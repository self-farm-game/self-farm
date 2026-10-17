"use client";
/**
 * Хатина — профіль і налаштування. Спливає над садом, як і решта вкладок.
 */
import { useEffect, useRef, useState } from "react";
import { useGame, type GameState } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { t, LANGS, type Lang } from "@/lib/mock-data/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Sheet from "@/components/ui/Sheet";
import { play } from "@/lib/sound/sound";
import { disablePush, enablePush, pushState, type PushState } from "@/lib/push/client";
import { exportSave, exportJournal, exportLogCsv } from "@/lib/utils/export";
import Icon from "@/components/icons/Icon";

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
      <span className="l3-ico"><Icon name={icon} size={20} /></span>
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
        <Row icon="spark" label={t(L, "cabin.account")} val={auth.email || t(L, "cabin.signed_in")} />
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

type View = null | "lang" | "reminders" | "export" | "about";

export default function Cabin() {
  const { state, auth, toggleMute, reset, setLang, setReminders, importState } = useGame();
  const L = state.lang;
  const lvl = levelInfo(state.totalXp, L);
  const [view, setView] = useState<View>(null);

  const runs = Object.values(state.questStats || {}).reduce((a, s) => a + s.runs, 0);
  const helped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);
  const rem = state.reminders || { on: false, times: ["20:00"] };
  const back = (
    <button className="l3-btn l3-sm l3-btn-soft" onClick={() => setView(null)}>
      {t(L, "cabin.back")}
    </button>
  );

  /* ── мова ── */
  if (view === "lang") {
    return (
      <Sheet crumb={t(L, "lang.crumb")} title={t(L, "lang.title")} sub={t(L, "lang.sub")} foot={back}>
        {LANGS.map((lg) => {
          const on = state.lang === lg.id;
          return (
            <div
              key={lg.id}
              className="l3-row"
              style={on ? { background: "var(--g-green-dim)", borderColor: "rgba(134,198,124,.35)" } : undefined}
              onClick={() => {
                setLang(lg.id as Lang);
                play("select");
                setView(null);
              }}
            >
              <span className="l3-ico" style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "var(--g-ink-3)" }}>{lg.flag}</span>
              <span className="l3-lab">
                {lg.label}
                <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>{t(L, lg.noteKey)}</span>
              </span>
              {on && <span style={{ color: "var(--g-green)", fontSize: 16 }}>✓</span>}
            </div>
          );
        })}
      </Sheet>
    );
  }

  /* ── нагадування ── */
  if (view === "reminders") {
    return <RemindersSheet L={L} rem={rem} setReminders={setReminders} back={back} />;
  }

  /* ── експорт ── */
  if (view === "export") {
    return <ExportSheet L={L} state={state} importState={importState} back={back} />;
  }

  /* ── про гру ── */
  if (view === "about") {
    return <AboutSheet L={L} back={back} />;
  }

  return (
    <Sheet crumb={t(L, "cabin.crumb")} title={t(L, "cabin.title")} sub={t(L, "cabin.sub")} note={t(L, "cabin.tagline")}>
      {/* профіль */}
      <div className="l3-row l3-static" style={{ padding: "16px 18px" }}>
        <span className="l3-ico"><Icon name="sprout" size={28} /></span>
        <span className="l3-lab" style={{ fontSize: 17 }}>
          {t(L, "cabin.traveller")}
          <span style={{ display: "block", fontSize: 12, color: "var(--g-ink-3)", fontWeight: 400, marginTop: 2 }}>
            {lvl.name} · {state.totalXp} XP
          </span>
          {!auth.isAnonymous && auth.email && (
            <span style={{ display: "block", fontSize: 11.5, color: "var(--g-green)", fontWeight: 400, marginTop: 2 }}>
              <Icon name="spark" size={11} /> {auth.email}
            </span>
          )}
        </span>
      </div>

      <div className="l3-grid" style={{ marginTop: 10, gridTemplateColumns: "repeat(4, 1fr)" }}>
        <Stat n={state.day} label={t(L, "cabin.stat_day")} />
        <Stat n={state.streak} label={t(L, "cabin.stat_streak")} />
        <Stat n={runs} label={t(L, "cabin.stat_paths")} />
        <Stat n={helped} label={t(L, "cabin.stat_helped")} />
      </div>

      {isSupabaseConfigured && (
        <>
          <div className="l3-section-title">{t(L, "cabin.sec_account")}</div>
          <AuthBlock />
        </>
      )}

      <div className="l3-section-title">{t(L, "cabin.sec_settings")}</div>
      <Row
        icon="globe"
        label={t(L, "cabin.language")}
        val={t(L, "cabin.language_val")}
        onClick={() => { play("select"); setView("lang"); }}
      />
      <Row
        icon={state.muted ? "sound-off" : "sound"}
        label={t(L, "cabin.sound")}
        val={state.muted ? t(L, "cabin.sound_off") : t(L, "cabin.sound_on")}
        onClick={() => { toggleMute(); if (state.muted) play("select"); }}
      />
      <Row
        icon={rem.on ? "bell" : "bell-off"}
        label={t(L, "cabin.reminders")}
        val={rem.on ? rem.times.join(" · ") : t(L, "cabin.reminders_off")}
        onClick={() => { play("select"); setView("reminders"); }}
      />
      <Row
        icon="export"
        label={t(L, "cabin.export")}
        val={t(L, "cabin.export_val")}
        onClick={() => { play("select"); setView("export"); }}
      />
      <Row
        icon="sprout"
        label={t(L, "cabin.about")}
        val={t(L, "cabin.about_val")}
        onClick={() => { play("select"); setView("about"); }}
      />
      <Row
        icon="picture"
        label={t(L, "cabin.classic")}
        val={t(L, "cabin.classic_val")}
        onClick={() => { play("select"); window.location.href = "/garden2d"; }}
      />
      <Row
        icon="reset"
        label={t(L, "cabin.reset")}
        onClick={() => { if (confirm(t(L, "cabin.reset_confirm"))) reset(); }}
      />
    </Sheet>
  );
}

