import { useEffect, useState } from "react";
import "./App.css";
import { AskLennyDrawer } from "./components/AskLennyDrawer";
import { AppShell } from "./components/AppShell";
import { OnboardingIntro } from "./pages/OnboardingIntro";
import { FoundationWizardPage } from "./pages/FoundationWizardPage";
import { getFoundationStatus } from "./lib/foundationStore";
import { LennyAvatar } from "./components/LennyAvatar";

type AppView = "intro" | "wizard" | "home";

function App() {
  const [, setWelcomed] = useState(false);
  const [view, setView] = useState<AppView>("home");

  useEffect(() => {
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
    try {
      window.localStorage.setItem("lenny.page", view);
    } catch {
      // ignore
    }
  }, [view]);

  return (
    <>
      <AppShell>
        {view === "intro" ? (
          <OnboardingIntro
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
          <div className="container">
            <div className="stack" style={{ alignItems: "stretch" }}>
              <div className="center" style={{ marginTop: "var(--s2)" }}>
                <LennyAvatar size={260} />
              </div>

              <div className="card card-pad">
                <div style={{ fontWeight: 950, fontSize: 20, lineHeight: 1.2, marginBottom: "var(--s2)" }}>
                  Let’s map the cleanest path from White Plains to the Capital District.
                </div>
                <div style={{ color: "var(--muted)", lineHeight: 1.5 }}>
                  We’ll keep this select-only and practical.
                </div>
              </div>

              <div className="stack" style={{ gap: "var(--s3)" }}>
                <button className="btn btn-primary" style={{ width: "100%" }} onClick={() => setView("wizard")}>
                  Continue / Start Foundation
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => alert("Browse Listings is coming next. For now, run Foundation to set the plan.")}
                >
                  Browse Listings
                </button>
              </div>

              <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "center" }}>
                Tap-friendly. Thumb-reachable. No typing required.
              </div>
            </div>
          </div>
        )}
      </AppShell>

      <AskLennyDrawer />
    </>
  );
}

export default App;
