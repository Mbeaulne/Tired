# Tired

A modern 2D browser game built through small daily warm-up experiments.
The long-term vision is a persistent open world that grows through community
contributions. See [the game notes](GAME_NOTES.md).

The official repository is [Mbeaulne/Tired](https://github.com/Mbeaulne/Tired).
It uses the [MIT license](LICENSE), which allows reuse and sharing, including
commercial use, with the license and copyright notice preserved.
Contribute through [forks and pull requests](CONTRIBUTING.md); Mbeaulne is the
only account permitted to update the official `main` branch.

## Established decisions

- Working name: Tired.
- 2D game.
- Three-quarter (isometric-style) view, inspired by Diablo 1.
- Character movement: click-to-move.
- First target: desktop browser, keyboard and mouse.
- First experiment: an endless floor of plain neutral isometric tiles, with
  a still view and automated verification of repetition and resource use.
- Second experiment: a stationary humanoid placeholder centered on the floor,
  with its feet anchored to the ground and a small shadow.
- Third experiment: sparse random depth markers. The current provisional style
  is short stone blocks with shaded faces and ground shadows.
- Development proceeds in small steps, with questions to define each step.
  See [the project rules](AGENTS.md).

## Stack

Used for the prototype, with exact versions recorded in `package.json`
and `package-lock.json`.

| Tool | Purpose |
| --- | --- |
| Phaser 4.2.1 | 2D scenes, input, cameras, sprites, animation, tilemaps, and collisions. |
| TypeScript 7.0.2 | Game code with type checking to catch errors during small changes. |
| Vite 8.3.2 | Local development server and production builds. |
| HTML and CSS | The browser page and any surrounding interface. |
| Playwright 1.63.0 | Automated browser checks; excluded from the browser application. |

The prototype uses Phaser's WebGL renderer. Add tools such as a map editor
only when a selected experiment needs them.

This stack is recommended because it provides common 2D game systems and a
short edit-and-preview cycle for daily experiments. Phaser supports isometric
tilemaps and sprite depth ordering, making it suitable for the chosen
three-quarter view. This first floor uses a repeating texture rather than
individual tile objects.

The Diablo 1 reference establishes the viewing direction. The final art style,
setting, and other game mechanics remain undecided.

References:

- [Phaser framework and capabilities](https://github.com/phaserjs/phaser)
- [Phaser releases](https://github.com/phaserjs/phaser/releases)
- [Phaser tilemap support, including isometric maps](https://docs.phaser.io/api-documentation/function/tilemaps)
- [Phaser sprite depth ordering](https://docs.phaser.io/api-documentation/namespace/gameobjects-components-depth)
- [Official Phaser templates, including Vite with TypeScript](https://docs.phaser.io/phaser/getting-started/project-templates)
- [TypeScript handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Vite guide](https://vite.dev/guide/)

## Run locally

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, usually `http://127.0.0.1:5173`.

```sh
npm run build
npm test
```

Browser checks use system Chromium at `/usr/bin/chromium` on Linux. Set
`TIRED_CHROMIUM_PATH` to use another Chromium executable. On other platforms,
install Playwright Chromium with `npx playwright install chromium`.

## Endless floor

The entire floor is one viewport-sized `TileSprite` using a generated
256 x 128 pixel texture (128 KiB of base RGBA pixels). No map or per-tile
objects accumulate with travel. `FloorScene.setViewOffset(x, y)` reduces
offsets modulo the repeating texture before passing them to the GPU.

The view stays still. Offset changes are available to the automated checks and
future movement code. Rapid updates are combined into one frame, and Phaser's
frame loop sleeps after drawing. Resizing or restoring a WebGL context wakes
it to redraw. When a moving character is added, its animation and updates must
also request frames; the current sleeping scene is deliberately static.

The floor has no map boundary. This is a repeating surface, with no unique
terrain, collision map, or movement simulation. Future very long movement
should keep character coordinates near a local origin as well; bounded floor
texture offsets alone do not solve precision for every future world object.

## Player placeholder

One stationary humanoid stands at the center of the view. Its feet define its
position on the floor; it stays centered when the browser resizes. The figure
and its shallow ground shadow are baked together into a 128 x 160 pixel
texture (80 KiB of base RGBA pixels), displayed at half size. It adds one image
object and one reusable texture, with no image downloads or animation loop.

The placeholder uses simple neutral shapes and a muted blue body. It is
replaceable artwork. Click-to-move is the established movement direction;
implementing movement remains a separately selected step.

## Depth markers

Sparse short blocks provide landmarks on the flat floor. Their top faces use
the same 2:1 angle as the floor tiles, their upright edges show vertical
direction, and shaded sides and shallow shadows show contact with the ground.
Blocks and the player draw in order of their ground position, so nearer
blocks can appear in front of the player. These are decorative depth cues.

Three block heights share one generated 384 x 160 pixel atlas (240 KiB of base
RGBA pixels). A deterministic cell hash chooses placement and height; returning
to the same area restores the same markers. Bases align to floor tile centers.

The marker field reuses a pool sized for the viewport plus a small margin.
It updates once before a requested render, rather than on every offset call.
At 1440 x 900 the pool holds 42 sprites; resizing changes its capacity, while
travelling does not. Distant world coordinates are converted to nearby screen
positions before reaching the GPU. No visited-area cache accumulates.

## Verification

The automated checks in [tests/floor.spec.ts](tests/floor.spec.ts) cover exact
seamless texture repetition, matching renders at offsets displaced by a
trillion pixels, unchanged object/texture counts after 2,000 offset updates,
one coalesced frame, no idle frames, and resizing from 800 x 600 to
1920 x 1080 while the player stays centered. They also check marker stability,
ground alignment, and drawing order relative to the player. The floor's
periodic render check excludes the non-repeating landmarks. Screenshots are
written to ignored `test-results/` and were visually inspected for ground
contact and depth cues at large and small desktop sizes.

On 2026-10-04, the production build and all four browser checks passed using
headless Chromium with software WebGL. After 2,000 offset updates at
1440 x 900, resources stayed at 44 scene objects (floor, player, and 42 pooled
markers) and three application textures. Phaser also retains its fixed
built-in textures. The updates produced one coalesced frame and the still
scene produced no idle frames. These checks verify resource bounds, rather
than measuring FPS on the user's GPU.

The production JavaScript bundle is approximately 360 kB gzipped, mainly the
Phaser runtime. The floor needs no image downloads. Runtime floor memory
stays bounded by the texture and viewport; total browser GPU memory depends
on viewport size and browser behavior.

A production preview smoke check also passed: the scene rendered without
browser errors, the development test bridge was absent, and forcing WebGL
context loss and recovery restored an identical image.

## Next decision

Choose the next small experiment before implementing it. A possible follow-up
is click-to-move for the placeholder; its exact scope remains open.

See [current tasks](TODO.md).