/* ───────────────────────── нагадування ───────────────────────── */

const PRESETS: { key: string; lk: string; nk: string; times: string[] }[] = [
  { key: "evening", lk: "rem.evening", nk: "rem.evening_note", times: ["20:00"] },
  { key: "morning", lk: "rem.morning", nk: "rem.morning_note", times: ["09:00"] },
  { key: "both", lk: "rem.both", nk: "rem.both_note", times: ["09:00", "20:00"] },
];

function RemindersSheet({
  L,
  rem,
  setReminders,
  back,
}: {
  L: Lang;
  rem: { on: boolean; times: string[] };
  setReminders: (r: { on: boolean; times: string[] }) => void;
  back: React.ReactNode;
}) {
  const [perm, setPerm] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );
  const [custom, setCustom] = useState(rem.times[0] || "20:00");
  const [ps, setPs] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);

  // Чи дійде нагадування із закритим браузером — залежить не від дозволу,
  // а від того, чи вдалося підписатись на push.
  useEffect(() => {
    let alive = true;
    void pushState().then((v) => alive && setPs(v));
    return () => {
      alive = false;
    };
  }, [rem.on, rem.times.join(",")]);

  const supported = perm !== "unsupported";
  const granted = perm === "granted";
  const current = rem.times.join(",");
  const livePush = ps === "subscribed";
  const canPush = ps === "ready" || ps === "subscribed";

  /** Увімкнути з дозволом і підпискою. Усе, що не вийшло, видно на екрані. */
  const turnOn = async (times: string[]) => {
    setBusy(true);
    try {
      const res = await enablePush({ times, lang: L });
      if (res.ok) {
        play("reward");
        setPerm("granted");
        setPs("subscribed");
      } else if (res.reason === "no-permission") {
        setPerm(typeof Notification !== "undefined" ? Notification.permission : "denied");
      } else {
        // push не склався — нагадування лишаються, але тільки з
        // відкритою вкладкою. Чесно скажемо про це нижче.
        setPs(res.reason === "failed" ? "ready" : res.reason);
        if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
          const r = await Notification.requestPermission().catch(() => "denied");
          setPerm(r);
        }
      }
      setReminders({ on: true, times });
    } finally {
      setBusy(false);
    }
  };

  const turnOff = async () => {
    setBusy(true);
    try {
      await disablePush();
      setPs("ready");
      setReminders({ on: false, times: rem.times });
    } finally {
      setBusy(false);
    }
  };

  const pick = (times: string[]) => {
    play("select");
    void turnOn(times);
  };

  return (
    <Sheet
      crumb={t(L, "rem.crumb")}
      title={t(L, "rem.title")}
      sub={t(L, "rem.sub")}
      foot={back}
      note={granted ? t(L, livePush ? "rem.note_push" : "rem.note_tab") : undefined}
    >
      {!supported && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="warn" size={15} />
          <span>{t(L, "rem.unsupported")}</span>
        </div>
      )}

      {ps === "ios-needs-install" && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="warn" size={15} />
          <span>{t(L, "rem.ios_install")}</span>
        </div>
      )}

      {/* Нагадування увімкнені, але живої підписки немає: немає ключів,
          підписка не вдалась або браузер не вміє push. Для людини це все
          один і той самий наслідок — працює лише з відкритою вкладкою,
          і краще сказати це прямо, ніж мовчки не спрацювати ввечері. */}
      {rem.on && granted && !livePush && ps !== null && ps !== "ios-needs-install" && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="warn" size={15} />
          <span>{t(L, "rem.tab_only")}</span>
        </div>
      )}

      {supported && perm === "denied" && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <Icon name="warn" size={15} />
          <span>{t(L, "rem.denied")}</span>
        </div>
      )}

      {supported && perm === "default" && (
        <div style={{ marginBottom: 16 }}>
          <button className="l3-btn l3-sm" onClick={() => !busy && void turnOn(rem.times)}>
            {busy ? "…" : t(L, "rem.allow")}
          </button>
          <div style={{ fontSize: 11.5, color: "var(--g-ink-3)", marginTop: 9, lineHeight: 1.5 }}>
            {t(L, "rem.allow_note")}
          </div>
        </div>
      )}

      <div
        className="l3-row"
        onClick={() => {
          if (busy) return;
          play("select");
          void (rem.on ? turnOff() : turnOn(rem.times));
        }}
      >
        <span className="l3-ico"><Icon name={rem.on ? "bell" : "bell-off"} size={20} /></span>
        <span className="l3-lab">
          {t(L, "rem.toggle")}
          <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
            {rem.on ? t(L, "rem.on") : t(L, "rem.off")}
          </span>
        </span>
        <span
          style={{
            width: 42,
            height: 24,
            borderRadius: 999,
            flex: "0 0 auto",
            background: rem.on ? "var(--g-green-dim)" : "rgba(0,0,0,.3)",
            border: "1px solid " + (rem.on ? "rgba(134,198,124,.5)" : "var(--g-line-soft)"),
            position: "relative",
            transition: "background .15s",
          }}
        >
          <span
            style={{
              position: "absolute",
              top: 2,
              left: rem.on ? 20 : 2,
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: rem.on ? "var(--g-green)" : "var(--g-ink-3)",
              transition: "left .15s",
            }}
          />
        </span>
      </div>

      {rem.on && (
        <>
          <div className="l3-section-title">{t(L, "rem.when")}</div>
          {PRESETS.map((p) => {
            const on = current === p.times.join(",");
            return (
              <div
                key={p.key}
                className="l3-row"
                style={on ? { background: "var(--g-green-dim)", borderColor: "rgba(134,198,124,.35)" } : undefined}
                onClick={() => pick(p.times)}
              >
                <span className="l3-ico"><Icon name={p.key === "morning" ? "sunrise" : p.key === "both" ? "reset" : "moon"} size={20} /></span>
                <span className="l3-lab">
                  {t(L, p.lk)}
                  <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>{t(L, p.nk)}</span>
                </span>
                {on && <span style={{ color: "var(--g-green)", fontSize: 16 }}>✓</span>}
              </div>
            );
          })}

          <div className="l3-section-title">{t(L, "rem.custom")}</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="time"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 14px",
                borderRadius: 12,
                outline: "none",
                fontFamily: "inherit",
                fontSize: 16,
                colorScheme: "dark",
                color: "var(--g-ink)",
                background: "rgba(0,0,0,.26)",
                border: "1px solid var(--g-line)",
              }}
            />
            <button className="l3-btn l3-sm l3-btn-soft" onClick={() => pick([custom])}>
              {t(L, "rem.set")}
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ───────────────────────── експорт / відновлення ───────────────────────── */

