import type { FoundationAnswerValue } from "../lib/foundationTypes";
import type { Choice } from "../lib/foundationSchema";

type SegmentedProps = {
  choices: Choice[];
  selected: FoundationAnswerValue | undefined;
  onSelect: (value: FoundationAnswerValue) => void;
};

export function Segmented({ choices, selected, onSelect }: SegmentedProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        borderRadius: 12,
        border: "1px solid rgba(0,0,0,0.12)",
        background: "#fff",
        overflow: "hidden",
      }}
    >
      {choices.map((c, idx) => {
        const isSelected = selected === c.value;
        return (
          <button
            key={String(c.value)}
            onClick={() => onSelect(c.value)}
            style={{
              minHeight: 44,
              borderRadius: 0,
              border: "none",
              borderLeft: idx === 0 ? "none" : "1px solid rgba(0,0,0,0.10)",
              background: isSelected ? "#111" : "transparent",
              color: isSelected ? "#fff" : "inherit",
              padding: "10px 12px",
              fontSize: 13,
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}


