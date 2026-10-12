"use client";
/**
 * Руни — слід від практики, а не оцінка стану. Відкриваються самі,
 * коли дія повторюється; нічого не можна «прокачати» навмисно.
 */
import { useGame } from "@/lib/store/game";
import { RUNE_BRANCHES } from "@/lib/mock-data/runes";
import { runeShort } from "@/lib/utils/runes";
import { t } from "@/lib/mock-data/i18n";
import Sheet from "@/components/ui/Sheet";

export default function Runes() {
  const { state } = useGame();
  const L = state.lang;

  const sessions = (state.journal || []).reduce((a, d) => a + d.entries.length, 0);
  const notes = (state.journal || []).reduce((a, d) => a + d.entries.filter((e) => e.note).length, 0);
  const helped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);

  // реальний прогрес; решта поки замкнена
  const prog: Record<string, { cur: number; req: number; how: string }> = {
    sprout: { cur: state.onboarded ? 1 : 0, req: 1, how: t(L, "rune.how.sprout") },
    move: { cur: Math.min(3, state.questsDone), req: 3, how: t(L, "rune.how.move") },
    return: { cur: Math.min(3, sessions), req: 3, how: t(L, "rune.how.return") },
    words: { cur: Math.min(3, notes), req: 3, how: t(L, "rune.how.words") },
    silence: { cur: Math.min(5, helped), req: 5, how: t(L, "rune.how.silence") },
  };

  const openCount = Object.values(prog).filter((p) => p.cur >= p.req).length;

  return (
    <Sheet
      crumb={t(L, "rune.crumb")}
      title={t(L, "rune.title2")}
      sub={t(L, "rune.sub2")}
      wide
      note={t(L, "rune.note")}
    >
      <div style={{ fontSize: 12.5, color: "var(--g-ink-2)", marginBottom: 4 }}>
        {t(L, "rune.opened_of", { n: openCount, total: RUNE_BRANCHES.reduce((a, b) => a + b.runes.length, 0) })}
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
            {L === "en" ? b.nameEn : b.name}
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
                  <h4>{runeShort(r, L)}</h4>
                  <p>{p ? p.how : t(L, "rune.later")}</p>
                  <div className="l3-bar">
                    <i style={{ width: p ? `${Math.round((p.cur / p.req) * 100)}%` : "0%" }} />
                  </div>
                  <div className="l3-rune-foot">
                    <span>{open ? t(L, "rune.state_open") : started ? t(L, "rune.state_going") : t(L, "rune.state_closed")}</span>
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
