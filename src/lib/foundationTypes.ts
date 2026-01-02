export type FoundationId =
  | "start_timeframe"
  | "move_in_date_flex"
  | "sequence_preference"
  | "financing_approach"
  | "temp_housing"
  | "carry_cost_tolerance"
  | "showing_tolerance"
  | "risk_posture"
  | "decision_pace"
  | "energy_level"
  | "hoa_preference";

export type FoundationAnswerValue = string | number | boolean;
export type FoundationAnswers = Record<FoundationId, FoundationAnswerValue>;


