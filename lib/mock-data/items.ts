// Items — atmospheric rewards found via quests. Not an RPG system yet.

export interface MockItem {
  icon: string;
  /** Ukrainian name. This is also what gets stored in state.ownedItems, so it
   *  must never change once shipped — the English label lives alongside it. */
  name: string;
  nameEn: string;
  rar: string; // rarity label (uk)
  rarEn: string;
  rc: string; // rarity color
  desc: string;
  descEn: string;
  locked?: boolean;
}

export const ITEMS: MockItem[] = [
  { icon: "🪨", name: "Малий Камінь", nameEn: "Small Stone", rar: "звичайне", rarEn: "common", rc: "#9a8c70", desc: "Тримає край стежки.", descEn: "It holds the edge of the path." },
  { icon: "🔘", name: "Стара Ґудзик", nameEn: "Old Button", rar: "звичайне", rarEn: "common", rc: "#9a8c70", desc: "Випав у того, хто тікав із печери.", descEn: "Dropped by someone fleeing the cave." },
  { icon: "🧵", name: "Синя Нитка", nameEn: "Blue Thread", rar: "рідкісне", rarEn: "rare", rc: "#7a5ad8", desc: "Ще трохи гуде, але вже тихо.", descEn: "Still humming a little, but quietly now." },
  { icon: "🍵", name: "Чаша з Моху", nameEn: "Moss Bowl", rar: "звичайне", rarEn: "common", rc: "#9a8c70", desc: "Тримає вологу для коріння.", descEn: "Keeps the moisture for the roots." },
  { icon: "🍄", name: "Синій Гриб", nameEn: "Blue Mushroom", rar: "рідкісне", rarEn: "rare", rc: "#7a5ad8", desc: "Світиться, коли поряд тиша.", descEn: "It glows when there is quiet nearby." },
  { icon: "🗝️", name: "Іржавий Ключ", nameEn: "Rusty Key", rar: "рідкісне", rarEn: "rare", rc: "#7a5ad8", desc: "Не знає, від чого. Поки що.", descEn: "Doesn't know what it opens. Not yet." },
  { icon: "🪶", name: "Пір'їна", nameEn: "Feather", rar: "звичайне", rarEn: "common", rc: "#9a8c70", desc: "Легша за вчорашній день.", descEn: "Lighter than yesterday." },
  { icon: "❔", name: "Порожнє місце", nameEn: "Empty slot", rar: "locked", rarEn: "locked", rc: "#4a3a6e", desc: "", descEn: "", locked: true },
];

// pool used for random drops on quest completion
export const DROP_POOL = ITEMS.filter((i) => !i.locked);
