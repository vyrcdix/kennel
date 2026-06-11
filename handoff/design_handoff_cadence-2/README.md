# Handoff: Cadence (recurring actions) — Tidewater

## Overview

**Cadence** layers a *recurring action* onto Steep's existing lifecycle. A
cadence is an ordinary action item with two things added: a **rhythm**
(daily / weekly / monthly) and an **attachment** to the thing it serves
(a crystal, idea, or thread). It is surfaced as an **invitation — "do this
week," never a due date** — warmed by an observed **vitality** signal rather
than a scorecard, and swept into honest amnesty the moment it stops being true.

The product rationale, voice, and the hard design stance ("do this week," never
"due"; no red, no overdue, no deficit) are in **`cadence-product-brief.md`** in
this folder. Read it first — this README is the *build* spec; the brief is the
*why*. This README assumes the rest of the Steep / Tidewater app is **already
implemented** (it is) and documents **only the Cadence additions**.

## About the design files

The files in this bundle are **design references created in HTML/React-via-Babel**
— a working prototype showing intended look and behavior, **not production code
to copy verbatim**. The task is to recreate these designs in the existing Steep
codebase using its established patterns (the same component layer, CSS-variable
token system, and lifecycle machinery already shipped). Where the prototype
fakes data or state for demo purposes, the notes below call out the real
contract.

- **`tide-cadence.jsx`** — the new module. All Cadence UI lives here:
  `CommitMeter`, `RhythmTrace`, `CadenceCard`, `CadenceResolved`, `DoThisWeek`
  (dashboard slot), `RecurModal` (the `R` verb popover), `CooledCadences`
  (the Aging-board section), and `MemoComposer` / `MemoChip` (optional note &
  voice capture, routed to the thread). Mirrors the file conventions of the
  existing `tide-*.jsx` modules (reads CSS vars only, exports onto `window`).
- **`Cadence Studies.html`** — a standalone comparison of three *vitality
  visual* treatments for the "Do this week" card. **Treatment C (rhythm trace +
  soft warmth tint) is the chosen direction and is what ships in the build.** A
  and B are recorded for context only — do not build them.
- **`cadence-product-brief.md`** — the original product brief (PM → design).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, and interactions.
Recreate pixel-accurately using the codebase's existing Tidewater token layer
and component classes (`.panel`, `.btn`, `.pill`, `.chip`, `.mono`, `.display`,
`.eyebrow`, `.kbd`, etc.). **No new colors or fonts are introduced** — Cadence
reuses the existing skin tokens entirely.

---

## The model: commitment (declared) + vitality (observed)

Two separate concepts. Keep them distinct in code and UI.

- **Commitment** is what the user *declares* — a deliberate dial set at creation:
  `trying` · `committed` · `core`. It controls how hard the cadence surfaces and
  how patient the system is before aging it (see Tolerance, below). It is **not**
  earned and **never** changes on its own.
- **Vitality** is what the system *observes* — derived warmth, **not stored**.
  It reuses Steep's existing temperature signal and **the exact Tidewater
  temperature vocabulary**: `fresh → "sunlit"`, `active → "active"`,
  `aging → "deepening"`, `dormant → "still"`. A kept-up cadence glows; a skipped
  one cools.

### Vitality derivation (the real contract — prototype stores it; you compute it)

Compute warmth from `last_done_at` vs the `cadence` interval, **weighted by
`commitment`** — exactly as crystal temperature is derived today. Do **not**
persist a vitality column. Rough mapping (tune against the existing temperature
thresholds):

| Windows since last "did it" (adjusted by commitment grace) | Vitality |
|---|---|
| within the current/last window | `fresh` (sunlit) |
| ~1 window behind | `active` |
| ~2 windows behind | `aging` (deepening) |
| beyond tolerance | `dormant` (still) |

`core` gets the most grace before cooling; `trying` cools fastest.

### The divergence moment

The design payoff is the gap between **declared `core`** and **observed
`dormant`**. This is surfaced as a gentle inline question on the card — never a
notification, never red. (See `CadenceCard` → divergence block.)

