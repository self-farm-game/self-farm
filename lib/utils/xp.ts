// Tree growth from XP. The tree never withers — it only grows from returning.
// 10 visible stages match the 10 sprite frames (acorn → grand apple oak).

export interface LevelInfo {
  levelNum: number; // 1..10 — also the visual tree stage
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
  { name: "Жолудь", sub: "щойно в землі", target: 30 },
  { name: "Паросток", sub: "перші два листки", target: 60 },
  { name: "Саджанець", sub: "тонкий стовбур", target: 110 },
  { name: "Молодий дуб", sub: "перші гілки", target: 180 },
  { name: "Квітучий дуб", sub: "зацвів уперше", target: 280 },
  { name: "Дуб із дуплом", sub: "зʼявилось дупло", target: 400 },
  { name: "Плідний дуб", sub: "перші зелені яблука", target: 560 },
  { name: "Щедрий дуб", sub: "яблука наливаються", target: 760 },
  { name: "Червоний дуб", sub: "стиглі яблука", target: 1020 },
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
