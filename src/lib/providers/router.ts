export function routeTask(opts: {
  taskType: string;
  needWeb?: boolean;
  needSecondOpinion?: boolean;
  openaiFailed?: boolean;
}): { provider: "openai" | "xai"; model: string } {
  // Simple scaffold for future multi-provider routing.
  // Default: OpenAI
  // Second opinion: xAI
  // If OpenAI fails: fallback to xAI

  if (opts.openaiFailed) {
    return { provider: "xai", model: "grok-2" };
  }

  if (opts.needSecondOpinion) {
    return { provider: "xai", model: "grok-2" };
  }

  // We keep OpenAI as default regardless of needWeb for now (OpenAI supports web_search tool when enabled server-side).
  return { provider: "openai", model: "gpt-4o-mini" };
}


