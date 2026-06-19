// Runes — the game-like progress / skill-tree shown under the tree roots.
// This is the CATALOG (names/symbols/colors). Actual unlock state + progress is
// computed from the player's real activity in the Runes page. On a fresh start
// everything is locked and grows with use.

export interface RuneNode {
  id: string;
  sym: string;
  name: string;
}

export interface RuneBranch {
  name: string;
  color: string;
  runes: RuneNode[];
}

export const RUNE_BRANCHES: RuneBranch[] = [
  {
    name: "Стани",
    color: "#d4506a",
    runes: [
      { id: "noise", sym: "ᚾ", name: "Руна Шуму" },
      { id: "swamp", sym: "ᛒ", name: "Руна Болота" },
      { id: "fire", sym: "ᚠ", name: "Руна Вогню" },
      { id: "silence", sym: "ᛋ", name: "Руна Тиші" },
    ],
  },
  {
    name: "Дії",
    color: "#7bbf5a",
    runes: [
      { id: "move", sym: "ᛗ", name: "Руна Руху" },
      { id: "water", sym: "ᛚ", name: "Руна Води" },
      { id: "order", sym: "ᛟ", name: "Руна Ладу" },
      { id: "air", sym: "ᛇ", name: "Руна Повітря" },
    ],
  },
  {
    name: "Повернення",
    color: "#a98bff",
    runes: [
      { id: "sprout", sym: "🌱", name: "Перший Паросток" },
      { id: "return", sym: "ᚱ", name: "Руна Повернення" },
      { id: "notmonday", sym: "ᛞ", name: "Не з Понеділка" },
      { id: "afterpit", sym: "ᚷ", name: "Після Прірви" },
    ],
  },
  {
    name: "Ясність",
    color: "#5ec8d8",
    runes: [
      { id: "words", sym: "ᚹ", name: "Руна Слів" },
      { id: "trace", sym: "ᛏ", name: "Руна Сліду" },
      { id: "mirror", sym: "ᛘ", name: "Руна Дзеркала" },
      { id: "clarity", sym: "ᛜ", name: "Руна Ясності" },
    ],
  },
];
