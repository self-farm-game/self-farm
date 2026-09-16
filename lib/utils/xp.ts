// Tree growth from XP. The tree never withers — it only grows from returning.
// 6 visible stages match the 6 sprite frames (sprout → grand apple tree).

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

// Ten stages. XP per quest is ~8–24, so early stages come quickly and later
// ones stretch out. Tune targets freely — the sprite for a stage is stage N.
const LEVELS: { name: string; sub: string; target: number }[] = [
  { name: "Паросток", sub: "щойно з землі", target: 40 },
  { name: "Саджанець", sub: "тонкий стовбур", target: 90 },
  { name: "Молоде деревце", sub: "перше листя", target: 170 },
  { name: "Плідне дерево", sub: "перші яблука", target: 300 },
  { name: "Щедре дерево", sub: "стиглі яблука", target: 500 },
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
