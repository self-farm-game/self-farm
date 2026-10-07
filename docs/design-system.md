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

### Garden scene v14 — bg fills full stage width (no side gaps), gnome visible
Dropped the centred aspect-box approach (it left side gaps and pushed the gnome
off-screen). Now `.sf-plot` spans the FULL stage (`inset:0`) on both formats and the
bg is `object-fit: cover; object-position: 50% 100%` — edge-to-edge, anchored bottom,
top cropped under the level bar. Tree/gnome are % of the full stage, verified in the
real fixed-frame structure (1200×800 desktop w/ 236px sidebar; 390×844 mobile):
- desktop: tree left 50% / bottom 30% / width 15%; gnome left 11% / bottom 30%.
- mobile: tree left 49% / bottom 25% / width 26%; gnome left 12% / bottom 34%.
Gnome now sits fully visible under the left tree; mobile meadow fills the whole width.

### Garden scene v15 — desktop width-fill (no artifact), gnome placed on scene
Desktop `object-fit: cover` mis-cropped (stage 964x726 ≈1.33 vs bg 1.5) and showed
the dirt-circle twice at the top. Fixed: desktop bg now WIDTH-FILLS and sits on the
bottom (`width:100%; height:auto; bottom:0`), sky gradient above — one clean scene
like the sandbox. Mobile keeps `cover` (bg is taller than the stage, fills fine).
Tree/gnome are plain absolute % of the stage (not tied to any box):
- desktop: tree 50%/22%/15%; gnome 12%/20%.
- mobile: tree 49%/25%/26%; gnome 12%/34%.
Verified in real fixed-frame replicas: gnome fully visible both formats, no artifacts.

### Garden scene v16 — tree actually ON the circle (desktop)
The 'two circles' was a placement bug, not the texture (bg has one circle). On the
width-filled desktop stage (964x726, bg drawn 964x643 bottom-anchored, 83px sky on
top) the bg circle lands at x=51% / bottom=30%. The tree was at bottom:22% — 8% too
low, sitting on the path below the ring. Moved tree to 51%/28% (trunk in the dirt)
and gnome to 12%/26%. Verified: single circle, tree planted in it, gnome visible.

### Garden scene v17 — gnome + bubble no longer clipped
Root cause: `.sf-gnome` had `transform: translateX(-50%)`, shifting the whole
gnome+bubble flex group left by half its width — the gnome slid under the sidebar
and the bubble's left edge went off-screen (text cut). Removed the transform and
anchored the gnome by its LEFT edge: mobile `left:4%; right:6%`, desktop
`left:4%; max-width:46%`. Verified in the real fixed-frame (with sidebar): gnome
fully visible and the full Бомбом line readable, both formats.

### Garden scene v18 — tree LOCKED to the circle (bg-relative, not stage-relative)
The "two circles" was always one texture circle + the tree sprite landing BELOW it,
because the tree was positioned as % of the STAGE whose height varies (level bar,
nav). Fix: on desktop the bg and the tree now live in ONE box `.sf-bgbox` (the bg's
own 3:2 frame, width-100%, bottom-anchored). The tree is % of THAT box
(`.sf-tree-desktop` left 51% / bottom 30%), so it sits on the circle no matter how
tall the stage is. Verified at two different nav heights — tree stays on the circle
both times. (Mobile keeps stage-relative tree; its bg covers the stage so the circle
position is stable there.) The tree must stay a separate sprite so it can grow per
stage — only its placement was wrong, now anchored to the bg.

### Garden scene v19 — cleaned: ONE bg, ONE tree, ONE gnome
Removed all the duplication I'd introduced (the bgbox + a separate desktop tree AND
mobile tree = two trees on screen). Scene is now flat and simple, exactly as asked:
sky gradient + clouds + stars behind → one meadow img (`.sf-plot-img`, mobile cover /
desktop width-fill) → one `.sf-garden-tree` (grows via scale) → one `.sf-gnome`.
Desktop tree at left 51% / bottom 30% sits on the circle (stage height is fixed by
the uniform-scale window, so a fixed % is stable). No bgbox, no per-format tree.

### Garden scene v20 — THE double-meadow bug (finally found)
Both bg images were rendering at once. Cause: `.sf-plot-img { display:block }` and
`.sf-only-desktop { display:none }` have EQUAL specificity (1 class each), and the
plot-img rule came later in the file → it won → the hide was ignored → BOTH the
mobile bg (tall, circle low) and desktop bg (wide, circle high) showed, stacked =
two meadows / two circles. Fixed with 2-class selectors `.sf-plot-img.sf-only-*`
(higher specificity) placed after the base rule, so exactly ONE bg shows per format.
Verified: single meadow, single circle, one tree, one gnome.

