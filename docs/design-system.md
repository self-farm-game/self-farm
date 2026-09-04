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

## Layout (mobile vs desktop)
- **Mobile (<1024px):** full-bleed portrait, top status pills, bottom nav.
- **Desktop (≥1024px):** a landscape "game window" with a **left wood sidebar**
  (`components/layout/SideNav.tsx`) — wordmark, profile, vertical nav, day/streak
  — and a main panel showing the active screen in a centered column (`.sf-page`,
  max ~480px) on the wooden wall. Bottom nav + mobile top bar are hidden via CSS.
  Implemented purely with media queries in `app/globals.css` (no JS branching),
  reusing the same screen components.

## Responsive breakpoints (updated)
- **≤767px (phones):** full-bleed portrait + bottom nav.
- **≥768px (tablets AND desktop):** landscape game window with the left wood
  sidebar; content centered (`.sf-page`, max ~480px). The old portrait "phone
  floating on a desktop" state (which looked wrong on tablets) is gone — tablets
  now use the same sidebar layout as desktop, sized via `min(1080px,94vw)`.

## Garden as a full-bleed scene (no scrolling)
The home screen is no longer a card stack with the tree in a framed box. It is a
single scene that fills the visible area:
- `.sf-garden` is absolutely positioned inside `.sf-scroll`, so it always equals
  the visible area (above the bottom nav on phones, full panel on desktop) and
  never scrolls.
- Background layers: `.sf-garden-sky`, clouds, `Stars`, `.sf-garden-grass`,
  `.sf-garden-soil`. The tree (`TreeStages`, now a fluid SVG) sits on the ground,
  Бомбом stands next to it and is tappable.
