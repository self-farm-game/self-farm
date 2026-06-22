"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { CABIN_ROWS } from "@/lib/mock-data/content";
import { ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const card = "linear-gradient(180deg,#2c2150,#241a42)";
const cardShadow = "0 0 0 2px #4a3a6e";

function Row({ icon, label, val, onClick }: { icon: string; label: string; val?: React.ReactNode; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 13, padding: "14px 16px", borderRadius: 13, cursor: onClick ? "pointer" : "default", background: card, boxShadow: cardShadow }}
    >
      <span style={{ fontSize: 22 }}>{icon}</span>
      <span style={{ flex: 1, fontSize: 16, color: "#e8dcc4", fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#9a8fc0", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{val}</span>
      {onClick && <span style={{ fontSize: 18, color: "#6a6090" }}>›</span>}
    </div>
  );
}

function AuthSection() {
  const { auth, signOut } = useGame();
  const [busy, setBusy] = useState(false);

  if (!auth.ready) {
    return (
      <div style={{ marginTop: 16, borderRadius: 14, padding: 16, textAlign: "center", color: "#8a7fb0", fontSize: 13, background: card, boxShadow: cardShadow }}>
        синхронізація…
      </div>
    );
  }

  if (!auth.isAnonymous) {
    return (
      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <Row icon="✦" label="Акаунт" val={auth.email || "увійдено"} />
        <div
          onClick={async () => {
            if (busy) return;
            setBusy(true);
            await signOut();
            setBusy(false);
          }}
          style={{ textAlign: "center", padding: "13px", borderRadius: 13, cursor: "pointer", fontWeight: 700, color: "#cfc4e6", background: "linear-gradient(180deg,#3a2c52,#2c2042)", boxShadow: cardShadow }}
        >
          {busy ? "…" : "Вийти"}
        </div>
      </div>
    );
  }

  return <AuthForm />;
}

function AuthForm() {
  const { signIn, signUp } = useGame();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input: React.CSSProperties = {
    width: "100%",
    padding: "12px 13px",
    borderRadius: 11,
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 15,
    color: "#3a2616",
    background: "linear-gradient(180deg,#e6cf9c,#cda874)",
    boxShadow: "inset 0 2px 4px rgba(120,86,48,.4), 0 0 0 2px #6a4a2c",
  };

  const run = async (mode: "in" | "up") => {
    setErr(null);
    setOk(null);
    if (!email.trim() || password.length < 6) {
      setErr("Введи пошту і пароль (мін. 6 символів).");
      return;
    }
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) setErr(res.error);
    else {
      play("reward");
      setOk(mode === "up" ? "Акаунт створено — прогрес збережено." : "Готово, з поверненням.");
    }
  };

  return (
    <div style={{ marginTop: 16, borderRadius: 16, padding: 16, background: "linear-gradient(180deg,#34255a,#241a42)", boxShadow: "0 0 0 2px #4a3a6e, inset 0 1px 0 rgba(150,120,200,.2)" }}>
      <div style={{ fontSize: 16, color: "#f4ecd6", fontWeight: 700 }}>Збережи свій сад</div>
      <div style={{ fontSize: 12.5, color: "#a99fc8", marginTop: 4, marginBottom: 12, lineHeight: 1.4 }}>
        Акаунт переносить прогрес на інші пристрої. Грати можна й без нього.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <input style={input} type="email" inputMode="email" autoComplete="email" placeholder="пошта" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={input} type="password" autoComplete="current-password" placeholder="пароль (мін. 6)" value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <div style={{ fontSize: 12.5, color: "#e8a0a0", marginTop: 9 }}>{err}</div>}
      {ok && <div style={{ fontSize: 12.5, color: "#b9d99a", marginTop: 9 }}>{ok}</div>}
      <div style={{ display: "flex", gap: 9, marginTop: 12 }}>
        <div
          onClick={() => !busy && run("up")}
          style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#2a1d10", background: "linear-gradient(180deg,#e6cf9c,#cda874)", boxShadow: "inset 0 2px 0 rgba(255,250,225,.5), 0 0 0 2px #6a4a2c" }}
        >
          {busy ? "…" : "Створити"}
        </div>
        <div
          onClick={() => !busy && run("in")}
          style={{ flex: 1, textAlign: "center", padding: "12px", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#cfc4e6", background: "linear-gradient(180deg,#3a2c52,#2c2042)", boxShadow: cardShadow }}
        >
          {busy ? "…" : "Увійти"}
        </div>
      </div>
    </div>
  );
}

export default function Cabin() {
  const { state, auth, toggleMute, reset } = useGame();
  const lvl = levelInfo(state.totalXp);

  const sessionsCount = state.journal.reduce((a, d) => a + d.entries.length, 0);
  const notesCount = state.journal.reduce((a, d) => a + d.entries.filter((e) => e.note).length, 0);
  const runesUnlocked =
    (state.onboarded ? 1 : 0) +
    (state.questsDone >= 3 ? 1 : 0) +
    (sessionsCount >= 3 ? 1 : 0) +
    (notesCount >= 3 ? 1 : 0);

  const stat = (n: string | number, label: string, color: string) => (
    <div style={{ flex: 1, textAlign: "center", borderRadius: 13, padding: "12px 6px", background: card, boxShadow: cardShadow }}>
      <div style={{ fontSize: 24, color, fontWeight: 700 }}>{n}</div>
      <div style={{ fontSize: 11, color: "#9a8fc0", letterSpacing: 1 }}>{label}</div>
    </div>
  );

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Хатина" sub="твій кут у тиші" />

      <div style={{ borderRadius: 18, padding: 18, background: "linear-gradient(180deg,#5d3f24,#3f2812)", boxShadow: "inset 0 2px 0 rgba(255,220,160,.3), inset 0 -5px 0 rgba(0,0,0,.4), 0 0 0 2px #2a1a0e, 0 6px 0 rgba(0,0,0,.3)", display: "flex", gap: 15, alignItems: "center" }}>
        <div style={{ width: 66, height: 66, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 34, background: "radial-gradient(circle,#7bbf5a,#3f6a2a)", boxShadow: "inset 0 0 0 3px #2a1a0e, 0 0 0 2px #6a4a2c" }}>🌱</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, color: "#f3d9a8", fontWeight: 700 }}>Мандрівник V</div>
          <div style={{ fontSize: 13, color: "#c9a878" }}>Рівень дерева {lvl.levelNum} · {state.totalXp} XP усього</div>
          {!auth.isAnonymous && auth.email && (
            <div style={{ fontSize: 12, color: "#b9d99a", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>✦ {auth.email}</div>
          )}
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        {stat(state.day, "ДНІВ", "#ffd98a")}
        {stat(runesUnlocked, "РУН", "#a98bff")}
        {stat(state.questsDone, "КВЕСТІВ", "#7bbf5a")}
      </div>

      {isSupabaseConfigured && <AuthSection />}

      <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <Row icon="🔈" label="Звук" val={state.muted ? "вимкнено" : "увімкнено"} onClick={() => { toggleMute(); if (state.muted) play("select"); }} />
        {CABIN_ROWS.map((c, i) => (
          <Row key={i} icon={c.icon} label={c.label} val={c.val} />
        ))}
        <Row icon="♻️" label="Скинути прогрес" onClick={() => { if (confirm("Скинути весь прогрес? Дерево почнеться з жолудя.")) reset(); }} />
      </div>

      <div style={{ textAlign: "center", fontSize: 12, color: "#6a5f88", marginTop: 20, fontStyle: "italic" }}>
        Self-Farm · не self-harm, а self-farm.
        <br />
        Одне дерево. Один рух.
      </div>
    </div>
  );
}
