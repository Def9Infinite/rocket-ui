# ORBITAL — Rocket Launch Stream Overlay (for OBS)

**English** · [简体中文](README.zh-CN.md)

A broadcast-style overlay kit for a rocket launch livestream. You capture the
**video feed yourself** in OBS; these pages are **transparent overlays** that
composite on top of it. One **control panel** drives every overlay at once —
they stay in sync automatically.

## Files

Overlays render at **2× (supersampling)** so they stay sharp on stream — set each OBS Browser
Source to the size below, then **scale it to 50%** on your canvas (the on‑canvas footprint is half
each number). Override the scale per source with `?s=<n>` in the URL (`?s=1` = no supersampling).

| File | Role | OBS Browser Source size (@2×) |
|------|------|--------------------------|
| `index.html` | **Control panel** (operator dashboard) — *do not put on stream* | open as a window/dock |
| `titlebar.html` | Mission name · vehicle · LIVE · status pill | **3840 × 168** — top, full width |
| `countdown.html` | T‑minus / T‑plus clock, HOLD banner | **1120 × 376** — top center |
| `weather.html` | Live range weather + GO/NO‑GO | **600 × 800** — lower left |
| `rocket.html` | Vehicle / stage spec block | **640 × 1344** — right side (grows w/ sections) |
| `timeline.html` | Moving flight timeline with event markers | **3840 × 208** — bottom, full width |
| `ticker.html` | Rolling key‑info ticker (alt to timeline) | **3840 × 144** — bottom |
| `trajectory.html` | **Ascent trajectory animation** (WebGL hi‑res globe + orbit) — full scene | **1920 × 1080** (1×, no supersampling) |
| `common.js`, `styles.css` | Shared engine + theme (Maple Mono bundled in `fonts/`) | — |

### Trajectory animation (`trajectory.html`)
A separate full‑screen view (open it from the control panel's **🛰 TRAJECTORY** button, or as its own
1920×1080 OBS Browser Source / scene). On a borderless gray land/ocean **globe — rendered in WebGL from a
high‑resolution (1:10m) coastline** so it stays crisp at any zoom — it: highlights the launch site, flies the
**computed ascent ground track** (launch azimuth derived from the site latitude + target inclination — NE for
a 53° LEO, *south* for a Vandenberg SSO), zooms out as simulated **T+** advances, fires your timeline events
as callouts, and ends on a **globe view of the final orbit** (an inclined ring at the target altitude — the
vehicle is genuinely in orbit by payload separation). The **major milestones (★) are marked directly on the
ascent path** with dot + label + T+ time (just like the timeline), and the side list shows the major
milestones only. Fully **localized (EN / 中文)** — it follows the control panel's language toggle. Orbit is
read from the payload's target‑orbit field; you can also override altitude/inclination in its bottom bar.
Controls: play/pause, replay, scrub, speed, and `C` for a clean (UI‑hidden) output.

## Quick start

1. **Run the sync server** (required — this is what pushes live updates to OBS):
   ```bash
   cd "Stream UI"
   python3 server.py 4187
   ```
   Then open `http://localhost:4187/index.html` — that's the control panel.

   > ⚠️ Use **`server.py`**, not `python3 -m http.server`, and load overlays by **URL, not “Local file.”**
   > OBS Browser Sources are separate browser processes that don't share storage; the server relays
   > state between them. Plain `http.server` / `file://` will load the overlays but they **won't update.**

2. **In OBS**, add your **video capture** (Display/Window/Camera) as the bottom layer.

3. For each overlay, add **Sources → + → Browser**, **paste the `http://localhost:4187/…` URL**
   shown in the control panel under *OBS Browser Sources* (leave **Local file unchecked**), and set
   the **size** from the table above. Position each on your canvas — the control panel's
   **Program Monitor** shows the reference layout.

4. Keep the **control panel** open in its own window/dock. Everything you do there
   updates all sources instantly.

## What the control panel does

- **Language** — an **EN / 中文** toggle in the header localizes the whole interface **and every overlay** (status, countdown, weather, vehicle spec, ticker, and the common flight-event labels). The choice persists and syncs to all sources.
- **Sequence** — `START COUNT`, `HOLD`/`RESUME`, presets (10:00 / 02:00 / 00:10 / LIFTOFF), or type any `mm:ss`.
- **Mission status** — the colored status pill on the title bar. Leave it on **AUTO** to track the countdown automatically (STANDBY → T‑MINUS → HOLD → IN FLIGHT), or force a specific status: **STANDBY**, **HOLD**, **NEW T‑0**, **SCRUBBED**, **IN FLIGHT**, **SUCCESS**, or **DESTROYED** — each color‑coded (SUCCESS green, SCRUBBED amber, DESTROYED red with a pulsing dot).
- **Liftoff · T‑0 (UTC)** — set T‑0 to an absolute **UTC date/time**; the count locks to that instant (and the panel shows the current T‑0 in UTC). Relative `mm:ss` presets still work and are shown as their resulting UTC time.
- **Bottom band** — `TIMELINE` / `TICKER`, plus a **CLEAR** toggle to make the band semi‑transparent (drops the dark backing; text keeps a shadow so it stays legible over bright video). The timeline is a slim two‑lane design (≤100 px).
- **Launch site & weather** — pick a pad; live weather is pulled from Open‑Meteo (falls back to simulated if offline) and a launch GO/NO‑GO is computed.
- **Vehicle spec** — every field of the rocket block is editable (engines, thrust, burn times, etc.). The Vehicle row shows the rocket's lift **Capacity**, distinct from the actual cargo. **Payload** (name / customer / type / mass / target orbit), **Boosters**, **Third Stage**, and **Upper Stage** are optional sections — toggle them on per‑mission; they only appear in the overlay when enabled (the card grows to fit).
- **Vehicle presets** — quick‑load a built‑in vehicle spec (Falcon 9 Block 5, Long March 2F, Long March 5, Electron) with `LOAD PRESET`.
- **Profiles (files)** — `SAVE PROFILE` downloads the **rocket spec + flight timeline** together as a single portable `.json` file; `LOAD PROFILE` reads one back. Easy to reload across machines, back up, or share.
- **Flight timeline** — add / edit / reorder events. Time accepts `T+02:35`, `-1:00`, or `145` (seconds); ★ marks a major milestone (MECO, Stage Sep, Fairing Sep, Landing…).

Shortcuts: `Space` = hold/resume · `T` = timeline/ticker · `Esc` = close dialog.

## How sync works

OBS Browser Sources are **separate browser processes** and do **not** share `localStorage`,
so the control panel relays state through the **sync server** (`server.py`): the panel
`POST`s the state to `/state`, and every overlay polls `GET /state` (~300 ms) and applies it.
`localStorage` is still used as a same‑browser fast path and for persistence. The clock is
stored as a timestamp and each overlay computes T locally every frame, so the countdown is
smooth regardless of sync latency. A heartbeat re‑pushes the state every few seconds, so a
restarted server or a newly‑added source catches up automatically.

**If overlays aren't updating:** you're almost certainly running plain `http.server` or loading
overlays as **Local file**. Switch to `python3 server.py` and use the `http://localhost` URLs.
