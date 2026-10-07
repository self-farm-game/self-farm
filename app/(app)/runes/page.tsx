"use client";
/**
 * Руни — слід від практики, а не оцінка стану. Відкриваються самі,
 * коли дія повторюється; нічого не можна «прокачати» навмисно.
 */
import { useGame } from "@/lib/store/game";
import { RUNE_BRANCHES } from "@/lib/mock-data/runes";
import Sheet from "@/components/ui/Sheet";

export default function Runes() {
  const { state } = useGame();

  const sessions = (state.journal || []).reduce((a, d) => a + d.entries.length, 0);
  const notes = (state.journal || []).reduce((a, d) => a + d.entries.filter((e) => e.note).length, 0);
  const helped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);

  // реальний прогрес; решта поки замкнена
  const prog: Record<string, { cur: number; req: number; how: string }> = {
    sprout: { cur: state.onboarded ? 1 : 0, req: 1, how: "посадити дерево" },
    move: { cur: Math.min(3, state.questsDone), req: 3, how: "пройти 3 стежки" },
    return: { cur: Math.min(3, sessions), req: 3, how: "повернутись 3 рази" },
    words: { cur: Math.min(3, notes), req: 3, how: "лишити 3 записи словами" },
    silence: { cur: Math.min(5, helped), req: 5, how: "5 разів «допомогло»" },
  };

  const openCount = Object.values(prog).filter((p) => p.cur >= p.req).length;

  return (
    <Sheet
      crumb="РУНИ"
      title="Колекція рун"
      sub="Твої практики лишають сліди. Кожне повернення має значення."
      wide
      note="Руни відображають практику, а не оцінку твого стану. Жодну не можна отримати навмисно — тільки прожити."
    >
      <div style={{ fontSize: 12.5, color: "var(--g-ink-2)", marginBottom: 4 }}>
        Відкрито <b style={{ color: "var(--g-gold)" }}>{openCount}</b> із{" "}
        {RUNE_BRANCHES.reduce((a, b) => a + b.runes.length, 0)}
      </div>

      {RUNE_BRANCHES.map((b, bi) => (
        <div key={bi}>
          <div className="l3-section-title">
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: b.color,
                boxShadow: `0 0 10px ${b.color}`,
                display: "inline-block",
              }}
            />
            {b.name}
          </div>
          <div className="l3-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
            {b.runes.map((r) => {
              const p = prog[r.id];
              const open = !!p && p.cur >= p.req;
              const started = !!p && p.cur > 0;
              return (
                <div key={r.id} className={"l3-rune" + (open ? " l3-on" : "")}>
                  <div className="l3-rune-glyph" style={open ? { color: b.color, borderColor: b.color + "66" } : undefined}>
                    {started || open ? r.sym : "·"}
                  </div>
                  <h4>{r.name.replace("Руна ", "")}</h4>
                  <p>{p ? p.how : "відкриється пізніше"}</p>
                  <div className="l3-bar">
                    <i style={{ width: p ? `${Math.round((p.cur / p.req) * 100)}%` : "0%" }} />
                  </div>
                  <div className="l3-rune-foot">
                    <span>{open ? "відкрито" : started ? "у процесі" : "ще не відкрита"}</span>
                    <span>{p ? `${p.cur} / ${p.req}` : "—"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </Sheet>
  );
}
