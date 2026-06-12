# Compass — answers to engineering's handback

**To:** Engineering (via Craig)
**From:** Design / PM
**Re:** your `Handback: Compass` review
**Date:** 2026-06-12

Great review — the codebase mapping is right and the sequencing
(let Cadence dogfood, then build Compass as its own slice plan) is accepted.
Going item by item. **"Confirmed"** = your default is correct; elaboration only
where it adds something or where we landed differently.

---

## A. Blockers

### A1. Both-skin parity — **ship in both. Not an exception.**

Your lean is right, with one sharpening: **the parity unit is *information*, and
the localized layer is *vocabulary* — exactly the Cadence precedent** (Life says
*sunlit / deepening*, Workshop says *fresh / active / aging / dormant*; same
data). Compass localizes the same way.

**Ships identically in both skins (skin-neutral spine):**
the bearing object, the horizon mechanic, the wake / evidence, the small
promise, the "Under a bearing" spine, the "still about?" loop, and the
high-friction creation flow. **The navigation words `Compass`, `bearing`,
`lodestar`, `star` stay in both** — they're navigation, not water, so they're
not Life-only.

**Life-localized vocabulary (via `lib/copy.ts`, NOT shipped to Workshop):**
the *water metaphor* — "the tide," "the wake," "days of water still ahead,"
"loose in the water," the dawn/first-light framing — **and**
Harbour / Driftwood / Currents.

**Workshop parallel vocabulary** (so you can fill *both* columns of `copy.ts` at
once — see A2):

| Concept | Life (Tidewater) | Workshop |
|---|---|---|
| the lens | **Compass** | **Compass** (neutral — unchanged) |
| accumulation visual | the **wake** | the **trail** / *ground covered* |
| room-remaining phrasing | "682 days of **water** still ahead" | "682 days of **road** ahead" |
| the orphan group | "loose in the **water**" | "loose on the **bench**" |
| the band's register | dawn / first-light sky | **banked-ember / worklight** header |
| warm-kept hue | sea-glass amber | blaze-gold / ember *(already mapped)* |
| nav: Dashboard→ | **Harbour** | Dashboard *(unchanged)* |
| nav: Aging→ | **Driftwood** | Aging *(unchanged)* |
| nav: Pinned threads→ | **Currents** | Pinned threads *(unchanged)* |

**`.cmp-sky`:** Life = first-light gradient; Workshop = a warm worklight /
banked-ember header — *same structure*, remapped through the `--sacred` /
`--action` tokens already present on `.sk-workshop`. Keep the stars + lodestar
in both (navigation is universal); they can read as faint sparks in Workshop.
Net: no Workshop-specific components, just the token remap + the copy column.

### A2. Naming sweep — **confirmed, with one add**
- (a) **Confirmed** — Life-skin copy routed through `lib/copy.ts`; Workshop words
  unchanged.
- (b) **Confirmed** — core surfaces first; the broad **thread→current** visible-
  string sweep as a fast follow.
- (c) **Confirmed** — code identifiers (`thread`, slugs, `THREADS`) **and the
  data-model noun** stay; "email thread" in Paste & route stays.
- **Add:** populate **both** columns of the `copy.ts` keys (Life + Workshop
  parallel, per the A1 table) in the same pass, even though the visible Life
  sweep ships staged — cheaper than reopening the table later.

### A3. Schema — **confirmed**
- **Confirmed:** `ctype = 'orientation'` (path A) over a thin new entity.
- **Confirmed:** horizon = two nullable item columns
  (`horizon_start_at` + `horizon_target_at`); "day N / total" + "days ahead"
  **derived** (Temperature pattern); no bar, no countdown.
- **Confirmed:** nullable `role` column (`promise | practice`, default
  `practice`), **batched with the horizon dates in one migration**.
- **Confirmed:** bearings are *forward*-pointed — the **target of `servesId`**,
  not `sources_from`. (Gallery placement → A4.)

