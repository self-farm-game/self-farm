"use client";
import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useGame, XP_WINDOW_CAP } from "@/lib/store/game";
import TreeStages from "@/components/garden/TreeStages";
import { levelInfo } from "@/lib/utils/xp";
import { play } from "@/lib/sound/sound";
import { QUESTS, suggestQuests, type MockQuest } from "@/lib/mock-data/quests";
import { orderStates, toggleState } from "@/lib/utils/states";
import { GROUP_TINT, stateLabel } from "@/lib/mock-data/states";
import { ITEMS } from "@/lib/mock-data/items";
import { BODY } from "@/lib/mock-data/content";
import { BOMBOM_LINES, t, ENERGY_OPTS, TENSION_OPTS, AFTER_OPTS } from "@/lib/mock-data/i18n";
import {
  WoodButton,
  ParchButton,
  Chip,
  HeartBar,
  Stars,
  BackRow,
  BombomBanner,
} from "@/components/ui/primitives";

type Flow =
  | "home"
  | "checkin_state"
  | "checkin_energy"
  | "quest_suggest"
  | "quest_detail"
  | "quest_active"
  | "quest_complete"
  | "quest_note"
  | "reward"
  | "inventory";

const parchCard =
  "linear-gradient(180deg,#d8bf94,#c8a878)";
const parchShadow =
  "inset 0 2px 0 rgba(255,245,220,.55), inset 0 -5px 0 rgba(120,86,48,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e, 0 5px 0 rgba(0,0,0,.3)";

// 5 cloud sprites drifting across the sky on slightly random tracks
const CLOUDS = [
  { v: 1, top: 8, w: 120, dur: 66, delay: 0, op: 0.95 },
  { v: 2, top: 16, w: 90, dur: 84, delay: -30, op: 0.85 },
  { v: 3, top: 24, w: 140, dur: 58, delay: -50, op: 0.9 },
  { v: 4, top: 12, w: 80, dur: 92, delay: -12, op: 0.8 },
  { v: 5, top: 30, w: 70, dur: 74, delay: -66, op: 0.8 },
];

