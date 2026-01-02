import { z } from "zod";
// NOTE: This file runs on Cloudflare Pages Functions (server-side). No keys ever go to the browser.

type Env = {
  OPENAI_API_KEY?: string;
};

const MODEL = "gpt-4o-mini";

const HistoryItemSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const BodySchema = z.object({
  message: z.string().trim().min(1, "message is required"),
  history: z.array(HistoryItemSchema).optional(),
  researchMode: z.boolean().optional(),
  // Internal-only safeguard (not user-facing). We may use this later.
  allowedDomains: z.array(z.string().trim().min(1)).optional(),
});

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

function isEventStreamRequest(req: Request) {
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/event-stream");
}

function looksLegalOrTaxOrContract(text: string): boolean {
  const t = text.toLowerCase();
  return [
    "contract",
    "contingency",
    "attorney",
    "attorney review",
    "legal",
    "tax",
    "irs",
    "capital gains",
    "transfer tax",
    "title",
    "escrow",
    "closing disclosure",
    "mortgage",
    "lender",
  ].some((k) => t.includes(k));
}

function buildSystemPrompt(userMessage: string): string {
  const base = `
You are "Lenny Lodge" — a host specialist for a NY move planner.
Tone: calm, professional, and practical. Light dry humor is allowed, but never forced.
Hard rules:
- Never joke about death, loss, aging, or money anxiety.
- Avoid forced emotional language. Be sensitive and practical.
- Keep answers structured and actionable.
- Explain why questions matter and how answers change outcomes.
`;

  const disclaimer = looksLegalOrTaxOrContract(userMessage)
    ? `\nIf the user asks about legal/tax/contract topics, include: "Educational guidance only; consult a NY real estate attorney/CPA as appropriate."\n`
    : "";

  return (base + disclaimer).trim();
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const key = ctx.env.OPENAI_API_KEY;
  if (!key) {
    return jsonResponse({ ok: false, error: "Missing OPENAI_API_KEY" }, { status: 500 });
  }

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await ctx.request.json());
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "Invalid JSON body",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 400 },
    );
  }

  const researchMode = body.researchMode ?? false;

  const systemPrompt = buildSystemPrompt(body.message);

  const inputMessages = [
    { role: "system", content: systemPrompt },
    ...(body.history ?? []).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: body.message },
  ];

  const payload: Record<string, unknown> = {
    model: MODEL,
    input: inputMessages,
  };

  const wantsStream = isEventStreamRequest(ctx.request);

  if (wantsStream) {
    payload.stream = true;
    if (researchMode) {
      payload.tools = [{ type: "web_search" }];
      payload.include = ["web_search_call.action.sources"];
    }
  } else {
    // non-stream mode returns JSON directly
    payload.stream = false;
    if (researchMode) {
      payload.tools = [{ type: "web_search" }];
      payload.include = ["web_search_call.action.sources"];
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: "Failed to call OpenAI", details: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }

  if (!upstream.ok) {
    // If streaming was requested but OpenAI fails, fall back to a non-stream call and return JSON.
    if (wantsStream) {
      try {
        const fallbackPayload = { ...payload, stream: false };
        const fb = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: {
            authorization: `Bearer ${key}`,
            "content-type": "application/json",
          },
          body: JSON.stringify(fallbackPayload),
        });
        if (fb.ok) {
          const rawText = await fb.text();
          let raw: any = null;
          try {
            raw = JSON.parse(rawText);
          } catch {
            return new Response(rawText, { status: 200, headers: { "content-type": "application/json" } });
          }

          const output: any[] = Array.isArray(raw?.output) ? raw.output : [];
          const message = output.find((o) => o?.type === "message");
          const content: any[] = Array.isArray(message?.content) ? message.content : [];

          const textParts: string[] = [];
          for (const item of content) {
            if (item?.type === "output_text" && typeof item?.text === "string") {
              textParts.push(item.text);
            }
          }

          const sources: Array<{ url: string; title?: string }> = [];
          for (const o of output) {
            if (o?.type !== "web_search_call") continue;
            const srcs: any[] = Array.isArray(o?.action?.sources) ? o.action.sources : [];
            for (const s of srcs) {
              if (typeof s?.url === "string" && s.url.length > 0) {
                sources.push({ url: s.url, ...(typeof s?.title === "string" ? { title: s.title } : {}) });
              }
            }
          }

          return jsonResponse({ ok: true, text: textParts.join("\n\n").trim(), sources, raw });
        }
      } catch {
        // swallow and return the original upstream error below
      }
    }

    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": "text/plain" },
    });
  }

  if (!wantsStream) {
    const rawText = await upstream.text();
    let raw: any = null;
    try {
      raw = JSON.parse(rawText);
    } catch {
      return new Response(rawText, { status: 200, headers: { "content-type": "application/json" } });
    }

    const output: any[] = Array.isArray(raw?.output) ? raw.output : [];
    const message = output.find((o) => o?.type === "message");
    const content: any[] = Array.isArray(message?.content) ? message.content : [];

    const textParts: string[] = [];
    for (const item of content) {
      if (item?.type === "output_text" && typeof item?.text === "string") {
        textParts.push(item.text);
      }
    }

    const sources: Array<{ url: string; title?: string }> = [];
    for (const o of output) {
      if (o?.type !== "web_search_call") continue;
      const srcs: any[] = Array.isArray(o?.action?.sources) ? o.action.sources : [];
      for (const s of srcs) {
        if (typeof s?.url === "string" && s.url.length > 0) {
          sources.push({ url: s.url, ...(typeof s?.title === "string" ? { title: s.title } : {}) });
        }
      }
    }

    return jsonResponse({
      ok: true,
      text: textParts.join("\n\n").trim(),
      sources,
      raw,
    });
  }

  if (!upstream.body) {
    return jsonResponse({ ok: false, error: "Upstream did not return a stream body" }, { status: 502 });
  }

  // Proxy OpenAI SSE as-is.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const reader = upstream.body!.getReader();
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          if (value) controller.enqueue(value);
        }
      } catch (err) {
        controller.error(err);
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // ignore
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache",
      connection: "keep-alive",
    },
  });
};


