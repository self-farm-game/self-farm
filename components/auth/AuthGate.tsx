"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/game";
import { Stars, WoodButton } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

export default function AuthGate() {
  const { signUp, signIn } = useGame();
  const [mode, setMode] = useState<"up" | "in">("up");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const input: React.CSSProperties = {
    width: "100%",
    padding: "13px 14px",
    borderRadius: 12,
    border: "none",
    outline: "none",
    fontFamily: "inherit",
    fontSize: 16,
    color: "#3a2616",
    background: "linear-gradient(180deg,#e6cf9c,#cda874)",
    boxShadow: "inset 0 2px 4px rgba(120,86,48,.4), 0 0 0 3px #6a4a2c",
  };

  const submit = async () => {
    setErr(null);
    setMsg(null);
    if (!email.trim() || password.length < 6) {
      setErr("Введи пошту і пароль (мінімум 6 символів).");
      return;
    }
    setBusy(true);
    const res = mode === "up" ? await signUp(email, password) : await signIn(email, password);
    setBusy(false);
    if (res.error) {
      if (mode === "up" && res.error.startsWith("Акаунт створено")) {
        setMsg(res.error);
        setMode("in");
      } else {
        setErr(res.error);
      }
    } else {
      play("complete");
    }
  };

  return (
    <div className="sf-screen" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", background: "linear-gradient(180deg,#1a1226,#2a1d3e)" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(120% 80% at 50% 16%, rgba(120,90,180,.2), transparent 60%)" }} />
      <div style={{ position: "absolute", inset: 0 }}>
        <Stars n={40} seed={7} />
      </div>

      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "28px 26px", width: "100%", maxWidth: 460, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 26 }}>
          <div style={{ fontSize: 60, marginBottom: 10, animation: "sf-float 5s ease-in-out infinite" }}>🌳</div>
          <div style={{ fontSize: 30, color: "#f4ecd6", fontWeight: 700, textShadow: "0 3px 0 rgba(0,0,0,.35)" }}>Self-Farm</div>
          <div style={{ fontSize: 13.5, color: "#b9aecb", fontStyle: "italic", marginTop: 8, lineHeight: 1.5, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>
            Поле чекає. Щоб твоє дерево росло й памʼяталось — заведи акаунт.
          </div>
        </div>

        {/* mode toggle */}
        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          {(["up", "in"] as const).map((m) => (
            <div
              key={m}
              onClick={() => {
                play("tap");
                setMode(m);
                setErr(null);
                setMsg(null);
              }}
              style={{
                flex: 1,
                textAlign: "center",
                padding: "10px",
                borderRadius: 11,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 14,
                color: mode === m ? "#2a1d10" : "#cfc4e6",
                background: mode === m ? "linear-gradient(180deg,#e6cf9c,#cda874)" : "linear-gradient(180deg,#3a2c52,#2c2042)",
                boxShadow: mode === m ? "0 0 0 2px #6a4a2c" : "0 0 0 2px #4a3a6e",
              }}
            >
              {m === "up" ? "Реєстрація" : "Вхід"}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <input style={input} type="email" inputMode="email" autoComplete="email" placeholder="пошта" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input
            style={input}
            type="password"
            autoComplete={mode === "up" ? "new-password" : "current-password"}
            placeholder="пароль (мінімум 6)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>

        {err && <div style={{ fontSize: 13, color: "#e8a0a0", marginTop: 12, textAlign: "center" }}>{err}</div>}
        {msg && <div style={{ fontSize: 13, color: "#b9d99a", marginTop: 12, textAlign: "center" }}>{msg}</div>}

        <div style={{ marginTop: 18 }}>
          <WoodButton big onClick={() => !busy && submit()}>
            {busy ? "…" : mode === "up" ? "🌱  Створити акаунт" : "Увійти"}
          </WoodButton>
        </div>

        <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "#7d7298", lineHeight: 1.5 }}>
          {mode === "up" ? "Уже маєш акаунт? Тисни «Вхід»." : "Ще нема акаунта? Тисни «Реєстрація»."}
        </div>
      </div>
    </div>
  );
}
