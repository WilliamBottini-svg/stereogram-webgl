# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

This project is a fork of [piellardj/stereogram-webgl](https://github.com/piellardj/stereogram-webgl)
by Jérémie Piellard. Version numbers below are this fork's own; the upstream project is
unversioned. The fork branched from upstream commit `44ceea3` ("Support high DPI screens").

## [1.0.0] - 2026-09-02

First tagged release of the fork.

### Added

- Pattern placement controls: offset X/Y, zoom, and repeat scale X/Y.
- Pattern crop controls (left / right / top / bottom), with the crop's aspect ratio driving
  the tile shape so cropped content is never stretched.
- Fullscreen preview with square and fill-screen modes, optionally using the browser
  fullscreen API.
- Download size selector (1024 / 2048 / 4096 px longest side), clamped to the WebGL
  limits of the current GPU.
- Shareable URL state: every numeric, boolean, and enum parameter is mirrored into the URL
  hash, plus a "Copy link" button. Uploaded images are intentionally not encoded.
- Redesigned UI: CSS custom-property design system, light / dark theme with a no-flash
  bootstrap, mobile bottom-sheet control panel, collapsible control sections, editable
  numeric fields and reset buttons next to every slider.
- Tooling: ESLint flat config, Prettier, strict TypeScript, Vitest suite for the pure
  logic and the URL binding layer, Husky pre-commit hook, GitHub Actions CI.
- Open Graph / Twitter card metadata on the generated pages so shared links unfurl with a
  preview image.
- `CHANGELOG.md`, `.nvmrc`, and `npm run check` (lint + format + typecheck + tests).

### Changed

- The generated app page and readme page now link to this repository and its live demo,
  and keep an explicit attribution line to the original author. Previously the footer
  carried the upstream author's personal e-mail and LinkedIn badges, and the readme page's
  images and "Live project" button pointed at the upstream repository.
- Relative links in `README.md` are made absolute on the generated readme page so they
  resolve from the GitHub Pages site as well as from GitHub.
- CI now runs the complete build (`npm run build`) on Node 20 and 22 instead of skipping
  page generation.
- Minimum supported Node.js version is 20 (Node 18 reached end of life in April 2025).
- Dev dependencies refreshed within their declared ranges (TypeScript 5.9, webpack 5.110,
  Prettier 3.9, ...) and Vitest upgraded to 4. The `webpage-templates` git dependency is now
  pinned to an exact commit so builds are reproducible.

### Fixed

- `npm run build` failed on Linux and macOS with `ENOENT ... home/user/...` because the
  webpage-templates dependency replaces EJS's include resolver in a way that drops the
  leading slash of absolute include paths. The generator now re-roots those paths. As a
  consequence the deployed readme page was months out of date and the app page's
  stylesheet link and theme bootstrap had to be pasted into `docs/index.html` by hand
  after every build; both are now produced by the build.
- The "Upload a depth map" / "Upload a pattern" buttons rendered as blank blue rectangles:
  the redesign styled the wrapper as a filled button while the framework kept painting the
  inner label in the accent colour, giving accent-on-accent text. The inner label is now
  the button.
- An empty red error banner was shown at the top of the page on every load, because the
  error block always contains a `<noscript>` element and therefore never matched `:empty`.
- Long control-section titles ("Pattern placement") wrapped onto two lines.
- In "Moving" depth-map mode the OBJ model file was requested again on every animation
  frame until the first request finished (the "loading" sentinel was lost in the strict
  TypeScript migration). The model is now requested once.

[1.0.0]: https://github.com/williambottini-svg/stereogram-webgl/releases/tag/v1.0.0
