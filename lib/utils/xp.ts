// Tree growth from XP. The tree never withers from inactivity — it only grows
// from returning and trying. Growth is staged: acorn → grand oak (6 stages).

export interface LevelInfo {
  levelNum: number; // 1..6 — also the visual tree stage
  name: string;
  sub: string;
  inLevel: number;
  target: number;
  pct: number; // 0..1 within current stage
  total: number;
  isMax: boolean;
}

// Six visible growth stages. XP per quest is ~8–12, so stages are reachable in
// a handful of sessions early on and stretch out later.
const LEVELS: { name: string; sub: string; target: number }[] = [
  { name: "Жолудь", sub: "щойно в землі", target: 40 },
  { name: "Паросток", sub: "перші два листки", target: 80 },
  { name: "Саджанець", sub: "тонкий стовбур", target: 160 },
  { name: "Молодий дуб", sub: "набирає силу", target: 280 },
  { name: "Дуб", sub: "тримає землю", target: 440 },
  { name: "Віковий дуб", sub: "памʼятає все", target: Infinity },
];

export function levelInfo(totalXp: number): LevelInfo {
  let lvl = 0;
  let rem = Math.max(0, totalXp);
  while (lvl < LEVELS.length - 1 && rem >= LEVELS[lvl].target) {
    rem -= LEVELS[lvl].target;
    lvl++;
  }
  const target = LEVELS[lvl].target;
  const finite = isFinite(target);
  return {
    levelNum: lvl + 1,
    name: LEVELS[lvl].name,
    sub: LEVELS[lvl].sub,
    inLevel: rem,
    target: finite ? target : rem,
    pct: finite ? Math.min(1, rem / target) : 1,
    total: totalXp,
    isMax: !finite,
  };
}

export const STAGE_COUNT = LEVELS.length;
