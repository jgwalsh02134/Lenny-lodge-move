import { z } from "zod";
import { callOpenAIResponses } from "../_ai/openai";
import { callXAIChat } from "../_ai/xai";
import { routeTask } from "../_ai/router";

type Env = {
  OPENAI_API_KEY?: string;
  XAI_API_KEY?: string;
};

const BodySchema = z.object({
  topic: z.string().trim().min(1),
  context: z.any().optional(),
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
}

function shouldUseWeb(topic: string): boolean {
  const t = topic.toLowerCase();
  return ["today", "current", "latest", "2025", "2026", "rate", "deadline", "law change", "updated"].some((k) =>
    t.includes(k),
  );
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

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await ctx.request.json());
  } catch (err) {
    return jsonResponse({ ok: false, error: "INVALID_BODY" }, { status: 400 });
  }

  const needWeb = shouldUseWeb(body.topic);
  const { provider } = routeTask({ taskType: "explain", needWeb });

  const system = `You are Lenny Lodge. Explain clearly, in plain language, with short sections and actionable takeaways.
Never joke about death/loss/aging/money anxiety. Avoid forced emotional language.`;

  // Prefer OpenAI; fallback to xAI only on OpenAI failures (429/5xx).
  if (provider === "openai") {
    const key = ctx.env.OPENAI_API_KEY;
    if (!key) return jsonResponse({ ok: false, error: "OPENAI_NOT_CONFIGURED" }, { status: 500 });

    const payload: Record<string, unknown> = {
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: system },
        {
          role: "user",
          content:
            `Topic:\n${body.topic}\n\nContext (JSON):\n${JSON.stringify(body.context ?? null)}\n\n` +
            `Explain it clearly and concisely.`,
        },
      ],
    };

    if (needWeb) {
      payload.tools = [{ type: "web_search" }];
      payload.include = ["web_search_call.action.sources"];
    }

    const r = await callOpenAIResponses({ apiKey: key, payload });
    if (r.ok) {
      return jsonResponse({ ok: true, text: extractOutputText(r.json) });
    }

    if ((r.status === 429 || (r.status >= 500 && r.status <= 599)) && ctx.env.XAI_API_KEY) {
      const xr = await callXAIChat({
        apiKey: ctx.env.XAI_API_KEY,
        model: "grok-2",
        messages: [
          { role: "system", content: system },
          { role: "user", content: `${body.topic}\n\nContext: ${JSON.stringify(body.context ?? null)}` },
        ],
      });
      if (xr.ok && xr.contentText) return jsonResponse({ ok: true, text: xr.contentText });
    }

    return jsonResponse({ ok: false, error: "UPSTREAM_ERROR", status: r.status }, { status: 502 });
  }

  // Second-opinion mode for future; not used by default right now.
  if (!ctx.env.XAI_API_KEY) return jsonResponse({ ok: false, error: "XAI_NOT_CONFIGURED" }, { status: 500 });
  const xr = await callXAIChat({
    apiKey: ctx.env.XAI_API_KEY,
    model: "grok-2",
    messages: [
      { role: "system", content: system },
      { role: "user", content: `${body.topic}\n\nContext: ${JSON.stringify(body.context ?? null)}` },
    ],
  });
  if (!xr.ok || !xr.contentText) return jsonResponse({ ok: false, error: "UPSTREAM_ERROR", status: xr.status }, { status: 502 });
  return jsonResponse({ ok: true, text: xr.contentText });
};


