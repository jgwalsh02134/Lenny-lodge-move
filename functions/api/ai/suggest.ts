import { z } from "zod";
import { callOpenAIResponses } from "../_ai/openai";
import { callXAIChat } from "../_ai/xai";
import { routeTask } from "../_ai/router";

type Env = {
  OPENAI_API_KEY?: string;
  XAI_API_KEY?: string;
};

const ChoiceSchema = z.object({
  label: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
  helper: z.string().optional(),
});

const BodySchema = z.object({
  questionId: z.string().min(1),
  choices: z.array(ChoiceSchema).min(1),
  context: z.any().optional(),
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

function extractOutputText(raw: any): string {
  const output: any[] = Array.isArray(raw?.output) ? raw.output : [];
  const message = output.find((o) => o?.type === "message");
  const content: any[] = Array.isArray(message?.content) ? message.content : [];
  const parts: string[] = [];
  for (const item of content) {
    if (item?.type === "output_text" && typeof item?.text === "string") parts.push(item.text);
  }
  return parts.join("\n\n").trim();
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await ctx.request.json());
  } catch {
    return jsonResponse({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const values = body.choices.map((c) => c.value);
  const OutSchema = z.object({
    ok: z.literal(true),
    value: z.any().refine((v) => values.some((x) => x === v), "value must be one of provided choice values"),
    reason: z.string().min(1),
  });

  const system = `You are Lenny Lodge. Pick the single best choice value for the user based on context.
Return ONLY valid JSON matching: {"ok":true,"value":<one_of_choice_values>,"reason":"..."}.
Never include extra keys, markdown, or commentary outside JSON.`;

  const prompt = `questionId: ${body.questionId}
choices: ${JSON.stringify(body.choices)}
context: ${JSON.stringify(body.context ?? null)}
`;

  const { provider } = routeTask({ taskType: "suggest", needWeb: false, preferSecondOpinion: false });

  async function tryOpenAI(): Promise<{ ok: boolean; status?: number; obj?: any; rawText?: string }> {
    const key = ctx.env.OPENAI_API_KEY;
    if (!key) return { ok: false, status: 500, rawText: "OPENAI_NOT_CONFIGURED" };
    const payload = {
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    };
    const r = await callOpenAIResponses({ apiKey: key, payload });
    if (!r.ok) return { ok: false, status: r.status, rawText: r.text };
    const text = extractOutputText(r.json);
    return { ok: true, obj: safeJsonParse(text), rawText: text };
  }

  async function tryXAI(): Promise<{ ok: boolean; status?: number; obj?: any; rawText?: string }> {
    const key = ctx.env.XAI_API_KEY;
    if (!key) return { ok: false, status: 500, rawText: "XAI_NOT_CONFIGURED" };
    const r = await callXAIChat({
      apiKey: key,
      model: "grok-2",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    });
    if (!r.ok || !r.contentText) return { ok: false, status: r.status, rawText: r.text };
    return { ok: true, obj: safeJsonParse(r.contentText), rawText: r.contentText };
  }

  async function validateOrNull(obj: any) {
    const parsed = OutSchema.safeParse(obj);
    return parsed.success ? parsed.data : null;
  }

  // First attempt (OpenAI default)
  let attempt1 = provider === "openai" ? await tryOpenAI() : await tryXAI();
  let valid = await validateOrNull(attempt1.obj);

  // Retry once (same provider) with a stricter nudge, if invalid JSON.
  if (!valid) {
    const retryPrompt = `${prompt}\nYour previous output was invalid. Return ONLY valid JSON with ok,value,reason.`;
    if (provider === "openai") {
      const key = ctx.env.OPENAI_API_KEY;
      if (key) {
        const r = await callOpenAIResponses({
          apiKey: key,
          payload: { model: "gpt-4o-mini", input: [{ role: "system", content: system }, { role: "user", content: retryPrompt }] },
        });
        if (r.ok) valid = await validateOrNull(safeJsonParse(extractOutputText(r.json)));
      }
    } else {
      const key = ctx.env.XAI_API_KEY;
      if (key) {
        const r = await callXAIChat({
          apiKey: key,
          model: "grok-2",
          messages: [{ role: "system", content: system }, { role: "user", content: retryPrompt }],
        });
        if (r.ok && r.contentText) valid = await validateOrNull(safeJsonParse(r.contentText));
      }
    }
  }

  // Fallback to xAI if OpenAI failed with 429/5xx
  if (!valid && provider === "openai") {
    const st = attempt1.status ?? 0;
    if ((st === 429 || (st >= 500 && st <= 599)) && ctx.env.XAI_API_KEY) {
      const attempt2 = await tryXAI();
      valid = await validateOrNull(attempt2.obj);
    }
  }

  // Deterministic safest default if still invalid
  if (!valid) {
    const safest = body.choices[0]?.value;
    return jsonResponse({
      ok: true,
      value: safest,
      reason: "I couldn’t reliably compute a suggestion, so I chose a safe default we can revise.",
    });
  }

  return jsonResponse(valid);
};