- UI floats over the scene: `.sf-garden-top` (level + inventory) and
  `.sf-garden-bottom` (Бомбом's line, XP panel, the single «Як ти зараз?» CTA),
  both capped at 560px and centered — identical on phone, tablet, desktop.
- All scene sizes use `clamp()` (vh-based), so the tree scales with screen
  height instead of overflowing. `@media (max-height: 680px)` trims the tree and
  clamps Бомбом's line to two rows so short phones still never scroll.
Other screens keep the normal scrolling column layout.

### Fix — small stages were hidden behind the UI
Two changes so an acorn/sprout reads as clearly as a grand oak:
1. **No overlap by construction.** `.sf-garden` is a flex column: `.sf-stage`
   (flex:1) holds sky/grass/tree/Бомбом, `.sf-garden-bottom` (flex:0 0 auto)
   holds the panels and carries the soil texture, so the UI looks planted in the
   ground instead of floating over it. The tree stands on the grass line at the
   bottom of the stage and can never be covered, whatever the panel height.
2. **Per-stage framing.** `TreeStages` picks a `viewBox` per stage (tight around
   the acorn, widening to the full canvas for the grand oak). Early stages are
   therefore large enough to see, while each stage still frames more world than
   the last, so growth remains legible.
Бомбом moved to the grass line (`left: 3%`) and the tree is capped at 76% width,
so they sit side by side without hiding each other.

### Garden layout v2
- **Level bar moved to the top** (`.sf-xp-panel`, slightly translucent wood):
  stage name + subtitle on the left, XP counter on the right, heart bar below.
- **Бомбом lives in the top-left corner** as a small floating sprite next to a
  translucent glass bubble (`.sf-bombom-bubble`, blurred dark fill) holding his
  line; tapping either cycles lines. He no longer stands in the scene, so he can
  never cover the sapling.
- **Bottom strip holds only the single action** («Як ти зараз?») on the soil
  texture.
- The tree stretches between the top panel (`top: clamp(150px,26vh,210px)`) and
  the grass, and `.sf-tree-fit` gives each stage a share of that height
  (42% acorn → 100% grand oak), so growth reads without early stages vanishing.

### Fix — the sprout appeared to hover
Every per-stage `viewBox` used to extend to y=156 while the drawing sits on the
ground line at y=150. Zoomed in for small stages, those 6 empty units became a
visible gap under the plant. All frames now end exactly at y=150.

Order inside `.sf-garden-top` (top → down): level bar, then the Бомбом bubble
and the inventory button on one row.

## Tree v3 — 10 sprite stages + hollow easter egg
- Growth is now 10 stages (`lib/utils/xp.ts`) rendered from real pixel sprites
  `public/assets/sprites/tree/stage-1..10.png` (sliced from the provided sheet,
  background removed, shared 200px-wide frame so the ground line aligns).
- The **base/starter quest is gone** — quests exist only inside a check-in set.
- **Hollow easter egg:** from stage 5 the trunk gains a hollow. A transparent,
  unlabelled hotspot sits over it (`HOLLOW = {x:.45,y:.66}` in TreeStages). Tapping
  opens a small panel to tuck ONE unlocked rune inside; the placed rune glows
  faintly in the hollow. State: `GameState.hollowRune`; action `placeHollowRune`;
  eligible runes via `lib/utils/runes.ts` (`unlockedRunes`). No visible button —
  it stays a discoverable secret.

## Tree v3.1 — clean slices, bigger, new font
- Re-sliced the 10 sprites with an edge flood-fill that keys out both the dark
  backdrop and the grey grid separators, and a top inset that drops the number.
  Each sprite is then padded onto ONE shared canvas, bottom-aligned and
  horizontally centered (220px wide), so the ground line matches across stages
  and nothing shows a number or a neighbour sliver.
- Tree enlarged: per-stage `fit` now spans 50%→100% across the 10 levels, the
  scene reserves more vertical room (`.sf-garden-tree` top raised), and
  `max-width` on the sprite up to 96%.
- Hollow hotspot moved to `{x:.46,y:.62}` for the new proportions, slightly
  larger tap area.
- Font switched from Pixelify Sans to **Fredoka** (rounded, friendly, far more
  readable, full Cyrillic) via next/font; still drives `--font-pixel`.

### Font fix
Fredoka/Baloo 2 have NO Cyrillic subset in next/font (build error `Unknown subset
`cyrillic``). Switched to **Comfortaa** — rounded, friendly, readable, and it
does ship a `cyrillic` subset (verified in next/font's google/font-data.json).
When picking a Google font here, confirm cyrillic in that manifest first.

### Tree v4 — final hand-drawn stages, aligned in place
Replaced the sliced sheet with 10 provided transparent frames (1..10.png). They
vary in size, so the pipeline: tight-crop each → measure the soil-platform width
along the bottom band → scale every frame so the platform is the SAME width
(median) → composite onto one shared canvas, bottom-aligned + centered (260→
exported 220px). Result: the ground disc stays put and the same size while the
tree above it grows. Hollow hotspot now uses a per-stage map
(`HOLLOW_BY_STAGE`, stages 5–10) since the trunk drifts a bit with growth.

### Fix — ghost debris beside the tree
Resampling during normalization smeared a faint sliver into the empty canvas on
some stages (a vertical 'ghost' of leaves to the right). Fixed by isolating each
frame to its LARGEST connected opaque component before scaling (drops any detached
debris), then hard-clipping alpha <=8 after the final resize. Canopies stay whole
because they're one connected mass.


## Garden scene v4 — layered decorations + drifting clouds + gnome on meadow
Rebuilt the home scene as stacked layers (bottom → top):
1. `.sf-garden-sky` — pure gradient (no more CSS box clouds).
2. `.sf-clouds` — 5 cloud sprites (`cloud-1..5.png`, sliced from the atlas) drift
   left→right on staggered `sf-cloud-drift` tracks (varied top/width/speed/opacity
   from the `CLOUDS` array).
3. `.sf-treeline` + `.sf-meadow` — distant conifer silhouette and the green ground.
4. `.sf-decor` bushes/grass/rock/flowers (from the atlas) pinned along the sides;
   leafy ones get `.sf-sway` (gentle wind rotation).
5. Tree in the centre; `.sf-gnome` (extracted gnome sprite) sits lower-left with
   his speech bubble, matching the reference — replaces the old corner Бомбом.
Assets in `public/assets/sprites/garden/`. Respects prefers-reduced-motion.

### Garden scene v5 — single baked meadow image
User supplied clean textures, so the scene is simpler and correct:
- `plot.png` is the whole static meadow (stone circle, path, side bushes, rocks,
  flowers all baked in) — one `.sf-plot-img` anchored to the bottom. No more
  scattered/floating decor sprites.
- `cloud-1..5.png` drift across the sky (`sf-cloud-drift`).
- Tree is absolutely positioned over the stone circle (~50% x, 30% from bottom);
  `BomBom.png` sits lower-left on the grass with his bubble.
Also fixed: nav showed literal `tab.questbook` — added that key (NAV id is
`questbook`, not `quests`).

### Garden scene v6 — plot fills the window; frame locked to orientation
- `.sf-plot` now paints `plot.png` as a `background-size: cover` layer filling the
  lower scene edge-to-edge (no blue gutters). The `<img>` was removed.
- Tree/gnome positioned as % of `.sf-plot` over the (centered) stone circle;
  tunable via `.sf-garden-tree { left/bottom/width }` and `.sf-gnome { left/bottom }`.
- Desktop `.sf-frame` locked to a fixed **3:2 landscape** via `aspect-ratio` and a
  single controlling width `min(1080px,96vw,144vh)` → it scales uniformly (whole
  window), never reshaping fluidly per-axis. Below 768px it's the portrait phone
  frame (100vw×100vh). So the window is portrait OR landscape, not a smooth morph.


### Garden scene v7 — tree planted in the circle, no floating island
- Cropped the soil/grass platform off each tree sprite (`stage-1..10.png`), so
  the trunk plants directly into the stone circle's dirt instead of sitting on
  its own grassy disc ("stump island"). Hollow map y-values shifted down to match
  the shorter frames.
- `.sf-plot` background now `130% auto` at `center 118%` so the meadow grass
  reaches both sides and the rounded island bottom edge (and sky beneath it) is
  pushed below the visible area.
- Tree `bottom: 34%`, `width: min(40%,260px)` — sits in the circle. Tunable.

### Garden scene v8 — tuned with a headless render harness
Instead of guessing CSS, rendered the scene in headless Chromium (Playwright) at
both desktop 3:2 and portrait sizes and iterated until it matched the reference.
Final layout: `.sf-plot` holds a bottom ground band (`::before`, plot's own grass
tones so no seam) + `plot.png` bottom-anchored filling the width; sky gradient
shows above the meadow's top edge (natural horizon, like the reference). Tree and
gnome placed as % over the stone circle, with separate portrait defaults and
desktop (`min-width:768px`) overrides:
- portrait: plot 112%, tree bottom 27% / width 22%, gnome 4%/15%.
- desktop: plot 100%, tree bottom 42% / width 15%, gnome 16%/23%.


### Garden scene v9 — dedicated per-orientation textures (final)
User supplied clean, separate textures per format. Wired in directly:
- `meadow-desktop.png` / `meadow-mobile.png` — full meadow with stone circle
  (circles centred ≈ 47%/65% desktop, 48%/68% mobile). Bottom-anchored, fill width.
- `decor-desktop.png` / `decor-mobile.png` — corner frame (tree+lantern+bushes),
  transparent centre, overlaid on z-index 7.
Both meadow+decor render for both formats; `.sf-only-mobile/.sf-only-desktop`
show the right pair per breakpoint. Positions tuned via the render harness:
- mobile: meadow 112%, tree bottom 22% / width 22% / x 48%, gnome 26% / x 12%.
- desktop: meadow 100%, tree bottom 33% / width 13% / x 47%, gnome 31% / x 19%.
Old plot.png + extracted dekor pieces removed.

### Garden scene v10 — single baked background + growing tree
User supplied complete backgrounds (meadow + decor together, transparent sky):
`bg-desktop.png` (1536×1024, circle ≈51%/66%) and `bg-mobile.png` (853×1807,
circle ≈49%/74%). Scene layers now: sky gradient → Stars → drifting clouds →
`bg-*` (per orientation) → tree in the circle → gnome on the grass. The separate
meadow/decor textures and plot.png were removed.
TREE GROWS: per-stage `growScale` (0.42→1.0 across the 10 stages) is applied as a
`transform: scale()` on `.sf-tree-fit` (origin 50% 100%, so the base stays planted
in the dirt). Tree base width: 26% mobile, 18% desktop; positioned at the circle.

### Clouds on mobile
Clouds drift on BOTH formats (same `sf-cloud-drift` animation; not disabled on
mobile). Bumped from 5 to 8 clouds (reusing the 5 sprites) with evenly-spread
negative delays so the tall narrow portrait sky always has clouds in view rather
than looking sparse. Verified motion via multi-frame headless capture.

### Garden scene v11 — FIX: cover-fit so the scene stays static
Bug on live (not sandbox): the bg used width:112% + height:auto, but the game's
.sf-stage is (frame − 236px sidebar) × height — a different, variable aspect than
the 1000×667 sandbox device. The tall bg overflowed and showed a mismatched crop
(double circle, scattered objects). Fixed by rendering the bg with
`object-fit: cover; object-position: 50% 100%` filling the stage — the composition
stays STATIC and undistorted at any window size, only cropping edges, and swaps to
the mobile bg below 768px. Removed leftover `.sf-plot{height:clamp}` override, the
duplicate `.sf-plot-img` block, and the unused `.sf-decor-frame`. Verified in a DOM
replica (frame+sidebar+stage) across narrow/wide desktop and phone widths.

### Garden scene v12 — meadow box keeps the bg's exact aspect (like the sandbox)
The live bug was that `.sf-stage` (frame minus 236px sidebar) is NOT 3:2, so a
width- or cover-fitted bg mismatched. Fix mirrors the sandbox exactly: `.sf-plot`
is now a fixed-ASPECT box (mobile `853/1807`, desktop `3/2`) that fits inside the
stage and is centred on the bottom; the bg is `object-fit: fill` inside it (no
distortion because the box already matches the bg aspect). Tree/gnome are % of
this box, so their positions are locked to the circle regardless of window size.
The 3:2 frame + `min(1080px,96vw,144vh)` keeps the whole window locked to its
aspect and scaling uniformly (letterboxed by the page bg), so resizing the browser
never reshapes the scene — it only scales. Verified in a DOM replica across
narrow/wide desktop and phone widths: identical composition every time.

### Window v13 — fixed design size + uniform scale (proportions locked)
Per user request: the game window must NEVER change proportions on browser resize.
Implemented a scale-to-fit: the frame is a FIXED design size (desktop 1200×800,
mobile 390×844) set in GameShell; a JS effect computes
`scale = min((vw-2m)/DW, (vh-2m)/DH)` and applies `transform: scale()` to `.sf-frame`
(transform-origin center). Everything inside is pixel-locked — resizing only changes
the scale, centred with the page bg as letterbox. No `aspect-ratio`/`vw`/`vh` on the
frame anymore.
Scene: `.sf-plot` desktop = 3:2 box filling stage width (gnome at 17% now sits under
the left tree, fully visible — the sidebar no longer clips it because the stage is a
known fixed width); mobile = 9:19 box filling the fixed 390-wide frame edge-to-edge
(fixes the "звужено" side gaps). Verified in DOM replicas at tall/wide/phone
viewports: identical composition, only scale differs.