function ExportSheet({
  L,
  state,
  importState,
  back,
}: {
  L: Lang;
  state: GameState;
  importState: (raw: unknown) => { ok: boolean; error?: string };
  back: React.ReactNode;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const entries = (state.journal || []).reduce((a, d) => a + d.entries.length, 0);
  const runs = Object.values(state.questStats || {}).reduce((a, s) => a + s.runs, 0);

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const text = await f.text();
      const res = importState(JSON.parse(text));
      if (res.ok) {
        play("reward");
        setMsg({ ok: true, text: t(L, "exp.ok_restore") });
      } else {
        setMsg({ ok: false, text: res.error || t(L, "exp.err_read") });
      }
    } catch {
      setMsg({ ok: false, text: t(L, "exp.err_json") });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Sheet
      crumb={t(L, "exp.crumb")}
      title={t(L, "exp.title")}
      sub={t(L, "exp.sub")}
      foot={back}
      note={t(L, "exp.note")}
    >
      <div className="l3-row l3-static">
        <span className="l3-ico"><Icon name="box" size={20} /></span>
        <span className="l3-lab">
          {t(L, "exp.inside")}
          <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
            {t(L, "exp.inside_val", { entries, runs, xp: state.totalXp })}
          </span>
        </span>
      </div>

      <div className="l3-section-title">{t(L, "exp.sec_save")}</div>
      <Row
        icon="disk"
        label={t(L, "exp.full")}
        val=".json"
        onClick={() => {
          play("select");
          exportSave(state);
          setMsg({ ok: true, text: t(L, "exp.ok_save") });
        }}
      />
      <Row
        icon="book"
        label={t(L, "exp.journal")}
        val=".md"
        onClick={() => {
          play("select");
          exportJournal(state);
          setMsg({ ok: true, text: t(L, "exp.ok_journal") });
        }}
      />
      <Row
        icon="table"
        label={t(L, "exp.log")}
        val=".csv"
        onClick={() => {
          play("select");
          exportLogCsv(state);
          setMsg({ ok: true, text: t(L, "exp.ok_log") });
        }}
      />

      <div className="l3-section-title">{t(L, "exp.sec_restore")}</div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Row
        icon="import"
        label={t(L, "exp.restore")}
        val={t(L, "exp.restore_val")}
        onClick={() => {
          if (!confirm(t(L, "exp.restore_confirm"))) return;
          fileRef.current?.click();
        }}
      />

      {msg && (
        <div
          style={{
            marginTop: 14,
            fontSize: 12.5,
            lineHeight: 1.5,
            color: msg.ok ? "var(--g-green)" : "var(--g-rose)",
          }}
        >
          <Icon name={msg.ok ? "sprout" : "warn"} size={13} style={{ marginRight: 6 }} />
          {msg.text}
        </div>
      )}
    </Sheet>
  );
}

