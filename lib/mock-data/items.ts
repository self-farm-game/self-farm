// Items — atmospheric rewards found via quests. Not an RPG system yet.

export interface MockItem {
  icon: string;
  name: string;
  rar: string; // rarity label (uk)
  rc: string; // rarity color
  desc: string;
  locked?: boolean;
}

export const ITEMS: MockItem[] = [
  { icon: "🪨", name: "Малий Камінь", rar: "звичайне", rc: "#9a8c70", desc: "Тримає край стежки." },
  { icon: "🔘", name: "Стара Ґудзик", rar: "звичайне", rc: "#9a8c70", desc: "Випав у того, хто тікав із печери." },
  { icon: "🧵", name: "Синя Нитка", rar: "рідкісне", rc: "#7a5ad8", desc: "Ще трохи гуде, але вже тихо." },
  { icon: "🍵", name: "Чаша з Моху", rar: "звичайне", rc: "#9a8c70", desc: "Тримає вологу для коріння." },
  { icon: "🍄", name: "Синій Гриб", rar: "рідкісне", rc: "#7a5ad8", desc: "Світиться, коли поряд тиша." },
  { icon: "🗝️", name: "Іржавий Ключ", rar: "рідкісне", rc: "#7a5ad8", desc: "Не знає, від чого. Поки що." },
  { icon: "🪶", name: "Пір'їна", rar: "звичайне", rc: "#9a8c70", desc: "Легша за вчорашній день." },
  { icon: "❔", name: "Порожнє місце", rar: "locked", rc: "#4a3a6e", desc: "", locked: true },
];

// pool used for random drops on quest completion
export const DROP_POOL = ITEMS.filter((i) => !i.locked);
