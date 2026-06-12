# Handback: Compass (orientation layer) — engineering review + questions

**To:** Claude design / PM
**From:** Engineering (via Craig)
**Re:** `handoff/design_handoff_compass/` (README build spec · concept note ·
concepts.html · `tide-compass.jsx`)
**Date:** 2026-06-12
**Status:** **RESOLVED — answered in `design_handoff_compass-2/ANSWERS to
engineering handback.md` (2026-06-12).** All blockers (A1–A5) and clarifications
(B1–B4) answered; sequencing accepted (build after Cadence dogfoods). Key
rulings: **Compass ships in BOTH skins, vocabulary-localized** (Workshop
parallel-vocab table provided for `copy.ts`); schema confirmed as proposed (one
combined migration: horizon dates + `role`; `ctype='orientation'` needs no
migration); the **"set a bearing" flow is now designed + built** in the rev-2
prototype (`SetBearingSheet`). Two items were punted back to **us** for a
yes/no — recorded under "Decisions for eng" below. Original review retained
below for history.

Reviewed against `main` (Tidewater skin slices 0–7 + Cadence C0–C6, shipped).
The concept is strong and most of it reuses machinery we already have. Below:
how it maps to our codebase, a sequencing recommendation, and the questions that
gate a build. Each has a proposed default.

---

## Decisions for eng — DECIDED (Craig, 2026-06-12)

1. **Let-go of a bearing → its promises (B1): REVERT TO `role = practice`.**
   The daily rhythm survives the bearing and falls back into the normal "Do
   this week" cadence grid as a free-standing practice — nothing is destroyed.
2. **Key bearings by persona/workspace from day one (B4): TAKE THE INSURANCE.**
   Add a nullable `persona` (workspace) key to the orientation crystal in the
   combined migration (null = the single set we render now). Avoids a future
   migration + backfill if the work-vs-life two-personas direction lands.

**Combined Compass migration is therefore:** `horizon_start_at`,
`horizon_target_at`, cadence `role` (default `practice`), bearing `persona`
(nullable) — all on `items`, all nullable/defaulted, one file. `ctype`
gains `orientation` at the app layer (no migration).

---

## What Compass is

The prospective top layer: **3–6 bearings** (a bearing = a *forward-pointed
crystal*: "what you're moving toward") with optional **horizons** (~1000-day,
framed as room-remaining, never a countdown), **small promises** (tiny daily
cadences, zero-debt), and **compounding evidence** (the *wake* — only kept days
render). Five surfaces: the Compass lens (new Mood), the dashboard dawn band,
an "Under a bearing" In-focus lens, the orientation/bearing page, and a Crystals-
gallery / resurfacing variant (flagged). Plus naming: Dashboard→**Harbour**,
Aging→**Driftwood**, Pinned threads→**Currents**, and a thread→current copy
sweep.

## How it maps to our codebase — mostly reuse ✅

| Compass piece | Our machinery |
|---|---|
| bearing = forward-pointed crystal | crystallization item with a new `ctype = 'orientation'` (6th type) — `ctype` is app-validated TEXT, **no migration for the type** (extend the enum + ~10 `CRYSTAL_TYPES`/`CTYPE_LABEL`/picker spots) |
| "what's built toward this" | `getItemsServing(bearingId)` + `getCadencesServing` — already exist (Cadence reuses them) |
| small promise | a **daily Cadence** (C0–C6, just shipped) + a new `role` key |
| keep a promise / skip leaves no trace | `didCadence` / `skipCadence` — our no-deficit skip is already exactly "no trace" |
| compounding evidence (wake) | the **activity log**, `verb='KEPT'` (we log it on did-cadence) filtered to cadences whose `servesId` = the bearing; only kept days |
| "still what you're about?" | the crystal resurface cadence (`resurfaceCrystal` / Still-true), re-pointed at the bearing |
| per-skin naming (Harbour/Driftwood/Currents) | `lib/copy.ts` (the per-skin copy table we built in slice 6) |

**Net-new persistence** ≈ the `orientation` ctype value (no migration) + horizon
dates (a migration) + the cadence `role` column (a migration). One small
combined migration covers the last two.

## Recommendation: build it as its own track, after Cadence dogfoods

Compass is a *third* substantial feature (5 surfaces + schema + a broad naming
sweep). It sits **on top of** Cadence (promises are cadences). So: let Cadence
settle on the test instance first, resolve the blockers below, then build
Compass as a dedicated slice plan (roughly: schema → bearing CRUD + the
high-friction "set a bearing" flow → Compass lens + orientation page →
CompassBand + the "Under a bearing" spine → compounding-evidence visuals →
naming sweep + QA). We'll leave plug-in seams where it touches the dashboard /
crystals if you want, the way we did for Cadence.

---

## A. Blockers — needed before a build

### A1. Both-skin parity — the big one
Cadence shipped in **both** skins (your A1 ruling: no parity exception). Compass
is specced entirely in **Tidewater** (the sky/dawn band, the wake aesthetic, and
the Harbour/Driftwood/Currents naming). We hold the information-parity
invariant.

