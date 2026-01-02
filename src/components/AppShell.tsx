import type { ReactNode } from "react";
import { LennyAvatar } from "./LennyAvatar";

type AppShellProps = {
  children: ReactNode;
};

export function AppShell({
  children,
}: AppShellProps) {
  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-title">
            <LennyAvatar mood="normal" />
            <div>
              <h1>Lenny Lodge</h1>
              <div>Move Planner</div>
            </div>
          </div>

          <button
            className="btn btn-ghost"
            onClick={() => {
              const el = document.getElementById("ask-lenny-open");
              el?.click();
            }}
            aria-label="Help (Ask Lenny)"
            title="Help"
          >
            Help
          </button>
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}


