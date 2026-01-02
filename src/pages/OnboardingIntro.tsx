import type { HumorDial } from "../lib/lennySettings";
import { LennyAvatar } from "../components/LennyAvatar";

type OnboardingIntroProps = {
  humorDial: HumorDial;
  onBegin: () => void;
  onSkip: () => void;
};

export function OnboardingIntro({ humorDial, onBegin, onSkip }: OnboardingIntroProps) {
  const dryLine =
    humorDial === "low"
      ? null
      : "I’ll keep this organized. You keep your calendar mostly intact.";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: 16 }}>
      <div style={{ display: "grid", gap: 14, justifyItems: "center" }}>
        <LennyAvatar size={260} />

        <div
          style={{
            width: "100%",
            borderRadius: 18,
            border: "1px solid rgba(0,0,0,0.10)",
            background: "rgba(255,255,255,0.92)",
            padding: 18,
            textAlign: "left",
          }}
        >
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
          {dryLine ? <p style={{ marginTop: 0, lineHeight: 1.5, opacity: 0.9 }}>{dryLine}</p> : null}

          <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center" }}>
            <button
              onClick={onBegin}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.12)",
                background: "#111",
                color: "#fff",
              }}
            >
              Let’s Begin
            </button>
            <button
              onClick={onSkip}
              style={{
                padding: "8px 10px",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "transparent",
                fontSize: 13,
                opacity: 0.8,
              }}
            >
              Skip intro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


