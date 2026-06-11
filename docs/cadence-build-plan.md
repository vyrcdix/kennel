# Cadence (recurring actions) — build plan

Feature: a **recurring action** — an ordinary action item (`kind=action`) given
a *rhythm* (daily/weekly/monthly), a declared *commitment* (trying/committed/
core), a derived *vitality* (reuses the temperature signal), an *attachment* to
what it serves, and an optional *resource* link. Surfaced as an **invitation
("do this week"), never a due date**; swept into honest amnesty when it cools.

**Authoritative design source:** `handoff/design_handoff_cadence-2/`
(`README.md` build spec · `cadence-product-brief.md` the why · `ENG-RESPONSE.md`
the answers to our handback · `Cadence Studies.html` → **Treatment C ships** ·
`Cadence Workshop.html` the parity proof · `tide-cadence.jsx` the prototype).
Eng questions + resolution: `handoff/cadence_eng_questions/README.md` (RESOLVED).

**Branch:** `feat-cadence`, off `main` **after the Tidewater skin merges**
(Cadence reuses the skin's token layer, copy table, toast/permanence and motion
layer, and ships in both skins). If the skin hasn't merged yet, branch off
`skin-life-tidewater`.

**Dependencies (all shipped on the skin branch):** semantic token layer +
`.km-skin-life` sheet · `lib/copy.ts` (per-skin voice) · `lib/toast.ts` +
`lib/permanence.ts` (kinds + Undo) · the motion layer (`--motion-scale`,
reduced-motion gate) · `lib/temperature.ts` (the engine cadence vitality
parallels).

---

## Design rulings (ENG-RESPONSE.md, 2026-06-11) — all blockers resolved

- **Both skins, no parity exception.** Cadence is core product. **One component
  set, two token maps** — same components, Workshop vs Life dress via the
  existing skin token system (do *not* fork components per skin). Workshop
  vitality words `fresh/active/aging/dormant`; Life `sunlit/active/deepening/
  still` — two labelings of one shared state. The loop, commitment dial, rhythm
  trace, divergence question and memo routing are identical across skins.
- **Persistence = typed columns + migration** (mirror `0010_v05_facets.sql`).
  The brief's "ride the JSON blob, no migration" is superseded. Vitality stays
  **derived — never persisted.**
- **The engine is ours to design**, on the crystal-resurface + aging model. The
  behavioral contract the UI depends on is specified (see Engine, below).
- **Vitality + tolerance numbers are given** (A4, below) and must be
  **configurable** (Settings → Lifecycle, per commitment) — ship the defaults,
  tune on the dogfood instance.
- **"Do this week"** is one aggregated slot below the hearth; cadences appear
  **only** there (suppressed from In-focus — the dedup rule); the per-card window
  chip carries the rhythm; daily renders softer.
- **Voice memo: v1 text-only**, the voice affordance kept but **behind a flag**.
- **Memo routing:** `noteTo.section` maps to the `FieldNotesSectionKey` enum;
  the memo files into the **attached parent's owning thread's** field notes.

## Data model (next migration — `0014_cadence.sql`)

Typed columns on `items` (action items only; null elsewhere). Mirror the v0.5
facet migration: add columns, backfill nothing, extend the API
serializer/deserializer and the `Item` type.

| Column | Type | Notes |
|---|---|---|
| `cadence` | `daily \| weekly \| monthly` | null = ordinary one-shot action |
| `commitment` | `trying \| committed \| core` | declared dial; never auto-changes |
| `window_opens_at` | timestamp | when it enters "do this week" |
| `last_done_at` | timestamp | last logged contact |
| `kept_count` | int | gentle streak readout — not a score |
| `resource_ref_id` | id (FK → `references`, type `link`) | the on-card resource |
| `note_default_section` | `FieldNotesSectionKey` | UI default for memo routing |

Attachment to the parent crystal/idea/thread reuses the **existing attach
relation** (`servesId`) — no new join. **Vitality is derived, not stored.**

## Vitality + cooling (A4 — defaults; configurable)

A **window** = one cadence period. `windows_behind` = full windows elapsed since
`last_done_at` with no "Did it". `effective = max(0, windows_behind − grace)`.

| Commitment | grace (windows) | cooling tolerance (consecutive skipped windows) |
|---|---|---|
| trying | 0 | 3 |
| committed | 1 | 6 |
| core | 2 | 10 |

| `effective` | vitality |
|---|---|
| 0 | fresh (sunlit) |
| 1 | active |
| 2 | aging (deepening) |
| ≥3 | dormant (still) |

Cooling tolerance in real time = N × the period (daily→days, weekly→weeks,
monthly→months). Vitality is **window-relative** (a daily practice must not read
"fresh" for three weeks) — a parallel computation on the temperature engine, not
the item's absolute 21/60-day thresholds. The three tolerance values become a
Settings → Lifecycle dial (per commitment), beside the resurface interval.

## Engine — behavioral contract (server-side; UI depends on these)

- **Recur-create** — promote an action: set `cadence`, `commitment`, optional
  `resource_ref_id`, attach to parent, set first `window_opens_at`.
- **Did it** — `last_done_at = now`; **roll `window_opens_at` to the next
  window**; `kept_count++`; recompute derived vitality. **Never completes/deletes
  the item** — it returns next window.
- **Skip** — roll the window; **no `kept_count` change, no deficit recorded**.
  One skip must not break the streak.
- **Snooze** — bump a few days **within the current window**; don't advance the
  cadence.
