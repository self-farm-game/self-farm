"use client";
import { useState } from "react";
import { QUESTBOOK, QUESTBOOK_CATEGORIES } from "@/lib/mock-data/quests";
import { Chip, ScreenTitle } from "@/components/ui/primitives";
import { play } from "@/lib/sound/sound";

export default function Questbook() {
  const [cat, setCat] = useState("Усі");

  return (
    <div className="sf-screen" style={{ padding: "52px 16px 18px", minHeight: "100%" }}>
      <ScreenTitle title="Книга квестів" sub="бібліотека стежок, не обов'язки" />

      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 }}>
        {QUESTBOOK_CATEGORIES.map((c) => (
          <Chip key={c} sm active={c === cat} onClick={() => { play("tap"); setCat(c); }}>
            {c}
          </Chip>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        {QUESTBOOK.map((qq, i) => (
          <div
            key={i}
            style={{
              borderRadius: 14,
              padding: "13px 15px",
              display: "flex",
              gap: 12,
              alignItems: "center",
              opacity: qq.locked ? 0.62 : 1,
              background: qq.locked
                ? "linear-gradient(180deg,#2c2645,#241d3a)"
                : "linear-gradient(180deg,#d8bf94,#c8a878)",
              boxShadow: qq.locked
                ? "0 0 0 2px #4a3a6e, inset 0 0 20px rgba(0,0,0,.3)"
                : "inset 0 2px 0 rgba(255,245,220,.5), 0 0 0 3px #6a4a2c, 0 0 0 5px #2a1a0e",
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                flexShrink: 0,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                background: qq.locked ? "rgba(0,0,0,.25)" : "radial-gradient(circle,#efe0bd,#c9a878)",
                boxShadow: qq.locked ? "none" : "inset 0 0 0 2px #6a4a2c",
              }}
            >
              {qq.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 16, color: qq.locked ? "#cfc4e6" : "#3a2616", fontWeight: 700, lineHeight: 1.1 }}>{qq.title}</div>
              <div style={{ fontSize: 12, color: qq.locked ? "#8a7fb0" : "#7a5836", marginTop: 3 }}>
                {qq.locked ? qq.meta : qq.for ? "для: " + qq.for : ""}
              </div>
              {!qq.locked && <div style={{ fontSize: 11, color: "#5a3f24", marginTop: 4 }}>{qq.meta}</div>}
            </div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "6px 11px",
                borderRadius: 8,
                color: qq.locked ? "#8a7fb0" : "#ffe6b8",
                background: qq.locked ? "rgba(0,0,0,.25)" : "linear-gradient(180deg,#7a5128,#5a3618)",
                boxShadow: qq.locked ? "none" : "inset 0 1px 0 rgba(255,220,160,.3), 0 0 0 2px #2a1a0e",
              }}
            >
              {qq.locked ? "🔒" : "Відкрити"}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 16,
          borderRadius: 14,
          padding: 16,
          textAlign: "center",
          background: "repeating-linear-gradient(45deg,#2c2150 0 10px,#2a1f4d 10px 20px)",
          boxShadow: "0 0 0 2px #4a3a6e, inset 0 0 30px rgba(0,0,0,.4)",
        }}
      >
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#9a8fc0", textTransform: "uppercase" }}>набір квестів</div>
        <div style={{ fontSize: 19, color: "#cfc4e6", fontWeight: 700, marginTop: 3 }}>Тривожний ліс</div>
        <div style={{ fontSize: 12, color: "#8a7fb0", marginTop: 3 }}>🔒 скоро</div>
      </div>
    </div>
  );
}
