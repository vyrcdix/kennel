# Cadence — response to engineering handback

**To:** Engineering (via Craig)
**From:** Claude design / PM
**Re:** `README-a1f4d985.md` (handback on `design_handoff_cadence/`)
**Date:** 2026-06-11

Thanks — this is exactly the right level of review. **We accept the sequencing
recommendation:** finish Tidewater skin slices 5–7, dogfood, then build Cadence
as its own multi-part track (data + engine → the 5 surfaces → memo routing)
against the reserved seams. Answers below, point by point. Where you proposed a
default and we agree, it says **confirmed**.

---

## A. Blockers

### A1. Skin parity → **Cadence ships in BOTH skins.** Parity invariant holds.
Cadence is core product, not a Life-only flourish — we will **not** take a parity
exception. It must be reachable and complete in Workshop too.

**Workshop treatment is delivered** — see **`Cadence Workshop.html`** in this
folder. The important architectural point: it imports the **unmodified
`tide-cadence.jsx`** and only remaps the token sheet on a `.sk-workshop` root.
Same components, same behaviour, Workshop dress. So this is **one component set,
two token maps** — do not fork the components per skin (same rule as the base
skin port). Concretely, the Workshop mapping:

| Token role | Life (Tidewater) | Workshop |
|---|---|---|
| Warm / kept hue (`--sacred*`) | sea-glass amber + glow | **blaze gold** `#E8B547` (keepsake hue) |
| Primary / in-focus (`--action*`) | lagoon teal | **ember** `#D9622C` |
| Card warmth treatment | radial sea-glass glow | radial **blaze** tint (no glow) |
| Display / sans / mono | Bricolage / Hanken / Spline Mono | **Oswald / Inter / JetBrains Mono** |
| Radius | 17 / 11px (water-worn) | **6 / 4px** (boxy) |
| Vitality words | sunlit / active / deepening / still | **fresh / active / aging / dormant** |

The loop (**Did it / Skip / Snooze**), the commitment dial, the rhythm trace, the
divergence question, and field-notes memo routing are **identical in structure
and behaviour** across skins — only vocabulary + dress change. (Voice memo: see
B3.) The divergence copy is lightly tuned to Workshop's terser voice but asks the
same question; no red, no "overdue," in either skin.

### A2. Persistence → **confirmed.** Promote to typed columns + API fields via a
migration, mirroring the v0.5 facet migration (`0010_v05_facets.sql`). The brief's
"no migration / ride the JSON blob" was a simplification on our side and is
**superseded** — your typed-column shape is correct. Fields: `cadence`,
`commitment`, `window_opens_at`, `last_done_at`, `kept_count`, `resource_ref_id`
(+ optional `note_default_section`, see B4). **Vitality stays derived — do not
persist it.**

### A3. Backend ownership → **confirmed: the engine is yours to design**, on the
crystal-resurface + aging model. No server-side spec exists. Here is the
**behavioral contract the UI depends on** (please preserve these semantics):

- **Recur-create** — promote an action: set `cadence`, `commitment`, optional
  `resource_ref_id`, attach to parent; set first `window_opens_at`.
- **Did it** — log a contact: set `last_done_at = now`, **roll
  `window_opens_at` to the next window**, increment `kept_count`, recompute
  derived vitality. **Never completes/deletes the item** — it returns next window.
- **Skip** — roll `window_opens_at` to the next window **without** touching
  `kept_count` and **without** recording any deficit. One skip must not break the
  streak.
- **Snooze** — bump within the *current* window (a few days) **without** advancing
  the cadence.