---

## Data model (light touch — no new top-level entity)

A cadence is an existing **action item** (`kind=action`). Extend the item's
existing `metadata` JSON column (same column that already absorbs kind-specific
extensions). From `cadence-product-brief.md` §9:

| Key | Type | Notes |
|---|---|---|
| `cadence` | enum `daily \| weekly \| monthly` | null for ordinary one-shot actions |
| `commitment` | enum `trying \| committed \| core` | the declared dial |
| `window_opens_at` | ISO timestamp | when it enters the "do this week" surface |
| `last_done_at` | ISO timestamp | last logged contact |
| `kept_count` | int | gentle streak readout — **not** a score |
| `resource_ref_id` | id | optional FK to a `reference` (`link`) row |
| `note_default_section` | string | optional — suggested thread section for memos captured on "did it" (UI default only) |

- **Attachment** to the parent crystal/idea/thread uses the **existing attach
  relation** — no new join.
- **Vitality** is derived (above), not stored.
- The recurrence + aging engine is a near-clone of the **crystal resurface
  timer** already in Lifecycle settings.

### Prototype data shape (`data.jsx` → `CADENCES`)

Each demo cadence object (maps onto the model above):

```js
{ id, text,
  cadence: 'weekly',            // daily | weekly | monthly
  window: 'do this week',       // 'do today' | 'do this week' | 'do this month'
  commitment: 'committed',      // trying | committed | core
  serves: 'Tourism in the South Pacific',  // attached parent label, or null
  servesType: 'idea',
  thread: 'pacific', tint: 'teal',          // owning thread + its label hue
  resource: { label, url } | null,          // the inline link (reuse `link` ref)
  vitality: 'fresh',            // DERIVED in production (fresh|active|aging|dormant)
  kept: 6, keptUnit: 'weeks',   // streak count + unit
  trace: [1,1,1,1,1,1],         // recent windows, newest LAST: 1 kept · 0 skipped
  daily: true,                  // convenience flag; daily surfaces softer
  diverged: true,               // declared core but gone cold (also derivable)
  noteTo: { thread: 'pacific', section: 'What I’m following' } }   // suggested field-notes section
```

Field-notes sections per thread live in `data.jsx` `THREAD_SECTIONS` (with
`FIELDNOTE_SECTIONS_DEFAULT` as fallback); `window.threadSections(slug)` returns
the list the composer offers, and `noteTo.section` must be one of them.

Look-up tables also added to `data.jsx`:

```js
CADENCE_LABEL = { daily:'every day', weekly:'every week', monthly:'every month' };
WINDOW_LABEL  = { 'do today':'do today', 'do this week':'do this week', 'do this month':'do this month' };
COMMIT = {
  trying:    { label:'trying it',     bars:1, blurb:'an experiment — ages out quickly and guiltlessly' },
  committed: { label:'committed',     bars:2, blurb:'a real intention — normal presence, normal patience' },
  core:      { label:'core practice', bars:3, blurb:'part of how I live right now — given the most grace' },
};
```

---

## Surfaces (the five integration points)

### 1. Dashboard — "Do this week" (its own slot)

**Where:** Dashboard, a full-width section **directly below the existing "Worth
revisiting" hearth**, as a distinct sibling region (not folded into crystals).
In the prototype: `tide-home.jsx`, `<window.DoThisWeek go={go} />` rendered
after `<Hearth>`.

**Component:** `DoThisWeek` (in `tide-cadence.jsx`).

- Header: repeat icon (`--action-ink`) + `<h2>` "Do this week"
  (Bricolage Grotesque 700, 21px, `-.01em`) + right-aligned mono caption
  `invitations, never due · {n} open`. Subhead paragraph in `--ink-muted` 13.5px.
- Cards in a responsive grid: `repeat(auto-fill, minmax(330px, 1fr))`, gap 13px.
- **Ordering:** by commitment bars **descending**, then vitality rank
  descending (fresh→dormant). So kept-up core practices sit top; the cooled core
  practice sinks within its group (gentle, not in your face).
