"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame, QUESTS_PER_CHECKIN, XP_WINDOW_CAP } from "@/lib/store/game";
import { QUESTS, STARTER_QUEST_ID, type MockQuest } from "@/lib/mock-data/quests";
import { STATE_LABEL } from "@/lib/mock-data/states";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

const parch = "linear-gradient(180deg,#d8bf94,#c8a878)";
const parchShadow = "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e";

function fmtLeft(ms: number) {
  const m = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return h > 0 ? `${h} год ${mm} хв` : `${mm} хв`;
}

export default function Questbook() {
  const router = useRouter();
  const { state, canCheckin, xpLeft, xpWindowLeftMs } = useGame();

  const [, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 20000);
    return () => clearInterval(id);
  }, []);

  const byId = (id: string) => QUESTS.find((q) => q.id === id);
  const activeQuests = (state.activeQuestIds || []).map(byId).filter(Boolean) as MockQuest[];
  const starter = byId(STARTER_QUEST_ID)!;
  const done = state.dayKey && state.doneToday ? state.doneToday : [];
  const hasSet = activeQuests.length > 0;

  const runQuest = (id: string) => {
    play("confirm");
    router.push(`/garden?quest=${id}`);
  };
  const goCheckin = () => {
    play("confirm");
    router.push("/garden");
  };

  const QuestCard = ({ q, tag }: { q: MockQuest; tag?: string }) => (
    <div style={{ borderRadius: 15, padding: "14px 15px", background: parch, boxShadow: parchShadow }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
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
      </div>
      <div
        onClick={() => runQuest(q.id)}
        style={{ marginTop: 12, textAlign: "center", padding: "11px", borderRadius: 11, fontWeight: 700, fontSize: 14.5, cursor: "pointer", color: "#ffe6b8", background: "linear-gradient(180deg,#7a5128,#5a3618)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.3), 0 0 0 2px #2a1a0e" }}
      >
        Виконати →
      </div>
    </div>
  );

  const label = (t: string) => (
    <div style={{ fontSize: 12, color: "#9a8fc0", textTransform: "uppercase", letterSpacing: 2, margin: "22px 2px 12px" }}>{t}</div>
  );

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Квести" sub="сьогоднішні стежки" />

      {/* status */}
      <div style={{ borderRadius: 15, padding: "13px 15px", marginTop: 4, background: "linear-gradient(180deg,#34255a,#241a42)", boxShadow: "0 0 0 2px #4a3a6e", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#cfc4e6" }}>
          {hasSet ? (
            <>Набір: <b style={{ color: "#f3d9a8" }}>{activeQuests.length}</b> стежок лишилось</>
          ) : (
            <>Базова стежка доступна завжди</>
          )}
        </div>
        <div style={{ fontSize: 12, color: xpLeft > 0 ? "#b9d99a" : "#c9a878" }}>
          XP-стежок лишилось: {xpLeft}/{XP_WINDOW_CAP}
        </div>
      </div>

      {/* ALWAYS-AVAILABLE starter quest */}
      {label("Доступно завжди")}
      <QuestCard q={starter} tag="за замовчуванням" />

      {/* ACTIVE set from the check-in */}
      {hasSet && (
        <>
          {label(`Під твій стан · ${(state.activeStates || []).map((k) => STATE_LABEL[k] || k).join(", ")}`)}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {activeQuests.map((q) => (
              <QuestCard key={q.id} q={q} />
            ))}
          </div>
        </>
      )}

      {/* CHECK-IN prompt (only when the current set is cleared) */}
      {canCheckin ? (
        <div onClick={goCheckin} style={{ cursor: "pointer", marginTop: 18, borderRadius: 15, padding: "18px 16px", textAlign: "center", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e" }}>
          <div style={{ fontSize: 30, marginBottom: 6 }}>🧭</div>
          <div style={{ fontSize: 15, color: "#cfc4e6", fontWeight: 700 }}>Відкрий стежки під свій стан</div>
          <div style={{ fontSize: 12.5, color: "#8a7fb0", marginTop: 5, lineHeight: 1.4 }}>
            Введи, як ти зараз — і зʼявляться {QUESTS_PER_CHECKIN} підібрані квести.
            {xpLeft > 0
              ? ` XP приносять перші ${XP_WINDOW_CAP} квести за 3 години (лишилось ${xpLeft}).`
              : " XP-ліміт вікна вичерпано — квести ще діють, але без XP до нового вікна."}
          </div>
          <div style={{ display: "inline-block", marginTop: 11, padding: "9px 18px", borderRadius: 11, fontSize: 14, fontWeight: 700, color: "#2a1d10", background: "linear-gradient(180deg,#e6cf9c,#cda874)", boxShadow: "0 0 0 2px #6a4a2c" }}>
            ✦ Як ти зараз?
          </div>
        </div>
      ) : (
        <div style={{ marginTop: 18, borderRadius: 15, padding: "16px", textAlign: "center", background: "linear-gradient(180deg,#3a2c52,#2c2042)", boxShadow: "0 0 0 2px #4a3a6e" }}>
          <div style={{ fontSize: 26, marginBottom: 5 }}>🌱</div>
          <div style={{ fontSize: 14, color: "#cfc4e6", fontWeight: 700 }}>Спершу пройди активні стежки</div>
          <div style={{ fontSize: 12.5, color: "#a99fc8", marginTop: 4, lineHeight: 1.4 }}>
            Новий настрій можна ввести, коли завершиш поточний набір ({activeQuests.length}).
          </div>
        </div>
      )}

      {/* DONE today */}
      {done.length > 0 && (
        <>
          {label(`Виконано сьогодні · ${done.length}`)}
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
        Базова стежка — завжди. Кожен чек-ін додає {QUESTS_PER_CHECKIN} під твій стан.
        <br />
        Один рух за раз. Дерево запамʼятає.
      </div>
    </div>
  );
}
