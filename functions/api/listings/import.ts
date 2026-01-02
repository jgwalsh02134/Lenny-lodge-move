import { z } from "zod";

const ImportBodySchema = z.object({
  url: z.string().url("url must be a valid URL"),
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

function stripTags(input: string) {
  return input.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function parseMetaTags(html: string) {
  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];
  const out: Record<string, string> = {};

  for (const tag of tags) {
    const attrs: Record<string, string> = {};
    const attrRe = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/g;
    let m: RegExpExecArray | null;
    while ((m = attrRe.exec(tag))) {
      const key = m[1].toLowerCase();
      const val = (m[3] ?? m[4] ?? m[5] ?? "").trim();
      attrs[key] = val;
    }

    const content = attrs["content"];
    if (!content) continue;

    const prop = (attrs["property"] ?? attrs["name"] ?? "").toLowerCase();
    if (!prop) continue;
    out[prop] = content;
  }

  return out;
}

function extractJsonLd(html: string): any[] {
  const jsonld: any[] = [];
  const re = /<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = (m[1] ?? "").trim();
    if (!raw) continue;
    try {
      jsonld.push(JSON.parse(raw));
    } catch {
      // ignore invalid blocks
    }
  }
  return jsonld;
}

function toNumberMaybe(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const cleaned = v.replace(/[^\d.]/g, "");
    if (!cleaned) return null;
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function formatAddress(addr: any): string | undefined {
  if (!addr) return undefined;
  if (typeof addr === "string") return addr.trim() || undefined;
  if (typeof addr !== "object") return undefined;

  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.postalCode,
    addr.addressCountry,
  ]
    .map((x: unknown) => (typeof x === "string" ? x.trim() : ""))
    .filter(Boolean);

  return parts.length ? parts.join(", ") : undefined;
}

function deepFindCandidate(node: any): any | undefined {
  if (!node) return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = deepFindCandidate(item);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof node !== "object") return undefined;

  const looksUseful = Boolean(
    node.address ||
      node.offers ||
      node.name ||
      node["@type"] ||
      node.numberOfBedrooms ||
      node.numberOfBathroomsTotal ||
      node.floorSize,
  );
  if (looksUseful) return node;

  const graph = node["@graph"];
  if (graph) {
    const found = deepFindCandidate(graph);
    if (found) return found;
  }

  for (const v of Object.values(node)) {
    const found = deepFindCandidate(v);
    if (found) return found;
  }
  return undefined;
}

function extractFromJsonLd(jsonLdBlocks: any[]) {
  const candidate = deepFindCandidate(jsonLdBlocks);
  if (!candidate || typeof candidate !== "object") {
    return { source: "unknown" as const, extracted: {}, raw: undefined };
  }

  const title = typeof candidate.name === "string" ? candidate.name : undefined;
  const address = formatAddress(candidate.address);

  const offers = candidate.offers;
  const firstOffer =
    Array.isArray(offers) ? offers[0] : offers && typeof offers === "object" ? offers : undefined;

  const price =
    firstOffer?.price ??
    firstOffer?.priceSpecification?.price ??
    (typeof firstOffer?.priceSpecification === "number" ? firstOffer.priceSpecification : undefined);

  const beds = toNumberMaybe(candidate.numberOfBedrooms);
  const baths = toNumberMaybe(candidate.numberOfBathroomsTotal);

  const sqft =
    toNumberMaybe(candidate.floorSize?.value) ??
    toNumberMaybe(candidate.floorSize) ??
    toNumberMaybe(candidate.area?.value);

  const image =
    typeof candidate.image === "string"
      ? candidate.image
      : Array.isArray(candidate.image) && typeof candidate.image[0] === "string"
        ? candidate.image[0]
        : null;

  const extracted = {
    title,
    address,
    price: price ?? undefined,
    beds: beds ?? null,
    baths: baths ?? null,
    sqft: sqft ?? null,
    image,
    source: "jsonld" as const,
  };

  return { source: "jsonld" as const, extracted, raw: candidate };
}

export const onRequestPost: PagesFunction = async (ctx) => {
  let parsed: z.infer<typeof ImportBodySchema>;
  try {
    parsed = ImportBodySchema.parse(await ctx.request.json());
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

  const url = parsed.url;
  let html = "";

  try {
    const resp = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (!resp.ok) {
      return jsonResponse(
        { ok: false, error: "Failed to fetch URL", status: resp.status },
        { status: 502 },
      );
    }

    html = await resp.text();
  } catch (err) {
    return jsonResponse(
      {
        ok: false,
        error: "Network error fetching URL",
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 502 },
    );
  }

  const meta = parseMetaTags(html);
  const og = {
    title: meta["og:title"],
    image: meta["og:image"],
  };

  const jsonLd = extractJsonLd(html);
  const { extracted: jsonldExtracted, raw: jsonldRaw } = extractFromJsonLd(jsonLd);

  const extracted = {
    title: jsonldExtracted.title ?? og.title ?? undefined,
    address: jsonldExtracted.address ?? undefined,
    price: jsonldExtracted.price ?? undefined,
    beds: (jsonldExtracted as any).beds ?? null,
    baths: (jsonldExtracted as any).baths ?? null,
    sqft: (jsonldExtracted as any).sqft ?? null,
    image:
      (jsonldExtracted as any).image ??
      (og.image ? og.image : null) ??
      null,
    source: jsonLd.length ? ("jsonld" as const) : og.title || og.image ? ("opengraph" as const) : ("unknown" as const),
    missing: [] as string[],
  };

  const missing: string[] = [];
  for (const key of ["title", "address", "price", "beds", "baths", "sqft", "image"] as const) {
    const val = (extracted as any)[key];
    if (val === undefined || val === null || val === "") missing.push(key);
  }
  extracted.missing = missing;

  // If we totally failed to find a title, try a last-resort <title> parse.
  if (!extracted.title) {
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch?.[1]) {
      extracted.title = stripTags(titleMatch[1]);
      extracted.source = extracted.source === "unknown" ? "unknown" : extracted.source;
      extracted.missing = extracted.missing.filter((k) => k !== "title");
    }
  }

  return jsonResponse({
    ok: true,
    url,
    extracted,
    raw: {
      jsonLd: jsonLd.length ? jsonLd : undefined,
      og: og.title || og.image ? og : undefined,
      jsonLdCandidate: jsonldRaw,
    },
  });
};


