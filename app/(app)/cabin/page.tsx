"use client";
/**
 * Хатина — профіль і налаштування. Спливає над садом, як і решта вкладок.
 */
import { useState } from "react";
import { useGame } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { t, LANGS, type Lang } from "@/lib/mock-data/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Sheet from "@/components/ui/Sheet";
import { play } from "@/lib/sound/sound";

function Row({
  icon,
  label,
  val,
  onClick,
}: {
  icon: string;
  label: string;
  val?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={"l3-row" + (onClick ? "" : " l3-static")} onClick={onClick}>
      <span className="l3-ico">{icon}</span>
      <span className="l3-lab">{label}</span>
      <span className="l3-val">{val}</span>
      {onClick && <span style={{ color: "var(--g-ink-3)", fontSize: 16 }}>›</span>}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 12,
  outline: "none",
  fontFamily: "inherit",
  fontSize: 15,
  color: "var(--g-ink)",
  background: "rgba(0,0,0,.26)",
  border: "1px solid var(--g-line)",
};

function AuthBlock() {
  const { auth, signOut, signIn, signUp, state } = useGame();
  const L = state.lang;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!auth.ready) {
    return <div className="l3-row l3-static">{t(L, "cabin.syncing")}</div>;
  }

  if (!auth.isAnonymous) {
    return (
      <>
        <Row icon="✦" label={t(L, "cabin.account")} val={auth.email || t(L, "cabin.signed_in")} />
        <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
          <button
            className="l3-btn l3-sm l3-btn-soft"
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              await signOut();
              setBusy(false);
            }}
          >
            {busy ? "…" : t(L, "cabin.sign_out")}
          </button>
        </div>
      </>
    );
  }

  const run = async (mode: "in" | "up") => {
    setErr(null);
    setOk(null);
    if (!email.trim() || password.length < 6) {
      setErr(t(L, "cabin.err_creds"));
      return;
    }
    setBusy(true);
    const res = mode === "in" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (res.error) setErr(res.error);
    else {
      play("reward");
      setOk(mode === "up" ? t(L, "cabin.ok_up") : t(L, "cabin.ok_in"));
    }
  };

  return (
    <div
      style={{
        padding: 16,
        borderRadius: 16,
        background: "var(--g-card)",
        border: "1px solid var(--g-line-soft)",
      }}
    >
      <div style={{ fontSize: 15, fontWeight: 700 }}>{t(L, "cabin.save_title")}</div>
      <div style={{ fontSize: 12.5, color: "var(--g-ink-3)", marginTop: 5, marginBottom: 13, lineHeight: 1.45 }}>
        {t(L, "cabin.save_desc")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        <input style={inputStyle} type="email" inputMode="email" autoComplete="email" placeholder={t(L, "cabin.email")} value={email} onChange={(e) => setEmail(e.target.value)} />
        <input style={inputStyle} type="password" autoComplete="current-password" placeholder={t(L, "cabin.password")} value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {err && <div style={{ fontSize: 12.5, color: "var(--g-rose)", marginTop: 10 }}>{err}</div>}
      {ok && <div style={{ fontSize: 12.5, color: "var(--g-green)", marginTop: 10 }}>{ok}</div>}
      <div style={{ display: "flex", gap: 9, marginTop: 13 }}>
        <button className="l3-btn l3-sm" style={{ flex: 1 }} onClick={() => !busy && run("up")}>
          {busy ? "…" : t(L, "cabin.create")}
        </button>
        <button className="l3-btn l3-sm l3-btn-soft" style={{ flex: 1 }} onClick={() => !busy && run("in")}>
          {busy ? "…" : t(L, "cabin.enter")}
        </button>
      </div>
    </div>
  );
}