### Tree v5 — new 6-stage sprites + instruction stays during quest
- Replaced the 10 tree frames with 6 new hand-made sprites (sprout → apple oak),
  cropped to content (soil at the bottom edge so bases align on the circle), kept
  at native aspect (no distortion), downscaled uniformly to ~520px. Growth is now
  6 stages (`xp.ts`), `growScale` = [.5 .62 .74 .86 .94 1]. Tree base width bumped
  (desktop 20%, mobile 32%) since the new art reads smaller; hollow map trimmed to
  stages 5–6.
- Quest execution: the `quest_active` screen now KEEPS the numbered instruction
  steps visible in a parchment card above the "Submit" button, instead of only a
  generic line — so the person can follow the steps while doing the quest.

### Garden scene v21 — new circle-less meadow + speech-bubble redesign
- Replaced bg-desktop/bg-mobile with new textures that have NO stone circle — just
  a clean meadow (grass, framing trees + lanterns, forest, flowers, sign). The tree
  now plants directly on the grass (its own soil mound blends in); lowered the tree
  (desktop bottom 24%, mobile 22%) so it sits grounded in the foreground.
- Бомбом's speech bubble redesigned: semi-transparent (rgba .60 + backdrop blur),
  blocky pixel-art outline (layered box-shadows, tiny 2px radius — square feel), and
  a stepped speech-bubble TAIL (::before outline + ::after fill triangle) pointing
  down-left to the gnome. Readable over the meadow.

### v22 — clouds visible again + bubble reshaped
- CLOUDS BUG: drift animated `translateX(160vw)` — vw is the BROWSER viewport, but the
  frame is a fixed 1200px box scaled by transform, so clouds flew far outside the scene
  and were almost never on screen. Now the keyframes animate `left: -30% → 115%`
  (container-relative), so they always cross the visible sky.
- BUBBLE: shape is "square with pixel-rounded corners" via a clip-path polygon with a
  2-step chamfer on each corner, and the speech ARROW is folded into the same polygon
  pointing LEFT toward Бомбом (clip-path can't draw outside the box, so the arrow lives
  inside it with extra left padding). Outline is crisp because the background is opaque
  and the whole element carries `opacity: .82` — so the drop-shadow outline follows the
  stepped silhouette and the bubble still reads as semi-transparent.

### v23 — THE real "no clouds" cause: prefers-reduced-motion
`.sf-drift` had `left: -30%` as its base position and relied on the keyframes to move
it into view. But `@media (prefers-reduced-motion: reduce) { .sf-drift { animation:
none } }` kills the animation — so on any machine with "reduce motion" enabled (a
common Windows/macOS setting) every cloud stayed parked at -30%, i.e. completely
outside `.sf-clouds` (overflow:hidden) → NO clouds at all, which is exactly what the
user saw while local renders looked fine.
Fix: each cloud now carries a static `left` (spread 6%–88%) from the CLOUDS array as
its base position; the animation overrides it when motion is allowed. Verified with
Playwright `reduced_motion="reduce"`: 8 clouds visible across the sky. Clouds were
also enlarged/opacified so they read clearly against the bright sky.

### v24 — reverted tree, clouds only
Rolled the tree back exactly as it was (sprites cropped with plain getbbox + width 520,
growScale [0.5 .62 .74 .86 .94 1]) — no texture resizing anywhere. Cloud sizes/opacity
also restored to the earlier values. The ONLY cloud change kept: each cloud has a static
`left` start position (so it is visible even when the OS reduces motion, which was the
reason the sky looked empty) and a calm, noticeable drift (42–56s per crossing).

