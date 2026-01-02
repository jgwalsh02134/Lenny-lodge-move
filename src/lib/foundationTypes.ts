export type FoundationId =
  | "start_timeframe"
  | "move_in_date_flex"
  | "sequence_preference"
  | "financing_approach"
  | "risk_tolerance"
  | "temp_housing"
  | "storage_need"
  | "carry_cost_tolerance"
  | "decision_pace"
  | "energy_level";

export type FoundationAnswerValue = string | number | boolean;
export type FoundationAnswers = Record<FoundationId, FoundationAnswerValue>;


