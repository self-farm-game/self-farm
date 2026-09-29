"use client";
/**
 * Self-Farm · 3D-прототип (/lab3d)
 *
 * Це ПІСОЧНИЦЯ, а не заміна гри. Основна 2D-сцена лишається як була.
 * Тут: low-poly острів на three.js + новий стиль вікон керування.
 */
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import "./lab3d.css";
import { QUESTS } from "@/lib/mock-data/quests";
import { RUNE_BRANCHES } from "@/lib/mock-data/runes";

const IslandScene = dynamic(() => import("@/components/lab3d/IslandScene"), {
  ssr: false,
  loading: () => <div className="l3-canvas" />,
});

const STAGES = [
  { name: "Паросток", sub: "щойно з землі" },
  { name: "Саджанець", sub: "тонкий стовбур" },
  { name: "Молоде деревце", sub: "перше листя" },
  { name: "Плідне дерево", sub: "перші яблука" },
  { name: "Щедре дерево", sub: "стиглі яблука" },
  { name: "Віковий дуб", sub: "памʼятає все" },
];

const ENERGY = [
  { k: "empty", ico: "🫥", lbl: "порожньо" },
  { k: "low", ico: "🪫", lbl: "мало" },
  { k: "ok", ico: "🔋", lbl: "норм" },
  { k: "wired", ico: "⚡", lbl: "перегрів" },
];
const TENSION = [
  { k: "calm", ico: "🌿", lbl: "тихо" },
  { k: "noisy", ico: "🌀", lbl: "шумно" },
  { k: "tense", ico: "🪢", lbl: "стисло" },
  { k: "angry", ico: "🔥", lbl: "пече" },
];

type Modal = null | "quests" | "checkin" | "runes" | "finds";

