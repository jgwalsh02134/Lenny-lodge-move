export type HumorDial = "low" | "medium" | "high";

const HUMOR_KEY = "lenny.humorDial";
const SERIOUS_KEY = "lenny.seriousMode";

const DEFAULT_HUMOR: HumorDial = "medium";
const DEFAULT_SERIOUS = false;

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore (e.g. privacy mode)
  }
}

export function getHumorDial(): HumorDial {
  const v = safeGetItem(HUMOR_KEY);
  if (v === "low" || v === "medium" || v === "high") return v;
  return DEFAULT_HUMOR;
}

export function setHumorDial(v: HumorDial): void {
  safeSetItem(HUMOR_KEY, v);
}

export function getSeriousMode(): boolean {
  const v = safeGetItem(SERIOUS_KEY);
  if (v === "1" || v === "true") return true;
  if (v === "0" || v === "false") return false;
  return DEFAULT_SERIOUS;
}

export function setSeriousMode(v: boolean): void {
  safeSetItem(SERIOUS_KEY, v ? "1" : "0");
}


