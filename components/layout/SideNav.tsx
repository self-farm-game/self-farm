"use client";
import { usePathname, useRouter } from "next/navigation";
import { NAV } from "@/lib/mock-data/content";
import { useGame } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { play } from "@/lib/sound/sound";

export default function SideNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { state } = useGame();
  const lvl = levelInfo(state.totalXp);
  const active = NAV.find((n) => pathname.startsWith(n.href))?.id ?? "garden";

  return (
    <aside className="sf-side">
      {/* wordmark */}
      <div style={{ padding: "4px 6px 16px", borderBottom: "2px solid rgba(0,0,0,.25)", marginBottom: 14 }}>
        <div style={{ fontSize: 22, color: "#ffe6b8", fontWeight: 700, letterSpacing: 0.5, textShadow: "0 2px 0 rgba(0,0,0,.4)" }}>🌳 Self-Farm</div>
        <div style={{ fontSize: 11, color: "#caa884", fontStyle: "italic", marginTop: 2 }}>одне дерево. один рух.</div>
      </div>

      {/* profile mini */}
      <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", borderRadius: 13, background: "linear-gradient(180deg,#6a4a2c,#43290f)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.3), 0 0 0 2px #2a1a0e", marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, flexShrink: 0, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, background: "radial-gradient(circle,#7bbf5a,#3f6a2a)", boxShadow: "inset 0 0 0 2px #2a1a0e" }}>🌱</div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14, color: "#f3d9a8", fontWeight: 700, lineHeight: 1.1 }}>{lvl.name}</div>
          <div style={{ fontSize: 11, color: "#c9a878" }}>{lvl.inLevel}/{lvl.target} XP</div>
        </div>
      </div>

      {/* vertical nav */}
      <nav style={{ display: "flex", flexDirection: "column", gap: 7, flex: 1 }}>
        {NAV.map((n) => {
          const on = active === n.id;
          return (
            <div
              key={n.id}
              onClick={() => {
                play("tap");
                router.push(n.href);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "11px 13px",
                borderRadius: 12,
                cursor: "pointer",
                userSelect: "none",
                color: on ? "#fff3d6" : "#d8c8a0",
                background: on ? "linear-gradient(180deg,#7a5128,#5a3618)" : "transparent",
                boxShadow: on ? "inset 0 1px 0 rgba(255,220,160,.35), 0 0 0 2px #2a1a0e" : "none",
                fontWeight: 700,
                fontSize: 15,
                transition: "background .12s",
              }}
            >
              <span
                style={{
                  width: 30,
                  height: 30,
                  flexShrink: 0,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  background: on ? "radial-gradient(circle,#7bbf5a,#3f6a2a)" : "rgba(0,0,0,.2)",
                  boxShadow: on ? "0 0 8px rgba(120,200,90,.5)" : "none",
                }}
              >
                {n.icon}
              </span>
              {n.label}
            </div>
          );
        })}
      </nav>

      {/* day + streak */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: "linear-gradient(180deg,#6a4a2c,#43290f)", boxShadow: "0 0 0 2px #2a1a0e" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#e7c389" }}>ДЕНЬ</div>
          <div style={{ fontSize: 17, color: "#f3d9a8", fontWeight: 700 }}>{state.day}</div>
        </div>
        <div style={{ flex: 1, textAlign: "center", padding: "8px 6px", borderRadius: 10, background: "linear-gradient(180deg,#6a4a2c,#43290f)", boxShadow: "0 0 0 2px #2a1a0e" }}>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: "#e7c389" }}>СЕРІЯ</div>
          <div style={{ fontSize: 17, color: "#ffd98a", fontWeight: 700 }}>🔥 {state.streak}</div>
        </div>
      </div>
    </aside>
  );
}
