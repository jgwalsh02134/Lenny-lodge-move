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
  const risk = String((answers as any).risk_posture ?? "");
  const temp = String((answers as any).temp_housing ?? "");
  const financing = String((answers as any).financing_approach ?? "");
  const sequence = String((answers as any).sequence_preference ?? "");

  const sellFirstBias = carry === "0 months" || risk === "minimize_surprises";

  const primary = sellFirstBias ? "Sell-first bias" : sequence || "Balanced (default)";
  const alternatives: string[] = [];
  alternatives.push("Simultaneous (if dates line up and everyone behaves).");
  alternatives.push("Buy-first (if financing is strong and overlap is tolerable).");

  const personalized: string[] = [];
  if (sellFirstBias) personalized.push("Keep overlap near zero: plan sell-first unless a specific listing forces a change.");
  if (temp === "Fine with it") personalized.push("Use temporary housing as a safety valve (it buys optionality).");
  if (financing === "Mortgage") personalized.push("Start pre-approval early so the timeline doesn’t surprise you.");

  return (
    <div className="container">
      <div className="card card-pad" style={{ textAlign: "left" }}>
        <h2 style={{ marginTop: 0 }}>Your provisional strategy</h2>
        <p style={{ marginTop: 0, opacity: 0.85, lineHeight: 1.5 }}>
          This is a first pass for 54 Collyer Pl → Capital District. It’s designed to reduce decision fatigue and keep
          options available without chaos.
        </p>

        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Primary</div>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "#f6f7f8" }}>
            <div style={{ fontWeight: 800 }}>{primary}</div>
            {personalized.length ? (
              <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 18 }}>
                {personalized.map((n) => (
                  <li key={n} style={{ marginBottom: 6 }}>
                    {n}
                  </li>
                ))}
              </ul>
            ) : (
              <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                No special constraints detected yet — we’ll tighten once we set real dates and neighborhood targets.
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Alternatives (keep in reserve)</div>
          <ul style={{ marginTop: 0, paddingLeft: 18 }}>
            {alternatives.slice(0, 2).map((a) => (
              <li key={a} style={{ marginBottom: 6 }}>
                {a}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Roadmap (A–F)</div>
          <ol style={{ marginTop: 0, paddingLeft: 18 }}>
            <li style={{ marginBottom: 8 }}>
              <b>A.</b> Define constraints: budget, must-haves, and “nice-to-haves” (North Colonie preferred, not required).
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>B.</b> Lock the sequence: sell-first / buy-first / simultaneous — and name a safety valve (temp housing or overlap buffer).
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>C.</b> Prep 54 Collyer Pl for market: pricing strategy, repairs, and a showing plan you can tolerate.
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>D.</b> Build the search pipeline up north: neighborhoods, tours, offer rules, and decision cadence.
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>E.</b> Execute the timeline: lenders/title/attorney/inspection windows.
            </li>
            <li style={{ marginBottom: 8 }}>
              <b>F.</b> Move logistics: movers, storage (if needed), and “one bad day” buffers.
            </li>
          </ol>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Next 3 steps (personalized)</div>
          <ol style={{ marginTop: 0, paddingLeft: 18 }}>
            <li style={{ marginBottom: 8 }}>
              Confirm your target window and constraints (must-haves, commute, schools, budget).
              {isOneOf(financing, ["Mortgage"]) ? " (If mortgage: confirm pre-approval + documentation.)" : ""}
            </li>
            <li style={{ marginBottom: 8 }}>
              Decide the sequence and the safety valve (temp housing and/or overlap buffer).
              {isOneOf(temp, ["Fine with it"]) ? " (You’re already open to temp housing — that’s leverage.)" : ""}
            </li>
            <li style={{ marginBottom: 8 }}>
              Build the checklist: listing prep for 54 Collyer Pl, offer rules, and a calendar that doesn’t eat your weekends.
            </li>
          </ol>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Find the right help (optional)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {[
              "Appraiser",
              "Home prep & staging",
              "Movers",
              "Storage",
              "NY real estate attorney",
              "Inspector",
            ].map((label) => (
              <button
                key={label}
                onClick={() => {
                  // placeholder — will call research endpoint later
                  alert(`Coming soon: I’ll help you find a ${label} with research + local constraints.`);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 14, fontSize: 12, opacity: 0.75 }}>
          Educational guidance only — for NY legal/tax questions, consult a NY attorney/CPA.
        </div>

        <div style={{ marginTop: 14 }}>
          <button
            onClick={onGoHome}
            className="btn btn-primary"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}


