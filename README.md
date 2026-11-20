# Neon Palms — Cover Studio

![Competition](https://make.fun/api/badges/competition/gta6-cover-art-01.svg)
![Rank](https://make.fun/api/badges/repos/faris-ecohomes/gta6-cover-art-01/rank.svg)
![Reward](https://make.fun/api/badges/repos/faris-ecohomes/gta6-cover-art-01/reward.svg)

An entry for the make.fun bounty
[gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01): a cover
art maker that turns your photos and a caption into GTA-style poster art,
entirely in the browser and entirely offline.

## What it does

Neon Palms arranges your photos into the multi-panel layouts of the
classic game-poster look — pale gutters between panels, one hero shot,
supporting scenes stacked around it — then finishes the frame with a
colour grade, film grain, a vignette and the lettering: a heavy condensed
headline filled with a sunset gradient, a script tagline, and a row of
heat stars. The finished cover exports as a PNG sized for posting.

- **Five layouts** — Showcase (hero plus a side stack), Mosaic (nine
  panels), Quarters, Columns and Billboard (one full-frame photo).
- **Four colour grades plus raw** — Dusk, Vice, Gold and Mono, each a
  photo filter paired with its own tinted wash.
- **Hands-on panels** — click a panel to select it, drag to reposition
  its photo, scroll to zoom; drop photos from the tray into any panel.
- **Three export sizes** — 1080 × 1080, 1080 × 1350 and 1920 × 1080.
  The preview canvas carries the export pixels, so what you see is the
  file you download.
- **Your photos stay yours** — no uploads, no network calls; four
  AI-made sample photos are included so the studio works the moment it
  opens.

## Run it

```sh
node serve.ts            # serves app/ at http://localhost:8080
```

Open the page, borrow the samples or add your own photos, pick a layout
and grade, write your headline, and download the PNG.

## Hand in (the kit's program/v1 plumbing)

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and
writes `dossier.json` there with the kit's vendored `buildDossier`
(`vendor/makefun-app.ts`, the kit's own copy, unchanged).

## Layout of this repository

- `app/` — the web app: `index.html`, `style.css`, and ES modules under
  `src/` (`layouts.js` panel geometry, `render.js` the canvas painter,
  `studio.js` the editor, `scenes.js` the screenshot scenes), plus
  `samples/` (four AI-generated photos) and `fonts/` (Anton and Pacifico,
  both SIL Open Font License — license texts sit beside the fonts).
- `screenshots/` — four JPEGs rendered from this app: a wide cover, the
  studio at work, a portrait cover and a square cover. `shots.json`
  lists the scenes; `take-shots.mjs` re-takes them with a headless
  browser.
- `main.ts`, `serve.ts` — the hand-in program and a local dev server,
  both Node standard library only.

## License

MIT — see `LICENSE`. The fonts under `app/fonts/` are under the SIL Open
Font License 1.1 (see the `*-OFL.txt` files there).
