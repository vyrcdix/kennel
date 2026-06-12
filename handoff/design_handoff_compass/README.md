# Handoff: Compass (the orientation layer) — Tidewater / Steep

## Overview

**Compass** adds the one layer that sits *above* everything Steep already is.
Steep is water — things wash in, drift, go deep, get swept. Compass is the few
**fixed bearings** above the tide: a persistent, forward-pointing sense of
*what the user is about and why*. A bearing is structurally a **forward-pointed
crystal** — what you're moving *toward*, not what you concluded — and it gives
meaning to the threads, focus items, cadences, and crystals beneath it.

The product thinking is in **`steep-orientation-layer.md`** (the concept note,
in this folder) — read it first; this README is the *build* spec. The visual
reference is **`Compass — orientation layer concepts.html`** (the standalone
study: three directions each for the persistent surface and the
compounding-evidence visual, in day + night). The **built reference module** is
**`tide-compass.jsx`** — a working prototype of the shipping direction
(B + C), already wired into the Tidewater app.

This README assumes the rest of Steep / Tidewater (capture, Sort, Reflecting,
Aging, Crystals, Cadence) is **already implemented** and documents **only the
Compass additions**.

## Fidelity

**High-fidelity.** Final palette, type, spacing, copy, interactions. Recreate in
the codebase using the existing Tidewater token layer and component classes
(`.panel`, `.crystal`, `.hearth`, `.btn`, `.pill`, `.chip`, `.mono`,
`.display`, `.eyebrow`, `.row`, `.kbd`). **No new colors or fonts** — Compass
reuses the **sacred (sea-glass amber)** family and a star/compass cue. New
`.cmp-*` classes (below) are layout-only.

---

## Decisions locked (this round)

These were weighed and decided with the PM. Build to them.

1. **Ship B + C** (of the three persistent-surface directions in the concept doc):
   - **B — Compass, the lens + a chrome anchor**: a new Mood you return to, plus
     a quiet "✦ Compass" anchor on the dashboard band.
   - **C — the spine**: a third lens on the dashboard's *In focus* panel,
     **"Under a bearing,"** where everything nests under the bearing it serves;
     orphans stay **"loose in the water,"** named, never shamed.
   - Direction **A** (the rotating dawn band) lives *inside* the dashboard band
     and the lens, used to fight habituation — not as its own surface.
2. **Compounding evidence: the wake leads.** The *wake* (a lengthening trail
   behind a single point of travel, pointed at the star) is the hero on the
   orientation page. The *deepening field* backs it as a calmer dashboard
   readout; the *crossing* appears on any bearing with a horizon. In all three:
   **only kept days render, gaps are simply absent, counts are mono.** Never a
   streak, never a progress bar, never a contribution grid.
3. **Small promises = a tiny Cadence**, not a new actions layer (that would
   crowd an already-busy UX). Same engine + vitality language, attached up to a
   bearing, tuned for zero debt. **Build requirement:** store a **`role`**
   attribute on the cadence (`promise` | `practice`) so promises can split into
   their own object later **without a data migration**.
4. **The horizon is optional**, not universal. Only concrete bearings with a
   real finish line carry one (e.g. "Run Chicago 2027"). Intangibles
   ("Stay close to the people I love") have **no clock and no percentage** —
   forcing one would break the no-progress-bar rail.
5. **Naming** (see the naming section): Dashboard → **Harbour**,
   Aging → **Driftwood**, Pinned threads → **Currents**.

---

## Non-negotiables (inherit from the brief + ADHD guidance)

- **Quiet by default.** No badges, notifications, streaks, nagging.
- **No red for accumulation.** Red = genuine errors only.
- **No progress bars on intangibles.** No invented percentages.
- **No streaks / "don't break the chain."** Compounding is *accumulated
  evidence*, not an unbroken line. A missed day leaves **no trace**.
- **Few, not many.** 3–6 bearings; **high-friction to add** — the inverse of
  capture. The constraint is the feature.
- **A rare, separate mood.** Setting a bearing never intrudes on capture or Sort.

---

## The model: a bearing = a forward-pointed crystal

Three nested altitudes (from the concept note):

