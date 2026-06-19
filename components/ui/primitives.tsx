"use client";
import React from "react";

/* Wooden carved button (primary in-world action) */
export function WoodButton({
  children,
  big,
  bg,
  color,
  onClick,
}: {
  children: React.ReactNode;
  big?: boolean;
  bg?: string;
  color?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: "center",
        padding: big ? "17px 20px" : "14px 18px",
        borderRadius: 14,
        background: bg || "linear-gradient(180deg,#7a5128,#5a3618)",
        boxShadow:
          "inset 0 2px 0 rgba(255,220,160,.4), inset 0 -5px 0 rgba(0,0,0,.45), 0 0 0 2px #2a1a0e, 0 5px 0 rgba(0,0,0,.35)",
        color: color || "#ffe6b8",
        fontSize: big ? 20 : 17,
        fontWeight: 700,
        letterSpacing: ".5px",
        cursor: "pointer",
        userSelect: "none",
        textShadow: "0 2px 0 rgba(0,0,0,.35)",
      }}
    >
      {children}
    </div>
  );
}

/* Parchment button (the main "Як ти зараз?" CTA) */
export function ParchButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        textAlign: "center",
        padding: "15px 18px",
        borderRadius: 14,
        background: "linear-gradient(180deg,#e6cf9c,#cda874)",
        boxShadow:
          "inset 0 2px 0 rgba(255,250,225,.6), inset 0 -5px 0 rgba(120,86,48,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e, 0 5px 0 rgba(0,0,0,.3)",
        color: "#3a2616",
        fontSize: 17,
        fontWeight: 700,
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {children}
    </div>
  );
}

/* Tappable chip (state / energy / tension / filters) */
export function Chip({
  children,
  active,
  sm,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  sm?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: sm ? "8px 13px" : "10px 16px",
        borderRadius: 11,
        cursor: "pointer",
        userSelect: "none",
        fontSize: sm ? 13 : 15,
        fontWeight: 600,
        color: active ? "#fff3d6" : "#d8c8a0",
        background: active
          ? "linear-gradient(180deg,#7a5128,#5a3618)"
          : "linear-gradient(180deg,#3a2c52,#2c2042)",
        boxShadow: active
          ? "inset 0 2px 0 rgba(255,220,160,.4), inset 0 -3px 0 rgba(0,0,0,.4), 0 0 0 2px #caa24a, 0 3px 0 rgba(0,0,0,.3)"
          : "inset 0 1px 0 rgba(150,120,200,.2), inset 0 -2px 0 rgba(0,0,0,.35), 0 0 0 2px #4a3a6e",
      }}
    >
      {children}
    </div>
  );
}

/* Heart-medallion progress bar (XP / resonance) */
export function HeartBar({
  pct,
  fill,
}: {
  pct: string;
  fill?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", height: 30 }}>
      <div
        style={{
          width: 34,
          height: 34,
          flexShrink: 0,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          zIndex: 2,
          background: "radial-gradient(circle at 40% 35%, #8a5a36, #5a3a1f)",
          boxShadow:
            "inset 0 0 0 2px #caa24a, inset 0 0 0 4px #3a2410, 0 0 0 2px #2a1a0e",
        }}
      >
        ❤️
      </div>
      <div
        style={{
          flex: 1,
          height: 22,
          marginLeft: -6,
          borderRadius: 5,
          position: "relative",
          overflow: "hidden",
          background: "#3a2f5c",
          boxShadow: "inset 0 0 0 2px #caa24a, inset 0 2px 4px rgba(0,0,0,.5)",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: pct,
            background: fill || "linear-gradient(180deg,#d4506a,#b03a52)",
            boxShadow: "inset 0 2px 0 rgba(255,255,255,.25)",
            transition: "width .4s ease",
          }}
        />
      </div>
    </div>
  );
}

/* Pixel star field (deterministic) */
export function Stars({ n, seed, area }: { n: number; seed: number; area?: number }) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const items = [];
  for (let i = 0; i < n; i++) {
    const x = rnd() * 100;
    const y = rnd() * (area || 100);
    const sz = rnd() < 0.8 ? 2 : 3;
    const dur = 2 + rnd() * 3;
    const dl = rnd() * 3;
    const col = rnd() < 0.5 ? "#fff0c0" : "#cdbef0";
    items.push(
      <div
        key={i}
        style={{
          position: "absolute",
          left: x + "%",
          top: y + "%",
          width: sz,
          height: sz,
          background: col,
          borderRadius: "50%",
          animation: `sf-star ${dur}s ease-in-out ${dl}s infinite`,
        }}
      />,
    );
  }
  return <>{items}</>;
}

/* "← назад" row */
export function BackRow({ onClick }: { onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 7,
        cursor: "pointer",
        color: "#b9aecb",
        fontSize: 14,
        fontWeight: 600,
        padding: "6px 0",
      }}
    >
      <span style={{ fontSize: 18 }}>←</span> назад
    </div>
  );
}

/* Bombom parchment banner (a speaking line on a wooden-edged parchment) */
export function BombomBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        borderRadius: 16,
        padding: "14px 16px",
        background: "linear-gradient(180deg,#d8bf94,#c8a878)",
        boxShadow:
          "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e",
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
      }}
    >
      <span style={{ fontSize: 30 }}>🧙</span>
      <div
        style={{
          fontSize: 14,
          lineHeight: 1.45,
          color: "#4a3320",
          fontStyle: "italic",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ScreenTitle({
  title,
  sub,
}: {
  title: string;
  sub?: string;
}) {
  return (
    <>
      <div
        style={{
          fontSize: 30,
          color: "#f4ecd6",
          fontWeight: 700,
          textShadow: "0 3px 0 rgba(0,0,0,.35)",
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 13,
            color: "#a99fc8",
            fontStyle: "italic",
            marginBottom: 14,
          }}
        >
          {sub}
        </div>
      )}
    </>
  );
}
