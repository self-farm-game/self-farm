"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/game";
import { JOURNAL_FILTERS } from "@/lib/mock-data/content";
import { Chip, ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

const tag: React.CSSProperties = {
  fontSize: 11,
  color: "#cdbef0",
  padding: "3px 9px",
  borderRadius: 6,
  background: "rgba(120,90,180,.25)",
  boxShadow: "inset 0 0 0 1px rgba(150,120,200,.3)",
};

export default function Journal() {
  const { state } = useGame();
  const [filter, setFilter] = useState("Усе");

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Журнал ферми" sub="що сталось — день за днем" />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16 }}>
        {JOURNAL_FILTERS.map((f) => (
          <Chip key={f} sm active={f === filter} onClick={() => { play("tap"); setFilter(f); }}>
            {f}
          </Chip>
        ))}
      </div>

      {state.journal.length === 0 && (
        <div style={{ borderRadius: 16, padding: "26px 18px", textAlign: "center", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>📖</div>
          <div style={{ fontSize: 16, color: "#cfc4e6", fontWeight: 700 }}>Журнал поки чистий</div>
          <div style={{ fontSize: 13, color: "#8a7fb0", marginTop: 8, lineHeight: 1.5 }}>
            Тут зʼявлятиметься те, що ти проживаєш — день за днем.
            <br />
            Почни з «Як ти зараз?» у саду.
          </div>
        </div>
      )}

      {state.journal.map((d, di) => (
        <div key={di} style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 13, letterSpacing: 2, color: "#9a8fc0", textTransform: "uppercase", fontWeight: 700, marginBottom: 10, paddingLeft: 4 }}>
            {d.day}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {d.entries.map((e, ei) => (
              <div
                key={ei}
                style={{
                  borderRadius: 14,
                  padding: "13px 15px",
                  background: "linear-gradient(180deg,#2c2150,#241a42)",
                  boxShadow: "0 0 0 2px #4a3a6e, inset 0 1px 0 rgba(150,120,200,.2)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ fontSize: 15, color: "#f4ecd6", fontWeight: 700 }}>{e.state}</div>
                  <div style={{ fontSize: 12, color: "#8a7fb0" }}>{e.time}</div>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: e.quest ? 8 : 0 }}>
                  <span style={tag}>⚡ {e.energy}</span>
                  {e.tension && <span style={tag}>💢 {e.tension}</span>}
                </div>
                {e.quest && (
                  <div style={{ fontSize: 14, color: "#cfc4e6", display: "flex", alignItems: "center", gap: 7 }}>
                    <span>🪶</span> {e.quest}
                    {e.after && <span style={{ color: "#7bbf5a", fontWeight: 700 }}>· {e.after}</span>}
                  </div>
                )}
                {e.reward && <div style={{ fontSize: 13, color: "#ffd98a", marginTop: 5 }}>✦ {e.reward}</div>}
                {e.note && (
                  <div style={{ fontSize: 13, color: "#a99fc8", fontStyle: "italic", marginTop: 8, paddingTop: 8, borderTop: "1px dashed rgba(150,120,200,.3)" }}>
                    «{e.note}»
                  </div>
                )}
                {!e.quest && (
                  <div style={{ fontSize: 13, color: "#8a7fb0", fontStyle: "italic", marginTop: 2 }}>
                    квест не брав — і це теж окей
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