- **Daily cadences surface softer:** smaller action text, slightly reduced
  opacity, a "· softly" mono cue. (Brief §11.5.)

**`CadenceCard` anatomy (top → bottom):**

1. **Vitality edge** — a 3px vertical bar down the left, `linear-gradient(180deg,
   {vitColor}, color-mix(... 30%))`; opacity .9 if warm (fresh/active), else .4.
2. **Card background/border** — when warm: border
   `color-mix(in oklab, var(--sacred) 26%, var(--line))` + a faint warmth glow
   `radial-gradient(120% 130% at 100% 0%, color-mix(in oklab, var(--sacred) 9%,
   transparent), transparent 60%)` over `var(--card)`. When cool: plain
   `var(--line)` / `var(--card)`.
3. **Top row:** repeat icon + cadence label (`every week`, mono 11px,
   `--ink-muted`) · window chip (`do this week`, mono 10.5px on `--action-soft`
   pill, `--action-ink`) · `· softly` if daily · spacer · **CommitMeter** (right).
4. **Action text** — `.display`, 17.5px / 600 (16px if daily), line-height 1.32.
5. **Serves row:** gem icon (`--sacred-ink`) + mono "keeps warm" + the attached
   parent label (13px / 600); then the owning thread `Pill`. If no parent: mono
   "a practice of its own".
6. **Resource chip (required when a resource exists, §7):** full-width button,
   `--card-2` on `1px var(--line)`, radius `--r-ctrl`, link icon (`--action-ink`)
   + label (13px/500, ellipsis) + chevron (`--ink-faint`). **One click to act —
   never buried.**
7. **Vitality + streak row:** `RhythmTrace` (left) · spacer · a dot in the
   vitality color + uppercase mono vitality label (sunlit/active/deepening/still,
   10.5px, `.08em`).
8. **Divergence block (only if `diverged`):** a `--sunk` panel, tide icon, copy
   *"You call this a **core practice**, but it's gone quiet. No harm done — is it
   still true?"* + buttons: **Re-commit** (sacred fill), **Ease off to "trying
   it"** (ghost), **Crystallize the lesson** (ghost, `--sacred-ink`, gem), **Let
   it go** (ghost, `--ink-faint`).
9. **The loop (actions):** **Did it** (sacred fill `--sacred`, text `#2A1B08`,
   check icon) · **Skip this week/day/month** (`btn-soft`) · **Snooze**
   (`btn-ghost`, clock icon).

**`CommitMeter`** — three bottom-aligned bars (widths 5/9/13px tall, 3px wide,
2px radius); first `bars` filled `--ink-muted`, rest
`color-mix(in oklab, var(--ink) 13%, transparent)`. Optional mono label
(`trying it` / `committed` / `core practice`, 11px, `--ink-muted`). Quiet and
neutral — it is **not** a score.

**`RhythmTrace`** — a row of marks for recent windows (newest last); each
6×12px, radius 999. **Kept** = filled in the vitality color with a gentle
opacity ramp toward the newest (`0.55 + 0.45*(i/(n-1))`); **skipped** =
transparent with `1.5px solid color-mix(in oklab, var(--ink) 18%, transparent)`.
Followed by mono streak text: `kept up {kept} {unit} running` (kept ≥ 2),
`one kept so far` (kept = 1), or `quiet just now` (kept = 0). **No deficit number
is ever shown.**

**Behavior (the loop):**
- **Did it** → warm pulse on the card (`cadKept` keyframe, see Tokens), toast
  *"Kept up — it'll wash back in next window."*, the card **collapses to a calm
  one-line `CadenceResolved` row** (checkmark + "kept up. comes back next week" +
  **Undo**). **The action is never "done"** — done would delete it; it is *fed*
  and returns. In production: log the contact, roll `window_opens_at` to the next
  window, bump `kept_count`, recompute vitality.
- **Skip** → toast *"Skipped, no harm. Rolls to the next window."* (with Undo),
  collapses to a resolved row ("rolled on. comes back next week"). **No chain
  break, no deficit.**
