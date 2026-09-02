# stereogram-webgl-extended

A real-time WebGL autostereogram ("Magic Eye") generator. Upload a depth map and a tile pattern, tweak the parameters, and download the result.

**Live demo:** https://williambottini-svg.github.io/stereogram-webgl

![Planet](src/readme/preview_planet.jpg)

---

## About this fork

This project is a fork of [piellardj/stereogram-webgl](https://github.com/piellardj/stereogram-webgl) by Jérémie Piellard, the original author of the WebGL stereogram engine. The core rendering algorithm, shader pipeline, and build scripts are his work.

**What I added on top:**

| Feature | Commit |
|---|---|
| Pattern placement controls (offset X/Y, zoom, repeat scales) | [`1bfa465`](../../commit/1bfa465) |
| Pattern cropping controls (X/Y min/max) | [`7ff371c`](../../commit/7ff371c) |
| Fullscreen preview module (square / fill modes, browser fullscreen) — 265 LOC, new module at `src/ts/fullscreen-preview.ts` | [`3151aaf`](../../commit/3151aaf) |
| Download-size selector (1024 / 2048 / 4096) and UI/attribution refactor | [`b727a86`](../../commit/b727a86) |
| Service worker to handle stale registrations | [`3151aaf`](../../commit/3151aaf) |
| Collapsible control sections, editable numeric fields and reset buttons next to every slider (`src/ts/ui-enhancements.ts`) | [`b727a86`](../../commit/b727a86) |

## Redesigned UI

The original project ships with a generic control-panel theme. This fork replaces it with a custom design system that fully restyles the app:

- **CSS custom-property palette** (light and dark) — theming is just a token swap on `[data-theme="dark"]`, no per-component dark-mode rules. See [`src/static/css/custom.css`](src/static/css/custom.css).
- **Dark / light mode toggle** with `prefers-color-scheme` as the default, explicit choice persisted to `localStorage`. A small inline script in `<head>` applies the theme before first paint so there's no light-to-dark flash on dark-preferred systems.
- **CSS Grid app shell**: canvas + control panel layout that adapts to viewport width.
- **Container queries on the control panel** so it reflows based on its own width (works the same whether docked, floated, or in a narrow sheet).
- **Mobile bottom-sheet**: under 900 px wide the control panel becomes a draggable sheet that slides up from the bottom of the screen.
- **A11y baked in**: visible `:focus-visible` rings, sufficient WCAG-AA contrast, ARIA labels on the floating buttons, `prefers-reduced-motion` honored.
- **Frosted-glass canvas buttons** with `backdrop-filter` blur, sized for touch targets (36 px) but compact.

The new design lives entirely in `src/static/css/custom.css` (loaded after the framework's `page.css` and overrides most of it) and `src/ts/theme.ts` (theme toggle module). The HTML structure is preserved so the existing observers and framework runtime keep working.

## Shareable URL state

Every numeric, boolean, and enum parameter is encoded into the URL hash, so any configuration is a copy-pasteable link. Click the **Copy link** button in the top-right corner to grab one.

Design notes:

- Compact `key=value&key=value` format in the hash (`#d=0.5&sc=12&tm=texture&...`) rather than base64-of-JSON. Human-readable, diffable, and unknown keys are silently ignored on decode so older links keep working as the schema grows.
- Short keys (e.g. `d` for depth, `cu0`/`cu1` for tile-crop min/max U) keep URLs paste-friendly.
- Floats are quantized to 4 decimal places before encoding — well below slider precision and roughly halves URL length.
- Writes use `history.replaceState` and are debounced 250 ms, so dragging a slider doesn't spam browser history.
- File-backed parameters (uploaded depth maps, uploaded pattern textures) are intentionally excluded — a URL hash is far too small to embed an image. Preset names are encoded; uploads aren't.

The codec lives in [`src/ts/url-state.ts`](src/ts/url-state.ts) (pure functions, fully unit-tested) and the UI binding lives in [`src/ts/url-state-binding.ts`](src/ts/url-state-binding.ts).

## Modern tooling

This fork adds the engineering infrastructure that wasn't in the original:

- **ESLint flat config + Prettier** (the original used `tslint`, deprecated since 2019).
- **Strict TypeScript**: `strict` + `strictNullChecks` on, ES2020 target.
- **GitHub Actions CI** runs lint, format-check, typecheck, tests, and the full build on Node 20 and 22 on every push.
- **Vitest test suite** (70 tests) covering the pure logic — export-dimension math, the URL state codec — and the URL binding layer, where the `Page` framework and `Parameters` singleton are substituted with recording fakes so no browser is needed. See `src/ts/**/*.test.ts`.
- **Husky pre-commit hook** runs lint + typecheck + tests locally before each commit.

---

## Run locally

1. Install [Node.js](https://nodejs.org/) **20 or newer** (see `engines` in `package.json`; an `.nvmrc` is provided).
2. From the project folder, install dependencies and build:

   ```bash
   npm install
   npm run build
   ```

3. Serve `docs/` on `http://localhost:8080`:

   ```bash
   npm run http-server
   ```

To rebuild on source changes: run `npm run build` again, or `npm run webpack:watch` in another terminal alongside `http-server`.

`npm run build` regenerates everything under `docs/` (the GitHub Pages site): the app page and the readme page from `src/generate-page.ts`, the shaders, the static assets, and the webpack bundle. `docs/` is committed, so commit the rebuilt output along with the source change that caused it. `npm run check` runs lint, format check, typecheck, and tests; the same checks run in CI and in the pre-commit hook.

## Releases

See [`CHANGELOG.md`](CHANGELOG.md) for what changed in each release.

## How a stereogram works

*(This section is from the original project, lightly edited. Full credit to Jérémie Piellard for the explanation and diagrams.)*

### Base idea

The brain perceives depth by combining the two slightly different images coming from our eyes. If an object looks exactly the same from both eyes, it's far in the distance; if it looks very different from each eye, the eyes have different perspectives on it and it's very close.

Since depth perception is binocular, to show a 3D object in a 2D image we need to trick the brain into thinking each eye sees a different perspective. Looking directly at the image doesn't work — the brain sees it's flat. The viewer has to focus a point either before the image or behind it.

Now consider what happens when someone looks at an object through a transparent screen:

<div style="text-align:center">
    <img alt="Depth creates repetition" src="src/readme/diagram-01.png"/>
    <p><i>There are two "ghosts" of the object on the screen because the eyes see it from different positions.</i></p>
</div>

Compare a near object to a far one:

<div style="text-align:center">
    <img alt="Repetition period vary with distance" src="src/readme/diagram-02.png"/>
    <p><i>The closer an object is to the screen, the closer its ghosts are on the screen.</i></p>
</div>

So: if the viewer looks beyond the image and we repeat a pattern, the brain interprets it as the pattern actually being behind the screen. Varying the repetition frequency creates the illusion of relative depth.

<div style="text-align:center">
    <img alt="Depth perception and repetition frequency" src="src/readme/tutorial_medium.png"/>
    <p><i>Daisies appear further away than butterflies because of the difference in repetition frequency.</i></p>
</div>

Only one repetition is needed to perceive depth, so on a single row varying the repetition frequency creates a slope:

<div style="text-align:center">
    <img alt="We can change depth on a single row" src="src/readme/frequency-change.png"/>
    <p><i>On each row, the repetition frequency varies, giving the perception of depth variation.</i></p>
</div>

### Algorithm

Inputs:

- a depth map encoded as a black-and-white image (in this example, a sphere)
- a base pattern (in this example, a seamless clouds texture)

Pick a base repetition period in pixels. Split the target image into vertical stripes, each one period wide.

<div style="text-align:center">
    <img alt="Image split in stripes" src="src/readme/demo_stripes_empty.png"/>
    <p><i>Target image split into 5 vertical stripes plus the reference stripe on the left.</i></p>
</div>

Make each stripe a repetition of the previous one. The far-left stripe is the reference:

<div style="text-align:center">
    <img alt="Repetition without displacement" src="src/readme/demo_stripes.png"/>
    <p><i>Repeating the first stripe without displacement: the viewer perceives a flat surface.</i></p>
</div>

Introduce horizontal displacement so each stripe is a displaced version of the previous one. Each pixel's local displacement comes from sampling the depth map at that position. The leftmost stripe has no reference to displace from, so the depth map is scaled and shifted right so all of it is sampled:

<div style="text-align:center">
    <img alt="Repetition with displacement" src="src/readme/demo_final.png"/>
    <p><i>Repeating the first stripe with displacement: the viewer perceives 3D objects.</i></p>
</div>

Every pixel ends up being a displaced version of the source stripe. Displaying the UV coordinates makes the displacement visible:

<div style="text-align:center">
    <img alt="Repetition with displacement" src="src/readme/demo_uv.png"/>
    <p><i>The sphere-shaped displacement sampled from the depth map is clearly visible.</i></p>
</div>

## How to see a stereogram

Seeing the 3D scene takes practice. The key is to look *beyond* the image, not at it:

- Consciously relax your eyes as if looking into the distance.
- Or: start with your head very close to the screen — so close you can't focus — then move back slowly without re-focusing.
- Or: hold a pen behind the screen, off to the side, stare at the pen, then slowly move it toward the center of the screen.

If you can't quite see a clear 3D object but you feel something weird, you're on the right track.

### Practice images

<div style="text-align:center;margin:48px 0">
    <p><i>Relax your eyes and a third black dot should appear in the middle.</i></p>
    <img alt="Easy practice" src="src/readme/tutorial_easy.png"/>
</div>

<div style="text-align:center;margin:48px 0">
    <p><i>Each row should float at a different depth: daisies far away, red flowers closer, blue butterfly closer still, yellow flowers closest.</i></p>
    <img alt="Medium practice" src="src/readme/tutorial_medium.png"/>
</div>

<div style="text-align:center;margin:48px 0">
    <p><i>Looked at correctly, a clear 3D object appears.</i></p>
    <img alt="Hard practice" src="src/readme/tutorial_hard.jpg"/>
</div>

## License

MIT. See [`LICENSE`](LICENSE) — copyright is split between the original author (Jérémie Piellard, 2021) and the modifications in this fork (William Bottini, 2026).