export default function Garden() {
  const { state, recordSession, nextBombom, dailyLeft, dailyDone, openCheckin, canCheckin, xpLeft } = useGame();
  const router = useRouter();
  const params = useSearchParams();
  const [flow, setFlow] = useState<Flow>("home");
  const [directId, setDirectId] = useState<string | null>(null);
  const [states, setStates] = useState<string[]>([]);
  const [energy, setEnergy] = useState<string | null>(null);
  const [tension, setTension] = useState<string | null>(null);
  const [body, setBody] = useState<string[]>([]);
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState("");
  const [qIdx, setQIdx] = useState(0);
  const [after, setAfter] = useState("");
  const [reflection, setReflection] = useState("");
  const [timer, setTimer] = useState(120);
  const [reward, setReward] = useState<{ xp: number; item: any } | null>(null);

  // ordered chips (personalised) + quests matched to the chosen states
  const lvl = levelInfo(state.totalXp);
  const L = state.lang;
  const orderedStates = orderStates(state.stateCounts || {});
  const suggested: MockQuest[] = states.length ? suggestQuests(states, lvl.levelNum, 3) : [];
  const directQ = directId ? QUESTS.find((x) => x.id === directId) : null;
  const q = directQ || suggested[qIdx] || suggested[0] || QUESTS[0];

  // deep-link from the Questbook: /garden?quest=<id> opens that quest directly
  useEffect(() => {
    const qid = params.get("quest");
    if (!qid) return;
    const found = QUESTS.find((x) => x.id === qid);
    if (found) {
      // reuse the states from the active check-in so the session is tagged
      setStates((state.activeStates && state.activeStates.length ? state.activeStates : []) as string[]);
      setDirectId(qid);
      go("quest_detail");
    }
    router.replace("/garden");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = useRef<any>(null);
  useEffect(() => {
    if (flow === "quest_active") {
      tick.current = setInterval(() => setTimer((t) => Math.max(0, t - 1)), 1000);
      return () => clearInterval(tick.current);
    }
  }, [flow]);

  const go = (f: Flow) => {
    setFlow(f);
    const el = document.querySelector(".sf-scroll");
    if (el) el.scrollTop = 0;
  };
  const resetFlow = () => {
    setStates([]);
    setEnergy(null);
    setTension(null);
    setBody([]);
    setShowNote(false);
    setNote("");
    setAfter("");
    setReflection("");
    setTimer(120);
    setDirectId(null);
    go("home");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  const fmtWait = (ms: number) => {
    const m = Math.max(0, Math.ceil(ms / 60000));
    const h = Math.floor(m / 60);
    return h > 0 ? `${h} год ${m % 60} хв` : `${m} хв`;
  };

  const finishToReward = () => {
    const r = recordSession({
      states: states.map((k) => stateLabel(L, k)),
      stateKeys: states,
      energy,
      tension,
      note,
      questId: q.id,
      questIcon: q.icon,
      questTitle: q.title,
      questXp: q.xp,
      after,
      reflection,
    });
    setReward(r);
    play("reward");
    if (r.item) setTimeout(() => play("item"), 350);
    go("reward");
  };

  /* ---------------- HOME ---------------- */
  if (flow === "home") {
    const lines = BOMBOM_LINES[state.lang] || BOMBOM_LINES.en;
    const line = lines[state.bombomIdx % lines.length];
    // each stage fills a bit more of the scene than the last one
    const fit = ["50%", "58%", "66%", "74%", "82%", "88%", "92%", "96%", "98%", "100%"][Math.min(10, lvl.levelNum) - 1];
    return (
      <div className="sf-screen sf-garden">
        {/* ---- the scene: takes whatever height the UI leaves ---- */}
        <div className="sf-stage">
          {/* sky gradient */}
          <div className="sf-garden-sky" />
          {/* drifting clouds (5 variations, staggered tracks) */}
          <div className="sf-clouds" aria-hidden>
            {CLOUDS.map((c, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={`/assets/sprites/garden/cloud-${c.v}.png`}
                alt=""
                className="sf-drift"
                style={{ top: `${c.top}%`, width: `${c.w}px`, animationDuration: `${c.dur}s`, animationDelay: `${c.delay}s`, opacity: c.op }}
              />
            ))}
          </div>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <Stars n={8} seed={11} area={42} />
          </div>

          {/* static meadow with the stone circle (all decor baked in) */}
          <div className="sf-plot">
            {/* the tree, planted on the stone circle */}
            <div className="sf-garden-tree">
              <div className="sf-tree-fit" style={{ height: fit }}>
                <div className="sf-garden-shadow" />
                <TreeStages stage={lvl.levelNum} pct={lvl.pct} />
              </div>
            </div>

            {/* Бомбом sits on the meadow (like the reference) */}
            <div
              className="sf-gnome"
              onClick={() => { nextBombom(); play("tap"); }}
              title="тицьни, щоб почути ще"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/assets/sprites/garden/BomBom.png" alt="БомБом" />
              <div className="sf-gnome-bubble">
                <div className="sf-bombom-name">{t(L, "bombom.tap")}</div>
                <p>{line}</p>
              </div>
            </div>
          </div>

          {/* ---- top overlay: level bar + inventory ---- */}
          <div className="sf-garden-top">
            <div className="sf-xp-panel">
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ fontSize: 16, color: "#f3d9a8", fontWeight: 700 }}>{lvl.name}</span>
                  <span style={{ fontSize: 11.5, color: "#c9a878", fontStyle: "italic", marginLeft: 7 }}>{lvl.sub}</span>
                </div>
                <div style={{ fontSize: 12, color: "#e7c389", fontWeight: 600, whiteSpace: "nowrap" }}>
                  {lvl.inLevel} / {lvl.target} XP
                </div>
              </div>
              <HeartBar pct={Math.round(lvl.pct * 100) + "%"} />
            </div>

            <div className="sf-top-row" style={{ justifyContent: "flex-end" }}>
              <div className="sf-inv-btn" onClick={() => go("inventory")}>
                <span style={{ fontSize: 22, lineHeight: 1 }}>🎒</span>
                <span style={{ fontSize: 8.5, letterSpacing: 0.5, color: "#e7c389", fontWeight: 700 }}>{t(L, "garden.finds")}</span>
                <div className="sf-inv-badge">{state.ownedItems.length}</div>
              </div>
            </div>
          </div>
        </div>

        {/* ---- bottom: the single action ---- */}
        <div className="sf-garden-bottom">
          {canCheckin ? (
            <ParchButton
              onClick={() => {
                play("confirm");
                setQIdx(0);
                go("checkin_state");
              }}
            >
              {t(state.lang, "cta.how_are_you")}
            </ParchButton>
          ) : (
            <div style={{ textAlign: "center", borderRadius: 14, padding: "13px 14px", background: "linear-gradient(180deg,#3a2c52,#2c2042)", boxShadow: "0 0 0 2px #4a3a6e" }}>
              <div style={{ fontSize: 14, color: "#cfc4e6", fontWeight: 700 }}>{t(state.lang, "cta.paths_waiting")}</div>
              <div style={{ fontSize: 12, color: "#a99fc8", marginTop: 3, lineHeight: 1.4 }}>
                {t(state.lang, "cta.finish_set", { n: dailyLeft })}
              </div>
            </div>
          )}
          {canCheckin && (
            <div style={{ textAlign: "center", fontSize: 11, color: "#e9dcc0", marginTop: 1, textShadow: "0 1px 2px rgba(0,0,0,.5)" }}>
              {xpLeft > 0
                ? `${state.questsDone === 0 ? t(state.lang, "hint.first") : t(state.lang, "hint.again")} · ${t(state.lang, "hint.xp_left", { n: xpLeft, cap: XP_WINDOW_CAP })}`
                : t(state.lang, "hint.xp_done")}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ---------------- INVENTORY ---------------- */
  if (flow === "inventory") {
    const found = ITEMS.filter((it) => !it.locked && state.ownedItems.includes(it.name));
    const lockedTiles = ITEMS.filter((it) => it.locked).slice(0, 2);
    return (
      <div className="sf-screen" style={{ padding: "54px 16px 18px", minHeight: "100%" }}>
        <BackRow onClick={() => go("home")} />
        <div style={{ fontSize: 30, color: "#f4ecd6", fontWeight: 700, textShadow: "0 3px 0 rgba(0,0,0,.35)", marginTop: 6 }}>{t(L, "garden.finds")}</div>
        <div style={{ fontSize: 13, color: "#a99fc8", fontStyle: "italic", marginBottom: 16 }}>речі, що чіпляються до стежки</div>

        {found.length === 0 && (
          <div style={{ borderRadius: 16, padding: "22px 18px", textAlign: "center", background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "0 0 0 2px #4a3a6e", marginBottom: 14 }}>
            <div style={{ fontSize: 38, marginBottom: 8 }}>🎒</div>
            <div style={{ fontSize: 15, color: "#cfc4e6", fontWeight: 700 }}>Поки порожньо</div>
            <div style={{ fontSize: 13, color: "#8a7fb0", marginTop: 6, lineHeight: 1.4 }}>
              Знахідки інколи випадають за квести.
              <br />
              Зроби маленький рух — і щось зачепиться.
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {found.map((it, i) => (
            <div
              key={i}
              style={{ borderRadius: 14, padding: "14px 12px", textAlign: "center", background: parchCard, boxShadow: "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e" }}
            >
              <div style={{ width: 54, height: 54, margin: "0 auto 9px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>{it.icon}</div>
              <div style={{ fontSize: 14, color: "#3a2616", fontWeight: 700, lineHeight: 1.1 }}>{it.name}</div>
              <div style={{ fontSize: 10, color: it.rc, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginTop: 3 }}>{it.rar}</div>
              <div style={{ fontSize: 11, color: "#6a4a2c", fontStyle: "italic", marginTop: 5, lineHeight: 1.3 }}>{it.desc}</div>
            </div>
          ))}
          {lockedTiles.map((_, i) => (
            <div key={"l" + i} style={{ borderRadius: 14, padding: "14px 12px", textAlign: "center", opacity: 0.5, background: "repeating-linear-gradient(45deg,#2c2645 0 8px,#241d3a 8px 16px)", boxShadow: "0 0 0 2px #4a3a6e" }}>
              <div style={{ width: 54, height: 54, margin: "0 auto 9px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, background: "rgba(0,0,0,.25)" }}>❔</div>
              <div style={{ fontSize: 14, color: "#8a7fb0", fontWeight: 700 }}>???</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- CHECK-IN: STATE ---------------- */
  if (flow === "checkin_state") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%" }}>
        <BackRow onClick={resetFlow} />
        <div style={{ marginTop: 6 }}>
          <BombomBanner>«Не будемо садити ліс. Одне дерево. Один рух. Кажи, що там у тебе зараз.»</BombomBanner>
        </div>
        <div style={{ fontSize: 28, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "24px 0 4px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{t(L, "checkin.state.title")}</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", marginBottom: 18 }}>{t(L, "checkin.state.sub")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center" }}>
          {orderedStates.map((sd) => {
            const on = states.includes(sd.key);
            const tint = GROUP_TINT[sd.group];
            return (
              <div
                key={sd.key}
                onClick={() => {
                  play("select");
                  setStates((cur) => toggleState(cur, sd.key));
                }}
                style={{
                  cursor: "pointer",
                  userSelect: "none",
                  fontSize: 14,
                  fontWeight: 600,
                  padding: "9px 14px",
                  borderRadius: 20,
                  color: on ? "#1a1226" : "#e7dcc4",
                  background: on ? tint : "rgba(60,48,86,.55)",
                  boxShadow: on ? `0 0 0 2px ${tint}, 0 0 10px ${tint}66` : "inset 0 0 0 2px rgba(150,120,200,.35)",
                  transition: "background .12s",
                }}
              >
                {stateLabel(L, sd.key)}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: "#7d7298", textAlign: "center", marginTop: 12 }}>
          {t(L, "checkin.state.reorder")}
        </div>
        <div onClick={() => setShowNote((v) => !v)} style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#c9a878", cursor: "pointer", letterSpacing: 0.5 }}>
          {t(L, "quest.add_words")}
        </div>
        {showNote && (
          <div style={{ marginTop: 12, borderRadius: 13, padding: 10, background: "rgba(212,191,148,.12)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(L, "quest.note_ph")}
              style={{ width: "100%", height: 62, resize: "none", border: "none", outline: "none", background: "transparent", color: "#efe7d2", fontSize: 14 }}
            />
          </div>
        )}
        <div style={{ marginTop: 24, opacity: states.length ? 1 : 0.5, pointerEvents: states.length ? "auto" : "none" }}>
          <WoodButton big onClick={() => {
            play("confirm");
            setQIdx(0);
            openCheckin(states, suggestQuests(states, lvl.levelNum, 3).map((x) => x.id));
            go("checkin_energy");
          }}>
            {states.length ? t(L, "checkin.next") : t(L, "checkin.pick_one")}
          </WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- CHECK-IN: ENERGY / TENSION ---------------- */
  if (flow === "checkin_energy") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%" }}>
        <BackRow onClick={() => go("checkin_state")} />
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "14px 0 6px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{t(L, "checkin.energy.title")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", marginBottom: 8 }}>
          {ENERGY_OPTS[L].map((e) => (
            <Chip key={e} active={energy === e} onClick={() => { play("select"); setEnergy(e); }}>{e}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "28px 0 6px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{t(L, "checkin.tension.title")}</div>
        <div style={{ display: "flex", gap: 9, justifyContent: "center", marginBottom: 18 }}>
          {TENSION_OPTS[L].map((tn) => (
            <Chip key={tn} active={tension === tn} onClick={() => { play("select"); setTension(tn); }}>{tn}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#9a8fc0", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>{t(L, "quest.where")}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {BODY.map((b) => (
            <Chip key={b} sm active={body.includes(b)} onClick={() => { play("tap"); setBody((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b])); }}>{b}</Chip>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <WoodButton big onClick={() => { play("confirm"); go("quest_suggest"); }}>{t(L, "checkin.next")}</WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- QUEST SUGGEST ---------------- */
  if (flow === "quest_suggest") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%" }}>
        <BackRow onClick={() => go("checkin_energy")} />
        <div style={{ marginTop: 6 }}>
          <BombomBanner>«Ось стежки під те, що ти зараз відчуваєш. Не мусиш перемагати день — обери одну маленьку.»</BombomBanner>
        </div>
        <div style={{ fontSize: 12.5, color: "#c9bfe0", textAlign: "center", margin: "18px 0 4px" }}>
          {t(L, "quest.pick_for", { states: states.map((k) => stateLabel(L, k)).join(", ") || t(L, "quest.your_state") })}
        </div>
        <div style={{ fontSize: 13, color: "#9a8fc0", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, margin: "6px 0 14px" }}>{t(L, "quest.choose")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {suggested.map((qq, i) => (
            <div
              key={qq.id}
              onClick={() => { play("select"); setQIdx(i); go("quest_detail"); }}
              style={{ cursor: "pointer", borderRadius: 16, padding: "15px 16px", background: parchCard, boxShadow: parchShadow, display: "flex", gap: 13, alignItems: "center" }}
            >
              <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>{qq.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, color: "#3a2616", fontWeight: 700, lineHeight: 1.1 }}>{qq.title}</div>
                <div style={{ fontSize: 12, color: "#7a5836", margin: "4px 0 8px" }}>{t(L, "quest.for", { for: qq.for })}</div>
                <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>⏱ {qq.dur}</span>
                  <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>✦ +{qq.xp}</span>
                  {qq.tier > 1 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: qq.tier === 3 ? "#8a2f2f" : "#8a5a1f", padding: "3px 8px", borderRadius: 6, background: qq.tier === 3 ? "rgba(180,60,60,.18)" : "rgba(200,140,50,.2)" }}>
                      {qq.tier === 3 ? t(L, "quest.badge.bold") : t(L, "quest.badge.challenge")}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 22, color: "#7a5836" }}>›</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- QUEST DETAIL ---------------- */
  if (flow === "quest_detail") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%" }}>
        <BackRow onClick={() => go("quest_suggest")} />
        <div style={{ marginTop: 6, borderRadius: 18, padding: "20px 18px 22px", background: parchCard, boxShadow: parchShadow }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontSize: 40, flexShrink: 0 }}>{q.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 21, color: "#3a2616", fontWeight: 700, lineHeight: 1.15 }}>{q.title}</div>
              <div style={{ fontSize: 12, color: "#7a5836", marginTop: 3 }}>для стану: {q.for}</div>
            </div>
          </div>
          <div style={{ height: 2, background: "repeating-linear-gradient(90deg,#8a6a44 0 6px, transparent 6px 12px)", margin: "16px 0", opacity: 0.6 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
            {q.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", gap: 11, alignItems: "flex-start" }}>
                <div style={{ width: 24, height: 24, flexShrink: 0, borderRadius: 7, background: "linear-gradient(180deg,#7a5128,#5a3618)", boxShadow: "inset 0 1px 0 rgba(255,220,160,.4), 0 0 0 2px #3a2410", color: "#ffe6b8", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{i + 1}</div>
                <div style={{ fontSize: 15, color: "#3a2616", lineHeight: 1.35, paddingTop: 2 }}>{s}</div>
              </div>
            ))}
          </div>
          <div style={{ height: 2, background: "repeating-linear-gradient(90deg,#8a6a44 0 6px, transparent 6px 12px)", margin: "16px 0", opacity: 0.6 }} />
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <div style={{ fontSize: 13, color: "#5a3f24", padding: "5px 12px", borderRadius: 8, background: "rgba(106,74,44,.18)" }}>⏱ {q.dur}</div>
            <div style={{ fontSize: 13, color: "#5a3f24", padding: "5px 12px", borderRadius: 8, background: "rgba(106,74,44,.18)" }}>✦ +{q.xp} XP</div>
            <div style={{ fontSize: 13, color: "#5a3f24", padding: "5px 12px", borderRadius: 8, background: "rgba(106,74,44,.18)" }}>🎁 предмет</div>
          </div>
        </div>
        <div style={{ marginTop: 18 }}>
          <WoodButton big onClick={() => { play("confirm"); setTimer(120); go("quest_active"); }}>Взяти квест</WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- QUEST ACTIVE ---------------- */
  if (flow === "quest_active") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
        <div style={{ fontSize: 13, letterSpacing: 3, color: "#9a8fc0", textTransform: "uppercase" }}>квест активний</div>
        <div style={{ fontSize: 72, margin: "18px 0", animation: "sf-float 4s ease-in-out infinite" }}>{q.icon}</div>
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{q.title}</div>
        <div style={{ fontSize: 34, color: "#ffd98a", fontWeight: 700, margin: "18px 0 6px", letterSpacing: 2 }}>{fmt(timer)}</div>
        <div style={{ width: 200, height: 10, borderRadius: 6, background: "rgba(0,0,0,.3)", boxShadow: "inset 0 0 0 2px #2a1a0e", overflow: "hidden" }}>
          <div style={{ height: "100%", width: 100 - (timer / 120) * 100 + "%", background: "linear-gradient(180deg,#7bbf5a,#4f9a3a)", transition: "width 1s linear" }} />
        </div>
        <div style={{ fontSize: 15, lineHeight: 1.5, color: "#b9aecb", fontStyle: "italic", margin: "26px 0", maxWidth: 260 }}>
          Не треба робити ідеально.<br />Просто повернись, коли зробиш.
        </div>
        <div style={{ width: "100%" }}>
          <WoodButton big onClick={() => { play("complete"); go("quest_complete"); }}>{t(L, "quest.submit")}</WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- QUEST COMPLETE (after-state) ---------------- */
  if (flow === "quest_complete") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 54, textAlign: "center", marginBottom: 10, animation: "sf-pop .5s ease both" }}>🌿</div>
        <div style={{ fontSize: 28, color: "#f4ecd6", fontWeight: 700, textAlign: "center", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{t(L, "complete.title")}</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", margin: "8px 0 24px", fontStyle: "italic" }}>{t(L, "complete.sub")}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AFTER_OPTS[L].map((a) => (
            <div
              key={a.label}
              onClick={() => { play("select"); setAfter(a.label); go("quest_note"); }}
              style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 13, padding: "15px 18px", borderRadius: 14, background: "linear-gradient(180deg,#3a2c52,#2c2042)", boxShadow: "inset 0 1px 0 rgba(150,120,200,.2), inset 0 -3px 0 rgba(0,0,0,.35), 0 0 0 2px #4a3a6e", color: "#e8dcc4", fontSize: 17, fontWeight: 600 }}
            >
              <span style={{ fontSize: 24 }}>{a.icon}</span> {a.label}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ---------------- OPTIONAL NOTE ---------------- */
  if (flow === "quest_note") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>{t(L, "note.title")}</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", margin: "8px 0 20px", fontStyle: "italic" }}>{t(L, "note.sub")}</div>
        <div style={{ borderRadius: 16, padding: 14, background: parchCard, boxShadow: "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e" }}>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder={t(L, "note.ph")}
            style={{ width: "100%", height: 120, resize: "none", border: "none", outline: "none", background: "transparent", color: "#3a2616", fontSize: 15, lineHeight: 1.5 }}
          />
        </div>
        <div style={{ marginTop: 18 }}>
          <ParchButton onClick={() => { play("confirm"); finishToReward(); }}>{t(L, "note.add")}</ParchButton>
        </div>
        <div onClick={() => { setReflection(""); finishToReward(); }} style={{ textAlign: "center", marginTop: 14, fontSize: 14, color: "#7d7298", cursor: "pointer", letterSpacing: 1 }}>{t(L, "note.skip")}</div>
      </div>
    );
  }

  /* ---------------- REWARD ---------------- */
  if (flow === "reward" && reward) {
    return (
      <div className="sf-screen" style={{ padding: "50px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", animation: "sf-pop .5s ease both" }}>
          <div style={{ fontSize: 40, color: "#ffd98a", fontWeight: 700, textShadow: "0 4px 0 rgba(0,0,0,.4)" }}>{t(L, "reward.xp", { n: reward.xp })}</div>
          <div style={{ fontSize: 15, color: "#b9d99a", fontStyle: "italic", marginTop: 6 }}>{t(L, "reward.woke")}</div>
        </div>

        {reward.item && (
          <div style={{ marginTop: 22, borderRadius: 16, padding: 16, background: parchCard, boxShadow: parchShadow, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 62, height: 62, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c, 0 0 14px rgba(255,220,140,.5)", animation: "sf-glow 2.2s ease-in-out infinite" }}>{reward.item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#8a6a44", textTransform: "uppercase" }}>{t(L, "reward.found_item")}</div>
              <div style={{ fontSize: 18, color: "#3a2616", fontWeight: 700 }}>{reward.item.name}</div>
              <div style={{ fontSize: 13, color: "#6a4a2c", fontStyle: "italic" }}>«{reward.item.desc}»</div>
            </div>
          </div>
        )}

        {/* rune progress — reflects real quests done */}
        {(() => {
          const cur = Math.min(3, state.questsDone);
          const opened = cur >= 3;
          return (
            <div style={{ marginTop: 14, borderRadius: 16, padding: 16, background: "linear-gradient(180deg,#2c2150,#241a42)", boxShadow: "inset 0 1px 0 rgba(150,120,200,.25), 0 0 0 3px #4a3a6e, 0 0 0 5px #1a1230" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, background: "radial-gradient(circle,#5a4a8a,#332658)", boxShadow: "0 0 14px rgba(150,110,220,.6), inset 0 0 0 2px #7a6ab0", animation: "sf-glow 2.4s ease-in-out infinite" }}>ᛗ</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, letterSpacing: 2, color: "#9a8fc0", textTransform: "uppercase" }}>{opened ? t(L, "reward.rune_open") : t(L, "reward.rune_grow")}</div>
                  <div style={{ fontSize: 17, color: "#efe7d2", fontWeight: 700 }}>{t(L, "reward.rune_move", { cur })}</div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 9, borderRadius: 5, background: "rgba(0,0,0,.35)", boxShadow: "inset 0 0 0 2px #1a1230", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (cur / 3) * 100 + "%", background: "linear-gradient(180deg,#a98bff,#7a5ad8)", transition: "width .5s ease" }} />
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 22 }}>
          <WoodButton big onClick={() => { play("tap"); resetFlow(); }}>{t(L, "reward.to_garden")}</WoodButton>
        </div>
      </div>
    );
  }

  return null;
}

/* ---------------- TREE SCENE (clean, watermark-free pixel scene) ---------------- */
