import type { ReactNode } from "react";
import { LennyAvatar } from "./LennyAvatar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
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
          <LennyAvatar mood="normal" />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, lineHeight: 1.1 }}>Lenny Lodge</div>
            <div style={{ fontSize: 13, opacity: 0.75 }}>Move Planner</div>
          </div>
        </div>
      </header>

      <main style={{ marginTop: 16 }}>{children}</main>
    </div>
  );
}


