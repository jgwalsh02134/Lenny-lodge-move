import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { postJSON } from "./lib/api";
import { AskLennyDrawer } from "./components/AskLennyDrawer";
import {
  getSeriousMode,
  setSeriousMode as persistSeriousMode,
} from "./lib/lennySettings";
import { AppShell } from "./components/AppShell";
import { OnboardingIntro } from "./pages/OnboardingIntro";
import { FoundationWizardPage } from "./pages/FoundationWizardPage";
import { getFoundationStatus } from "./lib/foundationStore";

type ResearchResponse = {
  ok: true;
  text: string;
  citations: Array<{ url: string; title?: string }>;
  sources: Array<{ url: string; title?: string }>;
  raw: unknown;
};

type ImportResponse = {
  ok: true;
  url: string;
  extracted: {
    title?: string;
    address?: string;
    price?: string | number;
    beds?: number | null;
    baths?: number | null;
    sqft?: number | null;
    image?: string | null;
    source: "jsonld" | "opengraph" | "unknown";
    missing: string[];
  };
  raw: unknown;
};

type AppView = "intro" | "wizard" | "home";

function App() {
  const [tab, setTab] = useState<"research" | "import">("research");
  const [showApiTester, setShowApiTester] = useState(false);
  const [, setWelcomed] = useState(false);
  const [view, setView] = useState<AppView>("home");

  // Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [seriousMode, setSeriousMode] = useState(false);
  const [allowedDomainsInput, setAllowedDomainsInput] = useState("");
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchError, setResearchError] = useState<string | null>(null);
  const [researchResult, setResearchResult] = useState<ResearchResponse | null>(null);

  const allowedDomains = useMemo(() => {
    const parts = allowedDomainsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length ? parts : undefined;
  }, [allowedDomainsInput]);

  // Import state
  const [importUrl, setImportUrl] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<ImportResponse | null>(null);

  // Humor dial is now internal-only:
  // - default "medium"
  // - forced "low" when Serious Mode is on
  const effectiveHumorDial = seriousMode ? "low" : "medium";

  useEffect(() => {
    // Hydrate persisted header modes
    setSeriousMode(getSeriousMode());

    try {
      const w = window.localStorage.getItem("lenny.welcomed");
      const isWelcomed = w === "1";
      setWelcomed(isWelcomed);

      const foundationStatus = getFoundationStatus();
      if (foundationStatus === "complete") {
        setView("home");
      } else if (!isWelcomed) {
        setView("intro");
      } else {
        setView("wizard");
      }
    } catch {
      setWelcomed(true);
      setView(getFoundationStatus() === "complete" ? "home" : "wizard");
    }
  }, []);

  useEffect(() => {
    persistSeriousMode(seriousMode);
  }, [seriousMode]);

  async function runResearch() {
    setResearchLoading(true);
    setResearchError(null);
    setResearchResult(null);
    try {
      const data = await postJSON<ResearchResponse>("/api/ai/research", {
        query: researchQuery,
        seriousMode,
        humorDial: effectiveHumorDial,
        allowedDomains,
      });
      setResearchResult(data);
    } catch (err) {
      setResearchError(err instanceof Error ? err.message : String(err));
    } finally {
      setResearchLoading(false);
    }
  }

  async function runImport() {
    setImportLoading(true);
    setImportError(null);
    setImportResult(null);
    try {
      const data = await postJSON<ImportResponse>("/api/listings/import", { url: importUrl });
      setImportResult(data);
    } catch (err) {
      setImportError(err instanceof Error ? err.message : String(err));
    } finally {
      setImportLoading(false);
    }
  }

  return (
    <>
      <AppShell
        seriousMode={seriousMode}
        onSeriousModeChange={(v) => setSeriousMode(v)}
      >
        {view === "intro" ? (
          <OnboardingIntro
            humorDial={effectiveHumorDial}
            onBegin={() => {
              try {
                window.localStorage.setItem("lenny.welcomed", "1");
              } catch {
                // ignore
              }
              setWelcomed(true);
              setView("wizard");
            }}
            onSkip={() => {
              try {
                window.localStorage.setItem("lenny.welcomed", "1");
              } catch {
                // ignore
              }
              setWelcomed(true);
              setView("wizard");
            }}
          />
        ) : view === "wizard" ? (
          <FoundationWizardPage
            onGoHome={() => {
              setView("home");
            }}
          />
        ) : (
          <div>
            <div
              style={{
                borderRadius: 16,
                border: "1px solid rgba(0,0,0,0.10)",
                background: "rgba(255,255,255,0.90)",
                padding: 16,
                textAlign: "left",
              }}
            >
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  onClick={() => setView("wizard")}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#111",
                    color: "#fff",
                  }}
                >
                  Start Foundation
                </button>
                <button
                  onClick={() => {
                    setShowApiTester(true);
                    setTab("import");
                  }}
                  style={{
                    padding: "14px 16px",
                    borderRadius: 14,
                    border: "1px solid rgba(0,0,0,0.12)",
                    background: "#f6f7f8",
                  }}
                >
                  Browse Listings
                </button>
              </div>

              <p style={{ marginTop: 12, marginBottom: 6, lineHeight: 1.5 }}>
                I’ll ask a few strategy questions first — they determine the cleanest path.
              </p>
              <div style={{ fontSize: 12, opacity: 0.75 }}>
                Educational guidance only — for NY legal/tax questions, consult a NY attorney/CPA.
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <button
                onClick={() => setShowApiTester((v) => !v)}
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "transparent",
                }}
              >
                {showApiTester ? "Hide" : "Show"} API Tester
              </button>
            </div>

            {showApiTester ? (
              <div
                style={{
                  marginTop: 12,
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.10)",
                  background: "rgba(255,255,255,0.90)",
                  padding: 16,
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
                  <h2 style={{ marginTop: 0, marginBottom: 6, fontSize: 18 }}>API Tester</h2>
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    Modes: Serious {seriousMode ? "ON" : "OFF"}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                  <button
                    onClick={() => setTab("research")}
                    disabled={tab === "research"}
                    style={{ padding: "8px 12px" }}
                  >
                    Research
                  </button>
                  <button
                    onClick={() => setTab("import")}
                    disabled={tab === "import"}
                    style={{ padding: "8px 12px" }}
                  >
                    Import Listing
                  </button>
                </div>

                {tab === "research" ? (
                  <div>
                    <h3 style={{ marginTop: 0 }}>Research (POST /api/ai/research)</h3>
                    <label style={{ display: "block", marginBottom: 8 }}>
                      Query
                      <textarea
                        value={researchQuery}
                        onChange={(e) => setResearchQuery(e.target.value)}
                        rows={6}
                        style={{ width: "100%", marginTop: 6 }}
                        placeholder="What is the typical NY home closing timeline?"
                      />
                    </label>

                    <label style={{ display: "block", marginTop: 12 }}>
                      Allowed domains (comma-separated, optional)
                      <input
                        value={allowedDomainsInput}
                        onChange={(e) => setAllowedDomainsInput(e.target.value)}
                        style={{ width: "100%", marginTop: 6 }}
                        placeholder="ny.gov, nysba.org"
                      />
                    </label>

                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button
                        onClick={runResearch}
                        disabled={researchLoading || researchQuery.trim().length === 0}
                      >
                        {researchLoading ? "Running…" : "Run research"}
                      </button>
                      <button
                        onClick={() => {
                          setResearchQuery("");
                          setResearchResult(null);
                          setResearchError(null);
                        }}
                        disabled={researchLoading}
                      >
                        Clear
                      </button>
                    </div>

                    {researchError ? (
                      <p style={{ color: "crimson", marginTop: 12 }}>{researchError}</p>
                    ) : null}

                    {researchResult ? (
                      <div style={{ marginTop: 16 }}>
                        <h4>Answer</h4>
                        <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                          {researchResult.text || "(no text returned)"}
                        </div>

                        <h4 style={{ marginTop: 16 }}>Citations</h4>
                        {researchResult.citations?.length ? (
                          <ul>
                            {researchResult.citations.map((c) => (
                              <li key={c.url}>
                                <a href={c.url} target="_blank" rel="noreferrer">
                                  {c.title ?? c.url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p>(none)</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div>
                    <h3 style={{ marginTop: 0 }}>Import Listing (POST /api/listings/import)</h3>
                    <label style={{ display: "block", marginBottom: 8 }}>
                      Listing URL
                      <input
                        value={importUrl}
                        onChange={(e) => setImportUrl(e.target.value)}
                        style={{ width: "100%", marginTop: 6 }}
                        placeholder="https://..."
                      />
                    </label>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={runImport}
                        disabled={importLoading || importUrl.trim().length === 0}
                      >
                        {importLoading ? "Importing…" : "Import"}
                      </button>
                      <button
                        onClick={() => {
                          setImportUrl("");
                          setImportResult(null);
                          setImportError(null);
                        }}
                        disabled={importLoading}
                      >
                        Clear
                      </button>
                    </div>

                    {importError ? (
                      <p style={{ color: "crimson", marginTop: 12 }}>{importError}</p>
                    ) : null}

                    {importResult ? (
                      <div style={{ marginTop: 16 }}>
                        <h4>Extracted</h4>
                        <dl style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 8 }}>
                          <dt>source</dt>
                          <dd>{importResult.extracted.source}</dd>
                          <dt>title</dt>
                          <dd>{importResult.extracted.title ?? "(missing)"}</dd>
                          <dt>address</dt>
                          <dd>{importResult.extracted.address ?? "(missing)"}</dd>
                          <dt>price</dt>
                          <dd>{importResult.extracted.price ?? "(missing)"}</dd>
                          <dt>beds</dt>
                          <dd>{String(importResult.extracted.beds ?? "(missing)")}</dd>
                          <dt>baths</dt>
                          <dd>{String(importResult.extracted.baths ?? "(missing)")}</dd>
                          <dt>sqft</dt>
                          <dd>{String(importResult.extracted.sqft ?? "(missing)")}</dd>
                          <dt>image</dt>
                          <dd>
                            {importResult.extracted.image ? (
                              <a
                                href={importResult.extracted.image}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {importResult.extracted.image}
                              </a>
                            ) : (
                              "(missing)"
                            )}
                          </dd>
                        </dl>

                        <h4 style={{ marginTop: 16 }}>Missing</h4>
                        {importResult.extracted.missing?.length ? (
                          <ul>
                            {importResult.extracted.missing.map((m) => (
                              <li key={m}>{m}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>(none)</p>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        )}
      </AppShell>

      <AskLennyDrawer humorDial={effectiveHumorDial} seriousMode={seriousMode} />
    </>
  );
}

export default App;
