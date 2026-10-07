"use client";
/**
 * Книга стежок — повний каталог 44 квестів, згрупований за станом.
 * Це довідник, а не місце, де квест запускають: запуск завжди через Сад,
 * бо стежка має сенс лише під конкретний стан «тут і зараз».
 *
 * Біля кожного квесту — твоя власна статистика: скільки разів проходив
 * і наскільки часто це допомагало. Та сама цифра впливає на підбір.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { MOODS, QUESTS, type MoodKey, type Quest } from "@/lib/mock-data/quests-v2";
import { statWeight } from "@/lib/utils/quest-picker";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

const parch = "linear-gradient(180deg,#d8bf94,#c8a878)";
const parchShadow = "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e";

export default function Questbook() {
  const router = useRouter();
  const { state, canCheckin } = useGame();
  const [open, setOpen] = useState<MoodKey | null>(null);
  const [detail, setDetail] = useState<Quest | null>(null);

  const byMood = useMemo(() => {
    const m = new Map<MoodKey, Quest[]>();
    for (const q of QUESTS) {
      const arr = m.get(q.mood) || [];
      arr.push(q);
      m.set(q.mood, arr);
    }
    return m;
  }, []);

  const totalRuns = Object.values(state.questStats || {}).reduce((a, s) => a + s.runs, 0);
  const totalHelped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Книга стежок" sub="44 маленькі пригоди на різні стани" />

      <div
        style={{
          borderRadius: 16,
          padding: "13px 16px",
          marginBottom: 14,
          background: parch,
          boxShadow: parchShadow,
          color: "#4a3220",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {totalRuns === 0 ? (
          <>Стежки відкриваються в Саду — там, де ти кажеш, як тобі зараз. Тут вони просто лежать усі разом.</>
        ) : (
          <>
            Пройдено <b>{totalRuns}</b>, допомогло <b>{totalHelped}</b>. Гра памʼятає це й
            наступного разу пропонує те, що тобі заходить.
          </>
        )}
        <div
          onClick={() => {
            play("select");
            router.push("/garden");
          }}
          style={{
            marginTop: 10,
            display: "inline-block",
            padding: "8px 16px",
            borderRadius: 11,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            color: "#1f3c10",
            background: "linear-gradient(180deg,#a5e072,#63ab38)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 3px 0 #3f7a25",
          }}
        >
          {canCheckin ? "У Сад → «Як ти зараз?»" : "У Сад → до стежок"}
        </div>
      </div>

      {MOODS.map((m) => {
        const list = byMood.get(m.key) || [];
        const isOpen = open === m.key;
        return (
          <div key={m.key} style={{ marginBottom: 10 }}>
            <div
              onClick={() => {
                play("select");
                setOpen(isOpen ? null : m.key);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 15px",
                borderRadius: 14,
                cursor: "pointer",
                background: isOpen ? "linear-gradient(180deg,#6a4a2c,#4a2f18)" : "rgba(60,42,24,.55)",
                boxShadow: isOpen
                  ? "inset 0 2px 0 rgba(255,220,160,.3), 0 0 0 2px #2a1a0e"
                  : "inset 0 0 0 2px rgba(150,110,70,.4)",
              }}
            >
              <span style={{ fontSize: 20 }}>{m.icon}</span>
              <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: "#f3d9a8" }}>{m.label}</span>
              <span style={{ fontSize: 12, color: "#c9a878" }}>{list.length}</span>
              <span style={{ fontSize: 12, color: "#c9a878" }}>{isOpen ? "▴" : "▾"}</span>
            </div>

            {isOpen && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {list.map((q) => {
                  const st = state.questStats?.[q.id];
                  const w = statWeight(st);
                  return (
                    <div
                      key={q.id}
                      onClick={() => {
                        play("tap");
                        setDetail(q);
                      }}
                      style={{
                        display: "flex",
                        gap: 11,
                        alignItems: "flex-start",
                        padding: "11px 13px",
                        borderRadius: 13,
                        cursor: "pointer",
                        background: parch,
                        boxShadow: "inset 0 2px 0 rgba(255,245,220,.45), 0 0 0 2px #6a4a2c",
                      }}
                    >
                      <span style={{ fontSize: 20, lineHeight: 1 }}>{q.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#3f2a16" }}>{q.title}</div>
                        <div style={{ fontSize: 11.5, color: "#7a5836", marginTop: 2, lineHeight: 1.35 }}>
                          {q.duration} · {q.intensity} · +{q.xp} XP
                        </div>
                        {st && st.runs > 0 && (
                          <div
                            style={{
                              fontSize: 11,
                              marginTop: 4,
                              fontWeight: 700,
                              color: w > 0.05 ? "#3f7a25" : w < -0.05 ? "#9a4a2c" : "#7a5836",
                            }}
                          >
                            пройдено {st.runs} · допомогло {st.helped}
                            {w > 0.05 ? " · заходить" : w < -0.05 ? " · не твоє" : ""}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: 10, color: "#8a6a44", flexShrink: 0 }}>{q.vid}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {detail && (
        <div
          onClick={() => setDetail(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 80,
            background: "rgba(10,8,20,.6)",
            backdropFilter: "blur(2px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 380,
              maxHeight: "86%",
              overflowY: "auto",
              borderRadius: 18,
              padding: 18,
              background: parch,
              boxShadow: parchShadow,
              color: "#3f2a16",
            }}
          >
            <div style={{ display: "flex", gap: 11, alignItems: "center" }}>
              <span style={{ fontSize: 26 }}>{detail.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 17, fontWeight: 700 }}>{detail.title}</div>
                <div style={{ fontSize: 11.5, color: "#7a5836" }}>
                  {detail.intensity} · {detail.duration} · {detail.context}
                </div>
              </div>
            </div>

            <p style={{ fontSize: 13, lineHeight: 1.5, marginTop: 11, fontStyle: "italic", color: "#5c4228" }}>
              {detail.intro}
            </p>

            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3, color: "#7a5836", margin: "14px 0 7px" }}>
              що робимо
            </div>
            {detail.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 7 }}>
                <span style={{ fontWeight: 700, color: "#3f7a25", flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, lineHeight: 1.45 }}>{s}</span>
              </div>
            ))}

            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 1.3, color: "#7a5836", margin: "14px 0 7px" }}>
              перевірка
            </div>
            {detail.check.map((c, i) => (
              <div key={i} style={{ fontSize: 13, lineHeight: 1.45, marginBottom: 5 }}>• {c}</div>
            ))}

            <div
              style={{
                marginTop: 14,
                padding: "11px 13px",
                borderRadius: 12,
                background: "linear-gradient(180deg,#f3df9f,#e3c56e)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,.6)",
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700 }}>🏆 «{detail.reward}»</div>
              <div style={{ fontSize: 12, color: "#6b5420", marginTop: 3 }}>{detail.rewardNote}</div>
            </div>

            {detail.warning && (
              <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.4, color: "#6b4a16" }}>
                ⚠ {detail.warning}
              </div>
            )}

            <div
              onClick={() => setDetail(null)}
              style={{ marginTop: 14, textAlign: "center", fontSize: 13, color: "#7a5836", cursor: "pointer" }}
            >
              Закрити
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
