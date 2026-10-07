"use client";
/**
 * Квести — ТІЛЬКИ поточний набір: що лишилось пройти і що вже пройдено
 * після останнього чек-іну. Повного каталогу тут навмисно немає: стежка
 * має сенс під конкретний стан, а не як список на вибір.
 *
 * Запуск завжди через Сад — тут лише видно, що саме зараз відкрито.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { MOOD_BY_KEY, OUTCOMES, QUEST_BY_ID, type Quest } from "@/lib/mock-data/quests-v2";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

const parch = "linear-gradient(180deg,#d8bf94,#c8a878)";
const parchShadow = "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e";

const OUT_ICON: Record<string, string> = Object.fromEntries(OUTCOMES.map((o) => [o.key, o.icon]));
const OUT_LABEL: Record<string, string> = Object.fromEntries(OUTCOMES.map((o) => [o.key, o.label]));

export default function Questbook() {
  const router = useRouter();
  const { state, canCheckin } = useGame();
  const [detail, setDetail] = useState<Quest | null>(null);

  const active = useMemo(
    () => (state.activeQuestIds || []).map((id) => QUEST_BY_ID[id]).filter(Boolean) as Quest[],
    [state.activeQuestIds],
  );
  const done = state.iterationDone || [];
  const mood = state.currentMood ? MOOD_BY_KEY[state.currentMood] : null;
  const total = active.length + done.length;

  const goGarden = () => {
    play("select");
    router.push("/garden");
  };

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle
        title="Квести"
        sub={mood ? `набір під стан «${mood.label}»` : "поточний набір стежок"}
      />

      {/* шапка набору */}
      <div
        style={{
          borderRadius: 16,
          padding: "14px 16px",
          marginBottom: 14,
          background: parch,
          boxShadow: parchShadow,
          color: "#4a3220",
          fontSize: 13,
          lineHeight: 1.45,
        }}
      >
        {total === 0 ? (
          <>Набору зараз немає. Скажи в Саду, як тобі, — і зʼявляться три стежки.</>
        ) : (
          <>
            Пройдено <b>{done.length}</b> з <b>{total}</b>.{" "}
            {active.length === 0
              ? "Набір закрито — у Саду відкрився новий чек-ін."
              : `Лишилось ${active.length}.`}
          </>
        )}
        {total > 0 && (
          <div
            style={{
              marginTop: 10,
              height: 11,
              borderRadius: 999,
              background: "rgba(90,60,30,.35)",
              overflow: "hidden",
              boxShadow: "inset 0 2px 3px rgba(80,50,20,.4)",
            }}
          >
            <div
              style={{
                width: `${Math.round((done.length / total) * 100)}%`,
                height: "100%",
                borderRadius: 999,
                background: "linear-gradient(180deg,#9ee06a,#5aa832)",
                transition: "width .4s cubic-bezier(.22,1,.36,1)",
              }}
            />
          </div>
        )}
        <div
          onClick={goGarden}
          style={{
            marginTop: 12,
            display: "inline-block",
            padding: "9px 17px",
            borderRadius: 11,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 13,
            color: "#1f3c10",
            background: "linear-gradient(180deg,#a5e072,#63ab38)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 3px 0 #3f7a25",
          }}
        >
          {canCheckin ? "У Сад → «Як ти зараз?»" : "У Сад → проходити"}
        </div>
      </div>

      {/* активні */}
      {active.length > 0 && (
        <>
          <Section title="Відкрито" />
          <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {active.map((q) => (
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
                  padding: "12px 14px",
                  borderRadius: 14,
                  cursor: "pointer",
                  background: parch,
                  boxShadow: "inset 0 2px 0 rgba(255,245,220,.45), 0 0 0 2px #6a4a2c",
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{q.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#3f2a16" }}>{q.title}</div>
                  <div style={{ fontSize: 12, color: "#5c4228", marginTop: 3, lineHeight: 1.4 }}>{q.intro}</div>
                  <div style={{ fontSize: 11.5, color: "#7a5836", marginTop: 5 }}>
                    {q.duration} · {q.intensity} · +{q.xp} XP · {q.steps.length} кроки
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* пройдене в цьому наборі */}
      {done.length > 0 && (
        <>
          <Section title="Пройдено в цьому наборі" />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {done.map((d, i) => (
              <div
                key={d.id + i}
                style={{
                  display: "flex",
                  gap: 11,
                  alignItems: "center",
                  padding: "11px 14px",
                  borderRadius: 13,
                  background: "rgba(60,42,24,.5)",
                  boxShadow: "inset 0 0 0 2px rgba(150,110,70,.35)",
                }}
              >
                <span style={{ fontSize: 19, opacity: 0.85 }}>{d.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: "#e8d5ad" }}>{d.title}</div>
                  <div style={{ fontSize: 11.5, color: "#b89a6e" }}>
                    {d.time} · {OUT_LABEL[d.outcome] || d.outcome}
                  </div>
                </div>
                <span style={{ fontSize: 17 }}>{OUT_ICON[d.outcome] || "·"}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {total === 0 && (
        <div
          style={{
            marginTop: 8,
            padding: "18px 16px",
            borderRadius: 16,
            textAlign: "center",
            fontSize: 13,
            lineHeight: 1.5,
            color: "#a99fc8",
            background: "rgba(60,48,86,.35)",
            boxShadow: "inset 0 0 0 2px rgba(150,120,200,.2)",
          }}
        >
          Тут буде видно, що саме відкрито зараз і що ти вже пройшов.
          <br />
          Нічого не губиться — усі проходження лишаються в Журналі.
        </div>
      )}

      {/* деталі квесту */}
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

            {detail.warning && (
              <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.4, color: "#6b4a16" }}>
                ⚠ {detail.warning}
              </div>
            )}

            <div
              onClick={goGarden}
              style={{
                marginTop: 15,
                textAlign: "center",
                padding: "11px 16px",
                borderRadius: 12,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                color: "#1f3c10",
                background: "linear-gradient(180deg,#a5e072,#63ab38)",
                boxShadow: "inset 0 2px 0 rgba(255,255,255,.5), 0 3px 0 #3f7a25",
              }}
            >
              Пройти в Саду →
            </div>
            <div
              onClick={() => setDetail(null)}
              style={{ marginTop: 11, textAlign: "center", fontSize: 13, color: "#7a5836", cursor: "pointer" }}
            >
              Закрити
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        margin: "18px 0 9px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: "#a98b5c",
      }}
    >
      {title}
      <span style={{ flex: 1, height: 2, borderRadius: 2, background: "rgba(169,139,92,.3)" }} />
    </div>
  );
}
