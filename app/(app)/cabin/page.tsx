"use client";
/**
 * Хатина — профіль і налаштування. Спливає над садом, як і решта вкладок.
 */
import { useRef, useState } from "react";
import { useGame, type GameState } from "@/lib/store/game";
import { levelInfo } from "@/lib/utils/xp";
import { t, LANGS, type Lang } from "@/lib/mock-data/i18n";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import Sheet from "@/components/ui/Sheet";
import { play } from "@/lib/sound/sound";
import { exportSave, exportJournal, exportLogCsv } from "@/lib/utils/export";

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

type View = null | "lang" | "reminders" | "export" | "about";

export default function Cabin() {
  const { state, auth, toggleMute, reset, setLang, setReminders, importState } = useGame();
  const L = state.lang;
  const lvl = levelInfo(state.totalXp);
  const [view, setView] = useState<View>(null);

  const runs = Object.values(state.questStats || {}).reduce((a, s) => a + s.runs, 0);
  const helped = Object.values(state.questStats || {}).reduce((a, s) => a + s.helped, 0);
  const rem = state.reminders || { on: false, times: ["20:00"] };
  const back = (
    <button className="l3-btn l3-sm l3-btn-soft" onClick={() => setView(null)}>
      ← Назад
    </button>
  );

  /* ── мова ── */
  if (view === "lang") {
    return (
      <Sheet crumb="ХАТИНА / МОВА" title={t(L, "lang.title")} sub={t(L, "lang.sub")} foot={back}>
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

  /* ── нагадування ── */
  if (view === "reminders") {
    return <RemindersSheet rem={rem} setReminders={setReminders} back={back} />;
  }

  /* ── експорт ── */
  if (view === "export") {
    return <ExportSheet state={state} importState={importState} back={back} />;
  }

  /* ── про гру ── */
  if (view === "about") {
    return <AboutSheet back={back} />;
  }

  return (
    <Sheet crumb="ХАТИНА" title={t(L, "cabin.title")} sub={t(L, "cabin.sub")} note={t(L, "cabin.tagline")}>
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
        onClick={() => { play("select"); setView("lang"); }}
      />
      <Row
        icon="🔈"
        label={t(L, "cabin.sound")}
        val={state.muted ? t(L, "cabin.sound_off") : t(L, "cabin.sound_on")}
        onClick={() => { toggleMute(); if (state.muted) play("select"); }}
      />
      <Row
        icon="🔔"
        label={t(L, "cabin.reminders")}
        val={rem.on ? rem.times.join(" · ") : "вимкнені"}
        onClick={() => { play("select"); setView("reminders"); }}
      />
      <Row
        icon="📤"
        label={t(L, "cabin.export")}
        val="файл"
        onClick={() => { play("select"); setView("export"); }}
      />
      <Row
        icon="🌱"
        label={t(L, "cabin.about")}
        val="пре-бета"
        onClick={() => { play("select"); setView("about"); }}
      />
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

/* ───────────────────────── нагадування ───────────────────────── */

const PRESETS: { key: string; label: string; note: string; times: string[] }[] = [
  { key: "evening", label: "Увечері", note: "один раз, о 20:00", times: ["20:00"] },
  { key: "morning", label: "Зранку", note: "один раз, о 09:00", times: ["09:00"] },
  { key: "both", label: "Двічі", note: "зранку і ввечері", times: ["09:00", "20:00"] },
];

function RemindersSheet({
  rem,
  setReminders,
  back,
}: {
  rem: { on: boolean; times: string[] };
  setReminders: (r: { on: boolean; times: string[] }) => void;
  back: React.ReactNode;
}) {
  const [perm, setPerm] = useState<string>(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "unsupported",
  );
  const [custom, setCustom] = useState(rem.times[0] || "20:00");

  const supported = perm !== "unsupported";
  const granted = perm === "granted";
  const current = rem.times.join(",");

  const ask = async () => {
    if (!supported) return;
    try {
      const r = await Notification.requestPermission();
      setPerm(r);
      if (r === "granted") {
        play("reward");
        new Notification("Self-Farm", { body: "Домовились. Нагадаю тихо.", tag: "self-farm-test" });
      }
    } catch {
      setPerm("denied");
    }
  };

  const pick = (times: string[]) => {
    play("select");
    setReminders({ on: true, times });
  };

  return (
    <Sheet
      crumb="ХАТИНА / НАГАДУВАННЯ"
      title="Нагадування"
      sub="Одне тихе повідомлення, без наполягань. Пропустив — нічого не станеться."
      foot={back}
      note={
        granted
          ? "Сповіщення локальні: вони приходять, поки вкладка з грою відкрита (хай і у фоні). Закритий браузер нічого не надішле — справжній push зʼявиться разом із сервером."
          : undefined
      }
    >
      {!supported && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <span>⚠</span>
          <span>Цей браузер не вміє показувати сповіщення. Налаштування збережеться, але нагадування не прийде.</span>
        </div>
      )}

      {supported && perm === "denied" && (
        <div className="l3-warn" style={{ marginTop: 0, marginBottom: 14 }}>
          <span>⚠</span>
          <span>
            Сповіщення заблоковані для цього сайту. Дозволити можна в налаштуваннях браузера —
            іконка біля адреси сторінки.
          </span>
        </div>
      )}

      {supported && perm === "default" && (
        <div style={{ marginBottom: 16 }}>
          <button className="l3-btn l3-sm" onClick={ask}>
            Дозволити сповіщення
          </button>
          <div style={{ fontSize: 11.5, color: "var(--g-ink-3)", marginTop: 9, lineHeight: 1.5 }}>
            Без дозволу браузер не покаже нічого. Його можна забрати будь-коли.
          </div>
        </div>
      )}

      <div
        className="l3-row"
        onClick={() => {
          play("select");
          setReminders({ on: !rem.on, times: rem.times });
        }}
      >
        <span className="l3-ico">{rem.on ? "🔔" : "🔕"}</span>
        <span className="l3-lab">
          Нагадувати
          <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
            {rem.on ? "увімкнено" : "вимкнено"}
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
          <div className="l3-section-title">коли</div>
          {PRESETS.map((p) => {
            const on = current === p.times.join(",");
            return (
              <div
                key={p.key}
                className="l3-row"
                style={on ? { background: "var(--g-green-dim)", borderColor: "rgba(134,198,124,.35)" } : undefined}
                onClick={() => pick(p.times)}
              >
                <span className="l3-ico">{p.key === "morning" ? "🌅" : p.key === "both" ? "🔁" : "🌙"}</span>
                <span className="l3-lab">
                  {p.label}
                  <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>{p.note}</span>
                </span>
                {on && <span style={{ color: "var(--g-green)", fontSize: 16 }}>✓</span>}
              </div>
            );
          })}

          <div className="l3-section-title">свій час</div>
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
              Поставити
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}

/* ───────────────────────── експорт / відновлення ───────────────────────── */

function ExportSheet({
  state,
  importState,
  back,
}: {
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
        setMsg({ ok: true, text: "Відновлено. Сад уже на місці." });
      } else {
        setMsg({ ok: false, text: res.error || "Не вдалось прочитати файл." });
      }
    } catch {
      setMsg({ ok: false, text: "Файл пошкоджений або це не JSON." });
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <Sheet
      crumb="ХАТИНА / ДАНІ"
      title="Експорт даних"
      sub="Усе робиться у твоєму браузері. Нічого нікуди не надсилається."
      foot={back}
      note="Файл збереження містить журнал і статистику. Якщо ділишся ним — пам'ятай, що там твої записи."
    >
      <div className="l3-row l3-static">
        <span className="l3-ico">📦</span>
        <span className="l3-lab">
          Що всередині
          <span style={{ display: "block", fontSize: 11, color: "var(--g-ink-3)", fontWeight: 400 }}>
            {entries} записів у журналі · {runs} проходжень · {state.totalXp} XP
          </span>
        </span>
      </div>

      <div className="l3-section-title">зберегти</div>
      <Row
        icon="💾"
        label="Повне збереження"
        val=".json"
        onClick={() => {
          play("select");
          exportSave(state);
          setMsg({ ok: true, text: "Файл пішов у «Завантаження»." });
        }}
      />
      <Row
        icon="📖"
        label="Журнал текстом"
        val=".md"
        onClick={() => {
          play("select");
          exportJournal(state);
          setMsg({ ok: true, text: "Журнал збережено." });
        }}
      />
      <Row
        icon="📊"
        label="Лог проходжень"
        val=".csv"
        onClick={() => {
          play("select");
          exportLogCsv(state);
          setMsg({ ok: true, text: "Таблиця збережена." });
        }}
      />

      <div className="l3-section-title">відновити</div>
      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: "none" }}
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      <Row
        icon="📥"
        label="Відновити з файлу"
        val="замінить поточний прогрес"
        onClick={() => {
          if (!confirm("Поточний сад буде замінено даними з файлу. Продовжити?")) return;
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
          {msg.ok ? "✓ " : "⚠ "}
          {msg.text}
        </div>
      )}
    </Sheet>
  );
}

/* ───────────────────────── про гру ───────────────────────── */

function AboutSheet({ back }: { back: React.ReactNode }) {
  return (
    <Sheet
      crumb="ХАТИНА / ПРО ГРУ"
      title="Про Self-Farm"
      sub="Одне дерево. Один рух. Маленька гра про повернення до себе."
      foot={back}
      note="Пре-бета · тексти стежок ще проходять вичитку"
    >
      <P>
        Ти помічаєш, як тобі зараз. Береш одну крихітну справу в реальному світі.
        Повертаєшся й кажеш, чи стало інакше. З цих повернень росте одне дерево —
        не з того, що тобі добре, а з того, що ти прийшов.
      </P>

      <div className="l3-section-title">як це влаштовано</div>
      <Row2 icon="🫧" title="Чек-ін — один дотик">
        Жодних шкал і щоденників. Обрав стан — отримав три стежки під нього.
      </Row2>
      <Row2 icon="👣" title="Стежка — крок за кроком">
        Один крок на екран. Наприкінці коротка перевірка й питання, чи допомогло.
      </Row2>
      <Row2 icon="🌳" title="Дерево росте від повернень">
        Шість стадій. Пропущені дні нічого не забирають — дерево не вʼяне.
      </Row2>
      <Row2 icon="📊" title="Гра вчиться на твоїх відповідях">
        Те, що допомагало, трапляється частіше. Те, що не підійшло, — рідше.
        Нічого не блокується назавжди.
      </Row2>

      <div className="l3-section-title">чим це не є</div>
      <P>
        Self-Farm — не терапія, не лікування і не заміна фахівцю. Тут немає
        діагнозів, оцінок і «правильного» стану. Це гра, яка допомагає помітити
        себе й зробити маленький рух.
      </P>
      <P>
        Якщо зараз справді важко й це триває — варто поговорити з живою людиною:
        з тим, кому довіряєш, або з фахівцем. Дерево почекає.
      </P>

      <div className="l3-section-title">дрібниці</div>
      <Row icon="🧙" label="Бомбом" val="живе в хатинці на острові" />
      <Row icon="🔒" label="Дані" val="локально + твій акаунт" />
      <Row icon="📦" label="Версія" val="пре-бета · 0.1" />
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
      <span className="l3-ico" style={{ marginTop: 1 }}>{icon}</span>
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
