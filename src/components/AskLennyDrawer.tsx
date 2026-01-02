import { useMemo, useState } from "react";
import type { HumorDial } from "../lib/lennySettings";

type Msg = {
  id: string;
  role: "user" | "lenny";
  text: string;
};

type AskLennyDrawerProps = {
  humorDial: HumorDial;
  seriousMode: boolean;
};

export function AskLennyDrawer({ humorDial, seriousMode }: AskLennyDrawerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);

  const modeText = useMemo(() => {
    return `Serious Mode ${seriousMode ? "ON" : "OFF"} • Humor Dial ${humorDial}`;
  }, [humorDial, seriousMode]);

  function send() {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: `${Date.now()}-u`, role: "user", text },
      {
        id: `${Date.now()}-l`,
        role: "lenny",
        text: "Got it. I can help with that — next I’ll be wired to the research endpoint.",
      },
    ]);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: "fixed",
          right: 16,
          bottom: 16,
          padding: "10px 14px",
          borderRadius: 999,
          border: "1px solid rgba(0,0,0,0.12)",
          background: "#111",
          color: "#fff",
          boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
          zIndex: 50,
        }}
      >
        Ask Lenny
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
          }}
        >
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
            }}
          />

          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              height: "100%",
              width: "min(420px, 92vw)",
              background: "#fff",
              color: "#111",
              borderLeft: "1px solid rgba(0,0,0,0.12)",
              boxShadow: "-10px 0 30px rgba(0,0,0,0.18)",
              display: "flex",
              flexDirection: "column",
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
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>Ask Lenny</div>
                <div style={{ fontSize: 12, opacity: 0.75 }}>{modeText}</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: "#f6f7f8",
                }}
              >
                Close
              </button>
            </div>

            <div style={{ padding: 16, overflow: "auto", flex: 1 }}>
              {messages.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Ask anything. For now I’ll respond with a placeholder until we wire up the
                  research endpoint here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "90%",
                        padding: "10px 12px",
                        borderRadius: 12,
                        background: m.role === "user" ? "#111" : "#f2f3f5",
                        color: m.role === "user" ? "#fff" : "#111",
                        border:
                          m.role === "user"
                            ? "1px solid rgba(0,0,0,0.12)"
                            : "1px solid rgba(0,0,0,0.06)",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.35,
                        fontSize: 13,
                      }}
                    >
                      {m.text}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              style={{
                padding: 16,
                borderTop: "1px solid rgba(0,0,0,0.08)",
                display: "grid",
                gap: 8,
              }}
            >
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={3}
                placeholder="Ask Lenny…"
                style={{
                  width: "100%",
                  resize: "vertical",
                  borderRadius: 10,
                  border: "1px solid rgba(0,0,0,0.12)",
                  padding: 10,
                  fontFamily: "inherit",
                  fontSize: 13,
                }}
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => {
                    setDraft("");
                  }}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#f6f7f8",
                  }}
                >
                  Clear
                </button>
                <button
                  onClick={send}
                  disabled={draft.trim().length === 0}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 10,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#111",
                    color: "#fff",
                    opacity: draft.trim().length === 0 ? 0.5 : 1,
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


