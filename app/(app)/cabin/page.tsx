"use client";
import { useGame } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { CABIN_ROWS } from "@/lib/mock-data/content";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

export default function Cabin() {
  const { state, toggleMute, reset } = useGame();
  const lvl = levelInfo(state.totalXp);

  const sessionsCount = state.journal.reduce((a, d) => a + d.entries.length, 0);
  const notesCount = state.journal.reduce((a, d) => a + d.entries.filter((e) => e.note).length, 0);
  const runesUnlocked =
    (state.onboarded ? 1 : 0) +
    (state.questsDone >= 3 ? 1 : 0) +
    (sessionsCount >= 3 ? 1 : 0) +
    (notesCount >= 3 ? 1 : 0);

  const stat = (n: string | number, label: string, color: string) => (
    <div style={{ flex: 1, textAlign: "center", borderRadius: 13, padding: "12px 6px", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}>
      <div style={{ fontSize: 24, color, fontWeight: 700 }}>{n}</div>
      <div style={{ fontSize: 11, color: "#9a8fc0", letterSpacing: 1 }}>{label}</div>
    </div>
  );

  const row = (icon: string, label: string, val: React.ReactNode, onClick?: () => void) => (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", borderRadius: 13, cursor: onClick ? "pointer" : "default", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 16, color: "#e8dcc4", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#9a8fc0" }}>{val}</span>
      <span style={{ fontSize: 18, color: "#6a6090" }}>›</span>
    </div>
  );

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Хатина" sub="твій кут у тиші" />

      {/* profile */}
      <div style={{ borderRadius: 18, padding: 18, background: "linear-gradient(180deg,#5d3f24,#3f2812)", boxShadow: "inset 0 2px 0 rgba(255,220,160,.3), inset 0 -5px 0 rgba(0,0,0,.4), 0 0 0 2px #2a1a0e, 0 6px 0 rgba(0,0,0,.3)", display: "flex", gap: 15, alignItems: "center" }}>
        <div style={{ width: 66, height: 66, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: "radial-gradient(circle,#7bbf5a,#3f6a2a)", boxShadow: "inset 0 0 0 3px #2a1a0e, 0 0 0 2px #6a4a2c" }}>🌱</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 22, color: "#f3d9a8", fontWeight: 700 }}>Мандрівник V</div>
          <div style={{ fontSize: 13, color: "#c9a878" }}>Рівень дерева {lvl.levelNum} · {state.totalXp} XP усього</div>
        </div>
      </div>

      {/* stats */}
      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {stat(state.day, "ДНІВ", "#ffd98a")}
        {stat(runesUnlocked, "РУН", "#a98bff")}
        {stat(state.questsDone, "КВЕСТІВ", "#7bbf5a")}
      </div>

      {/* settings */}
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        {row(
          "🔈",
          "Звук",
          state.muted ? "вимкнено" : "увімкнено",
          () => {
            toggleMute();
            if (state.muted) play("select"); // about to become unmuted
          },
        )}
        {CABIN_ROWS.map((c, i) => (
          <div key={i}>{row(c.icon, c.label, c.val)}</div>
        ))}
        {row("♻️", "Скинути прогрес", "", () => {
          if (confirm("Скинути весь прогрес? Дерево почнеться з паростка.")) {
            reset();
          }
        })}
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: "#6a5f88", marginTop: 20, fontStyle: "italic" }}>
        Self-Farm · не self-harm, а self-farm.
        <br />
        Одне дерево. Один рух.
      </div>
    </div>
  );
}