- **Re-commit / Ease off** — set `commitment` (core / trying); divergence clears
  implicitly (it's derived).
- **Aging** — exceeding the cooling tolerance surfaces the cadence on the Aging
  board; amnesty verbs (`U` keep going / `C` crystallize / `F` file / `X` let go)
  map to existing transitions.

No notifications, ever. No overdue, no red, no deficit. A cadence can only be
**done** or **roll**.

## Architecture

- **One component set, two token maps.** The Cadence components read only
  `var(--…)` tokens (sacred/action/fam-*/dot-*/ink/card/sunk, radii, shadows) —
  so they re-dress between Workshop and Life with zero per-skin forks, exactly
  like the base-skin port. Vitality colors come from the existing depth map
  (fresh→sacred, active→action, aging→fam-run, dormant→ink-faint); labels via
  `lib/copy.ts` (`vitality.*` keys, per skin).
- **Vitality derived client-side**, mirroring `temperatureForDate` — a pure
  `cadenceVitality(item, settings, now)` in `lib/cadence.ts` (windows-behind −
  grace → band). Window rolling + `kept_count` are server mutations.
- **Reuse the skin infra:** the loop's toasts/Undo go through `lib/permanence.ts`
  + `lib/toast.ts`; the "Did it" warm pulse (`cad-kept`) and the voice-record
  dot (`cad-rec`) are new keyframes in the motion layer, gated on
  `prefers-reduced-motion` + `--motion-scale` like everything else.
- **No new top-level entity.** A cooled cadence stays an `action` item the aging
  query already sees; "Kept warm by" / "Do this week" / "Cooled cadences" are
  new selectors over the cadence columns.

## Slices

| # | Slice | Contents | Gate |
|---|---|---|---|
| C0 | Data model | `0014_cadence.sql` typed columns; extend `Item` type + API (de)serialize; no behavior | migration review |
| C1 | Engine + endpoints | server services + routes: recur-create / did-it / skip / snooze / re-commit / ease-off; window rolling; per-commitment cooling tolerance in Settings; engine unit tests | contract tests green |
| C2 | Derivation + selectors | `lib/cadence.ts` (vitality A4, window helpers, "do this week" predicate, suppress-from-in-focus); selectors `getCadencesDueThisWeek` / `getCooledCadences` / `getCadencesServing`; `copy.ts` cadence keys (both skins) | none |
| C3 | Core components + tokens | `CommitMeter`, `RhythmTrace`, `CadenceCard`, `CadenceResolved` (Treatment C); `cadKept` + `cadRec` keyframes; `repeat`/`mic`/`globe` icons; both skins via tokens | none |
| C4 | Surfaces 1 + 4 | Dashboard **Do this week** below the hearth (both skins) + suppress cadences from In-focus + the loop wired to C1; Aging **Cooled cadences** panel (fills the slice-6 seam) with amnesty verbs | none |
| C5 | Surfaces 2 + 3 + 5 | Sort **R · Recur** verb + `RecurModal` (create); Crystal/idea **Kept warm by** + **+ Recurring action** (fills the slice-5 seam); Settings → Lifecycle **cadence aging tolerance** (per commitment, configurable A4) | none |
| C6 | Memo routing + QA/deploy | `MemoComposer`/`MemoChip` (text-only v1; voice behind a flag); route memo → attached parent's owning-thread field-notes section; QA (AA both skins, reduced-motion, **no-due/no-red/no-deficit audit**, parity); ship to the test instance | A5-style voice review; deploy |

## Open items / flags (resolve during the slices)

1. **Field-notes section enum mismatch (B4).** Our real `FieldNotesSectionKey`
   is `premise · whatIKnow · openQuestions · sources · crystallizations` — **not**
   the "People / Resources / Scratch / What's working" the response assumed. The
   suggested per-cadence defaults must remap: *Open questions* → `openQuestions`,
   *Resources* → `sources`, *What's working* → `whatIKnow`; **People** and
   **Scratch** have no equivalent. **Action:** confirm the remap with design
   (likely *People*/*Scratch* → `premise`), or treat as the deliberate enum
   extension the response flagged as out-of-scope for v1. Decide in C6.
2. **Voice memo behind a flag (B3).** Wire a build/runtime flag so the voice UI
   is hidden in v1 but the layout/mental-model stay intact; schedule real mic +
   storage + transcription as a separate follow-on.
3. **Tolerance dial shape.** Settings gains per-commitment cadence-tolerance
   fields (e.g. `cadenceToleranceTrying/Committed/Core` or a nested object) +
   migration/validation — decide the exact Settings shape in C1.
4. **Daily-cadence pressure.** Daily is the likeliest to feel naggy; if 3
   days-to-Aging for *trying* reads harsh in dogfood, the configurable dial is
   the lever (response A4 note 2).

## Invariants checklist (verify before merge)

- [ ] **No due date, no red, no "overdue," no deficit** anywhere — a cadence can
      only be *done* or *roll*; skipping breaks no streak and shows no count.
- [ ] **"Did it" never deletes** — it logs, rolls, and the action returns next
      window.
- [ ] **No notifications** — cadences only *surface* when their window opens.
- [ ] **Both-skin parity** — every surface complete in Workshop and Life; one
      component set, two token maps; no per-skin component fork.
- [ ] **Vitality derived, never stored**; window-relative; configurable
      grace/tolerance (A4 defaults shipped).
- [ ] **Cadences appear only in "Do this week"** (suppressed from In-focus).
- [ ] **Resource link renders on the card** (one click to act), never buried.
- [ ] **The divergence question is gentle** (declared core vs observed dormant) —
      never a scold; one-keystroke verdicts.
- [ ] **Motion** (cad-kept pulse, cad-rec dot) ≤ spec, reduced-motion =
      end-state; temperature/vitality never animates.
- [ ] **Memo** files into the attached parent's owning-thread field notes;
      text-only in v1.
- [ ] **AA contrast, both skins, both modes** (reuse the slice-7 harness).
