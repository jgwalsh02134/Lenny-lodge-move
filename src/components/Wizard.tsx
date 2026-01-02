import { useEffect, useMemo, useState } from "react";
import type { FoundationAnswerValue, FoundationAnswers } from "../lib/foundationTypes";
import type { Question } from "../lib/foundationSchema";
import {
  getFoundationAnswers,
  getFoundationStepIndex,
  getFoundationStatus,
  setFoundationAnswer,
  setFoundationStatus,
  setFoundationStepIndex,
} from "../lib/foundationStore";
import { ChoiceCards } from "./ChoiceCards";
import { Segmented } from "./Segmented";
import { LennyAvatar } from "./LennyAvatar";
import { QuestionHelpPanel } from "./QuestionHelpPanel";

type WizardProps = {
  questions: Question[];
  onComplete: () => void;
};

type WizardStep =
  | { type: "question"; question: Question }
  | { type: "sequenceExplainer" };

function buildSteps(questions: Question[], answers: Partial<FoundationAnswers>): WizardStep[] {
  const steps: WizardStep[] = [];
  for (const q of questions) {
    steps.push({ type: "question", question: q });
    if (q.id === "sequence_preference" && answers.sequence_preference === "Not sure") {
      steps.push({ type: "sequenceExplainer" });
    }
  }
  return steps;
}

