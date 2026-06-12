# Compass (orientation layer) — build plan

Feature: the prospective **top** layer. A **bearing** is a *forward-pointed
crystal* — what you're moving toward — with an optional **horizon** (~1000-day,
framed as room-remaining, never a countdown), **small promises** (tiny daily
cadences, zero-debt), and **compounding evidence** (the *wake* — only kept days
render). Few (3–6), high-friction to add, quiet, no streaks / no progress bars /
no red.

**Authoritative design source:** `handoff/design_handoff_compass-2/`
(`README.md` build spec · `steep-orientation-layer.md` the concept/why ·
`Compass — orientation layer concepts.html` the visual study ·
`tide-compass.jsx` the rev-2 prototype incl. `SetBearingSheet`).
Eng questions + resolution: `handoff/compass_eng_questions/README.md` (RESOLVED;
two eng decisions recorded).

**Branch:** `feat-compass`, off `main`. **P0 (schema) is independent of Cadence
runtime and can start now**; the surface slices build on the Cadence engine.

**Sequencing — Cadence dogfooding is underway now (test instance).** Compass's
promises *are* daily cadences, so it sits on the shipped Cadence engine (C0–C6).
Start the schema/foundation while dogfooding runs; let the surface slices proceed
as dogfooding confirms the cadence base feels right (the no-debt skip, the
vitality language, the "Did it" loop) — that feedback directly shapes the
small-promise UX.

**Dependencies (all on `main`):** Cadence (C0–C6) — promises reuse the engine,
`didCadence`/`skipCadence`, `getCadencesServing`, `verb='KEPT'` activity. Plus
the crystal/keepsake skin + `resurfaceCrystal` (Still-true), the **attach**
relation (`servesId`/`getItemsServing`), the per-skin **copy table**
(`lib/copy.ts`), and the Tidewater token layer.

---

## Design rulings (ANSWERS, 2026-06-12) — all resolved

- **Both skins, vocabulary-localized** (the Cadence precedent). The *spine* is
  skin-neutral: bearing object, horizon, wake/evidence, small promise, the
  "Under a bearing" lens, the "still about?" loop, the creation flow. **The
  navigation words `Compass / bearing / lodestar / star` stay in both.** Only
  the **water metaphor** (wake, "days of water ahead," "loose in the water",
  dawn/first-light) and **Harbour / Driftwood / Currents** are Life-only copy.
  `.cmp-sky` = a token remap (Life first-light gradient / Workshop banked-ember
  worklight) — **no Workshop-specific components.**
- **Schema confirmed** (path A + insurance). Combined migration + an app-layer
  ctype value (below).
- **Creation flow designed + built** — `SetBearingSheet` (two entry points, two
  beats; below).
- **Scope:** five core surfaces this round; Crystals-gallery treatment +
  resurfacing "still about?" variant = **fast follow**. Until then **filter
  bearings out of the Crystals gallery** so a forward crystal never renders with
  backward chrome.
- **Evidence:** ship the **wake** (orientation page) this round; deepening-field
  + crossing = fast follows. All derive from the activity log (`KEPT`,
  cadence.`servesId` = bearing); only kept days, gaps absent, mono counts.

### Eng decisions (Craig, 2026-06-12)
- **Let-go of a bearing → its promises revert to `role = practice`** (the daily
  rhythm survives; drops into "Do this week").
- **Key bearings by `persona` from day one** (nullable; null = today's single
  set) — insurance against a future work-vs-life split, no later migration.

## Data model

**One combined migration** (`0016_compass.sql`) — all on `items`, all
nullable/defaulted, mirroring the 0014/0015 style:

| Column | Type | Notes |
|---|---|---|
| `horizon_start_at` | timestamp | optional; only on bearings with a finish line |
| `horizon_target_at` | timestamp | optional; "day N / total" + "days ahead" **derived** |
| `role` | `promise \| practice` (default `practice`) | on cadences; promises require a `servesId` (no orphan promise) |
| `persona` | text, nullable | bearing/workspace key; null = the single set rendered now |

**`ctype` gains `'orientation'`** — app-layer only (TEXT, no DB CHECK): extend
`CrystalType` + the `CRYSTAL_TYPES` validator sets (client + server), the
`CTYPE_LABEL`, and the ctype pickers (~10 spots). Bearings are forward-pointed:
the **target of `servesId`** (queried via `getItemsServing`), not `sources_from`.

Net-new persistence = the four nullable columns. Everything else — the roll-up,
the wake, the horizon math, "still about?" — reuses existing machinery.

## Architecture

- **One component set, two token maps** (the Cadence model). Compass components
  read only `var(--…)` tokens (sacred family + `.cmp-*` layout classes) so they
  re-dress between skins. Vocabulary is per-skin via `lib/copy.ts` — fill **both
  columns** (Life water-vocab + the Workshop parallel below) in one pass even
  though the visible Life naming sweep ships staged.
