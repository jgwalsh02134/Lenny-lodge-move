import { z } from "zod";

type Env = {
  OPENAI_API_KEY?: string;
};

const MODEL = "gpt-4o-mini";
const MAX_TOOL_CALLS = 3;

const ResearchBodySchema = z.object({
  query: z.string().trim().min(1, "query is required"),
  seriousMode: z.boolean().optional(),
  humorDial: z.enum(["low", "medium", "high"]).optional(),
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

function uniqueByUrl<T extends { url?: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const url = item?.url;
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    out.push(item);
  }
  return out;
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let parsed: z.infer<typeof ResearchBodySchema>;
  try {
    const json = await ctx.request.json();
    parsed = ResearchBodySchema.parse(json);
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

  const key = ctx.env.OPENAI_API_KEY;
  if (!key) {
    return jsonResponse(
      {
        ok: false,
        error:
          "Missing OPENAI_API_KEY. Set it as a Pages secret in production, and as OPENAI_API_KEY in .dev.vars for local dev.",
      },
      { status: 500 },
    );
  }

  const seriousMode = parsed.seriousMode ?? false;
  const humorDial = seriousMode ? "low" : (parsed.humorDial ?? "medium");

  const educationalDisclaimer = seriousMode
    ? `\n\nEducational disclaimer: This is general information, not legal/financial advice. For time-sensitive or jurisdiction-specific questions, confirm with your attorney, lender, and title/escrow company.`
    : "";

  const persona = `
You are "Lenny Lodge" — professional, practical, and lightly dry when appropriate.
Humor rules:
- Humor dial: ${humorDial}
- Never joke about death, loss, aging, or money anxiety.
Style:
- Be concise but complete.
- Use plain language.
Sources:
- If you cite sources, make them clickable Markdown links (e.g. [Title](https://...)).
`;

  const requestBody: Record<string, unknown> = {
    model: MODEL,
    input: parsed.query,
    instructions:
      persona +
      educationalDisclaimer +
      `\n\nTask: Research the user's query using web search when helpful, then answer clearly.\n`,
    tools: [
      parsed.allowedDomains?.length
        ? { type: "web_search", filters: { allowed_domains: parsed.allowedDomains } }
        : { type: "web_search" },
    ],
    include: ["web_search_call.action.sources"],
    max_tool_calls: MAX_TOOL_CALLS,
  };

  let upstreamJson: any;
  try {
    const upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        authorization: `Bearer ${key}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const text = await upstream.text();
    try {
      upstreamJson = JSON.parse(text);
    } catch {
      upstreamJson = { nonJsonBody: text };
    }

    if (!upstream.ok) {
      return jsonResponse(
        {
          ok: false,
          error: "OpenAI request failed",
          status: upstream.status,
          raw: upstreamJson,
        },
        { status: 502 },
      );
    }
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "Failed to call OpenAI",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const output: any[] = Array.isArray(upstreamJson?.output) ? upstreamJson.output : [];

  const message = output.find((o) => o?.type === "message");
  const content: any[] = Array.isArray(message?.content) ? message.content : [];

  const textParts: string[] = [];
  const citations: Array<{ url: string; title?: string }> = [];

  for (const item of content) {
    if (item?.type !== "output_text") continue;
    const t = typeof item?.text === "string" ? item.text : "";
    if (t) textParts.push(t);

    const annotations: any[] = Array.isArray(item?.annotations) ? item.annotations : [];
    for (const ann of annotations) {
      if (ann?.type !== "url_citation") continue;
      const url = ann?.url;
      const title = ann?.title;
      if (typeof url === "string" && url.length > 0) {
        citations.push({ url, ...(typeof title === "string" ? { title } : {}) });
      }
    }
  }

  const sources: Array<{ url: string; title?: string }> = [];
  for (const o of output) {
    if (o?.type !== "web_search_call") continue;
    const srcs: any[] = Array.isArray(o?.action?.sources) ? o.action.sources : [];
    for (const s of srcs) {
      const url = s?.url;
      const title = s?.title;
      if (typeof url === "string" && url.length > 0) {
        sources.push({ url, ...(typeof title === "string" ? { title } : {}) });
      }
    }
  }

  return jsonResponse({
    ok: true,
    text: textParts.join("\n\n").trim(),
    citations: uniqueByUrl(citations),
    sources: uniqueByUrl(sources),
    raw: upstreamJson,
  });
};