- **Snooze** → toast *"Snoozed a few days — still inside this window."*; bumps a
  few days **without** advancing the whole cadence. Card stays.
- **Re-commit / Ease off** (divergence) → clears `diverged`; re-commit sets
  vitality `active` & keeps `core`; ease-off drops commitment to `trying`.

#### Capturing a note with a contact (memo / voice → routed to the thread)

A contact often *produces* something — a thought, a takeaway, a next step. Each
card carries an **optional, always-secondary** note affordance so that material
flows back into the thread the cadence serves.

- **Friction stance:** "Did it" stays **one click**. The note is never required
  and never blocks the loop. A `Note` ghost button (mic icon) sits at the right
  end of the card's action row; after "Did it", the collapsed `CadenceResolved`
  row also offers **"jot a note"**. (A note jotted on the open card carries
  through to the resolved state — in the prototype it's stored on the item.)
- **`MemoComposer`** (in `tide-cadence.jsx`) — a `--sunk` panel with:
  a mono header *"jot what came of it — optional, lands in the thread"*; a text
  **memo** textarea; a **voice memo** affordance (`Record a memo` → a pulsing red
  dot + `m:ss` timer → `Stop` → a `voice memo · 0:14` chip; **mocked** in the
  prototype — wire to real recording/transcription in production); and a
  **destination** row.
- **Destination = the served thread's FIELD NOTES, in a Claude-suggested
  section.** The composer shows `files into → {thread Pill} → [field notes] →
  {section chips}`, defaulting to `c.noteTo.section` and offering that thread's
  field-notes sections (`window.threadSections(slug)` — see `data.jsx`
  `THREAD_SECTIONS`, which mirrors the `FIELDNOTES` section model: *What's working
  / Open questions / People / Resources / Scratch*, with per-thread variants).
  The primary button reads **"Save to field notes."** Saving toasts *"Noted —
  filed into {thread} field notes · {section}."* and the card shows a `MemoChip`
  (`→ {thread} field notes · {section}`).
- **Production routing:** the saved memo is appended to the parent thread's
  **field notes** under the chosen section (reusing the existing field-notes
  store + the Smart-Routing section suggestion). A memo is a field-note entry
  whose section is pre-suggested from the cadence's attachment; voice memos
  attach audio (+ transcript) to that entry. This is the explicit destination
  model — these notes accrue into the thread's themed field-notes sections, where
  the user already reviews *What's working / Open questions / People*.

### 2. Sort (the bench) — the `R · Recur` verb

**Where:** Sort screen action row, a new decision verb beside the existing
`A`/`S`/`C`/`X`. In the prototype: `tide-work.jsx` `TideSort`.

- **Button:** `btn-ghost`, repeat icon, label "Recur", `<kbd>R</kbd>`. Placed
  between **Set aside** and **Crystallize**.
- **Keyboard:** `r` triggers it (added to the existing j/k/↵/s/c/x handler).
- Footer hint updated to: `J K walk · ↵ accept · S shelf · R recur · C keep · X let go`.
- **Action:** opens the `RecurModal` seeded with the current bench item's text &
  suggested thread, **and** sweeps the item off the bench (same leave animation
  as accept; toast *"Off the bench — now a recurring practice."* with Undo).

**`RecurModal`** (uses the existing `window.Modal` scrim shell; width 540):
- Header: repeat icon medallion (`--action-soft`/`--action-ink`) + title
  **"Make it recur"** + sub *"A repeating nudge, attached to what it serves. An
  invitation — never a deadline."*
- Seed row (if launched from an item): `--sunk` chip showing the action text.
- **Rhythm** — segmented `Daily / Weekly / Monthly` (default **Weekly**), using
  the existing `SegBtn`.
- **Commitment** — three selectable rows (CommitMeter + label + blurb), selected
  row gets `1.5px var(--action)` border + `--action-soft`. **Default `trying`**
  (lowest-pressure on-ramp, §11.3).
- **Resource** — text input with leading link icon on `--sunk`; placeholder
  *"Paste a link, or name what to do the contact with…"*. Optional.
- **Attach to** — chip typeahead over crystals/principles/threads (single
  select); chips carry the thread's left-tint.
- Footer: mono note *"It can only be done, or roll. It can't be late."* + Cancel
  + **Start the rhythm** (`btn-primary`, repeat icon). Submit toasts *"On your
  {cadence} rhythm — it'll wash in when the window opens. Never due."*

### 3. Crystal / idea page — "+ Recurring action" + "Kept warm by"

**Where:** crystal detail right column, a new panel after "It serves". In the
prototype: `tide-keep.jsx` `TideCrystal`.

- **"Kept warm by" panel** — lists cadences attached to this crystal/its goals:
  each row = vitality dot (vitality color) + action text (13.5px) + mono
  `{cadence label} · kept up {kept} {unit}` + repeat icon, on `--card-2`.
- **"+ Recurring action"** ghost button (repeat icon) at the bottom — opens
  `RecurModal` pre-attached to this crystal (`onRecur({ text:'', thread })`).
  This is the "born from a crystal" entry point (brief §5).

### 4. Aging board — "Cooled cadences"

**Where:** the **Aging** route renders a `CooledCadences` panel **above** the
shelf. In the prototype, the Aging route reuses the Reflecting screen with a
`mode="aging"` prop: the title becomes "Aging", the intro becomes *"The cold
material — things, and rhythms, asking honestly to be released. Sweeping the
workshop, not confronting failures."*, and `<window.CooledCadences>` renders at
top.

**`CooledCadences`** — a `panel` titled "Cooled cadences" + mono caption
*"sweeping the workshop — not confronting failures"* and subcopy *"rhythms you
stopped feeding. most should be filed or released, shamelessly."* Each cooled
row shows: repeat icon, action text (`--ink-muted`), thread Pill, CommitMeter,
and a mono `cooled` reason (e.g. *"skipped 5 weeks · you were 'trying it'"*).
**Amnesty actions (parallel to existing aging verbs):**
- **Keep it going** `U` · **Crystallize the lesson** `C` (`--sacred-ink`, gem) ·
  **File** `F` · spacer · **Let it go** `X` (`--ink-faint`).

A cadence drops here when it's skipped/ignored **past its tolerance**, and
tolerance is **set by commitment** (`trying` fast → `core` most grace). Framing
stays kind — never "overdue," never red.

### 5. Settings — cadence aging tolerance

**Where:** Settings → **Lifecycle** section, a new control beneath "Resurface
kept things". In the prototype: `tide-keep.jsx` `TideSettings`.

- Label **"Let quiet cadences age out"** + sub *"How long a skipped rhythm waits
  before it drifts onto the Aging board. More grace for deeper commitments —
  never a red mark, just a gentle question."*
- Three rows, one per commitment level (CommitMeter label + a `Fast / Patient /
  Most grace` segmented control); defaults: `trying → Fast`, `committed →
  Patient`, `core → Most grace`. This sits beside the existing resurface-interval
  setting (it's the same family of lifecycle timer).

---

## Interactions & behavior summary

- **No notifications, ever.** Cadences surface on the dashboard when their window
  opens; the system never pings. (Mirror the crystal resurface model.)
- **No overdue / no red / no deficit.** A cadence can only be **done** or
  **roll**. Skipping is guilt-free and breaks no chain.
- **Did-it warm pulse:** `.cad-card` gets class `cad-kept` → `cadKept` 720ms
  ease-out box-shadow flash (sacred glow), then collapses to the resolved row.
  Gated by `prefers-reduced-motion` via the existing motion layer conventions.
- All toasts reuse the existing toast host (`window.toast` / the `tide-toast`
  event), with `undo` where shown.

## State

Prototype keeps transient per-card status in `DoThisWeek` local state
(`open | did | skip | gone`) and the cooled list in `CooledCadences`. In
production these map to: logging a contact, rolling the window, recomputing
derived vitality, and the aging engine moving an item onto the Aging board.

## Design tokens (all pre-existing in `skin-tokens.css` — reused, none new)

- **Warmth / kept things:** `--sacred`, `--sacred-ink`, `--sacred-soft`
  (sea-glass amber). "Did it" and re-commit use a sacred fill with text
  `#2A1B08`.
- **Action / primary / window chip:** `--action`, `--action-ink`,
  `--action-soft` (lagoon teal).
- **Vitality colors** come from the existing depth/temperature map
  (`DEPTH` in `tide-core.jsx`): fresh→`--sacred`, active→`--action`,
  aging→`--fam-run`, dormant→`--ink-faint`; labels sunlit/active/deepening/still.
- **Surfaces/lines/text:** `--card`, `--card-2`, `--sunk`, `--line`,
  `--line-strong`, `--ink`, `--ink-muted`, `--ink-faint`.
- **Radii:** `--r-card` (17px), `--r-ctrl` (11px). **Shadows:** `--shadow-panel`,
  `--shadow-lift`.
- **Type:** display `Bricolage Grotesque`; sans `Hanken Grotesk`; mono
  `Spline Sans Mono`.
- **New keyframe** added to `skin-tokens.css`:
  ```css
  .cad-card.cad-kept { animation: cadKept 720ms ease-out; }
  @keyframes cadKept {
    0%   { box-shadow: var(--shadow-panel); }
    35%  { box-shadow: 0 0 0 2px var(--sacred-soft),
                       0 0 30px color-mix(in oklab, var(--sacred) 26%, transparent); }
    100% { box-shadow: var(--shadow-panel); }
  }
  /* voice-memo recording indicator */
  .cad-rec-dot { animation: cadRec 1.1s ease-in-out infinite; }
  @keyframes cadRec { 0%,100% { opacity: 1; } 50% { opacity: .3; } }
  ```

## Icons added (`helpers.jsx`, Lucide-style, stroke 1.6)

- `repeat` — the cadence/Recur glyph (two looping arrows).
- `arrowR2` — a small chevron used on the resource chip / destination row.
- `globe` — the "South Pacific" interest thread icon.
- `mic` — the voice-memo / Note affordance.

(All other icons — gem, link, check, clock, file, release, undo, tide — already
exist.)

## Seed content (demo)

The prototype seeds five live cadences (incl. the brief's worked example *"Catch
up on Foreign Affairs"* → weekly → committed → attached to a *Tourism in the
South Pacific* idea, plus *"The standing Sunday call with Dad"* and a **diverged**
*"200 words of the novel, every morning"* declared `core` but gone `dormant`),
one cooled cadence on the Aging board, and a new `pacific` thread
(tint `teal`, `globe` icon). Replace with real data.

## Files in this bundle

- `tide-cadence.jsx` — the new module (all Cadence components).
- `Cadence Studies.html` — the three vitality-visual treatments; **C ships**.
- `cadence-product-brief.md` — the product brief (the "why").

### Integration points in the existing (already-implemented) app

These are the files the new module plugs into — the dev edits these in the real
codebase, they are **not** re-bundled here:

- `data.jsx` — add `CADENCES` (incl. each cadence's `noteTo`), `CADENCES_COOLED`,
  `CADENCE_LABEL`, `WINDOW_LABEL`, `COMMIT`, `THREAD_SECTIONS` + `threadSections`,
  and the `pacific` thread; export them.
- `tide-home.jsx` — render `DoThisWeek` below the hearth; add `mode="aging"`
  handling that renders `CooledCadences` and swaps the Reflecting copy.
- `tide-work.jsx` — add the `R · Recur` verb + `r` key + footer hint in `TideSort`.
- `tide-keep.jsx` — add "Kept warm by" + "+ Recurring action" to `TideCrystal`;
  add the tolerance control to `TideSettings` → Lifecycle.
- `tide-app.jsx` — add the `recur` overlay + `openRecur(seed)`; pass `onRecur` to
  Sort and the crystal page; pass `mode="aging"` to the Aging route.
- `skin-tokens.css` — add the `cadKept` keyframe.
- `helpers.jsx` — add the `repeat`, `arrowR2`, `globe` icons.
