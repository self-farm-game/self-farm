"use client";
import { useGame } from "@/lib/store/game";
import { RUNE_BRANCHES } from "@/lib/mock-data/runes";

export default function Runes() {
  const { state } = useGame();

  const sessionsCount = state.journal.reduce((a, d) => a + d.entries.length, 0);
  const notesCount = state.journal.reduce(
    (a, d) => a + d.entries.filter((e) => e.note).length,
    0,
  );

  // real progress per rune id (everything else stays locked for now)
  const prog: Record<string, { cur: number; req: number }> = {
    sprout: { cur: state.onboarded ? 1 : 0, req: 1 },
    move: { cur: Math.min(3, state.questsDone), req: 3 },
    return: { cur: Math.min(3, sessionsCount), req: 3 },
    words: { cur: Math.min(3, notesCount), req: 3 },
  };
  const stateOf = (id: string): "done" | "prog" | "lock" => {
    const p = prog[id];
    if (!p || p.cur <= 0) return "lock";
    return p.cur >= p.req ? "done" : "prog";
  };

  // "дерево помітило" — only after there is something to notice
  const insights: string[] = [];
  if (state.questsDone > 0) insights.push(`Квестів зроблено: ${state.questsDone}.`);
  if (sessionsCount > 0) insights.push(`Ти повертався ${sessionsCount} ${sessionsCount === 1 ? "раз" : "рази"}.`);
  if (notesCount > 0) insights.push(`Ти лишив ${notesCount} запис(ів) словами.`);

  return (
    <div className="sf-screen" style={{ minHeight: "100%" }}>
      <div
        style={{
          position: "relative",
          padding: "52px 18px 20px",
          textAlign: "center",
          background: "linear-gradient(180deg,#34255a,#241a42)",
          boxShadow: "inset 0 -8px 20px rgba(0,0,0,.4)",
        }}
      >
        <div style={{ fontSize: 30, color: "#f4ecd6", fontWeight: 700, textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Руни</div>
        <div style={{ fontSize: 13, lineHeight: 1.5, color: "#a99fc8", fontStyle: "italic", marginTop: 6 }}>
          Дерево пам&apos;ятає не перемоги, а повернення.
          <br />
          Коли ти повторюєш маленькі дії — в корінні проступають руни.
        </div>
      </div>

      <div style={{ padding: "18px 16px", background: "linear-gradient(180deg,#241a42,#1a1230 70%,#140d24)" }}>
        {RUNE_BRANCHES.map((b, bi) => (
          <div key={bi} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 11, paddingLeft: 2 }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: b.color, boxShadow: "0 0 8px " + b.color }} />
              <div style={{ fontSize: 16, color: "#efe7d2", fontWeight: 700, letterSpacing: 1 }}>{b.name}</div>
              <div style={{ flex: 1, height: 2, background: "repeating-linear-gradient(90deg,rgba(150,120,200,.35) 0 5px, transparent 5px 10px)" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
              {b.runes.map((r, ri) => {
                const st = stateOf(r.id);
                const done = st === "done";
                const prg = st === "prog";
                const p = prog[r.id];
                return (
                  <div key={ri} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 26,
                        color: done ? "#fff" : prg ? "#cdbef0" : "#5a5276",
                        background: done
                          ? `radial-gradient(circle, ${b.color}, #2a2045)`
                          : prg
                          ? "radial-gradient(circle,#3a2f5c,#241a42)"
                          : "radial-gradient(circle,#221c38,#1a1430)",
                        boxShadow: done
                          ? `0 0 14px ${b.color}, inset 0 0 0 2px rgba(255,255,255,.4)`
                          : prg
                          ? "inset 0 0 0 2px #5a4a8a, 0 0 8px rgba(120,90,180,.4)"
                          : "inset 0 0 0 2px #2a2440",
                        animation: done ? "sf-glow 2.6s ease-in-out infinite" : "none",
                      }}
                    >
                      {st === "lock" ? "🔒" : r.sym}
                    </div>
                    <div style={{ fontSize: 10, lineHeight: 1.1, textAlign: "center", color: done ? "#e8dcc4" : prg ? "#b9aecb" : "#6a6090", minHeight: 22 }}>
                      {r.name}
                    </div>
                    {prg && p && <div style={{ fontSize: 9, color: b.color, fontWeight: 700 }}>{p.cur}/{p.req}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div
          style={{
            marginTop: 18,
            borderRadius: 16,
            padding: 16,
            background: "linear-gradient(180deg,#d8bf94,#c8a878)",
            boxShadow: "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e",
          }}
        >
          <div style={{ fontSize: 13, letterSpacing: 2, color: "#6a4a2c", fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
            🌳 дерево помітило
          </div>
          {insights.length === 0 ? (
            <div style={{ fontSize: 14, color: "#6a4a2c", fontStyle: "italic", lineHeight: 1.4 }}>
              Поки що дерево лише придивляється. Зроби кілька квестів — і тут проступлять закономірності.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              {insights.map((t, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 14, color: "#4a3320", lineHeight: 1.35 }}>
                  <span style={{ color: "#7bbf5a" }}>•</span> {t}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
