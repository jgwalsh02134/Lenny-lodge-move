export type OpenAIResponsesPayload = Record<string, unknown>;

export async function callOpenAIResponses(opts: {
  apiKey: string;
  payload: OpenAIResponsesPayload;
}): Promise<{ ok: boolean; status: number; text: string; json?: any }> {
  const resp = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${opts.apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(opts.payload),
  });

  const text = await resp.text();
  let json: any = undefined;
  try {
    json = JSON.parse(text);
  } catch {
    // ignore
  }

  return { ok: resp.ok, status: resp.status, text, json };
}


