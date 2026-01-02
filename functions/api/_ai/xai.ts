// xAI is optional. We only call it when XAI_API_KEY is present.
// This is a minimal OpenAI-compatible Chat Completions call.

export async function callXAIChat(opts: {
  apiKey: string;
  model: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}): Promise<{ ok: boolean; status: number; text: string; json?: any; contentText?: string }> {
  const resp = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: opts.model,
      messages: opts.messages,
      temperature: 0.2,
    }),
  });

  const text = await resp.text();
  let json: any = undefined;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  const contentText =
    typeof json?.choices?.[0]?.message?.content === "string"
      ? json.choices[0].message.content
      : undefined;

  return { ok: resp.ok, status: resp.status, text, json, contentText };
}


