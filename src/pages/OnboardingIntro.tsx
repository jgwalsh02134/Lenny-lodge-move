import { LennyAvatar } from "../components/LennyAvatar";

type OnboardingIntroProps = {
  onBegin: () => void;
  onSkip: () => void;
};

export function OnboardingIntro({ onBegin, onSkip }: OnboardingIntroProps) {
  const dryLine = "I’ll keep this organized. You keep your calendar mostly intact.";

  return (
    <div className="container">
      <div className="stack" style={{ justifyItems: "center" }}>
        <LennyAvatar size={280} />

        <div className="card card-pad" style={{ width: "100%" }}>
          <div style={{ fontWeight: 900, fontSize: 22, lineHeight: 1.15, marginBottom: 8 }}>
            Hi — I’m Lenny Lodge.
          </div>
          <div style={{ fontSize: 13, opacity: 0.75, marginBottom: 12 }}>
            Host specialist • Move strategy • White Plains → Capital District
          </div>

          <p style={{ marginTop: 0, lineHeight: 1.5 }}>
            I help you choose a sequence (sell-first, buy-first, or a clean middle path), map the steps, and keep
            optionality without drowning in it.
          </p>
          <p style={{ marginTop: 0, lineHeight: 1.5 }}>
            We’ll start with a few select-only questions. Your answers change the plan — and they change what “easy” means.
          </p>
          <p style={{ marginTop: 0, lineHeight: 1.5, opacity: 0.9 }}>{dryLine}</p>

          <div className="row-wrap" style={{ marginTop: "var(--s4)" }}>
            <button className="btn btn-primary" onClick={onBegin} style={{ width: "100%", maxWidth: 360 }}>
              Let’s Begin
            </button>
            <button className="btn btn-ghost" onClick={onSkip} style={{ width: "100%", maxWidth: 360 }}>
              Skip intro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


