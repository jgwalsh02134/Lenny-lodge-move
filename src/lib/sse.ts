export async function streamSSE(
  url: string,
  body: any,
  onEvent: (evt: { event?: string; data: string }) => void,
): Promise<void> {
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "text/event-stream",
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SSE request failed (${resp.status}): ${text.slice(0, 500)}`);
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

    // SSE messages are separated by a blank line
    let idx: number;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const raw = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);

      const lines = raw.split("\n").map((l) => l.trimEnd());
      const evt: { event?: string; data: string } = { data: "" };

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue; // keepalive / empty
        if (trimmed.startsWith("event:")) {
          evt.event = trimmed.slice("event:".length).trim();
        } else if (trimmed.startsWith("data:")) {
          const d = trimmed.slice("data:".length).trimStart();
          evt.data = evt.data ? `${evt.data}\n${d}` : d;
        }
      }

      if (!evt.data) continue;
      onEvent(evt);
    }
  }
}


