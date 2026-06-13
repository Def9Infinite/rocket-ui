# ORBITAL — Rocket Launch Stream Overlay (for OBS)

A broadcast-style overlay kit for a rocket launch livestream. You capture the
**video feed yourself** in OBS; these pages are **transparent overlays** that
composite on top of it. One **control panel** drives every overlay at once —
they stay in sync automatically.

## Files

| File | Role | OBS Browser Source size |
|------|------|--------------------------|
| `index.html` | **Control panel** (operator dashboard) — *do not put on stream* | open as a window/dock |
| `titlebar.html` | Mission name · vehicle · LIVE · status pill | **1920 × 80** — top, full width |
| `countdown.html` | T‑minus / T‑plus clock, HOLD banner | **560 × 170** — top center |
| `weather.html` | Live range weather + GO/NO‑GO | **300 × 330** — lower left |
| `rocket.html` | Vehicle / stage spec block | **320 × 430** — right side (grows w/ stages) |
| `timeline.html` | Moving flight timeline with event markers | **1920 × 92** — bottom, full width |
| `ticker.html` | Rolling key‑info ticker (alt to timeline) | **1920 × 64** — bottom |
| `common.js`, `styles.css` | Shared engine + theme | — |

## Quick start

1. **Serve the folder** (recommended for reliable sync):
   ```bash
   cd "Stream UI"
   python3 -m http.server 4178
   ```
   Then open `http://localhost:4178/index.html` — that's the control panel.
   (`file://` also works in OBS, but a local URL is the most reliable.)

2. **In OBS**, add your **video capture** (Display/Window/Camera) as the bottom layer.

3. For each overlay, add **Sources → + → Browser**, tick **Local file** (or paste the
   URL shown in the control panel under *OBS Browser Sources*), and set the **size**
   from the table above. Position each on your canvas — the control panel's
   **Program Monitor** shows the reference layout.

4. Keep the **control panel** open in its own window/dock. Everything you do there
   updates all sources instantly.

## What the control panel does

- **Language** — an **EN / 中文** toggle in the header localizes the whole interface **and every overlay** (status, countdown, weather, vehicle spec, ticker, and the common flight-event labels). The choice persists and syncs to all sources.
- **Sequence** — `START COUNT`, `HOLD`/`RESUME`, presets (10:00 / 02:00 / 00:10 / LIFTOFF), or type any `mm:ss`.
- **Liftoff · T‑0 (UTC)** — set T‑0 to an absolute **UTC date/time**; the count locks to that instant (and the panel shows the current T‑0 in UTC). Relative `mm:ss` presets still work and are shown as their resulting UTC time.
- **Bottom band** — `TIMELINE` / `TICKER`, plus a **CLEAR** toggle to make the band semi‑transparent (drops the dark backing; text keeps a shadow so it stays legible over bright video). The timeline is a slim two‑lane design (≤100 px).
- **Launch site & weather** — pick a pad; live weather is pulled from Open‑Meteo (falls back to simulated if offline) and a launch GO/NO‑GO is computed.
- **Vehicle spec** — every field of the rocket block is editable (engines, thrust, burn times, etc.). The Vehicle row shows the rocket's lift **Capacity**, distinct from the actual cargo. **Payload** (name / customer / type / mass / target orbit), **Boosters**, **Third Stage**, and **Upper Stage** are optional sections — toggle them on per‑mission; they only appear in the overlay when enabled (the card grows to fit).
- **Vehicle presets** — quick‑load a built‑in vehicle spec (Falcon 9 Block 5, Long March 2F, Long March 5, Electron) with `LOAD PRESET`.
- **Profiles (files)** — `SAVE PROFILE` downloads the **rocket spec + flight timeline** together as a single portable `.json` file; `LOAD PROFILE` reads one back. Easy to reload across machines, back up, or share.
- **Flight timeline** — add / edit / reorder events. Time accepts `T+02:35`, `-1:00`, or `145` (seconds); ★ marks a major milestone (MECO, Stage Sep, Fairing Sep, Landing…).

Shortcuts: `Space` = hold/resume · `T` = timeline/ticker · `Esc` = close dialog.

## How sync works

State lives in the browser's `localStorage` and is broadcast to every page via
`BroadcastChannel` + storage events, with a **300 ms polling fallback** so it still
works across separate OBS Browser Sources (which don't always share live events).
The clock is stored as a timestamp and each overlay computes T locally every frame,
so the countdown is always smooth regardless of sync latency. All edits also persist,
so a refresh (or OBS restart) restores your mission.
