export async function postJSON<TResponse>(
  path: string,
  body: unknown,
): Promise<TResponse> {
  const resp = await fetch(path, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await resp.text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // ignore
  }

  if (!resp.ok) {
    const msg =
      (json && (json.error || json.message)) ||
      `Request failed (${resp.status})`;
    throw new Error(typeof msg === "string" ? msg : `Request failed (${resp.status})`);
  }

  return json as TResponse;
}

import { streamSSE } from "./sse";

export async function streamChat(
  body: any,
  handlers: {
    onDelta: (textDelta: string) => void;
    onDone: () => void;
    onSources?: (sources: any) => void;
  },
): Promise<void> {
  const { onDelta, onDone, onSources } = handlers;

  function extractDelta(obj: any): string | null {
    if (!obj || typeof obj !== "object") return null;
    const t = obj.type;
    if (typeof t === "string" && t.includes("output_text") && t.includes("delta")) {
      if (typeof obj.delta === "string") return obj.delta;
      if (typeof obj.text === "string") return obj.text;
    }
    if (typeof obj.delta === "string" && typeof t === "string" && t.endsWith(".delta")) return obj.delta;
    return null;
  }

  function extractSources(obj: any): any[] | null {
    const src = obj?.action?.sources ?? obj?.sources;
    return Array.isArray(src) ? src : null;
  }

  let doneCalled = false;

  await streamSSE("/api/ai/chat", body, (evt) => {
    const data = evt.data;
    if (data === "[DONE]") {
      if (!doneCalled) {
        doneCalled = true;
        onDone();
      }
      return;
    }

    let obj: any = null;
    try {
      obj = JSON.parse(data);
    } catch {
      // If upstream ever emits plain-text deltas, ignore for safety in MVP.
      return;
    }

    const delta = extractDelta(obj);
    if (delta) onDelta(delta);

    const sources = extractSources(obj);
    if (sources && onSources) onSources(sources);

    const type = obj?.type;
    if (typeof type === "string" && (type === "response.completed" || type === "response.done")) {
      if (!doneCalled) {
        doneCalled = true;
        onDone();
      }
    }
  });

  if (!doneCalled) onDone();
}