export default function Lab3dPage() {
  const [stage, setStage] = useState(5);
  const [modal, setModal] = useState<Modal>(null);
  const [done, setDone] = useState<string[]>([]);
  const [energy, setEnergy] = useState<string | null>(null);
  const [tension, setTension] = useState<string | null>(null);
  const [rune, setRune] = useState<{ id: string; color: string; sym: string; name: string } | null>(null);
  const [line, setLine] = useState("Дерево не питає, як ти. Але я питаю. Тисни зелену — і не думай багато.");

  const lvl = STAGES[stage - 1];
  const xpPct = 0.18 + (stage - 1) * 0.13;

  const trio = useMemo(() => QUESTS.filter((q) => q.tier === 1).slice(4, 7), []);
  const allRunes = useMemo(
    () => RUNE_BRANCHES.flatMap((b) => b.runes.map((r) => ({ ...r, color: b.color, branch: b.name }))),
    [],
  );
  // у прототипі перші 4 руни «відкриті»
  const unlocked = allRunes.slice(0, 4).map((r) => r.id);

  const close = () => setModal(null);

  return (
    <div className="l3-root">
      <IslandScene
        stage={stage}
        runeColor={rune?.color ?? null}
        onTreeClick={() => setLine("Так, це дерево. Воно росте, поки ти повертаєшся. Не швидше.")}
        onHollowClick={() => setModal("runes")}
      />

      {/* панель прототипу */}
      <div className="l3-devbar">
        <span>стадія</span>
        <button onClick={() => setStage((s) => Math.max(1, s - 1))} aria-label="менше">−</button>
        <span className="l3-stagename">
          {stage} · {lvl.name}
        </span>
        <button onClick={() => setStage((s) => Math.min(6, s + 1))} aria-label="більше">+</button>
        <Link href="/garden" style={{ color: "#ffe6bd", textDecoration: "underline", marginLeft: 6 }}>
          ← 2D
        </Link>
      </div>

      <div className="l3-ui">
        <div className="l3-top">
          <div className="l3-panel l3-player">
            <div className="l3-avatar">🌳</div>
            <div className="l3-player-meta">
              <div className="l3-name">{lvl.name}</div>
              <div className="l3-sub">{lvl.sub}</div>
              <div className="l3-xp">
                <i style={{ width: `${Math.round(xpPct * 100)}%` }} />
              </div>
              <div className="l3-xp-num">{Math.round(xpPct * 180)} / 180 XP</div>
            </div>
          </div>

          <div className="l3-pills">
            <div className="l3-pill">📅 ДЕНЬ <b>1</b></div>
            <div className="l3-pill">🔥 <b>0</b></div>
          </div>
        </div>

        <div className="l3-rail">
          <div className="l3-tile" onClick={() => setModal("quests")}>
            <div className="l3-ico">📜</div>
            <div className="l3-cap">Квести</div>
            <div className="l3-badge">{trio.length - done.length}</div>
          </div>
          <div className="l3-tile" onClick={() => setModal("finds")}>
            <div className="l3-ico">🎒</div>
            <div className="l3-cap">Знахідки</div>
            <div className="l3-badge">5</div>
          </div>
          <div className="l3-tile" onClick={() => setModal("runes")}>
            <div className="l3-ico">🔮</div>
            <div className="l3-cap">Руни</div>
          </div>
          <div className="l3-tile" onClick={() => setLine("Журнал — це не звіт. Це доказ, що ти приходив.")}>
            <div className="l3-ico">📖</div>
            <div className="l3-cap">Журнал</div>
          </div>
        </div>

        <div className="l3-bombom">
          <div className="l3-bubble">
            <div className="l3-who">Бомбом</div>
            {line}
          </div>
        </div>

        <div className="l3-bottom">
          <button className="l3-btn" onClick={() => setModal("checkin")}>
            Як ти зараз?
          </button>
        </div>
      </div>

      {/* ───────────── вікно квестів ───────────── */}
      {modal === "quests" && (
        <div className="l3-scrim" onClick={close}>
          <div className="l3-modal" onClick={(e) => e.stopPropagation()}>
            <div className="l3-modal-head">
              <h2>Стежки</h2>
              <p>Три на це вікно. Виконай усі — відкриється новий чек-ін.</p>
              <div className="l3-x" onClick={close}>✕</div>
            </div>
            <div className="l3-modal-body">
              {trio.map((q) => {
                const isDone = done.includes(q.id);
                return (
                  <div
                    key={q.id}
                    className={"l3-quest" + (isDone ? " l3-done" : "")}
                    onClick={() => setDone((d) => (d.includes(q.id) ? d.filter((x) => x !== q.id) : [...d, q.id]))}
                  >
                    <div className="l3-quest-ico">{isDone ? "✅" : q.icon}</div>
                    <div style={{ minWidth: 0 }}>
                      <h3>{q.title}</h3>
                      <p>{q.steps[0]}</p>
                      <div className="l3-tags">
                        <span className="l3-tag">{q.dur}</span>
                        <span className="l3-tag l3-tag-green">+{q.xp} XP</span>
                        <span className="l3-tag l3-tag-blue">{q.category}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="l3-modal-foot">
              <button className="l3-btn l3-sm l3-btn-soft" onClick={close}>Пізніше</button>
              <button
                className="l3-btn l3-sm"
                onClick={() => {
                  setStage((s) => Math.min(6, s + 1));
                  setLine("Ну ок. Дерево трохи підросло. Не дякуй.");
                  close();
                }}
              >
                Готово ({done.length}/{trio.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── чек-ін ───────────── */}
      {modal === "checkin" && (
        <div className="l3-scrim" onClick={close}>
          <div className="l3-modal" onClick={(e) => e.stopPropagation()}>
            <div className="l3-modal-head">
              <h2>Як ти зараз?</h2>
              <p>Без слів. Просто тицяй.</p>
              <div className="l3-x" onClick={close}>✕</div>
            </div>
            <div className="l3-modal-body">
              <div className="l3-section-title">скільки сили</div>
              <div className="l3-grid">
                {ENERGY.map((o) => (
                  <div
                    key={o.k}
                    className={"l3-choice" + (energy === o.k ? " l3-on" : "")}
                    onClick={() => setEnergy(o.k)}
                  >
                    <div className="l3-ico">{o.ico}</div>
                    <div className="l3-lbl">{o.lbl}</div>
                  </div>
                ))}
              </div>
              <div className="l3-section-title">що всередині</div>
              <div className="l3-grid">
                {TENSION.map((o) => (
                  <div
                    key={o.k}
                    className={"l3-choice" + (tension === o.k ? " l3-on" : "")}
                    onClick={() => setTension(o.k)}
                  >
                    <div className="l3-ico">{o.ico}</div>
                    <div className="l3-lbl">{o.lbl}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="l3-modal-foot">
              <button className="l3-btn l3-sm l3-btn-soft" onClick={close}>Не зараз</button>
              <button
                className="l3-btn l3-sm"
                onClick={() => {
                  setLine("Записав. Тепер три стежки — і повертайся.");
                  setModal("quests");
                }}
              >
                Далі
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── руни (і пасхалка з дуплом) ───────────── */}
      {modal === "runes" && (
        <div className="l3-scrim" onClick={close}>
          <div className="l3-modal" onClick={(e) => e.stopPropagation()}>
            <div className="l3-modal-head">
              <h2>Руни</h2>
              <p>{stage >= 5 ? "У дуплі є місце рівно для однієї." : "Дупло зʼявиться на 5-й стадії."}</p>
              <div className="l3-x" onClick={close}>✕</div>
            </div>
            <div className="l3-modal-body">
              <div className="l3-grid">
                {allRunes.map((r) => {
                  const open = unlocked.includes(r.id);
                  return (
                    <div
                      key={r.id}
                      className={
                        "l3-choice" + (rune?.id === r.id ? " l3-on" : "") + (open ? "" : " l3-locked")
                      }
                      onClick={() => {
                        if (!open) return;
                        if (stage < 5) {
                          setLine("Дупла ще нема. Рости.");
                          return;
                        }
                        setRune(rune?.id === r.id ? null : { id: r.id, color: r.color, sym: r.sym, name: r.name });
                        setLine(rune?.id === r.id ? "Забрав. Нехай лежить у кишені." : `Поклав ${r.name} у дупло. Ніхто не побачить. Ти знатимеш.`);
                        close();
                      }}
                    >
                      <div className="l3-ico" style={{ color: open ? r.color : "#9d8a72" }}>{open ? r.sym : "🔒"}</div>
                      <div className="l3-lbl">{open ? r.name.replace("Руна ", "") : "—"}</div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="l3-modal-foot">
              <button className="l3-btn l3-sm l3-btn-soft" onClick={close}>Закрити</button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────── знахідки ───────────── */}
      {modal === "finds" && (
        <div className="l3-scrim" onClick={close}>
          <div className="l3-modal" onClick={(e) => e.stopPropagation()}>
            <div className="l3-modal-head">
              <h2>Знахідки</h2>
              <p>Те, що впало під ноги, поки ти йшов.</p>
              <div className="l3-x" onClick={close}>✕</div>
            </div>
            <div className="l3-modal-body">
              <div className="l3-grid">
                {["🪶", "🌰", "🍄", "🪵", "🔔"].map((i, n) => (
                  <div key={n} className="l3-choice">
                    <div className="l3-ico">{i}</div>
                    <div className="l3-lbl">×{n + 1}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="l3-modal-foot">
              <button className="l3-btn l3-sm l3-btn-soft" onClick={close}>Закрити</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
