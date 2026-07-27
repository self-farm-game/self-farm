"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, DAILY_QUEST_LIMIT } from "@/lib/store/game";
import { QUESTS, STARTER_QUEST_ID, type MockQuest } from "@/lib/mock-data/quests";
import { levelInfo } from "@/lib/utils/xp";
import { STATE_LABEL } from "@/lib/mock-data/states";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

const parch = "linear-gradient(180deg,#d8bf94,#c8a878)";
const parchShadow =
  "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e";

function fmtLeft(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h} год ${mm} хв` : `${mm} хв`;
}

export default function Questbook() {
  const router = useRouter();
  const { state, checkinLeftMs, dailyLeft } = useGame();
  const lvl = levelInfo(state.totalXp);

  // live countdown for the 3h check-in window
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);
  const leftMs = Math.max(0, (state.activeUntil || 0) - now);
  const active = leftMs > 0;

  const byId = (id: string) => QUESTS.find((q) => q.id === id);
  const activeQuests = (state.activeQuestIds || []).map(byId).filter(Boolean) as MockQuest[];
  const starter = byId(STARTER_QUEST_ID)!;
  const done = state.dayKey && state.doneToday ? state.doneToday : [];
  const limitReached = dailyLeft <= 0;

  const goCheckin = () => {
    play("confirm");
    router.push("/garden");
  };

  const QuestCard = ({ q, tag }: { q: MockQuest; tag?: string }) => (
    <div
      onClick={goCheckin}
      style={{ cursor: "pointer", borderRadius: 15, padding: "14px 15px", background: parch, boxShadow: parchShadow, display: "flex", gap: 12, alignItems: "center" }}
    >
      <div style={{ width: 46, height: 46, flexShrink: 0, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 25, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>{q.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, color: "#3a2616", fontWeight: 700, lineHeight: 1.1 }}>{q.title}</div>
        <div style={{ fontSize: 12, color: "#7a5836", margin: "3px 0 6px" }}>для: {q.for}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>⏱ {q.dur}</span>
          <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>✦ +{q.xp}</span>
          {q.tier > 1 && (
            <span style={{ fontSize: 11, fontWeight: 700, color: q.tier === 3 ? "#8a2f2f" : "#8a5a1f", padding: "3px 8px", borderRadius: 6, background: q.tier === 3 ? "rgba(180,60,60,.18)" : "rgba(200,140,50,.2)" }}>
              {q.tier === 3 ? "🔥 сміливий" : "↗ виклик"}
            </span>
          )}
          {tag && <span style={{ fontSize: 11, fontWeight: 700, color: "#3a6a2a", padding: "3px 8px", borderRadius: 6, background: "rgba(120,200,90,.25)" }}>{tag}</span>}
        </div>
      </div>
      <div style={{ fontSize: 22, color: "#7a5836" }}>›</div>
    </div>
  );

  const sectionLabel = (t: string) => (
    <div style={{ fontSize: 12, color: "#9a8fc0", textTransform: "uppercase", letterSpacing: 2, margin: "22px 2px 12px" }}>{t}</div>
  );

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Квести" sub="сьогоднішні стежки" />

      {/* status banner */}
      <div style={{ borderRadius: 15, padding: "13px 15px", marginTop: 4, background: "linear-gradient(180deg,#34255a,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 13, color: "#cfc4e6" }}>
            Сьогодні: <b style={{ color: "#f3d9a8" }}>{DAILY_QUEST_LIMIT - dailyLeft}</b> / {DAILY_QUEST_LIMIT}
          </div>
          {active ? (
            <div style={{ fontSize: 12, color: "#b9d99a" }}>настрій активний ще {fmtLeft(leftMs)}</div>
          ) : (
            <div style={{ fontSize: 12, color: "#c9a878" }}>настрій не введено</div>
          )}
        </div>
      </div>

      {limitReached ? (
        <div style={{ marginTop: 18, borderRadius: 15, padding: "22px 16px", textAlign: "center", background: "linear-gradient(180deg,#4a3a2a,#33251a)", boxShadow: "0 0 0 2px #2a1a0e" }}>
          <div style={{ fontSize: 34, marginBottom: 8 }}>🌙</div>
          <div style={{ fontSize: 16, color: "#f3d9a8", fontWeight: 700 }}>На сьогодні досить</div>
          <div style={{ fontSize: 13, color: "#c9a878", marginTop: 5, lineHeight: 1.4 }}>
            {DAILY_QUEST_LIMIT} стежок пройдено. Дерево росте від повернень, не від перевтоми — приходь завтра.
          </div>
        </div>
      ) : active ? (
        <>
          {sectionLabel(`Актуальні · під: ${(state.activeStates || []).map((k) => STATE_LABEL[k] || k).join(", ")}`)}
          {activeQuests.length ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activeQuests.map((q) => (
                <QuestCard key={q.id} q={q} />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", padding: "10px 0" }}>
              усі стежки цього настрою пройдено — введи настрій знову, коли захочеш
            </div>
          )}
          <div onClick={goCheckin} style={{ cursor: "pointer", textAlign: "center", marginTop: 14, fontSize: 13, color: "#c9a878", textDecoration: "underline" }}>
            ввести настрій наново
          </div>
        </>
      ) : (
        <>
          {sectionLabel("Доступно завжди")}
          <QuestCard q={starter} tag="за замовчуванням" />
          <div onClick={goCheckin} style={{ cursor: "pointer", marginTop: 14, borderRadius: 15, padding: "18px 16px", textAlign: "center", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}>
            <div style={{ fontSize: 30, marginBottom: 6 }}>🔒</div>
            <div style={{ fontSize: 15, color: "#cfc4e6", fontWeight: 700 }}>Реши стежки під свій стан</div>
            <div style={{ fontSize: 12.5, color: "#8a7fb0", marginTop: 5, lineHeight: 1.4 }}>
              Введи, як ти зараз — і сюди на 3 години зʼявляться підібрані квести.
            </div>
            <div style={{ display: "inline-block", marginTop: 11, padding: "9px 18px", borderRadius: 11, fontSize: 14, fontWeight: 700, color: "#2a1d10", background: "linear-gradient(180deg,#e6cf9c,#cda874)", boxShadow: "0 0 0 2px #6a4a2c" }}>
              ✦ Як ти зараз?
            </div>
          </div>
        </>
      )}

      {/* completed today */}
      {done.length > 0 && (
        <>
          {sectionLabel(`Виконано сьогодні · ${done.length}`)}
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {done.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 11, borderRadius: 12, padding: "10px 13px", background: "linear-gradient(180deg,#2c2645,#241d3a)", boxShadow: "0 0 0 2px #3f6a2a" }}>
                <div style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, background: "radial-gradient(circle,#7bbf5a,#3f6a2a)" }}>{d.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, color: "#e8dcc4", fontWeight: 600, lineHeight: 1.1 }}>{d.title}</div>
                  <div style={{ fontSize: 11, color: "#8a9f7a" }}>{d.time} · зроблено ✓</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ textAlign: "center", fontSize: 11.5, color: "#6a5f88", marginTop: 22, fontStyle: "italic", lineHeight: 1.5 }}>
        Стежки зʼявляються під твій стан і живуть 3 години.
        <br />
        Один рух за раз. Дерево запамʼятає.
      </div>
    </div>
  );
}
