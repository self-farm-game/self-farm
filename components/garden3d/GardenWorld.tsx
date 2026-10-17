"use client";
/**
 * Світ гри — постійний фон усього застосунку.
 *
 * 3D-острів змонтований один раз на рівні layout і НЕ перемонтовується при
 * переході між вкладками: камера, зум і стан сцени лишаються на місці, а
 * вкладки просто спливають над ним напівпрозорими панелями (children).
 *
 * Тут же живе весь цикл саду:
 *   чек-ін (стан) → три стежки → покрокове проходження → «чи допомогло?» → відкриття.
 *
 * Відповідь на «чи допомогло?» лягає в аналітику (state.questStats / comboStats)
 * і наступного разу змінює підбір — див. lib/utils/quest-picker.ts.
 *
 * Хатинка на острові клікабельна: Бомбом виходить збоку екрана з реплікою.
 * Стара піксельна сцена лишилась на /garden2d.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";
import { useGame } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { pickQuests, moodInsights } from "@/lib/utils/quest-picker";
import {
  MOOD_BY_KEY,
  QUEST_BY_ID,
  OUTCOMES,
  type MoodKey,
  type OutcomeKey,
  type Quest,
} from "@/lib/mock-data/quests-v2";
import { localizeQuest, moodLabel, moodsFor, outcomesFor } from "@/lib/mock-data/quests-i18n";
import { DROP_POOL } from "@/lib/mock-data/items";
import { unlockedRunes, runeById, runeShort } from "@/lib/utils/runes";
import { BOMBOM_LINES, t, type Lang } from "@/lib/mock-data/i18n";
import { play } from "@/lib/sound/sound";
import Icon from "@/components/icons/Icon";

const IslandScene = dynamic(() => import("@/components/garden3d/IslandScene"), {
  ssr: false,
  loading: () => <div className="l3-canvas" />,
});

type Screen = "scene" | "checkin" | "paths" | "run" | "check" | "outcome" | "reward" | "finds" | "runes" | "stats";

export default function GardenWorld({ children }: { children?: React.ReactNode }) {
  const { state, canCheckin, xpLeft, openCheckin, recordSession, placeHollowRune } = useGame();
  const L = state.lang;
  const lvl = levelInfo(state.totalXp, L);
  const moods = useMemo(() => moodsFor(L), [L]);
  const outcomes = useMemo(() => outcomesFor(L), [L]);

  const [screen, setScreen] = useState<Screen>("scene");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [say, setSay] = useState<string | null>(null);
  const [gain, setGain] = useState<{ xp: number; item: { icon: string; name: string } | null } | null>(null);
  const startedAt = useRef(0);

  const active = useMemo(
    () =>
      (state.activeQuestIds || [])
        .map((id) => QUEST_BY_ID[id])
        .filter(Boolean)
        .map((q) => localizeQuest(L, q as Quest)),
    [state.activeQuestIds, L],
  );
  const activeMood = (state.currentMood as MoodKey | null) || null;
  const runes = useMemo(() => unlockedRunes(state), [state]);
  const placed = runeById(state.hollowRune);
  const insights = useMemo(() => moodInsights(state), [state]);
  const lines = BOMBOM_LINES[state.lang] || BOMBOM_LINES.uk;
  // Бомбом has plenty to say now, so never hand back the line he just said —
  // an immediate repeat is the one thing that makes him feel canned.
  const saidRef = useRef<string | null>(null);
  const nextLine = () => {
    if (lines.length < 2) return lines[0] || "";
    let pick = lines[Math.floor(Math.random() * lines.length)];
    for (let i = 0; i < 6 && pick === saidRef.current; i++) {
      pick = lines[Math.floor(Math.random() * lines.length)];
    }
    saidRef.current = pick;
    return pick;
  };

  const close = () => setScreen("scene");
  // Поки над садом висить вкладка — свої вікна саду не показуємо.
  // Перевіряємо саме шлях: сторінка /garden повертає null, але children
  // усе одно непорожній елемент, тому `!!children` тут не працює.
  const pathname = usePathname();
  const sheetOpen = pathname !== "/garden";

  /* ── чек-ін ── */
  const chooseMood = (key: MoodKey) => {
    play("select");
    const picked = pickQuests(state, key, 3);
    openCheckin([key], picked.map((q) => q.id), key);
    setMood(key);
    setScreen("paths");
  };

  /* ── запуск квесту ── */
  const startQuest = (q: Quest) => {
    play("select");
    setQuest(q);
    setStepIdx(0);
    startedAt.current = Date.now();
    setScreen("run");
  };

  const nextStep = () => {
    if (!quest) return;
    if (stepIdx < quest.steps.length - 1) {
      setStepIdx((i) => i + 1);
      play("select");
    } else {
      setScreen("check");
    }
  };

  /* ── «чи допомогло?» → запис + аналітика ── */
  const finish = (outcome: OutcomeKey) => {
    if (!quest) return;
    const secs = (Date.now() - startedAt.current) / 1000;
    const res = recordSession({
      states: [moodLabel(L, quest.mood)],
      stateKeys: [quest.mood],
      energy: null,
      tension: null,
      questId: quest.id,
      questIcon: quest.icon,
      questTitle: quest.title,
      questXp: quest.xp,
      after: outcomes.find((o) => o.key === outcome)?.label || "",
      mood: activeMood || quest.mood,
      template: quest.template,
      outcome,
      seconds: secs,
    });
    play(outcome === "helped" ? "reward" : "select");
    setGain({
      xp: res.xp,
      item: res.item
        ? {
            icon: res.item.icon,
            name:
              (L === "en" ? DROP_POOL.find((d) => d.name === res.item!.name)?.nameEn : null) ||
              res.item.name,
          }
        : null,
    });
    setScreen("reward");
  };

  const sceneStage = Math.min(6, Math.max(1, lvl.levelNum));

  return (
    <div className={"l3-root" + (say ? " l3-talking" : "")}>
      <IslandScene
        stage={sceneStage}
        runeColor={placed ? "#b9a6ff" : null}
        onTreeClick={() => setSay(t(L, "garden.tree_say"))}
        onHollowClick={() => setScreen("runes")}
        onHutClick={() => {
          play("select");
          setSay(nextLine());
        }}
      />

      <div className="l3-ui">
        <div className="l3-top">
          <div className="l3-panel l3-player">
            <div className="l3-avatar"><Icon name={lvl.levelNum >= 3 ? "tree" : "sprout"} size={26} /></div>
            <div className="l3-player-meta">
              <div className="l3-name">{lvl.name}</div>
              <div className="l3-sub">{lvl.sub}</div>
              <div className="l3-xp">
                <i style={{ width: `${Math.round(lvl.pct * 100)}%` }} />
              </div>
              <div className="l3-xp-num">
                {lvl.isMax ? `${lvl.total} XP` : `${lvl.inLevel} / ${lvl.target} XP`}
              </div>
            </div>
          </div>

          <div className="l3-pills">
            <div className="l3-pill"><Icon name="calendar" size={14} /> {t(L, "garden.day")} <b>{state.day}</b></div>
            <div className="l3-pill"><Icon name="flame" size={14} /> <b>{state.streak}</b></div>
          </div>
        </div>

        <div className="l3-rail">
          <div className="l3-tile" onClick={() => { play("select"); setScreen("finds"); }}>
            <div className="l3-ico"><Icon name="bag" size={22} /></div>
            <div className="l3-cap">{t(L, "garden.finds")}</div>
            {state.ownedItems.length > 0 && <div className="l3-badge">{state.ownedItems.length}</div>}
          </div>
          <div className="l3-tile" onClick={() => { play("select"); setScreen("stats"); }}>
            <div className="l3-ico"><Icon name="chart" size={22} /></div>
            <div className="l3-cap">{t(L, "garden.what_works")}</div>
          </div>
        </div>

        <div className="l3-bottom">
          {canCheckin ? (
            <button className="l3-btn" onClick={() => { play("select"); setScreen("checkin"); }}>
              {t(L, "cta.how_are_you")}
            </button>
          ) : (
            <button className="l3-btn" onClick={() => { play("select"); setScreen("paths"); }}>
              {t(L, "garden.paths_n", { n: active.length })}
            </button>
          )}
          <div className="l3-hint">
            {canCheckin
              ? t(L, "garden.hint_rotate")
              : t(L, "garden.hint_left", { n: active.length, xp: xpLeft })}
          </div>
        </div>
      </div>

      {/* ── Бомбом вийшов з хатинки ── */}
      {say && (
        <div className="l3-bombom-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/sprites/garden/BomBom.png" alt={t(L, "bombom.name")} />
          <div className="l3-say">
            <div className="l3-say-x" onClick={() => setSay(null)}>✕</div>
            <div className="l3-who">{t(L, "bombom.name")}</div>
            {say}
            <div className="l3-say-more">
              <button
                className="l3-btn l3-sm l3-btn-soft"
                onClick={() => { play("tap"); setSay(nextLine()); }}
              >
                {t(L, "bombom.more")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── чек-ін: один стан ── */}
      {!sheetOpen && screen === "checkin" && (
        <Modal title={t(L, "checkin.state.title")} crumb={t(L, "checkin.crumb")} sub={t(L, "checkin.sub")} onClose={close}>
          <div className="l3-grid">
            {moods.map((m) => (
              <div key={m.key} className="l3-choice" onClick={() => chooseMood(m.key)}>
                <div className="l3-ico"><Icon name={m.icon} size={26} /></div>
                <div className="l3-lbl">{m.label}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── три стежки ── */}
      {!sheetOpen && screen === "paths" && (
        <Modal
          title={t(L, "paths.title")} crumb={t(L, "paths.crumb")}
          sub={
            activeMood
              ? t(L, "paths.sub_mood", { mood: moodLabel(L, activeMood) })
              : t(L, "paths.sub")
          }
          onClose={close}
          foot={<button className="l3-btn l3-sm l3-btn-soft" onClick={close}>{t(L, "paths.later")}</button>}
        >
          {active.length === 0 ? (
            <div className="l3-intro">
              {t(L, "paths.empty")}
            </div>
          ) : (
            active.map((q) => (
              <div key={q.id} className="l3-quest" onClick={() => startQuest(q)}>
                <div className="l3-quest-ico"><Icon name={q.icon} size={26} /></div>
                <div style={{ minWidth: 0 }}>
                  <h3>{q.title}</h3>
                  <p>{q.intro}</p>
                  <div className="l3-tags">
                    <span className="l3-tag">{q.duration}</span>
                    <span className="l3-tag l3-tag-green">+{q.xp} XP</span>
                    <span className="l3-tag l3-tag-blue">{q.context}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </Modal>
      )}

      {/* ── покрокове проходження ── */}
      {!sheetOpen && screen === "run" && quest && (
        <Modal
          title={quest.title}
          crumb={t(L, "run.crumb")}
          sub={t(L, "run.step_of", { n: stepIdx + 1, total: quest.steps.length })}
          onClose={close}
          foot={
            <>
              <button
                className="l3-btn l3-sm l3-btn-soft"
                onClick={() => (stepIdx === 0 ? setScreen("paths") : setStepIdx((i) => i - 1))}
              >
                {stepIdx === 0 ? t(L, "run.back") : t(L, "run.step_back")}
              </button>
              <button className="l3-btn l3-sm" onClick={nextStep}>
                {stepIdx < quest.steps.length - 1 ? t(L, "run.did") : t(L, "run.finish")}
              </button>
            </>
          }
        >
          <div className="l3-run-top">
            <div className="l3-run-ico"><Icon name={quest.icon} size={26} /></div>
            <div style={{ minWidth: 0 }}>
              <h3>{quest.title}</h3>
              <p>{quest.intensity} · {quest.duration} · {quest.context}</p>
            </div>
          </div>

          {stepIdx === 0 && <div className="l3-intro">{quest.intro}</div>}

          <div className="l3-dots">
            {quest.steps.map((_, i) => (
              <span
                key={i}
                className={"l3-dot" + (i === stepIdx ? " l3-on" : i < stepIdx ? " l3-past" : "")}
              />
            ))}
          </div>

          <div className="l3-step" key={stepIdx}>
            <div className="l3-step-n">{stepIdx + 1}</div>
            <div className="l3-step-t">{quest.steps[stepIdx]}</div>
          </div>

          {quest.warning && (
            <div className="l3-warn">
              <Icon name="warn" size={15} />
              <span>{quest.warning}</span>
            </div>
          )}
        </Modal>
      )}

      {/* ── перевірка «як тобі зараз?» ── */}
      {!sheetOpen && screen === "check" && quest && (
        <Modal
          title={t(L, "check.title")} crumb={t(L, "check.crumb")}
          sub={t(L, "check.sub")}
          onClose={close}
          foot={<button className="l3-btn l3-sm" onClick={() => setScreen("outcome")}>{t(L, "check.next")}</button>}
        >
          <div className="l3-qlist">
            {quest.check.map((c, i) => (
              <div key={i} className="l3-q">
                <span>•</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── чи допомогло ── */}
      {!sheetOpen && screen === "outcome" && quest && (
        <Modal
          title={t(L, "outcome.title")} crumb={t(L, "check.crumb")}
          sub={t(L, "outcome.sub")}
          onClose={close}
        >
          <div className="l3-outcomes">
            {outcomes.map((o) => (
              <div key={o.key} className="l3-outcome" onClick={() => finish(o.key)}>
                <div className="l3-ico"><Icon name={o.icon} size={24} /></div>
                <div>
                  <b>{o.label}</b>
                  <small>{o.note}</small>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── відкриття ── */}
      {!sheetOpen && screen === "reward" && quest && (
        <Modal
          title={t(L, "open.title")} crumb={t(L, "open.crumb")}
          sub={quest.title}
          onClose={() => { setQuest(null); setGain(null); close(); }}
          foot={
            <button
              className="l3-btn l3-sm"
              onClick={() => {
                setQuest(null);
                setGain(null);
                setScreen((state.activeQuestIds || []).length > 0 ? "paths" : "scene");
              }}
            >
              {(state.activeQuestIds || []).length > 0 ? t(L, "open.to_paths") : t(L, "open.to_garden")}
            </button>
          }
        >
          <div className="l3-reward">
            <div className="l3-trophy"><Icon name="trophy" size={38} /></div>
            <h3>«{quest.reward}»</h3>
            <p>{quest.rewardNote}</p>
            <div className="l3-gain">
              <span className="l3-tag l3-tag-green">
                {gain && gain.xp > 0 ? t(L, "reward.xp", { n: gain.xp }) : t(L, "open.noxp")}
              </span>
              {gain?.item && (
                <span className="l3-tag" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Icon name={gain.item.icon} size={15} /> {gain.item.name}
                </span>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ── знахідки ── */}
      {!sheetOpen && screen === "finds" && (
        <Modal title={t(L, "garden.finds")} crumb={t(L, "finds.crumb")} sub={t(L, "finds.sub")} onClose={close}>
          {state.ownedItems.length === 0 ? (
            <div className="l3-intro">{t(L, "finds.empty")}</div>
          ) : (
            <div className="l3-grid">
              {state.ownedItems.map((name) => {
                const it = DROP_POOL.find((d) => d.name === name);
                return (
                  <div key={name} className="l3-choice">
                    <div className="l3-ico"><Icon name={it?.icon || "spark"} size={26} /></div>
                    <div className="l3-lbl">{it && L === "en" ? it.nameEn : name}</div>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}

      {/* ── дупло: покласти руну ── */}
      {!sheetOpen && screen === "runes" && (
        <Modal
          title={t(L, "hollow.short")} crumb={t(L, "hollow.crumb")}
          sub={sceneStage >= 5 ? t(L, "hollow.sub_open") : t(L, "hollow.sub_locked")}
          onClose={close}
        >
          {runes.length === 0 ? (
            <div className="l3-intro">{t(L, "hollow.none")}</div>
          ) : (
            <div className="l3-grid">
              {runes.map((r) => (
                <div
                  key={r.id}
                  className={"l3-choice" + (state.hollowRune === r.id ? " l3-on" : "")}
                  onClick={() => {
                    if (sceneStage < 5) { setSay(t(L, "hollow.not_yet")); close(); return; }
                    placeHollowRune(state.hollowRune === r.id ? null : r.id);
                    play("select");
                    close();
                  }}
                >
                  <div className="l3-ico">{r.sym}</div>
                  <div className="l3-lbl">{runeShort(r, L)}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── що саме працює (аналітика) ── */}
      {!sheetOpen && screen === "stats" && (
        <Modal
          title={t(L, "garden.what_works")} crumb={t(L, "works.crumb")}
          sub={t(L, "works.sub")}
          onClose={close}
        >
          {insights.length === 0 ? (
            <div className="l3-intro">
              {t(L, "works.empty")}
            </div>
          ) : (
            insights.map((i) => (
              <div key={i.mood} className="l3-insight">
                <div className="l3-ico"><Icon name={i.icon} size={20} /></div>
                <div style={{ minWidth: 92 }}>
                  <b>{moodLabel(L, i.mood)}</b>
                  <small>{runsLabel(L, i.runs)}</small>
                </div>
                <div className="l3-bar">
                  <i style={{ width: `${Math.round((i.rate || 0) * 100)}%` }} />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, minWidth: 34, textAlign: "right" }}>
                  {i.rate === null ? "—" : Math.round(i.rate * 100) + "%"}
                </div>
              </div>
            ))
          )}
        </Modal>
      )}

      {/* вкладка, що спливає над садом */}
      {children}
    </div>
  );
}

/** Українська множина: 1 прохід · 2–4 проходи · 5+ проходів (з урахуванням 11–14). */
/** "3 проходи" / "3 walked" — Ukrainian needs three forms, English one. */
function runsLabel(lang: Lang, n: number): string {
  if (lang === "en") return `${n} walked`;
  const d = n % 10;
  const h = n % 100;
  const word = h >= 11 && h <= 14 ? "проходів" : d === 1 ? "прохід" : d >= 2 && d <= 4 ? "проходи" : "проходів";
  return `${n} ${word}`;
}

/* ───────────────────────── спливаюче вікно саду ───────────────────────── */
function Modal({
  title,
  sub,
  crumb,
  onClose,
  foot,
  children,
}: {
  title: string;
  sub?: string;
  crumb?: string;
  onClose: () => void;
  foot?: React.ReactNode;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  return (
    <div className="l3-scrim" onClick={onClose}>
      <div className="l3-modal" onClick={(e) => e.stopPropagation()}>
        <div className="l3-modal-head">
          <div className="l3-crumb">
            <b>⌁ SELF-FARM</b> <span>/</span> {crumb || "·"}
          </div>
          <h2>{title}</h2>
          {sub && <p>{sub}</p>}
          <div className="l3-x" onClick={onClose}>✕</div>
        </div>
        <div className="l3-modal-body">{children}</div>
        {foot && <div className="l3-modal-foot">{foot}</div>}
      </div>
    </div>
  );
}