- **Re-commit / Ease off** — set `commitment` (core / trying); clears the
  divergence state implicitly (it's derived).
- **Aging** — when a cadence exceeds its cooling tolerance (A4) it surfaces on the
  Aging board; the amnesty verbs (U keep going / C crystallize / F file / X let
  go) map to existing transitions.

### A4. Vitality + tolerance numbers → **proposed table below; ship it verbatim,
then tune.** Per Craig: these should become **configurable** (Settings →
Lifecycle, per commitment) — Claude proposes the starting values, we test on the
dogfood instance and refine. Treat the numbers as defaults, not constants.

Definitions: a **window** = one cadence period (1 day / 1 week / 1 month).
`windows_behind` = full windows elapsed since `last_done_at` with no "Did it".
`effective = max(0, windows_behind − grace[commitment])`.

**Commitment grace (flat offset, in windows):**

| Commitment | grace |
|---|---|
| trying | 0 |
| committed | 1 |
| core | 2 |

**Vitality band from `effective`:**

| effective | vitality |
|---|---|
| 0 | fresh |
| 1 | active |
| 2 | aging |
| ≥3 | dormant |

**Cooling tolerance — drops onto the Aging board after N *consecutive skipped
windows*, by commitment (the configurable dial):**

| Commitment | skipped windows before Aging |
|---|---|
| trying | 3 |
| committed | 6 |
| core | 10 |

…which in real time is: daily → 3 / 6 / 10 **days**; weekly → 3 / 6 / 10 **weeks**;
monthly → 3 / 6 / 10 **months**.

Notes: (1) Cadence vitality is **window-relative**, deliberately *not* the item
temperature's absolute 21d/60d — a daily practice shouldn't read "fresh" for three
weeks. Keep it a parallel computation on the same engine. (2) **Daily** is the
likeliest to feel naggy (B-side of §11.5); if 3 days-to-Aging for *trying* feels
harsh in dogfood, raise the daily multiplier — that's exactly what the configurable
dial is for. (3) Seed values in `data.jsx` (`vitality`, `kept`) are **illustrative
for the mock**; production derives them.

---

## B. Clarifications

### B1. "Do this week" semantics → **confirmed.** One aggregated slot below the
hearth. **Cadences appear *only* there** — suppress them from the normal In-focus /
"what it serves" list (that's the dedup rule). The per-card **window chip** (`do
today` / `do this week` / `do this month`) carries the real rhythm, so daily,
weekly, and monthly can share one slot without ambiguity; daily renders **softer**
(lighter, lower emphasis), not differently-placed.

### B2. Vitality vocabulary → **confirmed, framed per-skin.** The shared contract is
the **state** (`fresh / active / aging / dormant`). Each skin renders its own
label over that state: **Workshop = fresh / active / aging / dormant** (the
canonical words, guidance §6.3); **Life = sunlit / active / deepening / still**.
There is no conflict — they're two labelings of one signal, which is also how
item Temperature already differs by skin.

### B3. Voice memo scope → **confirmed: v1 text-only.** Real mic capture + audio
storage + transcription is a separate follow-on. **Keep the voice affordance in
the design** but ship it **hidden behind a flag** (don't delete it) so the layout
and mental model are intact when it lands. v1: the memo is a text field that
files into field notes (B4).

### B4. Field-notes memo routing → **confirmed, with one correction.**
- `noteTo.section` **maps to the fixed `FieldNotesSectionKey` enum.** The richer
  per-thread section names in the mock's `THREAD_SECTIONS` (e.g. "What I'm
  following", "Logistics", "Sources", "Draft notes") were **illustrative** — in
  production, collapse them to the enum. Suggested defaults for the seed cadences:

  | Cadence | Suggested section (enum) |
  |---|---|
  | Sunday call with Dad | **People** |
  | Catch up on Foreign Affairs | **Open questions** (alt: Resources) |
  | Mobility before the run | **What's working** |
  | Read one Le Guin essay | **Resources** |
  | 200 words of the novel | **Scratch** |

  If product later wants thread-specific section vocabularies, that's a deliberate
  **enum extension** — out of scope for v1; flag it and we'll spec separately.
- **Routing target = the owning thread of the attached parent.** When the cadence
  is attached to a crystal or idea (not a thread directly), the memo files into
  **that parent's owning thread's** field notes. Confirmed.

---

## Files added to the bundle for this response

- **`ENG-RESPONSE.md`** — this document.
- **`Cadence Workshop.html`** — the Workshop-skin treatment (parity proof: same
  components, remapped tokens) + a Life⇄Workshop vocabulary key.

`tide-cadence.jsx` is unchanged by this round (Workshop needs no component
changes — only a token map).
