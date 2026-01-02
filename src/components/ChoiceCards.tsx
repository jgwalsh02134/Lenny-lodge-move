import type { FoundationAnswerValue } from "../lib/foundationTypes";
import type { Choice } from "../lib/foundationSchema";

type ChoiceCardsProps = {
  choices: Choice[];
  selected: FoundationAnswerValue | undefined;
  onSelect: (value: FoundationAnswerValue) => void;
};

export function ChoiceCards({ choices, selected, onSelect }: ChoiceCardsProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}
    >
      {choices.map((c) => {
        const isSelected = selected === c.value;
        return (
          <button
            key={String(c.value)}
            onClick={() => onSelect(c.value)}
            style={{
              textAlign: "left",
              padding: 12,
              borderRadius: 14,
              border: isSelected ? "2px solid #111" : "1px solid rgba(0,0,0,0.12)",
              background: isSelected ? "rgba(17,17,17,0.06)" : "#fff",
              boxShadow: isSelected ? "0 10px 24px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <div style={{ fontWeight: 700 }}>{c.label}</div>
            {c.helper ? (
              <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>{c.helper}</div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}


