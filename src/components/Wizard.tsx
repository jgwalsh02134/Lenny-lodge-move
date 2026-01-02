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
    if (q.id === "sequence_preference" && answers.sequence_preference === "Not sure yet") {
      steps.push({ type: "sequenceExplainer" });
    }
  }
  return steps;
}

export function Wizard({ questions, onComplete }: WizardProps) {
  const [answers, setAnswers] = useState<FoundationAnswers>(() => getFoundationAnswers());
  const [stepIndex, setStepIndex] = useState(() => getFoundationStepIndex());

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
        <div>
          <h2 style={{ marginTop: 0, marginBottom: 6 }}>{currentQuestion.title}</h2>

          <details style={{ marginBottom: 12 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, opacity: 0.85 }}>
              Why this matters
            </summary>
            <div style={{ marginTop: 8, fontSize: 13, opacity: 0.85 }}>
              {currentQuestion.whyItMatters}
            </div>
          </details>

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
      ) : (
        <div>Loading…</div>
      )}
    </div>
  );
}


