import { useEffect, useState } from "react";
import { streamChat } from "../lib/api";

type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ url?: string; title?: string }>;
};

type AskLennyDrawerProps = {
};

export function AskLennyDrawer({}: AskLennyDrawerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [researchMode, setResearchMode] = useState(false);

  // No domain allowlisting UI; research mode uses internet + citations with no user filters.

  function loadPersisted() {
    try {
      const raw = window.localStorage.getItem("lenny.chat");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;
      const cleaned: Msg[] = parsed
        .filter((m: any) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
        .slice(-30)
        .map((m: any) => ({
          id: String(m.id ?? `${Date.now()}-${Math.random()}`),
          role: m.role,
          content: m.content,
          sources: Array.isArray(m.sources) ? m.sources : undefined,
        }));
      setMessages(cleaned);
    } catch {
      // ignore
    }
  }

  function persist(next: Msg[]) {
    try {
      window.localStorage.setItem("lenny.chat", JSON.stringify(next.slice(-30)));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadPersisted();
  }, []);

  async function send() {
    const text = draft.trim();
    if (!text || isStreaming) return;
    setDraft("");
    setError(null);
    setIsStreaming(true);

    const userMsg: Msg = { id: `${Date.now()}-u`, role: "user", content: text };
    const assistantId = `${Date.now()}-a`;
    const assistantMsg: Msg = { id: assistantId, role: "assistant", content: "" };

    setMessages((prev) => {
      const next = [...prev, userMsg, assistantMsg].slice(-30);
      persist(next);
      return next;
    });

    const history = messages
      .filter((m) => m.role === "user" || m.role === "assistant")
      .slice(-28)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      await streamChat(
        {
          message: text,
          history,
          researchMode,
        },
        {
          onDelta: (delta) => {
            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === assistantId ? { ...m, content: (m.content ?? "") + delta } : m,
              );
              persist(next);
              return next;
            });
          },
          onSources: (sources) => {
            if (!Array.isArray(sources)) return;
            setMessages((prev) => {
              const next = prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m,
              );
              persist(next);
              return next;
            });
          },
          onDone: () => {
            setIsStreaming(false);
          },
        },
      );
    } catch (err) {
      setIsStreaming(false);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Missing OPENAI_API_KEY")) {
        const hint = import.meta.env.DEV
          ? " Add OPENAI_API_KEY to Cloudflare Pages secrets or local .dev.vars."
          : "";
        setError(`Chat isn’t configured yet. The server is missing its API key.${hint}`);
      } else {
        setError("Chat couldn’t be reached right now. Please try again.");
      }
    }
  }

  return (
    <>
      <button
        id="ask-lenny-open"
        onClick={() => setOpen(true)}
        className="btn btn-primary floatingCta"
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
          <div className="overlay" onClick={() => setOpen(false)} />

          {/* Mobile: bottom sheet. Desktop: right drawer via CSS */}
          <div className="sheet askPanel">
            <div className="sheetHeader">
              <div>
                <div style={{ fontWeight: 900 }}>Ask Lenny</div>
                <div style={{ fontSize: 12, color: "var(--muted)" }}>Ask a question. I’ll keep it practical.</div>
              </div>
              <button className="btn btn-secondary" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>

            <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
              <label className="row" style={{ fontSize: 13 }}>
                <input
                  type="checkbox"
                  checked={researchMode}
                  onChange={(e) => setResearchMode(e.target.checked)}
                  disabled={isStreaming}
                />
                Research (uses internet + citations)
              </label>
              {error ? (
                <div style={{ marginTop: 10, fontSize: 12, color: "crimson" }}>{error}</div>
              ) : null}
            </div>

            <div className="sheetBody" style={{ flex: 1 }}>
              {messages.length === 0 ? (
                <div style={{ fontSize: 13, opacity: 0.75 }}>
                  Ask anything. I’ll stream the response as it arrives.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {messages.map((m) => (
                    <div key={m.id} style={{ display: "grid", gap: 6, alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "90%" }}>
                      <div
                        style={{
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
                        {m.content || (m.role === "assistant" && isStreaming ? "…" : "")}
                      </div>

                      {m.role === "assistant" && m.sources?.length ? (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          <div style={{ fontWeight: 700, marginBottom: 4 }}>Sources</div>
                          <ul style={{ margin: 0, paddingLeft: 18 }}>
                            {m.sources.slice(0, 6).map((s, idx) => (
                              <li key={`${s.url ?? idx}-${idx}`}>
                                {s.url ? (
                                  <a href={s.url} target="_blank" rel="noreferrer">
                                    {s.title ?? s.url}
                                  </a>
                                ) : (
                                  s.title ?? "(source)"
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
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
                disabled={isStreaming}
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
                  disabled={isStreaming}
                  className="btn btn-secondary"
                >
                  Clear
                </button>
                <button
                  onClick={send}
                  disabled={draft.trim().length === 0 || isStreaming}
                  className="btn btn-primary"
                >
                  {isStreaming ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}


