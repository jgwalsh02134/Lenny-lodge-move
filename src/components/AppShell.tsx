import type { ReactNode } from "react";
import { LennyAvatar } from "./LennyAvatar";

type AppShellProps = {
  seriousMode: boolean;
  onSeriousModeChange: (v: boolean) => void;
  children: ReactNode;
};

export function AppShell({
  seriousMode,
  onSeriousModeChange,
  children,
}: AppShellProps) {
  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 16 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: 12,
          borderRadius: 14,
          border: "1px solid rgba(0,0,0,0.10)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <LennyAvatar mood={seriousMode ? "serious" : "normal"} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>Lenny Lodge</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Move Planner</div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
            <input
              type="checkbox"
              checked={seriousMode}
              onChange={(e) => onSeriousModeChange(e.target.checked)}
            />
            Serious Mode
          </label>
        </div>
      </header>

      <main style={{ marginTop: 16 }}>{children}</main>
    </div>
  );
}


