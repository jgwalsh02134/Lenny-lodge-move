import { z } from "zod";
import { callOpenAIResponses } from "../_ai/openai";
import { callXAIChat } from "../_ai/xai";
import { routeTask } from "../_ai/router";

type Env = {
  OPENAI_API_KEY?: string;
  XAI_API_KEY?: string;
};

const BodySchema = z.object({
  context: z.any().optional(),
});

const PlanSchema = z.object({
  ok: z.literal(true),
  recommended: z.object({
    name: z.string().min(1),
    rationale: z.string().min(1),
    whenItWorks: z.string().min(1),
    biggestRisks: z.string().min(1),
    mitigations: z.array(z.string().min(1)).min(1),
  }),
  alternatives: z
    .array(
      z.object({
        name: z.string().min(1),
        rationale: z.string().min(1),
        whenItWorks: z.string().min(1),
      }),
    )
    .max(2),
  timeline: z.array(
    z.object({
      milestone: z.string().min(1),
      stage: z.string().min(1),
      targetWindow: z.string().min(1),
      notes: z.string().min(1),
    }),
  ),
  next3: z.array(z.object({ step: z.string().min(1), why: z.string().min(1) })).length(3),
  watchOuts: z.array(z.string().min(1)).min(1),
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

  const system = `You are Lenny Lodge. Produce a move plan as STRICT JSON.
Return ONLY valid JSON matching the schema described by the user.
No markdown. No extra keys.`;

  const prompt = `Context (JSON):\n${JSON.stringify(body.context ?? null)}\n\nOutput the plan JSON now.`;

  const { provider } = routeTask({ taskType: "plan", needWeb: false, preferSecondOpinion: false });

  async function attemptOpenAI(extraNudge?: string) {
    const key = ctx.env.OPENAI_API_KEY;
    if (!key) return { ok: false, status: 500, text: "OPENAI_NOT_CONFIGURED" };
    return await callOpenAIResponses({
      apiKey: key,
      payload: {
        model: "gpt-4o-mini",
        input: [
          { role: "system", content: system },
          { role: "user", content: prompt + (extraNudge ? `\n\n${extraNudge}` : "") },
        ],
      },
    });
  }

  async function attemptXAI(extraNudge?: string) {
    const key = ctx.env.XAI_API_KEY;
    if (!key) return { ok: false, status: 500, text: "XAI_NOT_CONFIGURED" } as any;
    return await callXAIChat({
      apiKey: key,
      model: "grok-2",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt + (extraNudge ? `\n\n${extraNudge}` : "") },
      ],
    });
  }

  async function parseAndValidate(text: string) {
    const obj = safeJsonParse(text);
    const parsed = PlanSchema.safeParse(obj);
    return parsed.success ? parsed.data : null;
  }

  // First attempt
  let valid: any = null;
  let status = 0;

  if (provider === "openai") {
    const r1 = await attemptOpenAI();
    status = r1.status;
    if (r1.ok) valid = await parseAndValidate(extractOutputText(r1.json));
    if (!valid) {
      const r2 = await attemptOpenAI("Your previous output was invalid. Return ONLY valid JSON (no prose).");
      if (r2.ok) valid = await parseAndValidate(extractOutputText(r2.json));
    }

    if (!valid && (status === 429 || (status >= 500 && status <= 599)) && ctx.env.XAI_API_KEY) {
      const xr = await attemptXAI("Return ONLY valid JSON (no prose).");
      if (xr.ok && xr.contentText) valid = await parseAndValidate(xr.contentText);
    }
  } else {
    const xr1 = await attemptXAI();
    status = xr1.status;
    if (xr1.ok && xr1.contentText) valid = await parseAndValidate(xr1.contentText);
    if (!valid) {
      const xr2 = await attemptXAI("Your previous output was invalid. Return ONLY valid JSON (no prose).");
      if (xr2.ok && xr2.contentText) valid = await parseAndValidate(xr2.contentText);
    }
  }

  if (!valid) {
    return jsonResponse({ ok: false, error: "PLAN_UNAVAILABLE", status }, { status: 502 });
  }

  return jsonResponse(valid);
};


