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

**Planned in this branch** (in progress):

- Shareable URL state: every parameter encoded in the URL hash so any configuration is a copy-pasteable link
- Modern tooling pass: tslint → ESLint + Prettier, GitHub Actions CI, Vitest test suite, modern TS target
- Hand-written UI replacing the generated control panel: design-system CSS variables, dark mode, container-query-based responsive layout, a11y pass

See `CHANGES.md` (coming) for a running log.

---

## Run locally

1. Install [Node.js](https://nodejs.org/) **18.16 or newer** (see `engines` in `package.json`).
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
