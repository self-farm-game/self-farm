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
type LevelDef = { name: string; sub: string; nameEn: string; subEn: string; target: number };

const LEVELS: LevelDef[] = [
  { name: "Паросток", sub: "щойно з землі", nameEn: "Sprout", subEn: "just out of the ground", target: 40 },
  { name: "Саджанець", sub: "тонкий стовбур", nameEn: "Seedling", subEn: "a thin stem", target: 90 },
  { name: "Молоде деревце", sub: "перше листя", nameEn: "Young tree", subEn: "its first leaves", target: 170 },
  { name: "Плідне дерево", sub: "перші яблука", nameEn: "Bearing tree", subEn: "its first apples", target: 300 },
  { name: "Щедре дерево", sub: "стиглі яблука", nameEn: "Generous tree", subEn: "ripe apples", target: 500 },
  { name: "Віковий дуб", sub: "памʼятає все", nameEn: "Ancient oak", subEn: "remembers everything", target: Infinity },
];

/** `en` switches the stage name; the numbers are the same in every language. */
export function levelInfo(totalXp: number, lang?: string): LevelInfo {
  const en = lang === "en";
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
    name: en ? LEVELS[lvl].nameEn : LEVELS[lvl].name,
    sub: en ? LEVELS[lvl].subEn : LEVELS[lvl].sub,
    inLevel: rem,
    target: finite ? target : rem,
    pct: finite ? Math.min(1, rem / target) : 1,
    total: totalXp,
    isMax: !finite,
  };
}

export const STAGE_COUNT = LEVELS.length;
