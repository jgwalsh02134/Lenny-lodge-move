import type { FoundationAnswers } from "../lib/foundationTypes";

type NextStepProps = {
  answers: FoundationAnswers;
  onGoHome: () => void;
};

function isOneOf(v: unknown, allowed: string[]) {
  return typeof v === "string" && allowed.includes(v);
}

export function NextStep({ answers, onGoHome }: NextStepProps) {
  const carry = String((answers as any).carry_cost_tolerance ?? "");
  const risk = String((answers as any).risk_tolerance ?? "");
  const temp = String((answers as any).temp_housing ?? "");
  const financing = String((answers as any).financing_approach ?? "");

  const sellFirstBias =
    carry === "0 months" || risk === "Low (min surprises)";

  const notes: string[] = [];
  if (sellFirstBias) notes.push("Sell-first bias: optimize certainty and reduce overlap risk.");
  if (temp === "Fine with it") notes.push("Temporary housing can be a safety valve (it increases your flexibility).");
  if (financing === "Mortgage") notes.push("Mortgage path: get pre-approval early so timing doesn’t surprise you.");

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.10)",
          background: "rgba(255,255,255,0.90)",
          padding: 18,
          textAlign: "left",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Recommended path (provisional)</h2>
        <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.5 }}>
          This is a first pass. We’ll tighten it once we add listing targets, constraints, and real dates.
        </p>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            {sellFirstBias ? "Sell-first bias" : "Balanced sequence (tune based on constraints)"}
          </div>
          {notes.length ? (
            <ul style={{ marginTop: 0, paddingLeft: 18 }}>
              {notes.map((n) => (
                <li key={n} style={{ marginBottom: 6 }}>
                  {n}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontSize: 13, opacity: 0.8 }}>
              No special flags yet. That’s fine — it means we can optimize once we see listings and timing.
            </div>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Two alternatives (keep in reserve)</div>
          <ul style={{ marginTop: 0, paddingLeft: 18 }}>
            <li style={{ marginBottom: 6 }}>If timing gets tight: add temporary housing as a pressure-release valve.</li>
            <li style={{ marginBottom: 6 }}>
              If financing is strong: consider buy-first, but cap overlap to your carry-cost tolerance.
            </li>
          </ul>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Next 3 steps</div>
          <ol style={{ marginTop: 0, paddingLeft: 18 }}>
            <li style={{ marginBottom: 8 }}>
              Pick your target window and constraints (must-haves, commute, schools, budget).
              {isOneOf(financing, ["Mortgage"]) ? " (If mortgage: confirm pre-approval + documentation.)" : ""}
            </li>
            <li style={{ marginBottom: 8 }}>
              Decide the sequence and the “safety valve” (temp housing and/or storage).
              {isOneOf(temp, ["Fine with it"]) ? " (You’re already open to temp housing — good leverage.)" : ""}
            </li>
            <li style={{ marginBottom: 8 }}>
              Build the checklist: listing prep, lender/title timing, and a calendar that doesn’t eat your weekends.
            </li>
          </ol>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
          Educational guidance only — for NY legal/tax questions, consult a NY attorney/CPA.
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={onGoHome}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#111",
              color: "#fff",
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}