export function Wizard({ questions, onComplete }: WizardProps) {
  const [answers, setAnswers] = useState<FoundationAnswers>(() => getFoundationAnswers());
  const [stepIndex, setStepIndex] = useState(() => getFoundationStepIndex());
  const [helpMode, setHelpMode] = useState<null | "explain" | "idk" | "suggest">(null);
  const [suggestRationale, setSuggestRationale] = useState<string | null>(null);
  const [idkMicro, setIdkMicro] = useState<Record<string, FoundationAnswerValue | undefined>>({});

  useEffect(() => {
    // hydrate in case localStorage updated elsewhere
    setAnswers(getFoundationAnswers());
    setStepIndex(getFoundationStepIndex());
  }, []);

  const steps = useMemo(() => buildSteps(questions, answers), [questions, answers]);

  const safeStepIndex = Math.min(Math.max(0, stepIndex), Math.max(0, steps.length - 1));
  const step = steps[safeStepIndex];

  useEffect(() => {
    if (safeStepIndex !== stepIndex) {
      setStepIndex(safeStepIndex);
      setFoundationStepIndex(safeStepIndex);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeStepIndex]);

  const progressText = `Step ${safeStepIndex + 1} of ${steps.length}`;
  const progressPct = steps.length > 0 ? ((safeStepIndex + 1) / steps.length) * 100 : 0;

  function goBack() {
    const next = Math.max(0, safeStepIndex - 1);
    setStepIndex(next);
    setFoundationStepIndex(next);
  }

  function goNext() {
    const next = safeStepIndex + 1;
    if (next >= steps.length) {
      setFoundationStatus("complete");
      onComplete();
      return;
    }
    setFoundationStatus(getFoundationStatus() === "not_started" ? "in_progress" : getFoundationStatus());
    setStepIndex(next);
    setFoundationStepIndex(next);
  }

  function pickAnswer(id: keyof FoundationAnswers, value: FoundationAnswerValue) {
    setFoundationAnswer(id as any, value);
    setAnswers(getFoundationAnswers());
    setFoundationStatus("in_progress");
  }

  const currentQuestion = step?.type === "question" ? step.question : null;
  const selectedValue =
    currentQuestion ? ((answers as any)[currentQuestion.id] as FoundationAnswerValue) : undefined;
  const isSelected =
    currentQuestion ? selectedValue !== "" && selectedValue !== undefined && selectedValue !== null : true;

  useEffect(() => {
    // reset helper UI when changing main question
    setHelpMode(null);
    setSuggestRationale(null);
    setIdkMicro({});
  }, [currentQuestion?.id]);

  function chooseWithRationale(id: keyof FoundationAnswers, value: FoundationAnswerValue, rationale: string) {
    pickAnswer(id, value);
    setSuggestRationale(rationale);
  }

  function suggestFor(q: Question, a: FoundationAnswers): { value: FoundationAnswerValue; rationale: string } {
    // Deterministic MVP rules (no AI)
    const carry = String((a as any).carry_cost_tolerance ?? "");
    const risk = String((a as any).risk_posture ?? "");
    const temp = String((a as any).temp_housing ?? "");
    const financing = String((a as any).financing_approach ?? "");
    const flex = String((a as any).move_in_date_flex ?? "");

    if (q.id === "sequence_preference") {
      if (carry === "0 months" || risk === "minimize_surprises") {
        return { value: "Sell first", rationale: "You want low overlap and fewer surprises, so sell-first is the safest default." };
      }
      if (temp === "Fine with it" && (flex === "Flexible (±1 month)" || flex === "Very flexible")) {
        return { value: "Sell first", rationale: "You’re flexible and open to temp housing, so sell-first preserves optionality without forcing timing." };
      }
      if (financing === "Cash" && (carry === "2 months" || carry === "3+ months")) {
        return { value: "Buy first", rationale: "Cash plus tolerance for overlap makes buy-first viable without turning timing into a cliff." };
      }
      return { value: "Sell first", rationale: "Defaulting to sell-first keeps the plan stable while we tighten details." };
    }

    if (q.id === "carry_cost_tolerance") {
      return { value: "1 month", rationale: "One month is a common planning buffer; we’ll tighten it once we set real dates." };
    }

    if (q.id === "financing_approach") {
      return { value: "Mortgage", rationale: "Mortgage is the common path; if you’re cash/bridge, we’ll switch once confirmed." };
    }

    if (q.id === "move_in_date_flex") {
      return { value: "Some flexibility (±2 weeks)", rationale: "A small buffer (±2 weeks) keeps options open without committing to a wide window." };
    }

    // Fallback: choose the first non-"Not sure" option
    const first = q.choices.find((c) => String(c.value).toLowerCase() !== "not sure" && String(c.value).toLowerCase() !== "not_sure") ?? q.choices[0];
    return { value: first.value, rationale: "This is a reasonable default; we can revise once we learn more." };
  }

  function renderExplain(q: Question) {
    const examplesById: Record<string, string[]> = {
      sequence_preference: [
        "Sell-first: stabilizes budget, may use temp housing/storage.",
        "Buy-first: smoother move, but needs stronger financing and overlap tolerance.",
        "Simultaneous: less overlap, more coordination risk.",
      ],
      carry_cost_tolerance: [
        "Overlap includes two payments plus utilities/insurance and logistics.",
        "Even 1 month of buffer can reduce deadline stress.",
      ],
      showing_tolerance: [
        "Minimal: fewer showings, more controlled scheduling.",
        "Flexible: easier to maximize buyer access and momentum.",
      ],
    };

    return (
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Plain-language</div>
          <div style={{ opacity: 0.85, lineHeight: 1.5 }}>
            {q.id === "sequence_preference"
              ? "This is the order of operations: do you sell 54 Collyer Pl first, buy the next place first, or try to time them together?"
              : q.id === "carry_cost_tolerance"
                ? "This is your buffer for having two places at once. It’s not a preference question — it’s a safety boundary."
                : q.title}
          </div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Why it matters</div>
          <div style={{ opacity: 0.85, lineHeight: 1.5 }}>{q.whyItMatters}</div>
        </div>
        <div>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>Examples</div>
          <ul style={{ marginTop: 0, paddingLeft: 18 }}>
            {(examplesById[q.id] ?? ["We’ll use your answer to remove options that create avoidable stress."]).map((ex) => (
              <li key={ex} style={{ marginBottom: 6 }}>
                {ex}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  function renderIdk(q: Question) {
    if (q.id !== "sequence_preference") {
      const rec = suggestFor(q, answers);
      return (
        <div style={{ display: "grid", gap: 12 }}>
          <div style={{ opacity: 0.85 }}>
            No problem. For now, I’ll pick a safe default so we can keep moving.
          </div>
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "#f6f7f8" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Recommended</div>
            <div style={{ marginBottom: 6 }}>{String(rec.value)}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{rec.rationale}</div>
          </div>
          <button
            onClick={() => {
              chooseWithRationale(q.id, rec.value, rec.rationale);
              setHelpMode(null);
            }}
            style={{
              padding: "12px 14px",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#111",
              color: "#fff",
            }}
          >
            Choose recommended
          </button>
        </div>
      );
    }

    const carryQ = {
      key: "canCarry",
      title: "Could you comfortably carry two places for 1–2 months?",
      choices: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
        { label: "Unsure", value: "unsure" },
      ],
    };
    const dateQ = {
      key: "hardDate",
      title: "Is your move-in timing effectively non-negotiable?",
      choices: [
        { label: "Yes", value: "yes" },
        { label: "No", value: "no" },
        { label: "Unsure", value: "unsure" },
      ],
    };

    const canCarry = String(idkMicro[carryQ.key] ?? "");
    const hardDate = String(idkMicro[dateQ.key] ?? "");

    let rec: { value: FoundationAnswerValue; rationale: string } | null = null;
    if (canCarry && hardDate) {
      if (canCarry === "no") {
        rec = { value: "Sell first", rationale: "If you can’t carry overlap, sell-first avoids stacking two housing payments." };
      } else if (canCarry === "yes" && hardDate === "yes") {
        rec = { value: "Buy first", rationale: "If you can carry overlap and the move-in timing is strict, buy-first can protect the move-in date." };
      } else if (hardDate === "yes" && canCarry !== "no") {
        rec = { value: "Try to do both (simultaneous)", rationale: "A strict date suggests we should minimize downtime; simultaneous can work if the parts cooperate." };
      } else {
        rec = { value: "Sell first", rationale: "As a default, sell-first keeps the plan stable while we tighten constraints." };
      }
    }

    return (
      <div style={{ display: "grid", gap: 14 }}>
        <div style={{ opacity: 0.85 }}>
          Two quick clarifiers. No typing — just point me in the right direction.
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{carryQ.title}</div>
            <Segmented
              choices={carryQ.choices as any}
              selected={idkMicro[carryQ.key]}
              onSelect={(v) => setIdkMicro((p) => ({ ...p, [carryQ.key]: v }))}
            />
          </div>
          <div>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>{dateQ.title}</div>
            <Segmented
              choices={dateQ.choices as any}
              selected={idkMicro[dateQ.key]}
              onSelect={(v) => setIdkMicro((p) => ({ ...p, [dateQ.key]: v }))}
            />
          </div>
        </div>

        {rec ? (
          <div style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.10)", background: "#f6f7f8" }}>
            <div style={{ fontWeight: 800, marginBottom: 6 }}>Recommended</div>
            <div style={{ marginBottom: 6 }}>{String(rec.value)}</div>
            <div style={{ fontSize: 13, opacity: 0.8 }}>{rec.rationale}</div>
          </div>
        ) : null}

        <button
          onClick={() => {
            if (!rec) return;
            chooseWithRationale(q.id, rec.value, rec.rationale);
            setHelpMode(null);
          }}
          disabled={!rec}
          style={{
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.12)",
            background: "#111",
            color: "#fff",
            opacity: rec ? 1 : 0.5,
          }}
        >
          Choose recommended
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(255,255,255,0.90)",
        padding: 16,
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, opacity: 0.7, marginBottom: 6 }}>{progressText}</div>
        <div
          style={{
            height: 8,
            borderRadius: 999,
            background: "rgba(0,0,0,0.08)",
            overflow: "hidden",
          }}
        >
          <div style={{ width: `${progressPct}%`, height: "100%", background: "#111" }} />
        </div>
      </div>

      <style>
        {`
          @media (max-width: 760px) {
            .wizardLayout { grid-template-columns: 1fr !important; }
            .wizardLenny { position: static !important; }
          }
        `}
      </style>

      {step?.type === "sequenceExplainer" ? (
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>Quick explainer: choosing a sequence</h2>
          <p style={{ marginTop: 0, opacity: 0.8 }}>
            Three common paths. None is “right” — the right one is the one your constraints can actually support.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            {[
              {
                label: "Sell-first",
                value: "Sell first",
                pros: ["Max certainty on budget", "Cleaner financing", "Lower overlap risk"],
                cons: ["May need temp housing", "Storage/logistics can increase"],
              },
              {
                label: "Buy-first",
                value: "Buy first",
                pros: ["Less disruption", "You can move once", "More time to sell well"],
                cons: ["Requires stronger financing", "Carry costs can stack up"],
              },
              {
                label: "Simultaneous",
                value: "Try to do both (simultaneous)",
                pros: ["Limits overlap time", "Often avoids temp housing"],
                cons: ["More moving parts", "Timelines must cooperate"],
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                  padding: 12,
                }}
              >
                <div style={{ fontWeight: 800, marginBottom: 8 }}>{card.label}</div>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>Pros</div>
                <ul style={{ marginTop: 0, marginBottom: 10, paddingLeft: 18 }}>
                  {card.pros.map((p) => (
                    <li key={p} style={{ marginBottom: 4 }}>
                      {p}
                    </li>
                  ))}
                </ul>
                <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>Cons</div>
                <ul style={{ marginTop: 0, marginBottom: 12, paddingLeft: 18 }}>
                  {card.cons.map((c) => (
                    <li key={c} style={{ marginBottom: 4 }}>
                      {c}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => {
                    pickAnswer("sequence_preference", card.value);
                    // Move forward to the next step after explainer (which will disappear once value is set)
                    goNext();
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 12,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#111",
                    color: "#fff",
                  }}
                >
                  Choose this
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button
              onClick={goBack}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#f6f7f8",
              }}
            >
              Back
            </button>
          </div>
        </div>
      ) : currentQuestion ? (
        <div
          className="wizardLayout"
          style={{
            display: "grid",
            gridTemplateColumns: "220px 1fr",
            gap: 14,
            alignItems: "start",
          }}
        >
          <div
            className="wizardLenny"
            style={{
              display: "grid",
              justifyItems: "center",
              gap: 10,
              position: "sticky",
              top: 16,
            }}
          >
            <LennyAvatar size={180} />
            <div style={{ fontSize: 12, opacity: 0.75, textAlign: "center" }}>
              I’ll keep this moving. You keep it select-only.
            </div>
          </div>

          <div>
            <h2 style={{ marginTop: 0, marginBottom: 10 }}>{currentQuestion.title}</h2>

            {currentQuestion.ui === "cards" ? (
              <ChoiceCards
                choices={currentQuestion.choices}
                selected={selectedValue}
                onSelect={(v) => pickAnswer(currentQuestion.id, v)}
              />
            ) : (
              <Segmented
                choices={currentQuestion.choices}
                selected={selectedValue}
                onSelect={(v) => pickAnswer(currentQuestion.id, v)}
              />
            )}

            {suggestRationale ? (
              <div style={{ marginTop: 10, padding: 12, borderRadius: 14, background: "#f6f7f8", border: "1px solid rgba(0,0,0,0.10)" }}>
                <div style={{ fontWeight: 800, marginBottom: 6 }}>Lenny suggests this because…</div>
                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.5 }}>{suggestRationale}</div>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
              <button
                onClick={() => setHelpMode("idk")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                I don’t know
              </button>
              <button
                onClick={() => setHelpMode("explain")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                Explain this
              </button>
              <button
                onClick={() => {
                  const rec = suggestFor(currentQuestion, answers);
                  chooseWithRationale(currentQuestion.id, rec.value, rec.rationale);
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#fff",
                }}
              >
                What do you suggest?
              </button>
            </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginTop: 16 }}>
            <button
              onClick={goBack}
              disabled={safeStepIndex === 0}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#f6f7f8",
                opacity: safeStepIndex === 0 ? 0.5 : 1,
              }}
            >
              Back
            </button>

            <button
              onClick={goNext}
              disabled={!isSelected}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#111",
                color: "#fff",
                opacity: !isSelected ? 0.5 : 1,
              }}
            >
              Next
            </button>
          </div>
          </div>
        </div>
      ) : (
        <div>Loading…</div>
      )}

      {currentQuestion ? (
        <>
          <QuestionHelpPanel
            title={helpMode === "explain" ? "Explain this" : helpMode === "idk" ? "Let’s figure it out" : "Help"}
            open={helpMode === "explain"}
            onClose={() => setHelpMode(null)}
          >
            {renderExplain(currentQuestion)}
          </QuestionHelpPanel>

          <QuestionHelpPanel
            title="I don’t know — quick helper"
            open={helpMode === "idk"}
            onClose={() => setHelpMode(null)}
          >
            {renderIdk(currentQuestion)}
          </QuestionHelpPanel>
        </>
      ) : null}
    </div>
  );
}


