"use client";
/**
 * Журнал — усе, що ти прожив, день за днем. Нічого не редагується і
 * нічого не оцінюється: це доказ, що ти приходив.
 */
import { useGame } from "@/lib/store/game";
import Sheet from "@/components/ui/Sheet";

export default function Journal() {
  const { state } = useGame();
  const days = state.journal || [];
  const total = days.reduce((a, d) => a + d.entries.length, 0);

  return (
    <Sheet
      crumb="ЖУРНАЛ"
      title="Фермерський журнал"
      sub={total === 0 ? "Поки порожньо." : `${total} записів. Дерево памʼятає не перемоги, а повернення.`}
      note="Записи не можна виправити чи стерти — так вони лишаються чесними."
    >
      {days.length === 0 ? (
        <div className="l3-empty">
          <div className="l3-ico">📖</div>
          <h4>Сторінки ще чисті</h4>
          <p>
            Тут зʼявлятиметься те, що ти проживаєш.
            <br />
            Почни з «Як ти зараз?» у Саду.
          </p>
        </div>
      ) : (
        days.map((d, di) => (
          <div key={di} style={{ marginBottom: 6 }}>
            <div className="l3-section-title">{d.day}</div>
            {d.entries.map((e, ei) => (
              <div key={ei} className="l3-entry">
                <div className="l3-entry-top">
                  <b>{e.state}</b>
                  <span>{e.time}</span>
                </div>
                <div className="l3-chips">
                  {e.energy && e.energy !== "—" && <span className="l3-tag l3-tag-blue">⚡ {e.energy}</span>}
                  {e.tension && <span className="l3-tag">💢 {e.tension}</span>}
                </div>
                {e.quest && (
                  <div style={{ fontSize: 14, marginTop: 10, display: "flex", gap: 8, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span>🪶</span>
                    <span>{e.quest}</span>
                    {e.after && <span style={{ color: "var(--g-green)", fontWeight: 700 }}>· {e.after}</span>}
                  </div>
                )}
                {e.reward && (
                  <div style={{ fontSize: 12.5, color: "var(--g-gold)", marginTop: 7 }}>✦ {e.reward}</div>
                )}
                {e.note && <div className="l3-entry-note">«{e.note}»</div>}
                {!e.quest && (
                  <div style={{ fontSize: 12.5, color: "var(--g-ink-3)", fontStyle: "italic", marginTop: 6 }}>
                    стежку не брав — і це теж окей
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      )}
    </Sheet>
  );
}
