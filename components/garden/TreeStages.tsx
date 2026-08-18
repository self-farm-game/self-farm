"use client";
import { useState } from "react";
import { useGame } from "@/lib/store/game";
import { unlockedRunes, runeById } from "@/lib/utils/runes";
import { play } from "@/lib/sound/sound";
import { t } from "@/lib/mock-data/i18n";

// The hollow appears from stage 5. Per-stage centre (fraction of the sprite box)
// since the trunk shifts a little as the tree grows.
const HOLLOW_FROM_STAGE = 5;
const HOLLOW_BY_STAGE: Record<number, { x: number; y: number }> = {
  5: { x: 0.42, y: 0.74 },
  6: { x: 0.44, y: 0.76 },
  7: { x: 0.42, y: 0.72 },
  8: { x: 0.42, y: 0.72 },
  9: { x: 0.42, y: 0.72 },
  10: { x: 0.42, y: 0.72 },
};

export default function TreeStages({ stage, pct = 0 }: { stage: number; pct?: number }) {
  const s = Math.min(10, Math.max(1, Math.round(stage)));
  const { state, placeHollowRune } = useGame();
  const lang = state.lang;
  const [open, setOpen] = useState(false);

  const hasHollow = s >= HOLLOW_FROM_STAGE;
  const HOLLOW = HOLLOW_BY_STAGE[s] || { x: 0.42, y: 0.66 };
  const runes = unlockedRunes(state);
  const placed = runeById(state.hollowRune);

  return (
    <div style={{ position: "relative", height: "100%", width: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
      <div style={{ position: "relative", height: "100%" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/assets/sprites/tree/stage-${s}.png`}
          alt="дерево"
          className="sf-treesway"
          style={{ height: "100%", width: "auto", display: "block", imageRendering: "pixelated", filter: "drop-shadow(0 8px 6px rgba(0,0,0,.45))" }}
        />

        {/* hidden hollow hotspot — no visible button, just a tappable area */}
        {hasHollow && (
          <div
            onClick={() => {
              play("select");
              setOpen((o) => !o);
            }}
            title=""
            style={{
              position: "absolute",
              left: `calc(${HOLLOW.x * 100}% - 25px)`,
              top: `calc(${HOLLOW.y * 100}% - 29px)`,
              width: 50,
              height: 58,
              borderRadius: "50%",
              cursor: "pointer",
              // invisible by default; the placed rune glows faintly inside the hollow
              background: "transparent",
            }}
          >
            {placed && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  color: "#cdbef0",
                  textShadow: "0 0 8px rgba(170,140,255,.9), 0 0 3px rgba(170,140,255,.9)",
                  animation: "sf-glow 3s ease-in-out infinite",
                }}
              >
                {placed.sym}
              </div>
            )}
          </div>
        )}
      </div>

      {/* the rune-placing panel, opened by tapping the hollow */}
      {open && hasHollow && (
        <div
          onClick={() => setOpen(false)}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(10,8,20,.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 320, borderRadius: 18, padding: 18, background: "linear-gradient(180deg,#2c2150,#1c1530)", boxShadow: "0 0 0 2px #4a3a6e, 0 10px 30px rgba(0,0,0,.5)" }}
          >
            <div style={{ fontSize: 16, color: "#f4ecd6", fontWeight: 700 }}>{t(lang, "hollow.title")}</div>
            <div style={{ fontSize: 12.5, color: "#a99fc8", marginTop: 4, marginBottom: 14, lineHeight: 1.4 }}>
              {t(lang, "hollow.desc")}
            </div>

            {runes.length === 0 ? (
              <div style={{ fontSize: 13, color: "#8a7fb0", textAlign: "center", padding: "10px 0" }}>
                {t(lang, "hollow.empty")}
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                {runes.map((r) => {
                  const on = state.hollowRune === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => {
                        play(on ? "select" : "reward");
                        placeHollowRune(on ? null : r.id);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        width: 60,
                        padding: "9px 4px",
                        borderRadius: 12,
                        cursor: "pointer",
                        background: on ? "radial-gradient(circle,#5a4a8a,#332658)" : "rgba(60,48,86,.5)",
                        boxShadow: on ? "0 0 12px rgba(150,110,220,.6), inset 0 0 0 2px #7a6ab0" : "inset 0 0 0 2px rgba(150,120,200,.3)",
                      }}
                    >
                      <div style={{ fontSize: 22, color: on ? "#fff" : "#cdbef0" }}>{r.sym}</div>
                      <div style={{ fontSize: 8.5, color: on ? "#e8dcc4" : "#9a8fc0", textAlign: "center", lineHeight: 1.1 }}>{r.name}</div>
                    </div>
                  );
                })}
              </div>
            )}

            {placed && (
              <div
                onClick={() => {
                  play("select");
                  placeHollowRune(null);
                }}
                style={{ marginTop: 14, textAlign: "center", fontSize: 12.5, color: "#c9a878", cursor: "pointer", textDecoration: "underline" }}
              >
                {t(lang, "hollow.remove")}
              </div>
            )}
            <div onClick={() => setOpen(false)} style={{ marginTop: 12, textAlign: "center", fontSize: 13, color: "#8a7fb0", cursor: "pointer" }}>
              {t(lang, "hollow.close")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