export default function Cabin() {
  const { state, auth, toggleMute, reset, setLang } = useGame();
  const L = state.lang;
  const lvl = levelInfo(state.totalXp);
  const [langOpen, setLangOpen] = useState(false);

  const runs = Object.values(state.questStats || {}).reduce((a, s) => a + s.runs, 0);
  const helped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);

  if (langOpen) {
    return (
      <Sheet
        crumb="ХАТИНА / МОВА"
        title={t(L, "lang.title")}
        sub={t(L, "lang.sub")}
        foot={
          <button className="l3-btn l3-sm l3-btn-soft" onClick={() => setLangOpen(false)}>
            ← Назад
          </button>
        }
      >
        {LANGS.map((lg) => {
          const on = state.lang === lg.id;
          return (
            <div
              key={lg.id}
              className={"l3-row" + (on ? " l3-on" : "")}
              style={on ? { background: "var(--g-green-dim)", borderColor: "rgba(134,198,124,.35)" } : undefined}
              onClick={() => {
                setLang(lg.id as Lang);
                play("select");
                setLangOpen(false);
              }}
            >
              <span className="l3-ico">{lg.flag}</span>
              <span className="l3-lab">
                {lg.label}
                <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>{lg.note}</span>
              </span>
              {on && <span style={{ color: "var(--g-green)", fontSize: 16 }}>✓</span>}
            </div>
          );
        })}
      </Sheet>
    );
  }

  return (
    <Sheet
      crumb="ХАТИНА"
      title={t(L, "cabin.title")}
      sub={t(L, "cabin.sub")}
      note={t(L, "cabin.tagline")}
    >
      {/* профіль */}
      <div className="l3-row l3-static" style={{ padding: "16px 18px" }}>
        <span className="l3-ico" style={{ fontSize: 28 }}>🌱</span>
        <span className="l3-lab" style={{ fontSize: 17 }}>
          {t(L, "cabin.traveller")}
          <span style={{ display: "block", fontSize: 12, color: "var(--g-ink-3)", fontWeight: 400, marginTop: 2 }}>
            {lvl.name} · {state.totalXp} XP
          </span>
          {!auth.isAnonymous && auth.email && (
            <span style={{ display: "block", fontSize: 11.5, color: "var(--g-green)", fontWeight: 400, marginTop: 2 }}>
              ✦ {auth.email}
            </span>
          )}
        </span>
      </div>

      <div className="l3-grid" style={{ marginTop: 10, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Stat n={state.day} label="день" />
        <Stat n={state.streak} label="серія" />
        <Stat n={runs} label="стежок" />
        <Stat n={helped} label="допомогло" />
      </div>

      {isSupabaseConfigured && (
        <>
          <div className="l3-section-title">акаунт</div>
          <AuthBlock />
        </>
      )}

      <div className="l3-section-title">налаштування</div>
      <Row
        icon="🌐"
        label={t(L, "cabin.language")}
        val={t(L, "cabin.language_val")}
        onClick={() => { play("select"); setLangOpen(true); }}
      />
      <Row
        icon="🔈"
        label={t(L, "cabin.sound")}
        val={state.muted ? t(L, "cabin.sound_off") : t(L, "cabin.sound_on")}
        onClick={() => { toggleMute(); if (state.muted) play("select"); }}
      />
      <Row icon="🔔" label={t(L, "cabin.reminders")} val={t(L, "cabin.reminders_val")} />
      <Row icon="📤" label={t(L, "cabin.export")} />
      <Row icon="🌱" label={t(L, "cabin.about")} />
      <Row
        icon="🖼️"
        label="Класична 2D-сцена"
        val="архів"
        onClick={() => { play("select"); window.location.href = "/garden2d"; }}
      />
      <Row
        icon="♻️"
        label={t(L, "cabin.reset")}
        onClick={() => { if (confirm(t(L, "cabin.reset_confirm"))) reset(); }}
      />
    </Sheet>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "12px 6px",
        borderRadius: 14,
        background: "var(--g-card)",
        border: "1px solid var(--g-line-soft)",
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 700, color: "var(--g-gold)" }}>{n}</div>
      <div style={{ fontSize: 10, letterSpacing: 1.1, textTransform: "uppercase", color: "var(--g-ink-3)", marginTop: 3 }}>
        {label}
      </div>
    </div>
  );
}
