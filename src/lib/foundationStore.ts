import type { FoundationAnswerValue, FoundationAnswers, FoundationId } from "./foundationTypes";

const KEY_ANSWERS = "foundation.answers";
const KEY_STEP_INDEX = "foundation.stepIndex";
const KEY_STATUS = "foundation.status";

export type FoundationStatus = "not_started" | "in_progress" | "complete";

const DEFAULT_STATUS: FoundationStatus = "not_started";

const FOUNDATION_IDS: FoundationId[] = [
  "start_timeframe",
  "move_in_date_flex",
  "sequence_preference",
  "financing_approach",
  "temp_housing",
  "carry_cost_tolerance",
  "showing_tolerance",
  "risk_posture",
  "decision_pace",
  "energy_level",
  "hoa_preference",
];

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
    // ignore
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function emptyAnswers(): FoundationAnswers {
  const out: any = {};
  for (const id of FOUNDATION_IDS) out[id] = "";
  return out as FoundationAnswers;
}

export function getFoundationStatus(): FoundationStatus {
  const v = safeGetItem(KEY_STATUS);
  if (v === "not_started" || v === "in_progress" || v === "complete") return v;
  return DEFAULT_STATUS;
}

export function setFoundationStatus(v: FoundationStatus): void {
  safeSetItem(KEY_STATUS, v);
}

export function getFoundationAnswers(): FoundationAnswers {
  const raw = safeGetItem(KEY_ANSWERS);
  if (!raw) return emptyAnswers();
  try {
    const parsed = JSON.parse(raw) as Partial<Record<FoundationId, FoundationAnswerValue>>;
    const out = emptyAnswers();
    for (const id of FOUNDATION_IDS) {
      const val = parsed[id];
      if (val !== undefined) (out as any)[id] = val;
    }
    return out;
  } catch {
    return emptyAnswers();
  }
}

export function setFoundationAnswer(id: FoundationId, value: FoundationAnswerValue): void {
  const current = getFoundationAnswers();
  (current as any)[id] = value;
  safeSetItem(KEY_ANSWERS, JSON.stringify(current));
}

export function clearFoundation(): void {
  safeRemoveItem(KEY_ANSWERS);
  safeRemoveItem(KEY_STEP_INDEX);
  safeRemoveItem(KEY_STATUS);
}

export function getFoundationStepIndex(): number {
  const raw = safeGetItem(KEY_STEP_INDEX);
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function setFoundationStepIndex(n: number): void {
  if (!Number.isFinite(n) || n < 0) return;
  safeSetItem(KEY_STEP_INDEX, String(Math.floor(n)));
}