**Need a ruling:** does Compass ship in **Workshop too**?
- If **both** (consistent with Cadence): what's the Workshop dress for the
  `.cmp-sky` band, the bearing cards, and the wake — and do the **naming
  changes** (Harbour/Driftwood/Currents) apply in Workshop, or stay Life-only
  words over the same surfaces?
- If **Life-only**: confirm Compass is an accepted, deliberate **exception** to
  parity (it's a real product divergence). *Our lean:* both skins, sacred-family
  dress in both, but the `Harbour/Driftwood/Currents` **words** are Life-only
  copy (Workshop keeps Dashboard/Aging/Pinned threads), via the per-skin table.

### A2. Naming sweep — scope + skin
Harbour / Driftwood / Currents + the **thread→current** visible-string sweep is
broad (toasts, labels, sub-copy across many screens).
**Need:** (a) confirm these are **Life-skin copy** routed through `lib/copy.ts`
(Workshop unchanged); (b) is the full thread→current sweep in scope **this
round**, or staged after the core Compass surfaces? (c) README confirms code
identifiers (`thread`, slugs, `THREADS`) stay — **confirmed, we agree**; the
data-model noun does **not** change (your Q4). *Our lean:* Life-only copy;
core surfaces first, the broad copy sweep as a fast follow.

### A3. Schema — confirm the shape (your Q1/Q2)
**Proposed (path A + cheap insurance):**
- Bearing = crystallization with **`ctype = 'orientation'`** (6th type; no
  migration — extend the enum + validators).
- **Horizon** = two nullable item columns `horizon_start_at` + `horizon_target_at`
  (a migration); "day N / total" + "days ahead" **derived** (Temperature
  pattern). No progress bar, no countdown.
- **Cadence `role`** = a nullable `role` column on items (`promise | practice`,
  default `practice`) so promises can split out later without a migration
  (your build requirement). Batch with the horizon dates in **one** migration.

**Need:** confirm (A) over a thin new entity; confirm the one combined migration.
**Plus:** bearings are *forward*-pointed crystals (target of `servesId`, not
`sources_from`). Do they appear in the **Crystals gallery** alongside backward
crystals, or live only in Compass? (Your Q3 — see A4.)

### A4. Scope this round (your Q3)
Do the **Crystals-gallery** orientation treatment **and** the resurfacing
**"still what you're about?"** Worth-revisiting variant ship **this round**, or
next? *Our lean:* the five core surfaces this round; the gallery + Worth-
revisiting variant as a fast follow (both are pure reuse, low-risk).

### A5. The "set a bearing" flow is unspecified
The prototype stubs **"Set a new bearing"** as a toast ("a slow, deliberate
mood"). The real high-friction creation flow isn't designed. **Need the flow:**
is a bearing created by *crystallizing an item as `orientation`* (reusing the
crystallize path + a type picker), by a dedicated deliberate modal (statement +
optional horizon + currents), or both? Editing/horizon-setting too.

---

## B. Clarifications

### B1. Small promises = daily cadences with `role='promise'`
Confirm a promise is exactly a **daily Cadence** with `role=promise`, reusing our
shipped engine: one-click **keep** = `didCadence`; **skip leaves no trace** =
our existing no-deficit skip. **Dedup:** does a promise appear in *both* the
dashboard **"Do this week"** and the orientation page, or only under the bearing
(like cadences are suppressed from In-focus)? *Our lean:* promises surface on the
**orientation page** + the bearing's row, and are **suppressed** from the
general "Do this week" cadence grid (they belong to the bearing).

### B2. Compounding evidence derivation + which visuals ship
Confirm the **wake / deepening field / crossing** all derive from the **activity
log** (`verb='KEPT'`, the cadence's `servesId` = the bearing) — only kept days,
gaps absent, counts mono. And which of the three ship this round: README says
wake = hero on the orientation page, deepening field = dashboard readout,
crossing = horizon bearings only. *Our lean:* **wake** (orientation page) this
round; deepening field + crossing as fast follows.

### B3. Horizon semantics
Confirm horizon = optional `start_date` + `target_date` **on the bearing
crystal** (no separate "goal" object between bearing and promise); intangibles
carry **no clock** (neither date). "Day N / total" + "days ahead" derived;
never a percentage or countdown. *Confirmed in the README — just sanity-checking
there's no hidden middle "goal" altitude.*

### B4. ADHD-guidance carryovers (your Q5)
"the bench" vs "Inbox", and the **single-build-two-personas** question (Craig's
work persona vs the life persona) both intersect the **"Under a bearing"** spine.
Are these in scope for Compass, or a separate track? *Our lean:* **separate** —
they're orthogonal to the orientation layer; flag that they touch the In-focus
lens so we don't double-build it.

---

## What we're not blocked on

The `.cmp-*` classes (layout-only), the 7 icons, and the sky/dawn aesthetic port
cleanly onto our token layer (sacred family, no new hues). The "few, high-
friction, quiet, no-streak/no-progress-bar/no-red" non-negotiables match the
rails we already hold. The real gates are A1 (parity) and A3/A5 (schema + the
creation flow).