/* ───────────────────────── про гру ───────────────────────── */

function AboutSheet({ L, back }: { L: Lang; back: React.ReactNode }) {
  return (
    <Sheet
      crumb={t(L, "ab.crumb")}
      title={t(L, "ab.title")}
      sub={t(L, "ab.sub")}
      foot={back}
      note={t(L, "ab.note")}
    >
      <P>{t(L, "ab.p1")}</P>

      <div className="l3-section-title">{t(L, "ab.sec_how")}</div>
      <Row2 icon="bubble" title={t(L, "ab.h1")}>{t(L, "ab.d1")}</Row2>
      <Row2 icon="steps" title={t(L, "ab.h2")}>{t(L, "ab.d2")}</Row2>
      <Row2 icon="tree" title={t(L, "ab.h3")}>{t(L, "ab.d3")}</Row2>
      <Row2 icon="chart" title={t(L, "ab.h4")}>{t(L, "ab.d4")}</Row2>

      <div className="l3-section-title">{t(L, "ab.sec_not")}</div>
      <P>{t(L, "ab.p2")}</P>
      <P>{t(L, "ab.p3")}</P>

      <div className="l3-section-title">{t(L, "ab.sec_bits")}</div>
      <Row icon="gnome" label={t(L, "ab.bombom")} val={t(L, "ab.bombom_val")} />
      <Row icon="lock" label={t(L, "ab.data")} val={t(L, "ab.data_val")} />
      <Row icon="box" label={t(L, "ab.version")} val={t(L, "ab.version_val")} />
    </Sheet>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 13.5, lineHeight: 1.6, color: "var(--g-ink-2)", marginBottom: 12 }}>{children}</p>
  );
}

function Row2({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="l3-row l3-static" style={{ alignItems: "flex-start" }}>
      <span className="l3-ico" style={{ marginTop: 1 }}><Icon name={icon} size={20} /></span>
      <span className="l3-lab">
        {title}
        <span
          style={{
            display: "block",
            fontSize: 11.5,
            color: "var(--g-ink-3)",
            fontWeight: 400,
            marginTop: 3,
            lineHeight: 1.5,
          }}
        >
          {children}
        </span>
      </span>
    </div>
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
