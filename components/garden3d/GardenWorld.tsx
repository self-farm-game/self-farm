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
  MOODS,
  MOOD_BY_KEY,
  QUEST_BY_ID,
  OUTCOMES,
  type MoodKey,
  type OutcomeKey,
  type Quest,
} from "@/lib/mock-data/quests-v2";
import { DROP_POOL } from "@/lib/mock-data/items";
import { unlockedRunes, runeById } from "@/lib/utils/runes";
import { BOMBOM_LINES } from "@/lib/mock-data/i18n";
import { play } from "@/lib/sound/sound";

const IslandScene = dynamic(() => import("@/components/garden3d/IslandScene"), {
  ssr: false,
  loading: () => <div className="l3-canvas" />,
});

type Screen = "scene" | "checkin" | "paths" | "run" | "check" | "outcome" | "reward" | "finds" | "runes" | "stats";

export default function GardenWorld({ children }: { children?: React.ReactNode }) {
  const { state, canCheckin, xpLeft, openCheckin, recordSession, placeHollowRune } = useGame();
  const lvl = levelInfo(state.totalXp);

  const [screen, setScreen] = useState<Screen>("scene");
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [quest, setQuest] = useState<Quest | null>(null);
  const [stepIdx, setStepIdx] = useState(0);
  const [say, setSay] = useState<string | null>(null);
  const [gain, setGain] = useState<{ xp: number; item: { icon: string; name: string } | null } | null>(null);
  const startedAt = useRef(0);

  const active = useMemo(
    () => (state.activeQuestIds || []).map((id) => QUEST_BY_ID[id]).filter(Boolean) as Quest[],
    [state.activeQuestIds],
  );
  const activeMood = (state.currentMood as MoodKey | null) || null;
  const runes = useMemo(() => unlockedRunes(state), [state]);
  const placed = runeById(state.hollowRune);
  const insights = useMemo(() => moodInsights(state), [state]);
  const lines = BOMBOM_LINES[state.lang] || BOMBOM_LINES.uk;

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
      states: [MOOD_BY_KEY[quest.mood]?.label || ""],
      stateKeys: [quest.mood],
      energy: null,
      tension: null,
      questId: quest.id,
      questIcon: quest.icon,
      questTitle: quest.title,
      questXp: quest.xp,
      after: OUTCOMES.find((o) => o.key === outcome)?.label || "",
      mood: activeMood || quest.mood,
      template: quest.template,
      outcome,
      seconds: secs,
    });
    play(outcome === "helped" ? "reward" : "select");
    setGain({ xp: res.xp, item: res.item ? { icon: res.item.icon, name: res.item.name } : null });
    setScreen("reward");
  };

  const sceneStage = Math.min(6, Math.max(1, lvl.levelNum));

  return (
    <div className={"l3-root" + (say ? " l3-talking" : "")}>
      <IslandScene
        stage={sceneStage}
        runeColor={placed ? "#b9a6ff" : null}
        onTreeClick={() => setSay("Дерево? Воно росте, поки ти повертаєшся. Не швидше, не повільніше.")}
        onHollowClick={() => setScreen("runes")}
        onHutClick={() => {
          play("select");
          setSay(lines[Math.floor(Math.random() * lines.length)]);
        }}
      />

      <div className="l3-ui">
        <div className="l3-top">
          <div className="l3-panel l3-player">
            <div className="l3-avatar">🌳</div>
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
            <div className="l3-pill">📅 ДЕНЬ <b>{state.day}</b></div>
            <div className="l3-pill">🔥 <b>{state.streak}</b></div>
          </div>
        </div>

        <div className="l3-rail">
          <div className="l3-tile" onClick={() => { play("select"); setScreen("finds"); }}>
            <div className="l3-ico">🎒</div>
            <div className="l3-cap">Знахідки</div>
            {state.ownedItems.length > 0 && <div className="l3-badge">{state.ownedItems.length}</div>}
          </div>
          <div className="l3-tile" onClick={() => { play("select"); setScreen("stats"); }}>
            <div className="l3-ico">📊</div>
            <div className="l3-cap">Що працює</div>
          </div>
        </div>

        <div className="l3-bottom">
          {canCheckin ? (
            <button className="l3-btn" onClick={() => { play("select"); setScreen("checkin"); }}>
              Як ти зараз?
            </button>
          ) : (
            <button className="l3-btn" onClick={() => { play("select"); setScreen("paths"); }}>
              Стежки · {active.length}
            </button>
          )}
          <div className="l3-hint">
            {canCheckin
              ? "⟲ тягни — оберт · колесо чи щипок — зум · тисни хатинку"
              : `лишилось пройти ${active.length} · XP у вікні: ${xpLeft}`}
          </div>
        </div>
      </div>

      {/* ── Бомбом вийшов з хатинки ── */}
      {say && (
        <div className="l3-bombom-panel">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/sprites/garden/BomBom.png" alt="Бомбом" />
          <div className="l3-say">
            <div className="l3-say-x" onClick={() => setSay(null)}>✕</div>
            <div className="l3-who">Бомбом</div>
            {say}
            <div className="l3-say-more">
              <button
                className="l3-btn l3-sm l3-btn-soft"
                onClick={() => setSay(lines[Math.floor(Math.random() * lines.length)])}
              >
                Ще щось скажи
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── чек-ін: один стан ── */}
      {!sheetOpen && screen === "checkin" && (
        <Modal title="Як ти зараз?" crumb="ЧЕК-ІН" sub="Один дотик. Слова не потрібні." onClose={close}>
          <div className="l3-grid">
            {MOODS.map((m) => (
              <div key={m.key} className="l3-choice" onClick={() => chooseMood(m.key)}>
                <div className="l3-ico">{m.icon}</div>
                <div className="l3-lbl">{m.label}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* ── три стежки ── */}
      {!sheetOpen && screen === "paths" && (
        <Modal
          title="Стежки" crumb="СТЕЖКИ"
          sub={
            activeMood
              ? `Підібрано під стан «${MOOD_BY_KEY[activeMood]?.label}». Пройди всі — відкриється новий чек-ін.`
              : "Пройди всі — відкриється новий чек-ін."
          }
          onClose={close}
          foot={<button className="l3-btn l3-sm l3-btn-soft" onClick={close}>Пізніше</button>}
        >
          {active.length === 0 ? (
            <div className="l3-intro">
              Стежок зараз немає. Тисни «Як ти зараз?» — і зʼявляться три.
            </div>
          ) : (
            active.map((q) => (
              <div key={q.id} className="l3-quest" onClick={() => startQuest(q)}>
                <div className="l3-quest-ico">{q.icon}</div>
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
          crumb="СТЕЖКА"
          sub={`крок ${stepIdx + 1} з ${quest.steps.length}`}
          onClose={close}
          foot={
            <>
              <button
                className="l3-btn l3-sm l3-btn-soft"
                onClick={() => (stepIdx === 0 ? setScreen("paths") : setStepIdx((i) => i - 1))}
              >
                {stepIdx === 0 ? "Назад" : "← Крок назад"}
              </button>
              <button className="l3-btn l3-sm" onClick={nextStep}>
                {stepIdx < quest.steps.length - 1 ? "Зробив →" : "Готово"}
              </button>
            </>
          }
        >
          <div className="l3-run-top">
            <div className="l3-run-ico">{quest.icon}</div>
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
              <span>⚠</span>
              <span>{quest.warning}</span>
            </div>
          )}
        </Modal>
      )}

      {/* ── перевірка «як тобі зараз?» ── */}
      {!sheetOpen && screen === "check" && quest && (
        <Modal
          title="Швидка перевірка" crumb="ПЕРЕВІРКА"
          sub="Нічого писати не треба — просто подивись на це."
          onClose={close}
          foot={<button className="l3-btn l3-sm" onClick={() => setScreen("outcome")}>Далі →</button>}
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
          title="Чи допомогло?" crumb="ПЕРЕВІРКА"
          sub="Чесна відповідь робить наступні стежки точнішими."
          onClose={close}
        >
          <div className="l3-outcomes">
            {OUTCOMES.map((o) => (
              <div key={o.key} className="l3-outcome" onClick={() => finish(o.key)}>
                <div className="l3-ico">{o.icon}</div>
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
          title="Відкрито" crumb="ВІДКРИТТЯ"
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
              {(state.activeQuestIds || []).length > 0 ? "До стежок" : "На галявину"}
            </button>
          }
        >
          <div className="l3-reward">
            <div className="l3-trophy">🏆</div>
            <h3>«{quest.reward}»</h3>
            <p>{quest.rewardNote}</p>
            <div className="l3-gain">
              <span className="l3-tag l3-tag-green">
                {gain && gain.xp > 0 ? `+${gain.xp} XP` : "без XP — ліміт вікна"}
              </span>
              {gain?.item && <span className="l3-tag">{gain.item.icon} {gain.item.name}</span>}
            </div>
          </div>
        </Modal>
      )}

      {/* ── знахідки ── */}
      {!sheetOpen && screen === "finds" && (
        <Modal title="Знахідки" crumb="ЗНАХІДКИ" sub="Те, що впало під ноги, поки ти йшов." onClose={close}>
          {state.ownedItems.length === 0 ? (
            <div className="l3-intro">Поки порожньо. Знахідки падають самі, коли проходиш стежки.</div>
          ) : (
            <div className="l3-grid">
              {state.ownedItems.map((name) => {
                const it = DROP_POOL.find((d) => d.name === name);
                return (
                  <div key={name} className="l3-choice">
                    <div className="l3-ico">{it?.icon || "✦"}</div>
                    <div className="l3-lbl">{name}</div>
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
          title="Дупло" crumb="ДУПЛО"
          sub={sceneStage >= 5 ? "Місце рівно для однієї руни." : "Дупло зʼявиться на 5-й стадії."}
          onClose={close}
        >
          {runes.length === 0 ? (
            <div className="l3-intro">Жодної руни ще не відкрито. Вони приходять самі.</div>
          ) : (
            <div className="l3-grid">
              {runes.map((r) => (
                <div
                  key={r.id}
                  className={"l3-choice" + (state.hollowRune === r.id ? " l3-on" : "")}
                  onClick={() => {
                    if (sceneStage < 5) { setSay("Дупла ще нема. Рости."); close(); return; }
                    placeHollowRune(state.hollowRune === r.id ? null : r.id);
                    play("select");
                    close();
                  }}
                >
                  <div className="l3-ico">{r.sym}</div>
                  <div className="l3-lbl">{r.name.replace("Руна ", "")}</div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}

      {/* ── що саме працює (аналітика) ── */}
      {!sheetOpen && screen === "stats" && (
        <Modal
          title="Що працює" crumb="АНАЛІТИКА"
          sub="Збирається з твоїх відповідей після кожної стежки."
          onClose={close}
        >
          {insights.length === 0 ? (
            <div className="l3-intro">
              Поки нічого. Пройди кілька стежок і скажи, чи допомогло — тут зʼявиться,
              що саме спрацьовує в якому стані, і підбір стане точнішим.
            </div>
          ) : (
            insights.map((i) => (
              <div key={i.mood} className="l3-insight">
                <div className="l3-ico">{i.icon}</div>
                <div style={{ minWidth: 92 }}>
                  <b>{i.label}</b>
                  <small>{plural(i.runs, "прохід", "проходи", "проходів")}</small>
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
function plural(n: number, one: string, few: string, many: string) {
  const d = n % 10;
  const h = n % 100;
  const word = h >= 11 && h <= 14 ? many : d === 1 ? one : d >= 2 && d <= 4 ? few : many;
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
            <b>⌁ SELF-FARM</b> <span>/</span> {crumb || "САД"}
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
