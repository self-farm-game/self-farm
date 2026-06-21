"use client";
import React from "react";

const P = 8; // pixel block size
const GROUND = 150;

const LEAF = "#5e9e3f";
const LEAF_HI = "#84c45c";
const LEAF_SH = "#3f6a2a";
const BARK = "#7a5128";
const BARK_SH = "#5a3618";

function hash(x: number, y: number) {
  const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return s - Math.floor(s);
}

function blocks(cx: number, cy: number, rx: number, ry: number) {
  const cx0 = Math.round(cx / P) * P;
  const cy0 = Math.round(cy / P) * P;
  const out: React.ReactNode[] = [];
  for (let gx = cx0 - Math.ceil(rx / P) * P; gx <= cx0 + rx; gx += P) {
    for (let gy = cy0 - Math.ceil(ry / P) * P; gy <= cy0 + ry; gy += P) {
      const dx = (gx + P / 2 - cx) / rx;
      const dy = (gy + P / 2 - cy) / ry;
      if (dx * dx + dy * dy > 1) continue;
      const ny = dy;
      let fill = LEAF;
      if (ny > 0.45) fill = LEAF_SH;
      else if (ny < -0.1 && hash(gx, gy) > 0.62) fill = LEAF_HI;
      out.push(<rect key={`c${gx}_${gy}`} x={gx} y={gy} width={P} height={P} fill={fill} />);
    }
  }
  return out;
}

function trunk(w: number, h: number) {
  const x0 = Math.round((80 - w / 2) / P) * P;
  const out: React.ReactNode[] = [];
  for (let gx = x0; gx < x0 + w; gx += P) {
    for (let gy = GROUND - h; gy < GROUND; gy += P) {
      const fill = gx >= x0 + w - P ? BARK_SH : BARK;
      out.push(<rect key={`t${gx}_${gy}`} x={gx} y={gy} width={P} height={P} fill={fill} />);
    }
  }
  return out;
}

function branch(fromX: number, fromY: number, dir: number, len: number) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < len; i++) {
    out.push(
      <rect key={`b${dir}_${i}`} x={fromX + dir * (i + 1) * P} y={fromY - i * P} width={P} height={P} fill={BARK_SH} />,
    );
  }
  return out;
}

export default function TreeStages({ stage, pct = 0 }: { stage: number; pct?: number }) {
  const s = Math.min(6, Math.max(1, stage));
  // small continuous growth within a stage
  const grow = 1 + Math.min(0.06, pct * 0.06);

  let body: React.ReactNode = null;

  if (s === 1) {
    // acorn in a little mound
    body = (
      <g>
        <rect x={72} y={GROUND - 8} width={16} height={8} fill="#8a6a44" />
        <rect x={76} y={GROUND - 22} width={8} height={6} fill="#caa24a" />
        <rect x={74} y={GROUND - 18} width={12} height={10} fill="#a9772f" />
        <rect x={74} y={GROUND - 22} width={3} height={4} fill="#6a4a2c" />
        <rect x={83} y={GROUND - 22} width={3} height={4} fill="#6a4a2c" />
        <rect x={78} y={GROUND - 28} width={4} height={6} fill="#7a5836" />
      </g>
    );
  } else if (s === 2) {
    // sprout: short stem + two leaves
    body = (
      <g>
        <rect x={72} y={GROUND - 6} width={16} height={6} fill="#8a6a44" />
        <rect x={77} y={GROUND - 34} width={6} height={28} fill="#6aa83f" />
        {blocks(64, GROUND - 34, 14, 11)}
        {blocks(96, GROUND - 30, 14, 11)}
        <rect x={77} y={GROUND - 40} width={6} height={8} fill="#6aa83f" />
      </g>
    );
  } else {
    const cfg = {
      3: { tw: 8, th: 26, cx: 80, cy: 96, rx: 22, ry: 19, br: false },
      4: { tw: 16, th: 42, cx: 80, cy: 78, rx: 32, ry: 27, br: true },
      5: { tw: 18, th: 54, cx: 80, cy: 62, rx: 42, ry: 35, br: true },
      6: { tw: 24, th: 62, cx: 80, cy: 50, rx: 52, ry: 43, br: true },
    }[s as 3 | 4 | 5 | 6]!;

    const trunkTopY = GROUND - cfg.th;
    body = (
      <g>
        {trunk(cfg.tw, cfg.th)}
        {cfg.br && branch(80 - cfg.tw / 2, trunkTopY + 18, -1, 3)}
        {cfg.br && branch(80 + cfg.tw / 2 - P, trunkTopY + 26, 1, 3)}
        {/* dark backing for a soft outline */}
        <g opacity={0.9}>{blocks(cfg.cx, cfg.cy, cfg.rx + 3, cfg.ry + 3).map((r, i) => React.cloneElement(r as any, { key: "o" + i, fill: LEAF_SH }))}</g>
        {blocks(cfg.cx, cfg.cy, cfg.rx, cfg.ry)}
        {/* highlight cap */}
        {blocks(cfg.cx - cfg.rx * 0.25, cfg.cy - cfg.ry * 0.4, cfg.rx * 0.5, cfg.ry * 0.35).map((r, i) =>
          React.cloneElement(r as any, { key: "h" + i, fill: LEAF_HI }),
        )}
        {/* grand oak: blossoms + fruit */}
        {s === 6 && (
          <g>
            <rect x={56} y={36} width={P} height={P} fill="#e8b7c4" />
            <rect x={104} y={52} width={P} height={P} fill="#e8b7c4" />
            <rect x={88} y={28} width={P} height={P} fill="#f0c96b" />
            <rect x={64} y={64} width={P} height={P} fill="#c97f3a" />
          </g>
        )}
      </g>
    );
  }

  return (
    <svg viewBox="0 0 160 156" width={236} height={230} style={{ overflow: "visible", filter: "drop-shadow(0 6px 5px rgba(0,0,0,.4))" }}>
      <g style={{ transformOrigin: "80px 150px", transform: `scale(${grow})` }}>
        <g className="sf-treesway" style={{ transformOrigin: "80px 150px" }}>
          {body}
        </g>
      </g>
    </svg>
  );
}