### A4. Scope this round — **confirmed**
Five core surfaces this round; the **Crystals-gallery** orientation treatment +
the **resurfacing "still about?"** variant as a fast follow (both pure reuse).
**One guard:** until the gallery treatment ships, **filter bearings out of the
Crystals gallery** (don't let a forward-pointed crystal render with plain
backward-crystal chrome and look broken). They live only in Compass this round.

### A5. The "set a bearing" flow — **designed + built. See the prototype.**
It's now live in `tide-compass.jsx` → **`SetBearingSheet`** (open Compass →
"Set a new bearing" in `design/Tidewater.html`). The shape, answering your
question (*crystallize-as-orientation, dedicated modal, or both?*) → **both,
as one sheet with two entry points:**

1. **Entry points (both land in the same sheet):**
   (a) Compass → **"Set a new bearing."**
   (b) **Crystallizing an item** with `ctype = orientation` routes into the same
   sheet, **pre-filled** with the item's text (a bearing *is* a forward-pointed
   crystal, so this reuses the crystallize path + the type picker).
2. **Two beats — the friction is the point:**
   - **Compose** — the statement as a *direction* (verb-starter chips: Run / See
     / Stay close to / Grow at…); an **optional finish line** toggle (**default
     off** → intangible, no clock); an optional **"what already flows toward
     this?"** current-picker that seeds the roll-up.
   - **Sit with it** — a confirm beat that restates the bearing large, names that
     it's **load-bearing and rarely changed**, and offers **Save as draft**
     (lands in search, not yet in Compass) vs **Set this bearing**.
   - Plus a **"N of ~6 · few by design"** counter. The whole thing is the
     deliberate inverse of one-tap capture.
3. **Editing / horizon-setting** reuse the same sheet in an edit mode;
   **"Reword"** on the orientation page opens it pre-filled. Horizon can be
   added or removed anytime (it's just the two optional dates).

---

## B. Clarifications

### B1. Small promises — **confirmed**
A promise is exactly a **daily Cadence with `role = promise`**: one-click keep =
`didCadence`; skip = your existing **no-deficit skip** (= "no trace"). **Dedup
confirmed:** promises are **suppressed from "Do this week"** and surface on the
**orientation page + the bearing's row** (the proto shows "today's promise" on
both the dawn band and each Compass card). **Add:** `role = promise` **requires**
a `servesId` (a promise belongs to a bearing — there's no orphan promise). On
**let-go** of a bearing, its promises revert to `role = practice` (or are
released) — please pick one; our lean is **revert to practice** so the rhythm
survives the bearing.

### B2. Compounding evidence — **confirmed**
All three derive from the **activity log** (`verb = 'KEPT'`, the cadence's
`servesId` = the bearing); only kept days, gaps absent, mono counts. **Ship the
wake** (orientation page) this round; **deepening field + crossing as fast
follows** — confirmed.

### B3. Horizon semantics — **confirmed**
No hidden middle "goal" altitude. Horizon = optional `start_date` +
`target_date` **on the bearing crystal**; intangibles carry **neither** date.
Derived "day N / total" + "days ahead"; never a percentage or countdown.

### B4. ADHD-guidance carryovers — **confirmed separate, with a seam + insurance**
"the bench" vs "Inbox" and the **two-personas** question are a **separate
track** — orthogonal to Compass. Two notes so we don't double-build or
under-build:
- **Seam:** build the **"Under a bearing"** grouping as a *third option on the
  existing In-focus lens component* — the same component those tracks touch — so
  they extend one lens rather than forking it.
- **Cheap insurance (like the cadence `role`):** the two-personas question could
  eventually make Compass itself **per-persona** (work bearings vs life
  bearings). Don't hard-code a single global bearing set — **key bearings by
  persona / workspace from day one**, even though we render one set now. Avoids a
  migration if personas land.

---

## Net for sequencing
Your slice plan stands. The two real gates are closed: **A1** → both skins,
vocabulary-localized (table above for `copy.ts`); **A5** → flow designed + in the
prototype. **A3** schema confirmed as proposed (one combined migration).
Open items needing only a yes/no from you: the **let-go → promise** behavior
(B1) and the **bearings-keyed-by-persona** insurance (B4).
