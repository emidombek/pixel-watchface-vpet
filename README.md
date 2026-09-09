# Pixel Pet — Versa 4 clock face

A Tamagotchi-inspired clock face. Each pet lives through one life cycle:
starts as a randomly-chosen species' egg (8 species, drawn from a shuffled
deck so you see all 8 once before any repeat), advances one stage per treat
(egg → baby → teen → adult), then lingers at its fully-grown adult form
for 3 days before retiring — at which point a new egg hatches from the deck,
guaranteed to be a different species than the one that just finished. Treats
are earned once per day, only when you hit your step goal, and a lifetime
treat count persists across every cycle as a running stat.

## Files

- `package.json` — app manifest (name, permissions, build target)
- `app/index.js` — clock tick logic, step/treat tracking, stage+species state machine
- `resources/index.view` — SVG layout (pet image, time, steps, treats, goal badge)
- `resources/styles.css` — text styling
- `resources/images/` — 16 pixel-art sprites (4 species x 4 stages) plus two small icons
- `gen_sprites.py` — the script that generated the placeholder sprites; edit and
  rerun it, or replace the PNGs by hand, to design your own pets and eggs
- `sprite_sheet_preview.png` — a contact sheet of all 16 sprites for a quick look

## Files

- `package.json` — app manifest (name, permissions, build target)
- `app/index.js` — clock tick logic, step/treat tracking, evolution life-cycle,
  behavior detection (idle/walk/roll/sleep/eat), and the checker-static
  evolution transition
- `resources/index.view` — SVG layout (pet image, static overlay, time, steps,
  treats, goal badge)
- `resources/styles.css` — text styling
- `resources/images/` — pixel-art sprites, named `<species>-<stage>-<behavior>-<frame>.png`
  (e.g. `sprout-baby-walk-1.png`). Two frames per behavior. Egg and baby
  stages use `roll` instead of `walk` (no legs); `run` reuses walk/roll art,
  just played back faster - no separate run art needed. Some species (see
  `SPECIES_ALWAYS_ROLL` in `app/index.js`) roll at every stage regardless of
  legs, as a deliberate design choice - currently just `bloom`. Egg stage has
  no `eat` art (falls back to idle if ever needed) - instead, when an egg
  earns its hatching treat, it plays a dedicated `hatch` animation
  (`<species>-egg-hatch-1/2.png`) instead of the generic checker-static
  transition used everywhere else.
- `gen_sprites.py` — placeholder generator. Species in `SPECIES_WITH_REAL_ART`
  are skipped so it never overwrites real art - update that set as you finish
  more species. Currently: **sprout is done** (idle/roll or walk/sleep for all
  4 stages, eat for baby/teen/adult). The other 7 species are still
  placeholders.
- `sprite_sheet_preview.png` — a contact sheet of each species' idle-1 frame
  for a quick look

## Customizing the pixel art

For any behavior/frame combo, either edit `gen_sprites.py`'s shape grids and
rerun it (placeholder species only), or draw/paste real art directly into
`resources/images/` following the naming convention above. Keep every sprite
on the same 32x32 canvas regardless of stage - growth is shown by how much
of that canvas the creature fills (roughly 50/65/80/95% for egg/baby/teen/adult),
not by changing canvas size.

## Building and sideloading

1. Install Node.js if you don't have it, and create a free Fitbit developer
   account at dev.fitbit.com (same account your watch is paired to).
2. From the project root: `npm install` (this pulls in `@fitbit/sdk` and
   `@fitbit/sdk-cli`, already pinned in `package.json` to versions known to
   work with the Versa 4's "hera" build target).
3. Generate an app ID for this project: `npx fitbit-build generate-appid`.
   This writes an `appID` into `package.json` for you — no manual UUID
   editing needed.
4. Build it: `npx fitbit-build`.
5. On your phone, open the Fitbit app → your Versa 4 → **Developer Bridge**,
   and enable it to pair your dev machine with the watch over Bluetooth.
6. Open the Fitbit dev shell (`npx fitbit`), then run `connect device` and
   `connect phone` to link up, and `install` to push the build — this is the
   actual "sideload" step.
7. To remove it later: Fitbit app → your Versa 4 → **Developer** → **Sideloaded
   apps** → Pixel Pet → delete.

Note: this pins to SDK `6.2.0-pre.1` / CLI `1.8.0-pre.10` rather than the
newer SDK 7, since that combo is the one the Versa 4/Sense 2 developer
community has documented as working for sideloading (the official SDK's
newest releases target Versa 3/Sense only).

## How the logic works (app/index.js)

- `today.adjusted.steps` (from the `user-activity` module) drives the stage.
- A small JSON file (`pet-data.json`) written via the `fs` module persists
  `treats`, the last date a treat was awarded, and whether today's treat has
  already been claimed — so treats don't double-award and stage resets daily
  without losing species progress.
- Thresholds (`STAGE_THRESHOLDS`, `SPECIES_THRESHOLDS`, `STEP_GOAL`) are all
  constants at the top of the file — easy to retune.
