import { useState } from "react";
import { Wizard } from "../components/Wizard";
import { QUESTIONS } from "../lib/foundationSchema";
import { getFoundationAnswers, setFoundationStatus } from "../lib/foundationStore";
import { NextStep } from "./NextStep";

type FoundationWizardPageProps = {
  onGoHome: () => void;
};

export function FoundationWizardPage({ onGoHome }: FoundationWizardPageProps) {
  const [completed, setCompleted] = useState(false);

  if (completed) {
    const answers = getFoundationAnswers();
    return (
      <NextStep
        answers={answers}
        onGoHome={() => {
          setFoundationStatus("complete");
          onGoHome();
        }}
      />
    );
  }

  return (
    <Wizard
      questions={QUESTIONS}
      onComplete={() => {
        setFoundationStatus("complete");
        setCompleted(true);
      }}
    />
  );
}


