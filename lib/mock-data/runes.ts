// Runes — the game-like progress / skill-tree shown under the tree roots.
// This is the CATALOG (names/symbols/colors). Actual unlock state + progress is
// computed from the player's real activity in the Runes page. On a fresh start
// everything is locked and grows with use.

export interface RuneNode {
  id: string;
  sym: string;
  name: string;
  nameEn: string;
}

export interface RuneBranch {
  name: string;
  nameEn: string;
  color: string;
  runes: RuneNode[];
}

export const RUNE_BRANCHES: RuneBranch[] = [
  {
    name: "Стани",
    nameEn: "States",
    color: "#d4506a",
    runes: [
      { id: "noise", sym: "ᚾ", name: "Руна Шуму", nameEn: "Rune of Noise" },
      { id: "swamp", sym: "ᛒ", name: "Руна Болота", nameEn: "Rune of the Swamp" },
      { id: "fire", sym: "ᚠ", name: "Руна Вогню", nameEn: "Rune of Fire" },
      { id: "silence", sym: "ᛋ", name: "Руна Тиші", nameEn: "Rune of Silence" },
    ],
  },
  {
    name: "Дії",
    nameEn: "Actions",
    color: "#7bbf5a",
    runes: [
      { id: "move", sym: "ᛗ", name: "Руна Руху", nameEn: "Rune of Motion" },
      { id: "water", sym: "ᛚ", name: "Руна Води", nameEn: "Rune of Water" },
      { id: "order", sym: "ᛟ", name: "Руна Ладу", nameEn: "Rune of Order" },
      { id: "air", sym: "ᛇ", name: "Руна Повітря", nameEn: "Rune of Air" },
    ],
  },
  {
    name: "Повернення",
    nameEn: "Returning",
    color: "#a98bff",
    runes: [
      { id: "sprout", sym: "🌱", name: "Перший Паросток", nameEn: "First Sprout" },
      { id: "return", sym: "ᚱ", name: "Руна Повернення", nameEn: "Rune of Return" },
      { id: "notmonday", sym: "ᛞ", name: "Не з Понеділка", nameEn: "Not From Monday" },
      { id: "afterpit", sym: "ᚷ", name: "Після Прірви", nameEn: "After the Pit" },
    ],
  },
  {
    name: "Ясність",
    nameEn: "Clarity",
    color: "#5ec8d8",
    runes: [
      { id: "words", sym: "ᚹ", name: "Руна Слів", nameEn: "Rune of Words" },
      { id: "trace", sym: "ᛏ", name: "Руна Сліду", nameEn: "Rune of the Trace" },
      { id: "mirror", sym: "ᛘ", name: "Руна Дзеркала", nameEn: "Rune of the Mirror" },
      { id: "clarity", sym: "ᛜ", name: "Руна Ясності", nameEn: "Rune of Clarity" },
    ],
  },
];
