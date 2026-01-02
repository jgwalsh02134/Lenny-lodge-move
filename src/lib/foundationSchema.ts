import type {
  FoundationAnswerValue,
  FoundationAnswers,
  FoundationId,
} from "./foundationTypes";

export type Choice = { label: string; value: FoundationAnswerValue; helper?: string };

export type Question = {
  id: FoundationId;
  title: string;
  whyItMatters: string;
  choices: Choice[];
  ui: "cards" | "segmented";
  branch?: (answers: Partial<FoundationAnswers>) => FoundationId | null;
};

export const QUESTIONS: Question[] = [
  {
    id: "start_timeframe",
    title: "When do you want to start making real progress on the White Plains → Capital District move?",
    whyItMatters:
      "Timing drives everything: listing prep for 54 Collyer Pl, search pace up north, and how tight financing/closing windows need to be.",
    ui: "cards",
    choices: [
      { label: "Now (this month)", value: "Now (this month)" },
      { label: "Next 1–3 months", value: "Next 1–3 months" },
      { label: "3–6 months", value: "3–6 months" },
      { label: "6+ months", value: "6+ months" },
    ],
  },
  {
    id: "move_in_date_flex",
    title: "How flexible is your target move-in timing (Capital District / North Colonie preferred, not required)?",
    whyItMatters:
      "Flexibility is leverage. The more flexible you are, the more options you have for sequence, offers, and staging/repairs at 54 Collyer Pl.",
    ui: "segmented",
    choices: [
      { label: "Fixed date", value: "Fixed date" },
      { label: "Some flexibility (±2 weeks)", value: "Some flexibility (±2 weeks)" },
      { label: "Flexible (±1 month)", value: "Flexible (±1 month)" },
      { label: "Very flexible", value: "Very flexible" },
    ],
  },
  {
    id: "sequence_preference",
    title: "Which sequence feels safest for you right now?",
    whyItMatters:
      "Sell-first vs buy-first changes risk, financing options, and how much the “safety valves” (temp housing, overlap time) matter.",
    ui: "cards",
    choices: [
      { label: "Sell first", value: "Sell first" },
      { label: "Buy first", value: "Buy first" },
      { label: "Try to do both (simultaneous)", value: "Try to do both (simultaneous)" },
      { label: "Not sure", value: "Not sure", helper: "Totally normal — I’ll help you pick a default." },
    ],
  },
  {
    id: "financing_approach",
    title: "What’s your financing path for the next home?",
    whyItMatters:
      "Financing drives what’s feasible: buy-first is very different with cash vs mortgage vs bridge options.",
    ui: "segmented",
    choices: [
      { label: "Cash", value: "Cash" },
      { label: "Mortgage", value: "Mortgage" },
      { label: "Bridge/temporary loan", value: "Bridge/temporary loan" },
      { label: "Not sure", value: "Not sure" },
    ],
  },
  {
    id: "carry_cost_tolerance",
    title: "How long could you tolerate carrying two places (overlap) if needed?",
    whyItMatters:
      "Overlap (two housing payments + utilities) is the biggest stress multiplier. This sets guardrails for the plan.",
    ui: "segmented",
    choices: [
      { label: "0 months", value: "0 months" },
      { label: "1 month", value: "1 month" },
      { label: "2 months", value: "2 months" },
      { label: "3+ months", value: "3+ months" },
    ],
  },
  {
    id: "temp_housing",
    title: "Are you open to temporary housing if the timing doesn’t line up cleanly?",
    whyItMatters:
      "Temporary housing can turn a fragile plan into a flexible one. It’s optional — but it’s powerful.",
    ui: "segmented",
    choices: [
      { label: "No", value: "No" },
      { label: "Prefer not", value: "Prefer not" },
      { label: "If needed", value: "If needed" },
      { label: "Fine with it", value: "Fine with it" },
    ],
  },
  {
    id: "showing_tolerance",
    title: "How much disruption can you tolerate while selling 54 Collyer Pl (showings + prep)?",
    whyItMatters:
      "This changes whether we optimize for speed, privacy, or flexibility — and how aggressive we are about staging/repairs.",
    ui: "cards",
    choices: [
      { label: "Minimal (keep it controlled)", value: "minimal" },
      { label: "Moderate", value: "moderate" },
      { label: "Flexible (I can roll with it)", value: "flexible" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
  {
    id: "risk_posture",
    title: "Practical risk posture: what are we optimizing for?",
    whyItMatters:
      "This decides whether we bias toward certainty (fewer surprises) or toward the best outcome (more moving parts).",
    ui: "cards",
    choices: [
      { label: "Minimize surprises", value: "minimize_surprises" },
      { label: "Balanced", value: "balanced" },
      { label: "Optimize outcome (even if bumpy)", value: "optimize_outcome" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
  {
    id: "decision_pace",
    title: "Decision pace: how fast should this move when choices appear?",
    whyItMatters:
      "This sets the cadence for tours, offers, and review time — without turning your life into a spreadsheet.",
    ui: "cards",
    choices: [
      { label: "Fast", value: "Fast" },
      { label: "Steady", value: "Steady" },
      { label: "Slow & careful", value: "Slow & careful" },
      { label: "Not sure", value: "Not sure" },
    ],
  },
  {
    id: "energy_level",
    title: "How’s your bandwidth for this process right now?",
    whyItMatters:
      "This helps me pick a plan you’ll actually follow. Sustainable beats heroic.",
    ui: "segmented",
    choices: [
      { label: "Low", value: "Low" },
      { label: "Medium", value: "Medium" },
      { label: "High", value: "High" },
    ],
  },
  {
    id: "hoa_preference",
    title: "HOA preference (for the next place): where do you land?",
    whyItMatters:
      "HOAs can reduce maintenance load but add rules and fees. This helps narrow options in the Capital District without over-filtering too early.",
    ui: "segmented",
    choices: [
      { label: "Prefer HOA", value: "prefer_hoa" },
      { label: "No HOA", value: "no_hoa" },
      { label: "Indifferent", value: "indifferent" },
      { label: "Not sure", value: "not_sure" },
    ],
  },
];