- **Orientation (top, few):** a life-orienting statement. Forward-pointed
  sibling of the crystal — a star glyph + `orientation` type label instead of
  the gem, a directional cue, otherwise the same keepsake skin.
- **Horizon (middle, optional ~1000 days):** ambient context — "day 318 / 1000,"
  derived, framed as *room remaining* ("682 days of water still ahead"), never a
  countdown.
- **Small promises (bottom, daily):** a tiny kept promise (a tiny Cadence).

---

## Data model (schema path assumed — confirm before build)

Assumed path **(A)** from concept note §5: a **sixth crystal type**
`orientation` alongside principle/quote/reminder/hint/memory. It inherits the
resurfacing machinery for free.

| Concern | Shape |
|---|---|
| The bearing object | crystal `type = orientation` (a forward-pointed crystal) |
| Horizon | optional metadata: `start_date` + `target_date`; "day N / total" + "days ahead" **derived** (same pattern as Temperature deriving from `updated_at`) |
| What's built toward it | a **query** over the existing **attach** relation (focus items / cadences / crystals whose `serves`/attachment points at the bearing) — *no new storage* |
| Small promise | an existing **action item** with `cadence=daily` **plus a new `role` key** in `metadata` (`promise` \| `practice`); reuses the Cadence engine |
| Compounding evidence | the **activity log** filtered to the bearing; only "kept" events render |
| "still what you're about?" | the crystal resurface cadence, re-pointed at the bearing |

Net-new persistence ≈ the type enum + two horizon dates + the cadence `role`
key. Everything else reuses existing machinery. **Move to a thin new entity only
if the horizon + roll-up fields prove awkward on a crystal.**

---

## Surfaces (the integration points)

### 1. Compass — a new Mood (lens) · `TideCompass`
A dedicated lens you return to in orientation-mood. Sky header (the one place
the layer shows its altitude), then the bearings as cards: glyph medallion,
statement, optional horizon chip (or "no clock"), what it **keeps warm**
(cadences + a kept crystal), the owning currents, today's promise, and a count
of what's under it. "Set a new bearing" is **deliberately high-friction**.
- Nav: new entry under **Moods**, placed directly below **Harbour**, gold
  (sacred) accent like Crystals. Route `compass`.

### 2. Dashboard dawn band · `CompassBand`
A quiet `.cmp-sky` band **above Worth revisiting**, surfacing **one** bearing at
a time (rotating to avoid habituation), with the **✦ Compass** anchor → the lens.
Ambient context, never a KPI.

### 3. The spine — a third *In focus* lens
Dashboard *In focus* segmented control gains **"Under a bearing"** beside
"What it serves" / "By when". Backed by `groupFocus('orient')`: focus items
nest under the bearing they serve; unattached items fall into the
**"loose in the water — not under a bearing yet"** group. (Verified live: Japan
items nest under "See more of the world," marathon items under "Run Chicago,"
the dishwasher task stays loose.)

### 4. The orientation page · `TideOrientation`
A bearing's detail — a forward-pointed crystal (`.crystal` keepsake skin) with:
the `orientation` type label + current pills, the statement + note, the optional
**horizon** field, the **wake** hero (`{kept} kept across {days} days`), the
**"what's built toward this"** roll-up (focus + cadences + the crystal +
"+ small promise / recurring action"), **today's small promise** (one-click
keep; kept feels good, skipped leaves no trace), and the **"still what you're
about?"** block (Still true / Reword / Let it set) — the emotional peak.

### 5. Crystals gallery + resurfacing variant (designed, **not yet built live**)
The concept doc shows orientations rendered in the **Crystals gallery** as a
forward-pointed type, and a **"still what you're about?"** card surfacing in the
**Worth revisiting** slot. Both reuse existing machinery. **Flag:** decide if
these land this round.

---

## Naming changes (this round)

| Old | New | Where |
|---|---|---|
| Dashboard | **Harbour** | nav label + crumb (route key `dashboard` unchanged) |
| Aging | **Driftwood** | nav label, crumb, screen title (route key `aging` unchanged) |
| Pinned threads | **Currents** | nav section eyebrow; "New thread" → "New current" |

