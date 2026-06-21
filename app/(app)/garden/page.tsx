"use client";
import { useEffect, useRef, useState } from "react";
import { useGame } from "@/lib/store/game";
import TreeStages from "@/components/garden/TreeStages";
import { levelInfo } from "@/lib/utils/xp";
import { play } from "@/lib/sound/sound";
import { QUESTS } from "@/lib/mock-data/quests";
import { ITEMS } from "@/lib/mock-data/items";
import { STATES, ENERGY, TENSION, BODY, AFTER, BOMBOM_LINES } from "@/lib/mock-data/content";
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

export default function Garden() {
  const { state, recordSession, nextBombom } = useGame();
  const [flow, setFlow] = useState<Flow>("home");
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

  const q = QUESTS[qIdx] || QUESTS[0];
  const lvl = levelInfo(state.totalXp);

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
    go("home");
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  const finishToReward = () => {
    const r = recordSession({
      states,
      energy,
      tension,
      note,
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
    return (
      <div
        className="sf-screen"
        style={{ padding: "52px 16px 18px", minHeight: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "0 4px" }}>
          <div style={{ maxWidth: 215 }}>
            <div style={{ fontSize: 10, letterSpacing: 1.6, color: "#9a8fc0", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Твоє дерево-супутник
            </div>
            <div style={{ fontSize: 34, lineHeight: 1.05, color: "#f4ecd6", fontWeight: 700, marginTop: 2, textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>
              {lvl.name}
            </div>
            <div style={{ fontSize: 14, color: "#a99fc8", fontStyle: "italic", marginTop: 1 }}>{lvl.sub}</div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: "7px 12px 6px",
              borderRadius: 12,
              background: "linear-gradient(180deg,#6a4a2c,#43290f)",
              boxShadow:
                "inset 0 1px 0 rgba(255,220,160,.4), inset 0 -3px 0 rgba(0,0,0,.45), 0 0 0 2px #2a1a0e, 0 4px 0 rgba(0,0,0,.3)",
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#e7c389" }}>СЕРІЯ</div>
            <div style={{ fontSize: 22, color: "#ffd98a", fontWeight: 700, lineHeight: 1, marginTop: 2 }}>🔥 {state.streak}</div>
          </div>
        </div>

        {/* tree scene */}
        <TreeScene level={lvl.levelNum} pct={lvl.pct} invCount={state.ownedItems.length} onInventory={() => go("inventory")} />

        {/* XP panel */}
        <div
          style={{
            marginTop: 14,
            borderRadius: 16,
            padding: "13px 15px 15px",
            background: "linear-gradient(180deg,#5d3f24,#3f2812)",
            boxShadow: "inset 0 2px 0 rgba(255,220,160,.3), inset 0 -5px 0 rgba(0,0,0,.4), 0 0 0 2px #2a1a0e, 0 5px 0 rgba(0,0,0,.3)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 9 }}>
            <div style={{ fontSize: 13, color: "#f3d9a8", fontWeight: 700, letterSpacing: 1 }}>РІВЕНЬ {lvl.levelNum}</div>
            <div style={{ fontSize: 13, color: "#e7c389", fontWeight: 600 }}>
              {lvl.inLevel} / {lvl.target} XP
            </div>
          </div>
          <HeartBar pct={Math.round(lvl.pct * 100) + "%"} />
        </div>

        {/* main CTA */}
        <div style={{ marginTop: 16 }}>
          <ParchButton
            onClick={() => {
              play("confirm");
              go("checkin_state");
            }}
          >
            ✦  Як ти зараз?
          </ParchButton>
        </div>

        {/* Бомбом */}
        <div
          onClick={() => {
            nextBombom();
            play("tap");
          }}
          style={{ position: "relative", marginTop: 16, display: "flex", alignItems: "flex-end", cursor: "pointer" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/sprites/bombom.png"
            alt="БомБом"
            style={{ width: 134, height: "auto", flexShrink: 0, alignSelf: "flex-end", marginBottom: -2, filter: "drop-shadow(0 3px 3px rgba(0,0,0,.5))", animation: "sf-float 5.5s ease-in-out infinite" }}
          />
          <div
            style={{
              position: "relative",
              flex: 1,
              marginLeft: 10,
              marginBottom: 30,
              background: "#f5f1e6",
              borderRadius: 17,
              padding: "13px 16px 14px",
              boxShadow: "0 0 0 3px #241a32, 4px 6px 0 rgba(0,0,0,.28)",
            }}
          >
            <div style={{ position: "absolute", left: 16, bottom: -15, width: 0, height: 0, borderLeft: "12px solid transparent", borderRight: "12px solid transparent", borderTop: "15px solid #241a32" }} />
            <div style={{ position: "absolute", left: 19, bottom: -11, width: 0, height: 0, borderLeft: "9px solid transparent", borderRight: "9px solid transparent", borderTop: "11px solid #f5f1e6" }} />
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <div style={{ fontSize: 13, color: "#3a2a1c", fontWeight: 700, letterSpacing: 0.5 }}>БомБом</div>
              <div style={{ fontSize: 10, color: "#9a8a74", letterSpacing: 1 }}>тицьни ↻</div>
            </div>
            <div style={{ fontSize: 13.5, lineHeight: 1.5, color: "#2b2230" }}>
              {BOMBOM_LINES[state.bombomIdx % BOMBOM_LINES.length]}
            </div>
          </div>
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
        <div style={{ fontSize: 30, color: "#f4ecd6", fontWeight: 700, textShadow: "0 3px 0 rgba(0,0,0,.35)", marginTop: 6 }}>Знахідки</div>
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
        <div style={{ fontSize: 28, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "24px 0 4px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Як ти зараз?</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", marginBottom: 18 }}>обери, що відгукується — можна кілька</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
          {STATES.map((s) => (
            <Chip
              key={s}
              active={states.includes(s)}
              onClick={() => {
                play("select");
                setStates((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));
              }}
            >
              {s}
            </Chip>
          ))}
        </div>
        <div onClick={() => setShowNote((v) => !v)} style={{ textAlign: "center", marginTop: 22, fontSize: 14, color: "#c9a878", cursor: "pointer", letterSpacing: 0.5 }}>
          + додати словами
        </div>
        {showNote && (
          <div style={{ marginTop: 12, borderRadius: 13, padding: 10, background: "rgba(212,191,148,.12)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="кілька слів, якщо хочеться…"
              style={{ width: "100%", height: 62, resize: "none", border: "none", outline: "none", background: "transparent", color: "#efe7d2", fontSize: 14 }}
            />
          </div>
        )}
        <div style={{ marginTop: 26 }}>
          <WoodButton big onClick={() => { play("confirm"); go("checkin_energy"); }}>Далі  →</WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- CHECK-IN: ENERGY / TENSION ---------------- */
  if (flow === "checkin_energy") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%" }}>
        <BackRow onClick={() => go("checkin_state")} />
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "14px 0 6px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Скільки енергії?</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 9, justifyContent: "center", marginBottom: 8 }}>
          {ENERGY.map((e) => (
            <Chip key={e} active={energy === e} onClick={() => { play("select"); setEnergy(e); }}>{e}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", margin: "28px 0 6px", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Напруга в тілі?</div>
        <div style={{ display: "flex", gap: 9, justifyContent: "center", marginBottom: 18 }}>
          {TENSION.map((t) => (
            <Chip key={t} active={tension === t} onClick={() => { play("select"); setTension(t); }}>{t}</Chip>
          ))}
        </div>
        <div style={{ fontSize: 13, color: "#9a8fc0", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, marginBottom: 12 }}>де саме? (необов&apos;язково)</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
          {BODY.map((b) => (
            <Chip key={b} sm active={body.includes(b)} onClick={() => { play("tap"); setBody((cur) => (cur.includes(b) ? cur.filter((x) => x !== b) : [...cur, b])); }}>{b}</Chip>
          ))}
        </div>
        <div style={{ marginTop: 30 }}>
          <WoodButton big onClick={() => { play("confirm"); go("quest_suggest"); }}>Далі  →</WoodButton>
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
          <BombomBanner>«Схоже, в голові шумить. Не будемо перемагати день. Візьми маленький квест.»</BombomBanner>
        </div>
        <div style={{ fontSize: 13, color: "#9a8fc0", textAlign: "center", textTransform: "uppercase", letterSpacing: 2, margin: "22px 0 14px" }}>обери одну стежку</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {QUESTS.map((qq, i) => (
            <div
              key={qq.id}
              onClick={() => { play("select"); setQIdx(i); go("quest_detail"); }}
              style={{ cursor: "pointer", borderRadius: 16, padding: "15px 16px", background: parchCard, boxShadow: parchShadow, display: "flex", gap: 13, alignItems: "center" }}
            >
              <div style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c" }}>{qq.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 17, color: "#3a2616", fontWeight: 700, lineHeight: 1.1 }}>{qq.title}</div>
                <div style={{ fontSize: 12, color: "#7a5836", margin: "4px 0 8px" }}>для: {qq.for}</div>
                <div style={{ display: "flex", gap: 7 }}>
                  <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>⏱ {qq.dur}</span>
                  <span style={{ fontSize: 11, color: "#5a3f24", padding: "3px 8px", borderRadius: 6, background: "rgba(106,74,44,.18)" }}>✦ +{qq.xp}</span>
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
          <WoodButton big onClick={() => { play("complete"); go("quest_complete"); }}>Здати квест</WoodButton>
        </div>
      </div>
    );
  }

  /* ---------------- QUEST COMPLETE (after-state) ---------------- */
  if (flow === "quest_complete") {
    return (
      <div className="sf-screen" style={{ padding: "54px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ fontSize: 54, textAlign: "center", marginBottom: 10, animation: "sf-pop .5s ease both" }}>🌿</div>
        <div style={{ fontSize: 28, color: "#f4ecd6", fontWeight: 700, textAlign: "center", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Що змінилось?</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", margin: "8px 0 24px", fontStyle: "italic" }}>чесно, без правильних відповідей</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {AFTER.map((a) => (
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
        <div style={{ fontSize: 26, color: "#f4ecd6", fontWeight: 700, textAlign: "center", textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Хочеш лишити пару слів?</div>
        <div style={{ fontSize: 13, color: "#a99fc8", textAlign: "center", margin: "8px 0 20px", fontStyle: "italic" }}>це не домашка. просто слід.</div>
        <div style={{ borderRadius: 16, padding: 14, background: parchCard, boxShadow: "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e" }}>
          <textarea
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            placeholder="підійшов до вікна, побачив дощ. стало тихіше…"
            style={{ width: "100%", height: 120, resize: "none", border: "none", outline: "none", background: "transparent", color: "#3a2616", fontSize: 15, lineHeight: 1.5 }}
          />
        </div>
        <div style={{ marginTop: 18 }}>
          <ParchButton onClick={() => { play("confirm"); finishToReward(); }}>Додати запис</ParchButton>
        </div>
        <div onClick={() => { setReflection(""); finishToReward(); }} style={{ textAlign: "center", marginTop: 14, fontSize: 14, color: "#7d7298", cursor: "pointer", letterSpacing: 1 }}>пропустити</div>
      </div>
    );
  }

  /* ---------------- REWARD ---------------- */
  if (flow === "reward" && reward) {
    return (
      <div className="sf-screen" style={{ padding: "50px 18px 24px", minHeight: "100%", display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ textAlign: "center", animation: "sf-pop .5s ease both" }}>
          <div style={{ fontSize: 40, color: "#ffd98a", fontWeight: 700, textShadow: "0 4px 0 rgba(0,0,0,.4)" }}>+{reward.xp} XP</div>
          <div style={{ fontSize: 15, color: "#b9d99a", fontStyle: "italic", marginTop: 6 }}>Дерево трохи прокинулось.</div>
        </div>

        {reward.item && (
          <div style={{ marginTop: 22, borderRadius: 16, padding: 16, background: parchCard, boxShadow: parchShadow, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 62, height: 62, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: "radial-gradient(circle,#efe0bd,#c9a878)", boxShadow: "inset 0 0 0 2px #6a4a2c, 0 0 14px rgba(255,220,140,.5)", animation: "sf-glow 2.2s ease-in-out infinite" }}>{reward.item.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#8a6a44", textTransform: "uppercase" }}>знайдено предмет</div>
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
                  <div style={{ fontSize: 11, letterSpacing: 2, color: "#9a8fc0", textTransform: "uppercase" }}>{opened ? "руна відкрилась" : "руна росте"}</div>
                  <div style={{ fontSize: 17, color: "#efe7d2", fontWeight: 700 }}>Руна Руху · {cur}/3</div>
                </div>
              </div>
              <div style={{ marginTop: 10, height: 9, borderRadius: 5, background: "rgba(0,0,0,.35)", boxShadow: "inset 0 0 0 2px #1a1230", overflow: "hidden" }}>
                <div style={{ height: "100%", width: (cur / 3) * 100 + "%", background: "linear-gradient(180deg,#a98bff,#7a5ad8)", transition: "width .5s ease" }} />
              </div>
            </div>
          );
        })()}

        <div style={{ marginTop: 22 }}>
          <WoodButton big onClick={() => { play("tap"); resetFlow(); }}>← До саду</WoodButton>
        </div>
      </div>
    );
  }

  return null;
}

/* ---------------- TREE SCENE (clean, watermark-free pixel scene) ---------------- */
function TreeScene({ level, pct, invCount, onInventory }: { level: number; pct: number; invCount: number; onInventory: () => void }) {
  return (
    <div
      style={{
        position: "relative",
        marginTop: 8,
        height: 286,
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "inset 0 0 0 3px rgba(0,0,0,.4), inset 0 0 50px rgba(0,0,0,.25)",
        background: "linear-gradient(180deg,#8fc7ea 0%,#a9d8ef 46%,#cfe9f5 60%)",
        imageRendering: "pixelated",
      }}
    >
      {/* pixel clouds */}
      <div style={{ position: "absolute", top: 34, left: 28, width: 64, height: 16, background: "#f4fbff", boxShadow: "12px -8px 0 0 #f4fbff, 30px 0 0 0 #f4fbff", borderRadius: 8, opacity: 0.92 }} />
      <div style={{ position: "absolute", top: 70, right: 30, width: 50, height: 14, background: "#eaf6ff", boxShadow: "20px 0 0 0 #eaf6ff", borderRadius: 8, opacity: 0.85 }} />
      {/* ambient daytime sparkles */}
      <Stars n={10} seed={11} area={50} />

      {/* grass + soil */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 30, height: 22, background: "#6fae46", boxShadow: "inset 0 3px 0 rgba(255,255,255,.18), inset 0 -2px 0 rgba(0,0,0,.2)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 30, background: "repeating-linear-gradient(90deg,#6b4a2c 0 22px,#5c3f24 22px 24px), linear-gradient(180deg,#7a5436,#5c3f24)" }} />

      {/* ground shadow */}
      <div style={{ position: "absolute", left: "8%", right: "8%", bottom: 26, height: 22, borderRadius: "50%", background: "radial-gradient(closest-side, rgba(20,30,10,.5), transparent)" }} />

      {/* tree */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 16, display: "flex", justifyContent: "center", alignItems: "flex-end" }}>
        <TreeStages stage={level} pct={pct} />
      </div>

      {/* inventory button */}
      <div
        onClick={onInventory}
        style={{ position: "absolute", left: 12, bottom: 12, width: 62, height: 62, borderRadius: 12, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, background: "linear-gradient(180deg,#6a4a2c,#43290f)", boxShadow: "inset 0 2px 0 rgba(255,220,160,.35), inset 0 -4px 0 rgba(0,0,0,.45), 0 0 0 2px #2a1a0e, 0 4px 0 rgba(0,0,0,.35)" }}
      >
        <span style={{ fontSize: 25, lineHeight: 1 }}>🎒</span>
        <span style={{ fontSize: 9, letterSpacing: 0.5, color: "#e7c389", fontWeight: 700 }}>Знахідки</span>
        <div style={{ position: "absolute", top: -7, right: -7, minWidth: 19, height: 19, padding: "0 4px", borderRadius: 10, background: "linear-gradient(180deg,#caa24a,#a07a28)", boxShadow: "0 0 0 2px #2a1a0e", color: "#2a1a0e", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{invCount}</div>
      </div>
    </div>
  );
}
