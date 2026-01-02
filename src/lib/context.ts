type AnyObj = Record<string, unknown>;

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeJsonParse(raw: string | null): any {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function buildClientContext(): {
  page: string | null;
  foundation: {
    status: string | null;
    stepIndex: number | null;
    answers: AnyObj | null;
  };
  listing: null;
} {
  const answers = safeJsonParse(safeGetItem("foundation.answers"));
  const stepIndexRaw = safeGetItem("foundation.stepIndex");
  const stepIndex = stepIndexRaw != null && stepIndexRaw !== "" ? Number(stepIndexRaw) : null;

  return {
    page: safeGetItem("lenny.page"),
    foundation: {
      status: safeGetItem("foundation.status"),
      stepIndex: Number.isFinite(stepIndex as any) ? (stepIndex as number) : null,
      answers: answers && typeof answers === "object" ? answers : null,
    },
    listing: null,
  };
}


