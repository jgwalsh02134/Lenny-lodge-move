export function routeTask(opts: {
  taskType: "chat" | "explain" | "suggest" | "plan";
  needWeb?: boolean;
  preferSecondOpinion?: boolean;
}): { provider: "openai" | "xai" } {
  if (opts.preferSecondOpinion) return { provider: "xai" };
  return { provider: "openai" };
}


