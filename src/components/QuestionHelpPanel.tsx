import type { ReactNode } from "react";

type QuestionHelpPanelProps = {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
};

export function QuestionHelpPanel({ title, open, onClose, children }: QuestionHelpPanelProps) {
  if (!open) return null;

  return (
    <div role="dialog" aria-modal="true" style={{ position: "fixed", inset: 0, zIndex: 70 }}>
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)" }}
      />

      <div
        style={{
          position: "absolute",
          top: "8vh",
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(720px, 92vw)",
          maxHeight: "84vh",
          overflow: "auto",
          borderRadius: 16,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "#fff",
          color: "#111",
          boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ fontWeight: 900 }}>{title}</div>
          <button
            onClick={onClose}
            style={{
              padding: "8px 10px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.12)",
              background: "#f6f7f8",
            }}
          >
            Got it
          </button>
        </div>

        <div style={{ padding: 16 }}>{children}</div>
      </div>
    </div>
  );
}


