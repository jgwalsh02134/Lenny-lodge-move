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
    title: "When are you starting this move plan?",
    whyItMatters:
      "Timeframe determines how aggressive we can be with pricing, prep work, and lender/title timelines.",
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
    title: "How flexible is your move-in date?",
    whyItMatters:
      "Flexibility is leverage. It changes which contingencies are safe and which timelines are realistic.",
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
    title: "Which sequence do you prefer?",
    whyItMatters:
      "Sell-first vs buy-first changes risk, financing options, and how much temporary housing/storage helps.",
    ui: "cards",
    choices: [
      { label: "Sell first", value: "Sell first" },
      { label: "Buy first", value: "Buy first" },
      { label: "Try to do both (simultaneous)", value: "Try to do both (simultaneous)" },
      { label: "Not sure yet", value: "Not sure yet", helper: "I’ll show a quick explainer next." },
    ],
  },
  {
    id: "financing_approach",
    title: "How are you planning to finance?",
    whyItMatters:
      "Financing determines the order of operations, documentation needs, and how tight the schedule can be.",
    ui: "segmented",
    choices: [
      { label: "Cash", value: "Cash" },
      { label: "Mortgage", value: "Mortgage" },
      { label: "Bridge/temporary loan", value: "Bridge/temporary loan" },
      { label: "Not sure", value: "Not sure" },
    ],
  },
  {
    id: "risk_tolerance",
    title: "How much risk can you tolerate?",
    whyItMatters:
      "Risk tolerance determines whether we optimize for certainty (clean close) or for the best outcome (with more moving parts).",
    ui: "cards",
    choices: [
      { label: "Low (min surprises)", value: "Low (min surprises)" },
      { label: "Medium", value: "Medium" },
      { label: "High (optimize outcome even if bumpy)", value: "High (optimize outcome even if bumpy)" },
    ],
  },
  {
    id: "temp_housing",
    title: "Are you open to temporary housing?",
    whyItMatters:
      "Temporary housing is a safety valve. It can turn a stressful ‘must-time-perfectly’ plan into a manageable one.",
    ui: "segmented",
    choices: [
      { label: "No", value: "No" },
      { label: "Prefer not", value: "Prefer not" },
      { label: "If needed", value: "If needed" },
      { label: "Fine with it", value: "Fine with it" },
    ],
  },
  {
    id: "storage_need",
    title: "Do you need storage during the move?",
    whyItMatters:
      "Storage affects costs, logistics, and whether we can stage/prepare efficiently without living inside moving boxes.",
    ui: "segmented",
    choices: [
      { label: "None", value: "None" },
      { label: "A little", value: "A little" },
      { label: "A lot", value: "A lot" },
      { label: "Not sure", value: "Not sure" },
    ],
  },
  {
    id: "carry_cost_tolerance",
    title: "How many months of overlap can you tolerate (carry costs)?",
    whyItMatters:
      "Overlap (two mortgages/rents, utilities, insurance) is the biggest stress multiplier — we plan to keep it within your tolerance.",
    ui: "segmented",
    choices: [
      { label: "0 months", value: "0 months" },
      { label: "1 month", value: "1 month" },
      { label: "2 months", value: "2 months" },
      { label: "3+ months", value: "3+ months" },
    ],
  },
  {
    id: "decision_pace",
    title: "How fast do you want decisions to move?",
    whyItMatters:
      "Pace determines how we structure search, tours, offers, and review time — without turning it into a second job.",
    ui: "cards",
    choices: [
      { label: "Fast", value: "Fast" },
      { label: "Steady", value: "Steady" },
      { label: "Slow & careful", value: "Slow & careful" },
    ],
  },
  {
    id: "energy_level",
    title: "How’s your bandwidth for this process right now?",
    whyItMatters:
      "This helps me pick a plan that’s sustainable. The best plan is the one you’ll actually follow.",
    ui: "segmented",
    choices: [
      { label: "Low", value: "Low" },
      { label: "Medium", value: "Medium" },
      { label: "High", value: "High" },
    ],
  },
];


