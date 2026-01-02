import type { FoundationAnswerValue } from "../lib/foundationTypes";
import type { Choice } from "../lib/foundationSchema";

type ChoiceCardsProps = {
  choices: Choice[];
  selected: FoundationAnswerValue | undefined;
  onSelect: (value: FoundationAnswerValue) => void;
};

export function ChoiceCards({ choices, selected, onSelect }: ChoiceCardsProps) {
  return (
    <div className="choiceGrid">
      {choices.map((c) => {
        const isSelected = selected === c.value;
        return (
          <button
            key={String(c.value)}
            onClick={() => onSelect(c.value)}
            className={`choiceCard ${isSelected ? "choiceCard--selected" : ""}`}
          >
            {/* icon slot (empty for now) */}
            <div aria-hidden="true" />
            <div>
              <div className="choiceLabel">{c.label}</div>
              {c.helper ? <div className="choiceHelper">{c.helper}</div> : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}


