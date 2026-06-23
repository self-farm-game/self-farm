"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useGame } from "@/lib/store/game";
import BottomNav from "./BottomNav";
import SideNav from "./SideNav";
import AuthGate from "@/components/auth/AuthGate";

function WoodPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 8,
        background: "linear-gradient(180deg,#6a4a2c,#4a2f18)",
        boxShadow:
          "inset 0 1px 0 rgba(255,220,160,.35), inset 0 -2px 0 rgba(0,0,0,.4), 0 0 0 2px #2a1a0e",
        color: "#f3d9a8",
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.5,
      }}
    >
      {children}
    </div>
  );
}

export default function GameShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { state, auth } = useGame();
  const [now, setNow] = useState("");
  useEffect(() => {
    const f = () => setNow(new Date().toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" }));
    f();
    const id = setInterval(f, 30000);
    return () => clearInterval(id);
  }, []);
  // onboarding and the initial redirect render full-bleed with their own bg
  const bare = pathname === "/onboarding" || pathname === "/";

  // auth gating: until ready show a tiny loader; if not signed in show the gate
  const loading = !auth.ready;
  const gated = auth.ready && auth.isAnonymous;

  return (
    <div className="sf-field">
      <div className="sf-frame">
        <div className="sf-inner">
          {loading ? (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#0c0a16", color: "#8a7fb0", fontSize: 13, letterSpacing: 2 }}>
              Self-Farm…
            </div>
          ) : gated ? (
            <AuthGate />
          ) : bare ? (
            <div style={{ position: "absolute", inset: 0 }}>{children}</div>
          ) : (
            <div className="sf-shell">
              <SideNav />
              <div className="sf-main">
                <div className="sf-wall" />
                <div className="sf-wall-glow" />

                {/* mobile-only top status bar */}
                <div className="sf-topbar">
                  <WoodPill>{now || "··:··"}</WoodPill>
                  <WoodPill>ДЕНЬ {state.day}</WoodPill>
                  <WoodPill>🔥 {state.streak}</WoodPill>
                </div>

                <div className="sf-scroll">
                  <div className="sf-page">{children}</div>
                </div>
                <BottomNav />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
