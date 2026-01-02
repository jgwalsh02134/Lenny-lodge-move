import { z } from "zod";
import { buildSystemPrompt } from "../../../src/lib/lennyPrompt";

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
  seriousMode: z.boolean().optional(),
  humorDial: z.enum(["low", "medium", "high"]).optional(),
  researchMode: z.boolean().optional(),
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

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const key = ctx.env.OPENAI_API_KEY;
  if (!key) {
    return jsonResponse(
      { ok: false, error: "Missing OPENAI_API_KEY (set as Pages secret / local .dev.vars)" },
      { status: 500 },
    );
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

  const seriousMode = body.seriousMode ?? false;
  const humorDial = (body.humorDial ?? "medium") as "low" | "medium" | "high";
  const researchMode = body.researchMode ?? false;

  const systemPrompt = buildSystemPrompt({ seriousMode, humorDial });

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
      payload.tools = [
        body.allowedDomains?.length
          ? { type: "web_search", filters: { allowed_domains: body.allowedDomains } }
          : { type: "web_search" },
      ];
      payload.include = ["web_search_call.action.sources"];
    }
  } else {
    // non-stream mode returns JSON directly
    payload.stream = false;
    if (researchMode) {
      payload.tools = [
        body.allowedDomains?.length
          ? { type: "web_search", filters: { allowed_domains: body.allowedDomains } }
          : { type: "web_search" },
      ];
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
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { "content-type": "text/plain" } });
  }

  if (!wantsStream) {
    const text = await upstream.text();
    return new Response(text, { status: 200, headers: { "content-type": "application/json" } });
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


