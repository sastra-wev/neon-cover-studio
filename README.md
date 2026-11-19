# Neon Cover Studio

[![Competition](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/sastra-wev/neon-cover-studio/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/sastra-wev/neon-cover-studio/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

Entry for the make.fun **gta6-cover-art-01** bounty:
https://make.fun/bounty/gta6-cover-art-01

**Neon Cover Studio** is a GTA-style cover art maker that runs entirely in the
browser. Drop in your own photos, arrange them across a multi-panel poster
layout with white panel edges, grade the colours, letter a bold title and
caption over the art, and export a share-ready PNG. Static web app, no build
step, no network — your photos are read on your own machine and never
uploaded anywhere. Original design throughout; no Rockstar Games logos,
wordmarks, artwork or fonts.

## What it does

- **Any photos, your way** — add several photos by file picker or drag & drop.
  Each panel can hold a different photo, or one photo can span every panel.
  Click a panel (or a thumbnail) to assign photos.
- **Five poster layouts** — Hero (1 panel), Split (2), Wide bands (3),
  Classic (5) and Mosaic (6), all with white edges between panels.
- **Per-panel framing** — drag a photo right on the cover to reposition it,
  zoom with the slider or the mouse wheel, and switch each panel between
  Fill (crop to panel) and Fit (whole photo).
- **Canvas colour grades** — Sunset Vice, Neon Night, Duotone (violet → pink
  → amber), Comic B&W (hard-stepped black and white), or no grade.
- **Lettering** — an editable title in big display type and a caption line
  under it, with colour pickers, a size slider, top / middle / bottom
  placement and optional heat stars. The title face is Anton, vendored
  locally under the SIL Open Font License (`app/fonts/`, license included).
- **Exports** — one click downloads a PNG at **1080 × 1080**, **1080 × 1350**
  or **1920 × 1080**.

## Run it

```bash
node serve.ts            # then open http://localhost:8080
```

or serve `app/` with any static file server and open `index.html`. Vanilla
JavaScript ES modules, no dependencies, no build step, works offline.

## Source layout

- `app/src/state.js` — editor state: photos, panel placements, lettering, export size
- `app/src/layouts.js` — the five poster layouts as normalised panel rectangles
- `app/src/grade.js` — the colour grades (canvas filters, gradient washes, pixel-mapped duotone/comic)
- `app/src/cover.js` — the one renderer behind both the preview and every export
- `app/src/text.js` — title / caption / heat-star lettering on the canvas
- `app/src/export.js` — offscreen renders and PNG downloads at the three post sizes
- `app/src/ui.js` — the editor: buttons, photo tray, drag & wheel panel framing
- `app/src/shots.js` — the fixed `?shot=` scenes the screenshots were taken from
- `app/src/main.js` — wiring and first paint
- `app/fonts/` — Anton (SIL OFL 1.1, license file beside it), loaded locally only
- `app/samples/` — two sample photos made with an image model, free to use

## Hand in (maintainers)

```bash
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output folder and writes
`dossier.json` with the vendored make.fun library (`vendor/makefun-app.ts`,
unmodified).

## License

MIT — see `LICENSE`. The Anton font is licensed separately under the SIL
Open Font License 1.1 (`app/fonts/OFL.txt`).
