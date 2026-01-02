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
      <div
        style={{
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.10)",
          background: "rgba(255,255,255,0.90)",
          padding: 18,
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <LennyAvatar size={56} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>Hi — I’m Lenny Lodge.</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Host specialist • Move strategy</div>
          </div>
        </div>

        <p style={{ marginTop: 0, lineHeight: 1.5 }}>
          I help you pick a sane sequence (sell-first, buy-first, or a clean middle path), map the steps, and reduce
          decision clutter.
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
  );
}


