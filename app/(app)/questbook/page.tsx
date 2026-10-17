"use client";
/**
 * Квести — ТІЛЬКИ поточний набір: що лишилось пройти і що вже пройдено
 * після останнього чек-іну. Повного каталогу тут немає навмисно: стежка
 * має сенс під конкретний стан, а не як меню на вибір.
 */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useGame } from "@/lib/store/game";
import { OUTCOMES, QUEST_BY_ID, type Quest } from "@/lib/mock-data/quests-v2";
import { localizeQuest, moodLabel, outcomeLabel, questById } from "@/lib/mock-data/quests-i18n";
import { t } from "@/lib/mock-data/i18n";
import Sheet from "@/components/ui/Sheet";
import { play } from "@/lib/sound/sound";
import Icon from "@/components/icons/Icon";

const OUT_ICON: Record<string, string> = Object.fromEntries(OUTCOMES.map((o) => [o.key, o.icon]));

export default function Questbook() {
  const router = useRouter();
  const { state, canCheckin } = useGame();
  const L = state.lang;
  const [detail, setDetail] = useState<Quest | null>(null);

  const active = useMemo(
    () =>
      (state.activeQuestIds || [])
        .map((id) => QUEST_BY_ID[id])
        .filter(Boolean)
        .map((q) => localizeQuest(L, q as Quest)),
    [state.activeQuestIds, L],
  );
  const done = state.iterationDone || [];
  const total = active.length + done.length;

  const goGarden = () => {
    play("select");
    router.push("/garden");
  };

  if (detail) {
    return (
      <Sheet
        crumb={t(L, "qb.crumb_path")}
        title={detail.title}
        sub={`${detail.intensity} · ${detail.duration} · ${detail.context}`}
        note={
          detail.warning ? (
            <span style={{ display: "inline-flex", gap: 7, alignItems: "flex-start" }}>
              <Icon name="warn" size={14} style={{ marginTop: 1 }} /> {detail.warning}
            </span>
          ) : undefined
        }
        foot={
          <>
            <button className="l3-btn l3-sm l3-btn-soft" onClick={() => setDetail(null)}>
              {t(L, "qb.back_to_set")}
            </button>
            <button className="l3-btn l3-sm" onClick={goGarden}>
              {t(L, "qb.do_in_garden")}
            </button>
          </>
        }
      >
        <div className="l3-intro">{detail.intro}</div>
        <div className="l3-section-title">{t(L, "qb.what_we_do")}</div>
        {detail.steps.map((s, i) => (
          <div key={i} className="l3-step" style={{ marginBottom: 9 }}>
            <div className="l3-step-n">{i + 1}</div>
            <div className="l3-step-t" style={{ fontSize: 14 }}>{s}</div>
          </div>
        ))}
        <div className="l3-section-title">{t(L, "qb.check_label")}</div>
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
      crumb={t(L, "qb.crumb")}
      title={t(L, "qb.set_title")}
      sub={
        state.currentMood
          ? t(L, "qb.set_sub_mood", { mood: moodLabel(L, state.currentMood) })
          : t(L, "qb.set_sub_none")
      }
      foot={
        <button className="l3-btn l3-sm" onClick={goGarden}>
          {canCheckin ? t(L, "qb.go_checkin") : t(L, "qb.go_do")}
        </button>
      }
    >
      {total === 0 ? (
        <div className="l3-empty">
          <div className="l3-ico"><Icon name="scroll" size={34} /></div>
          <h4>{t(L, "qb.empty_title")}</h4>
          <p>
            {t(L, "qb.empty_desc")}
            <br />
            {t(L, "qb.empty_note")}
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
            <span>{t(L, "qb.progress", { done: done.length, total })}</span>
            <span className="l3-bar" style={{ maxWidth: 180 }}>
              <i style={{ width: `${Math.round((done.length / total) * 100)}%` }} />
            </span>
          </div>

          {active.length > 0 && (
            <>
              <div className="l3-section-title">{t(L, "qb.opened")}</div>
              {active.map((q) => (
                <div key={q.id} className="l3-quest" onClick={() => { play("tap"); setDetail(q); }}>
                  <div className="l3-quest-ico"><Icon name={q.icon} size={26} /></div>
                  <div style={{ minWidth: 0 }}>
                    <h3>{q.title}</h3>
                    <p>{q.intro}</p>
                    <div className="l3-tags">
                      <span className="l3-tag">{q.duration}</span>
                      <span className="l3-tag l3-tag-green">+{q.xp} XP</span>
                      <span className="l3-tag l3-tag-blue">{t(L, "qb.steps_n", { n: q.steps.length })}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {done.length > 0 && (
            <>
              <div className="l3-section-title">{t(L, "qb.done_in_set")}</div>
              {done.map((d, i) => (
                <div key={d.id + i} className="l3-row l3-static">
                  <span className="l3-ico"><Icon name={questById(L, d.id)?.icon || d.icon} size={20} /></span>
                  <span className="l3-lab">
                    {questById(L, d.id)?.title || d.title}
                    <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
                      {d.time} · {outcomeLabel(L, d.outcome)}
                    </span>
                  </span>
                  <Icon name={OUT_ICON[d.outcome] || "equal"} size={18} />
                </div>
              ))}
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