A **thread → current** copy sweep was applied to the live app's **visible
strings** (toasts, labels, sub-copy: "Filed into the current," "All currents,"
"the current's field notes," "How this current actually moved," etc.).
**Not changed:** code identifiers (`THREADS`, `thread:`, slugs), the data-model
noun, the legitimate "email thread" in Paste & route, and code comments.
**Open:** does the data-model noun + remaining design docs (System/Studies)
adopt "current" too? (copy is swept; identifiers aren't — a deliberate call.)

---

## Tokens, icons, components (reused — nothing net-new in palette/type)

**Color:** bearings use the **sacred** family (`--sacred`, `--sacred-ink`,
`--sacred-soft`); the lodestar is `--sacred`. Current tints reuse the existing
`--tint-*`. **No new hues.**

**New `.cmp-*` classes** (in `skin-tokens.css`, layout-only): `.cmp-sky` (+ day
first-light / night deep-sky overrides), `.cmp-stars` / `.cmp-star(.lode)`,
`.cmp-eyebrow`, `.cmp-anchor`, `.cmp-warm`, `.cmp-horizonchip`, `.cmp-rot`,
`.cmp-horizon(-done/-now)`, `.cmp-built`, `.cmp-still`, `.cmp-promise` /
`.cmp-keep` / `.cmp-skipped`, `.cmp-wake` / `.cmp-wakemark` / `.cmp-wakestar`,
`.cmp-bearingcard`, `.cmp-resori`.

**New icons** (in `helpers.jsx`, Lucide-style, stroke 1.6): `compass`, `star4`,
`star4f` (filled lodestar), `horizon`, `tick`, `heart`, `anchor`.

---

## Files the dev edits in the real codebase

- **`data.jsx`** — add `ORIENTATIONS`, `ORIENT_BY_SERVES`, `orientById`,
  `orientBuilt`, `wakeSeries`; extend `groupFocus` with the `'orient'` key;
  export them. (Demo seeds five bearings mapped onto existing currents/
  cadences/crystals — replace with real data.)
- **`helpers.jsx`** — add the seven icons above.
- **`skin-tokens.css`** — add the `.cmp-*` block.
- **`tide-compass.jsx`** — the new module: `CompassBand`, `TideCompass`,
  `TideOrientation` (this file; reads CSS vars + existing data only, exports
  onto `window`). **Note:** its top-level aliases are uniquely prefixed
  (`CMPI`, `CmpMono`, `cmpThreadName`, …) because Babel-in-browser shares
  top-level scope across the `tide-*.jsx` modules — keep that discipline.
- **`tide-core.jsx`** — `NavRail`: add the Compass mood; rename
  Dashboard→Harbour, Aging→Driftwood, "Pinned threads"→"Currents",
  "New thread"→"New current".
- **`tide-home.jsx`** — render `<CompassBand>` above the hearth; add the
  "Under a bearing" segment to the *In focus* lens; the `aging` title →
  "Driftwood"; copy sweep ("All currents," "Filed into the current.").
- **`tide-app.jsx`** — routes `compass` → `TideCompass`, `orientation` →
  `TideOrientation`; crumbs.
- **`Tidewater.html`** — load `tide-compass.jsx` (after `tide-cadence.jsx`).

---

## Open questions for design + build

1. **Schema:** crystal-type `orientation` (assumed) vs. a thin new entity?
2. **Small-promise `role`:** confirm storing it now (cheap migration insurance).
3. **Scope:** do the Crystals-gallery treatment + the resurfacing
   "still what you're about?" variant ship this round, or next?
4. **Naming depth:** does the data-model noun (and the System/Studies docs)
   adopt **current**, or does "current" stay a UI-copy-only term?
5. **Carried from ADHD guidance (still open):** "the bench" vs "Inbox"; and the
   single-build-two-personas question (Craig's work persona vs. the life
   persona) — both intersect the spine.

---

## Files in this bundle

- `README.md` — this build spec.
- `steep-orientation-layer.md` — the concept note (the *why*; read first).
- `Compass — orientation layer concepts.html` — the standalone visual study
  (3 directions each for the persistent surface + compounding evidence;
  day + night). Self-contained.
- `tide-compass.jsx` — the built reference module (the shipping B + C direction).

The live, navigable build is `design/Tidewater.html` in the project — open
**Compass** in the nav to walk it.