### v25 — clouds actually DRIFT (the real cause)
`@media (prefers-reduced-motion: reduce) { .sf-drift { animation: none } }` was killing
the cloud animation outright. On a machine with the OS "reduce motion" setting on (the
user's case) the clouds therefore either sat off-screen (empty sky) or, after the static
fallback, hung motionless. Clouds are slow ambient drift, not a vestibular trigger, so
they now KEEP animating under reduced motion (just eased to a 90s crossing).
Setup: 4 clouds, one crossing ≈ 55s, negative delays spread across the cycle so only
1–2 are inside the sky at any moment and the rest wait off-screen. Verified with
Playwright `reduced_motion="reduce"`: positions advanced 9% of the sky in 5s.


---

## v26 — 3D-прототип саду (`/lab3d`)

Окрема сторінка-пісочниця на **three.js**. Основна 2D-сцена (`/garden`) не
змінювалась — це паралельний варіант, щоб порівняти вживу.

**Що всередині**
- `components/lab3d/IslandScene.tsx` — уся сцена будується процедурно з коду:
  жодних `.glb`/`.fbx`, тільки `BufferGeometry` + `MeshLambertMaterial
  ({ flatShading: true })`. Детермінований `mulberry32(seed)`, тому острів
  щоразу однаковий.
  - острів: верх (трава) і низ (конус землі) будуються з **спільного масиву
    `rim[]`**, тому між ними не буває щілини; колір задається `vertexColors`
    по трикутниках — звідси гранований low-poly вигляд;
  - дерево: 6 стадій = 6 наборів «стовбур + гілки + блоби крони + яблука»,
    збігаються зі стадіями з `lib/utils/xp.ts`;
  - дупло з 5-ї стадії — клікабельне (raycaster), відкриває вибір руни;
  - Бомбом — `THREE.Sprite` з наявної піксельної текстури, стоїть **на острові**;
    сцена щокадру проєктує його позицію в `--l3-bx/--l3-by`, і HTML-бульбашка
    їде за ним (на телефоні бульбашка стає нижньою реплікою);
  - хмари, світлячки, погойдування кущів, ліхтар із `PointLight`.
- `app/lab3d/lab3d.css` — нова стилізація вікон керування (префікс `.l3-`):
  товсті заокруглені картки, кремово-дерев'яна палітра, «видавлені» кнопки
  з нижнім кантом, дерев'яна шапка модалки, пігулки-теги.

**Камера.** Фіксована композиція, обертання перетягуванням обмежене
(`yaw ∈ [-0.85, 1.55]`, `pitch ∈ [-0.22, 0.42]`), зуму немає. Дистанція
рахується так, щоб острів **завжди влазив цілком** при будь-якому
співвідношенні сторін:
`need = max(halfW/(tan(fov/2)·aspect), halfH/tan(fov/2))`, а туман
підтягується за камерою (`near = d−2`, `far = d+30`) — інакше на вузькому
екрані, де камера відʼїжджає далеко, острів вицвітає.

**Граблі, на які вже наступили**
- Порядок вершин. Кільцеві квади верху спершу були намотані за годинниковою
  стрілкою → `FrontSide` відсікав їх і галявина була невидима, а все інше
  висіло в повітрі. Перевіряти нормаль через `(b−a)×(c−b)`, а не на око.
- `next/font` не працює в офлайн-збірці: перед локальним `npm run build`
  шрифт тимчасово заглушається, після — **обовʼязково** `grep -c Comfortaa
  app/layout.tsx` == 2.

### v27 — оберт на 360° і шість різних силуетів дерева

- **Камера.** Горизонтальний оберт більше не обмежений — повне коло, з
  інерцією після відпускання (`spin *= 0.94`). Вертикаль лишилась затиснутою
  (`pitch ∈ [-0.3, 0.5]`), щоб не залізти під острів. Бульбашка Бомбома
  перекидається на інший бік, коли він заходить у праву половину екрана
  (клас `.l3-bub-left` ставиться зі сцени).
- **Кадрування** більше не прив'язане до фіксованої дистанції: камера
  кадрує «коробку» `viewR` × (`treeTop` … `viewBot`), яка росте зі стадією.
  На паростку камера ближче, на дубі показуємо весь летючий острів.
  Верхівка береться з `tree.topY`, тому дистанція завжди відповідає
  реальній висоті дерева. На вузькому екрані зсув погляду рахується від
  **видимої висоти кадру** (`cd · tan(fov/2) · 0.18`), а не від дистанції —
  інакше острів з'їжджає геть униз.
- **Стадії — різні силуети, а не один масштаб:**
  1. паросток: грудочка землі, вигнуте стебельце, дві сім'ядолі, кори немає;
  2. саджанець: тонке стебло, окремі листочки по спіралі з черешками;
  3. молоде деревце: перша кора, три гілочки, рідка «прозора» крона;
  4. плідне: справжній стовбур, перша куляста крона, перші яблука;
  5. щедре: широка крона, багато яблук, з'являється дупло;
  6. віковий дуб: кряжистий стовбур із напливом, гілки у два коліна,
     розлога плеската крона, мох.
  `TREE_SCALE` ледь збільшує ранні стадії — інакше паросток на екрані
  не читається.

---

## v28 — 3D стає основним садом

`/garden` тепер 3D. Стара піксельна сцена жива на `/garden2d` (вхід із Хатини).
Сцена переїхала в `components/garden3d/IslandScene.tsx`, стилі — в
`app/(app)/garden/garden3d.css` (префікс `.l3-`). `.l3-root` абсолютний і
живе всередині `.sf-scroll`, тому бічна й нижня навігація застосунку лишаються
на місці.

### Квести — з документа, покроково, з аналітикою

`lib/mock-data/quests-v2.ts` згенеровано з «Self-Farm — квести в ігровому
форматі»: 44 квести, 19 станів. Кожен квест — зачин, кроки, перевірка,
текстове відкриття, інтенсивність/тривалість/умови і застереження.

Цикл у Саду: **чек-ін (один стан) → три стежки → крок за кроком → перевірка →
«чи допомогло?» → відкриття**. Відповідь пишеться у два місця:

- `state.questStats[questId]` — по конкретному квесту;
- `state.comboStats["<стан>|<шаблон T01–T20>"]` — по парі «стан + тип вправи»;
- `state.questLog` — останні 300 проходжень (квест, шаблон, стан, час,
  відповідь, секунди) — сире джерело, якщо знадобиться вивантажити.

`lib/utils/quest-picker.ts` рахує
`score = база(точний стан 3 / сусідній 1.5) + 1.4·перевага + штраф за свіжість + шум`,
де перевага = `statWeight(квест) + 0.6·statWeight(стан|шаблон)`, а
`statWeight = (helped − 1.3·nope − 0.25·same) / (1 + runs)`. Нічого не
блокується назавжди — «провалений» квест просто випадає рідше. Набір з трьох
по можливості бере різні шаблони, щоб це не були три варіації однієї вправи.
Екран «Що працює» в Саду показує це зведення гравцю.

### Джерело, струмок, водоспад

Вода — три шматки однієї `CanvasTexture` зі світлими прожилками, яка повзе по V
(`offset.y -= dt·k`); геометрія нерухома. Чаша джерела → стрічка русла,
побудована вздовж кривої по схилу (`streamXZ(t)`), → полотно водоспаду, що
зривається з краю по дузі й **тане через vertex-alpha** (атрибут `color` з
itemSize 4 + `vertexColors` на `MeshBasicMaterial`). Знизу — хмарка туману
з `Points`.

Важливо: `SPRING_A/SPRING_R/HUT_A/HUT_R` і `makeBlocker(R)` лежать на рівні
модуля, і `buildDecor` ставить кущі/каміння/квіти лише там, де `blocked()`
повертає false. Без цього кущі виростають просто в руслі й на даху хати.

### Хатинка замість Бомбома на галявині

Бомбом більше не стоїть спрайтом на острові. На острові — його хатинка
(кругла, з конічним дахом, димком із комина і теплим вікном, що ледь пульсує).
Клік по ній → Бомбом виходить **оверлеєм знизу-зліва**.

Репліка адаптивна: висоту не задано, `overflow-wrap: anywhere`,
`max-height: min(42vh, 300px)` і прокрутка — текст більше не обрізається,
яким би довгим не був. Поки Бомбом говорить, на `.l3-root` висить
`.l3-talking`, і нижня кнопка піднімається, щоб репліка її не накривала.

### v29 — вода з об'ємом і рельєф острова

- **Струмок** більше не плоска стрічка. Канал піднятий (галявину не
  прорізати — сітка надто велика), і складається з трьох шарів:
  темне мокре дно (`BED_UP = 0.03`), над ним поверхня води
  (`WATER_UP = 0.19`) і валуни-береги по боках. Вода напівпрозора з
  vertex-alpha: центр темніший і щільніший (0.84), краї світліші й
  прозоріші (0.42) — класична підказка глибини. Краї полотна опускаються
  майже до дна (`BED_UP + (WATER_UP−BED_UP)·(1−edge)^0.7`), інакше вони
  висять над травою прозорими клаптями. Крізь воду видно дно — звідси
  відчуття об'єму. З води стирчать камінці, берег навмисно нерівний.
- **Водоспад** — два полотна: щільне ядро попереду і ширший серпанок
  позаду з іншою швидкістю текстури, тому потік має товщину. `H = 11`,
  прозорість падає лише до ~0.6, тож він не обривається, а йде за нижню
  межу кадру.
- **Рельєф** (`buildTerrain`): пологі горбки (сфери-півкулі під траву),
  скельні виступи зі сходинок-плит, поодинокі валуни з супутниками,
  кілька високих кущів для силуету. Усе проходить через той самий
  `blocked()`, що й декор, тому нічого не виростає в руслі чи на подвірʼї.
  Кількість навмисно скромна: 7 горбків, 5 виступів, 4 валуни, 3 кущі —
  острів перестає бути пустим, але не стає звалищем каміння.

### v30 — обʼємний водоспад, зум і чистка набору

- **Водоспад** більше не дві площини. Це оболонка, протягнута вздовж
  падіння: поперек потоку йде дуга з 9 сегментів, тому читається
  циліндрична товщина, а vertex-колір дає затінення (центр яскравий,
  боки темніші й прозоріші). Попереду щільне ядро, позаду ширший
  серпанок з іншою швидкістю текстури — разом дає обʼєм і паралакс.
- **Струмок не вилазить за силует.** `buildIsland` тепер віддає
  `rimRadius(angle)` — справжній (нерівний) радіус краю, і русло
  закінчується на `rimRadius(A0) − 0.42`, перед камʼяним порогом.
  Раніше кінець рахувався від середнього `R + 0.1` і в місцях, де край
  западає, вода стирчала кутом за острів.
- **Текстура води** переписана: 64×512 замість 32×256, базовий градієнт,
  широкі світлі смуги (головний рух), дрібні прожилки (деталізація
  зблизька) і темні жилки під гребенями. `anisotropy = 4`.
- **Зум.** Колесо на десктопі (`wheel` з `passive: false`), щипок двома
  пальцями на телефоні (через `pointers: Map`, `touch-action: none` на
  канвасі). Діапазон 0.45–2.4 від «усе влазить»; під час щипка обертання
  на паузі, а клік після нього не зараховується.
- **Міграція збереження.** У старих збереженнях лежали id квестів зі
  старого каталогу. Вони ніде не знаходились, набір рахувався непорожнім,
  чек-ін лишався закритим — і кнопка «Як ти зараз?» зникала назавжди.
  `migrate()` у сторі викидає невідомі id при гідратації (локальній і
  хмарній), а `canCheckin` рахує лише відомі квести.
- **Вкладка «Квести»** — тільки поточний набір: відкрите й пройдене після
  останнього чек-іну, зі смужкою прогресу. Повного каталогу там немає
  навмисно: стежка має сенс під стан, а не як меню на вибір.

---

## v31 — темне скло: один інтерфейс над живим садом

Вкладки більше не окремі сторінки з власним фоном. Сад — постійне тло
всього застосунку, а все інше спливає над ним напівпрозорими панелями.

### Архітектура

- `app/(app)/layout.tsx` монтує `GardenWorld` **один раз**. Сцена не
  перемонтовується при переході між вкладками: камера, зум, хмари й Бомбом
  лишаються там, де були.
- Вкладка приходить у `GardenWorld` як `children` і рендериться поверх.
  `/garden/page.tsx` повертає `null` — відсутність вкладки і є «ми в саду».
- **Граблі:** `sheetOpen` не можна рахувати як `!!children` — сторінка,
  що повертає `null`, усе одно приходить непорожнім елементом, тож власні
  вікна саду ніколи не показувались. Перевіряємо `usePathname()`.
- `/garden2d` винесено з групи `(app)`, щоб під ним не крутився 3D-світ.
- `components/ui/Sheet.tsx` — спільна оболонка вкладки: крихта
  «⌁ SELF-FARM / РОЗДІЛ», заголовок, підзаголовок, скрол, футер, нота.
  Закриття завжди веде в Сад.

### Палітра (`app/glass.css`, токени `--g-*`)

| роль | значення |
|---|---|
| панель | `rgba(16,40,36,.74)` + `backdrop-filter: blur(18px)` |
| картка | `rgba(32,66,58,.46)` |
| лінія | `rgba(168,214,186,.22)` |
| текст | `#e9f2e8` / `#a8c1b2` / `#7c968a` |
| акценти | золото `#e9c178`, зелений `#86c67c` |

Розмиття саду робить **скрим**, а не фільтр на сцені: `filter: blur()` на
контейнері з canvas змушує перерастеризовувати кадр щоразу, тоді як
`backdrop-filter` на скримі робить те саме на GPU і безкоштовно.

Стара цегляна стіна й дерев'яна верхня смужка сховані (`.sf-wall`,
`.sf-topbar`), бо фон тепер дає сам сад. Навігація — те саме скло.
