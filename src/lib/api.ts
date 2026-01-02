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


