// Tree growth from XP. The tree never withers from inactivity — it only grows
// from returning and trying (see requirements UX rules 8–11).

export interface LevelInfo {
  levelNum: number;
  name: string;
  sub: string;
  inLevel: number;
  target: number;
  pct: number; // 0..1 within current level
  total: number;
}

const LEVELS: { name: string; sub: string; target: number }[] = [
  { name: "Жолудь", sub: "щойно в землі", target: 60 },
  { name: "Паросток", sub: "молоде дерево", target: 200 },
  { name: "Молодий дуб", sub: "набирає силу", target: 300 },
  { name: "Дуб з корінням", sub: "тримає землю", target: 500 },
  { name: "Старий дуб", sub: "пам'ятає все", target: Infinity },
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
  };
}
