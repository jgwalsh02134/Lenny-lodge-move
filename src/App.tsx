import { useMemo, useState } from "react";
import "./App.css";
import { postJSON } from "./lib/api";

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

function App() {
  const [tab, setTab] = useState<"research" | "import">("research");

  // Research state
  const [researchQuery, setResearchQuery] = useState("");
  const [seriousMode, setSeriousMode] = useState(false);
  const [humorDial, setHumorDial] = useState<"low" | "medium" | "high">("medium");
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

  async function runResearch() {
    setResearchLoading(true);
    setResearchError(null);
    setResearchResult(null);
    try {
      const data = await postJSON<ResearchResponse>("/api/ai/research", {
        query: researchQuery,
        seriousMode,
        humorDial,
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
    <div style={{ maxWidth: 920, margin: "0 auto", padding: 16, textAlign: "left" }}>
      <h1 style={{ marginBottom: 8 }}>Lenny Lodge Move — API Tester</h1>
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
          <h2 style={{ marginTop: 0 }}>Research (POST /api/ai/research)</h2>
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

          <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={seriousMode}
                onChange={(e) => setSeriousMode(e.target.checked)}
              />
              Serious Mode
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              Humor Dial
              <select
                value={humorDial}
                onChange={(e) => setHumorDial(e.target.value as any)}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </label>
          </div>

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
              <h3>Answer</h3>
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
                {researchResult.text || "(no text returned)"}
              </div>

              <h3 style={{ marginTop: 16 }}>Citations</h3>
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
          <h2 style={{ marginTop: 0 }}>Import Listing (POST /api/listings/import)</h2>
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
              <h3>Extracted</h3>
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
                    <a href={importResult.extracted.image} target="_blank" rel="noreferrer">
                      {importResult.extracted.image}
                    </a>
                  ) : (
                    "(missing)"
                  )}
                </dd>
              </dl>

              <h3 style={{ marginTop: 16 }}>Missing</h3>
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
  );
}

export default App;
