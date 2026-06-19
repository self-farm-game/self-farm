# Design system

Pixel-art, wooden, warm, strange — a post-apocalyptic fairy tale. Faithful to the
shared `Self-Farm.html` design. Most styling is inline (ported 1:1 from the
design); Tailwind config exists for future utility use.

## Font
**Pixelify Sans** (Google Fonts, full Cyrillic). `-webkit-font-smoothing: none`
and `image-rendering: pixelated` keep everything crisp/pixel.

## Palette
- Night / "shine" residue: `#0c0a16`, `#1c1530`, `#241a42`, purples
  `#8a7fb0 #9a8fc0 #a99fc8 #b9aecb`.
- Wood: pills `#6a4a2c→#4a2f18`, panels `#5d3f24→#3f2812`, outline `#2a1a0e`,
  tiled plank texture (`public/assets/textures/wood-plank.png`).
- Parchment cards: `#d8bf94→#c8a878`, ink `#3a2616 / #4a3320 / #5a3f24`.
- White speech bubble: `#f5f1e6`, outline `#241a32`.
- Cream text: `#f4ecd6 / #efe7d2`. Gold: `#ffd98a #e7c389 #caa24a`.
- Quest/grow green: `#7bbf5a→#4f9a3a`. Rune purple: `#a98bff→#7a5ad8`.

## Surfaces & components
Wooden carved buttons, parchment buttons/cards, tappable chips (active = wood +
gold outline), heart-medallion progress bar, glowing rune nodes, white pixel
speech bubble with triangle tail. Primitives: `components/ui/primitives.tsx`.

## Motion
Keyframes `sf-float` (idle bob), `sf-glow` (rune/item shimmer), `sf-pop`
(reward), `sf-fade` (screen enter), `sf-star`/`sf-drift` (ambient). All disabled
under `prefers-reduced-motion`.

## Layout
Mobile: full-bleed, bottom nav. Desktop: a 390×820 framed "game window" centered
on a dark soil field with drifting dust + vignette (decorative filler), per the
requirements' responsive rule.

## Signature
The pixel oak in the empty field + Бомбом's white speech bubble. Spend boldness
there; keep everything else quiet.