- **Reuse, not new engine.** Promises = daily Cadences with `role=promise`
  (keep = `didCadence`, skip = the existing no-deficit skip = "no trace"). The
  roll-up = `getItemsServing(bearingId)`. The wake = `KEPT` activity filtered to
  the bearing. "Still about?" = `resurfaceCrystal`/Still-true re-pointed.
- **The "Under a bearing" lens is a 3rd option on the existing In-focus lens
  component** (a seam — the ADHD two-personas / bench tracks touch the same
  component; extend, don't fork).
- **Quiet, rare, high-friction.** Bearing-setting never appears in capture/Sort;
  the creation sheet is the deliberate inverse of one-tap capture.

### `copy.ts` — Life ⇄ Workshop parallel vocabulary (fill both)
| Concept | Life | Workshop |
|---|---|---|
| the lens | Compass | Compass |
| accumulation visual | the wake | the trail / ground covered |
| room-remaining | "682 days of **water** ahead" | "682 days of **road** ahead" |
| orphan group | "loose in the **water**" | "loose on the **bench**" |
| band register | dawn / first-light | banked-ember / worklight |
| nav: Dashboard | **Harbour** | Dashboard |
| nav: Aging | **Driftwood** | Aging |
| nav: Pinned threads | **Currents** | Pinned threads |

## Slices

| # | Slice | Contents | Gate |
|---|---|---|---|
| P0 | Schema + types | `0016_compass.sql` (horizon dates, `role`, `persona`); `ctype='orientation'` enum + validators/labels/pickers; Item type + rowToItem; no behavior | migration review |
| P1 | Backend: bearings | set-bearing (promote/crystallize→orientation, optional horizon, currents attach, persona), reword/edit, set/remove horizon, cadence `role=promise`, let-go (revert promises→practice), still-about (resurface re-pointed); contract tests (horizon derivation inputs, let-go→practice) | tests green |
| P2 | Derivation + selectors + copy | `lib/compass.ts` (horizon day/total/ahead; wake series from KEPT; `getBearings`, `getBearingBuilt`, `getBearingPromise`); `groupFocus('orient')`; both copy columns | none |
| P3 | Core components + `.cmp-*` | `CompassBand`, bearing card, the **wake** visual, `SetBearingSheet`, orientation-page atoms; the `.cmp-*` block (sky Life/Workshop, stars/lodestar, horizon, wake, promise); 7 icons | none |
| P4 | Compass lens + orientation page | `TideCompass` (new **Compass** Mood/route — **top of the Moods nav, above Harbour**, per the backlog; the handoff said "below Harbour" — Craig overrode) + `TideOrientation` (forward crystal · horizon · wake · what's-built roll-up · today's promise · "still about?"); creation flow wired | none |
| P5 | Dashboard surfaces | `CompassBand` above the hearth (both skins, rotating) + the **"Under a bearing"** 3rd In-focus lens (on the existing lens component); guard: filter bearings out of the Crystals gallery | none |
| P6 | Naming sweep + QA/deploy | Harbour/Driftwood/Currents + the broad thread→current visible-string sweep (Life copy, staged); QA (both-skin parity, **no-progress-bar / no-streak / no-red** audit, AA, reduced-motion); ship to the test instance | parity/voice review; deploy |

## Fast follows (next round, flagged)
- Crystals-gallery orientation treatment (until then, bearings are filtered out).
- The resurfacing **"still what you're about?"** card in the Worth-revisiting slot.
- The **deepening-field** (dashboard) + **crossing** (horizon bearings) evidence
  visuals (the wake ships this round).
- The broad thread→current copy sweep may itself span more than P6.

## Invariants checklist (verify before merge)

- [ ] **Few + high-friction** — 3–6 bearings; the creation sheet is deliberately
      slow (two beats, "N of ~6", draft vs set); never offered in capture/Sort.
- [ ] **No progress bar, no countdown, no invented percentage.** Horizon is
      room-remaining ("days of water/road ahead"); intangibles carry no clock.
- [ ] **No streaks / "don't break the chain."** Compounding = accumulated
      evidence; **a missed day leaves no trace** (gaps simply absent).
- [ ] **No red for accumulation; no badges/notifications.** Quiet by default.
- [ ] **Both-skin parity** — identical spine; only water-vocab + Harbour/
      Driftwood/Currents are Life-localized; no Workshop-specific components.
- [ ] **Promises** = daily cadences `role=promise`, require a `servesId`,
      suppressed from "Do this week", revert to `practice` on bearing let-go.
- [ ] **Bearings keyed by `persona`** (rendered as one set now).
- [ ] **Forward-pointed bearings filtered out of the Crystals gallery** this round.
- [ ] **Reuse intact** — attach (`servesId`), activity (`KEPT`), resurface
      (Still-true), the Cadence engine, the crystal keepsake skin.
- [ ] **AA contrast, both skins, both modes** (reuse the slice-7 / cadence harness).
