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
    const src =
      obj?.action?.sources ??
      obj?.sources ??
      obj?.item?.action?.sources ??
      obj?.output?.action?.sources;
    return Array.isArray(src) ? src : null;
  }

  let doneCalled = false;

  // Prefer SSE streaming. If the server falls back to JSON, handle that too.
  const resp = await fetch("/api/ai/chat", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  const ct = resp.headers.get("content-type") ?? "";

  if (!resp.ok) {
    let errMsg = `Request failed (${resp.status})`;
    try {
      const j = await resp.json();
      if (j?.error) errMsg = String(j.error);
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  if (ct.includes("application/json")) {
    const j = await resp.json();
    if (typeof j?.text === "string" && j.text) onDelta(j.text);
    if (onSources && Array.isArray(j?.sources)) onSources(j.sources);
    onDone();
    return;
  }

  if (!resp.body) {
    throw new Error("SSE response has no body");
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const lines = raw.split("\n").map((l) => l.trimEnd());
      let data = "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed.startsWith("data:")) {
          const d = trimmed.slice("data:".length).trimStart();
          data = data ? `${data}\n${d}` : d;
        }
      }

      if (!data) continue;
      if (data === "[DONE]") {
        if (!doneCalled) {
          doneCalled = true;
          onDone();
        }
        continue;
      }

      let obj: any = null;
      try {
        obj = JSON.parse(data);
      } catch {
        continue;
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
    }
  }

  if (!doneCalled) onDone();
}



