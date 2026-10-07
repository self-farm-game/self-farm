"use client";
/**
 * Квести — ТІЛЬКИ поточний набір: що лишилось пройти і що вже пройдено
 * після останнього чек-іну. Повного каталогу тут немає навмисно: стежка
 * має сенс під конкретний стан, а не як меню на вибір.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { MOOD_BY_KEY, OUTCOMES, QUEST_BY_ID, type Quest } from "@/lib/mock-data/quests-v2";
import Sheet from "@/components/ui/Sheet";
import { play } from "@/lib/sound/sound";

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

  if (detail) {
    return (
      <Sheet
        crumb="СТЕЖКА"
        title={detail.title}
        sub={`${detail.intensity} · ${detail.duration} · ${detail.context}`}
        note={detail.warning ? `⚠ ${detail.warning}` : undefined}
        foot={
          <>
            <button className="l3-btn l3-sm l3-btn-soft" onClick={() => setDetail(null)}>
              ← До набору
            </button>
            <button className="l3-btn l3-sm" onClick={goGarden}>
              Пройти в Саду
            </button>
          </>
        }
      >
        <div className="l3-intro">{detail.intro}</div>
        <div className="l3-section-title">що робимо</div>
        {detail.steps.map((s, i) => (
          <div key={i} className="l3-step" style={{ marginBottom: 9 }}>
            <div className="l3-step-n">{i + 1}</div>
            <div className="l3-step-t" style={{ fontSize: 14 }}>{s}</div>
          </div>
        ))}
        <div className="l3-section-title">перевірка</div>
        <div className="l3-qlist">
          {detail.check.map((c, i) => (
            <div key={i} className="l3-q">
              <span>•</span>
              <span>{c}</span>
            </div>
          ))}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      crumb="КВЕСТИ"
      title="Поточний набір"
      sub={
        mood
          ? `Підібрано під стан «${mood.label}». Повний каталог не показуємо — стежка має сенс під стан.`
          : "Набір відкривається чек-іном у Саду."
      }
      foot={
        <button className="l3-btn l3-sm" onClick={goGarden}>
          {canCheckin ? "У Сад → «Як ти зараз?»" : "У Сад → проходити"}
        </button>
      }
    >
      {total === 0 ? (
        <div className="l3-empty">
          <div className="l3-ico">📜</div>
          <h4>Набору зараз немає</h4>
          <p>
            Скажи в Саду, як тобі, — і зʼявляться три стежки.
            <br />
            Усі проходження лишаються в Журналі.
          </p>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 4,
              fontSize: 12.5,
              color: "var(--g-ink-2)",
            }}
          >
            <span>
              Пройдено <b style={{ color: "var(--g-ink)" }}>{done.length}</b> з{" "}
              <b style={{ color: "var(--g-ink)" }}>{total}</b>
            </span>
            <span className="l3-bar" style={{ maxWidth: 180 }}>
              <i style={{ width: `${Math.round((done.length / total) * 100)}%` }} />
            </span>
          </div>

          {active.length > 0 && (
            <>
              <div className="l3-section-title">відкрито</div>
              {active.map((q) => (
                <div key={q.id} className="l3-quest" onClick={() => { play("tap"); setDetail(q); }}>
                  <div className="l3-quest-ico">{q.icon}</div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{q.title}</h3>
                    <p>{q.intro}</p>
                    <div className="l3-tags">
                      <span className="l3-tag">{q.duration}</span>
                      <span className="l3-tag l3-tag-green">+{q.xp} XP</span>
                      <span className="l3-tag l3-tag-blue">{q.steps.length} кроки</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {done.length > 0 && (
            <>
              <div className="l3-section-title">пройдено в цьому наборі</div>
              {done.map((d, i) => (
                <div key={d.id + i} className="l3-row l3-static">
                  <span className="l3-ico">{d.icon}</span>
                  <span className="l3-lab">
                    {d.title}
                    <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
                      {d.time} · {OUT_LABEL[d.outcome] || d.outcome}
                    </span>
                  </span>
                  <span style={{ fontSize: 17 }}>{OUT_ICON[d.outcome] || "·"}</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
