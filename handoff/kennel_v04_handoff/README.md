# Handoff: Kennel v0.4 — crystallization-first redesign (blaze + dust)

> **Scope:** a visual + flow redesign of the existing Kennel app. The data model
> is essentially unchanged (still projects/threads, items, docs, kinds, states) —
> this changes the **palette**, the **information architecture** of the theme and
> dashboard surfaces, and adds a small number of **facets** to existing tables.
>
> Builds on v0.3 (which already shipped the lifecycle states, `last_touched_at`,
> Field notes, and the Sort screen).

## What's in this bundle

```
kennel_v04_handoff/
├── README.md                       ← you are here
└── design/
    ├── v4-flow.jsx                 ← THE canonical reference: Dashboard,
    │                                  Theme landing, Crystal detail in the
    │                                  final blaze+dust palette
    ├── crystallization-layer.jsx   ← typed crystal artifacts + drill-down
    ├── crystal-structures.jsx      ← the three-doorways model (field notes /
    │                                  guidebook / playbook) + the two detail views
    ├── trace.jsx                   ← "go back through your thinking" timeline
    ├── actions-in-context.jsx      ← actions nested in their thinking (not a list)
    └── common.jsx                  ← shared atoms (icons, KindIcon, etc.)
```

`v4-flow.jsx` is the source of truth for palette and layout. The other files are
reference for specific surfaces. Re-implement in the existing codebase's stack;
don't ship the JSX.

---

## Fidelity

**High-fidelity.** Palette values, layout, hierarchy, and vocabulary are final.

---

## 1. The big idea

Kennel is an information-organization tool around the cycle
**think → research → consolidate → reflect → repeat**. The *point* of the tool is
to **crystallize knowledge** — to distil the salient stuff (memories, quotes,
hints, principles) out of a sprawl of supporting material, and keep it fresh.

v0.4 makes that legible. A theme reads as a funnel toward crystallization, the
crystals are the visual hero, and the messy supporting material is organized into
three clear kinds behind them.

**It is NOT a task manager.** To-dos exist, but only ever *in service of* a piece
of thinking — never as a context-free list. (See §6.)

---

## 2. Palette — "blaze + dust"

The tonal leads are **blaze** (the light) and **dust** (the room). Full token set
(from `v4-flow.jsx`, scoped to `.km-v4`):

| Token         | Value      | Role                                                            |
|---------------|------------|-----------------------------------------------------------------|
| `--v-bg`      | `#EEE2C9`  | Dust ground — the everyday page background.                     |
| `--v-sunk`    | `#E5D4B4`  | Deeper dust — header bands, sunk panels, secondary rows.        |
| `--v-card`    | `#F8F1E0`  | Card — **lighter** than the ground; lift comes from this, not shadow. |
| `--v-ink`     | `#2B2014`  | Warm dark ink (replaces cold slate for all text).               |
| `--v-soft`    | `rgba(43,32,20,.62)` | Secondary text.                                       |
| `--v-faint`   | `rgba(43,32,20,.40)` | De-emphasized / mono metadata.                        |
| `--v-line`    | `rgba(43,32,20,.13)` | Default hairline.                                     |
| `--v-line2`   | `rgba(43,32,20,.26)` | Emphasized border.                                    |
| **`--v-blaze`**   | `#E8B547` | **Crystallization glow.** The hero accent.                  |
| `--v-blaze-dk`| `#B07E12`  | Blaze text/icon on light surfaces.                              |
| `--v-dust`    | `#C9A87C`  | Dust accent (theme pills, soft chrome).                         |
| `--v-ember`   | `#D9622C`  | **Sparing** action accent — primary buttons, the live focus marker only. |
| `--v-ember-dk`| `#A84919`  | Ember hover / pressed.                                          |
| `--v-moss`    | `#5C7A3E`  | Structure — guidebook family marker.                            |
| `--v-clay`    | `#BC7A4E`  | Field-notes family marker.                                      |

### Palette rules (enforce these)

1. **Blaze appears ONLY on crystals and the crystallization moment.** Gem icons,
   crystal-card gradient borders, crystal counts, the pipeline's Crystallize
   endpoint. If blaze is everywhere, nothing reads as crystallized.
2. **Dust is the default surface.** Most of every screen is dust-toned and quiet.
3. **Ember is rationed.** The single primary action (Capture) and the "in focus"
   marker. Nothing else.
4. **Lift without shadow.** A raised card (`--v-card`) is *lighter* than its ground
   (`--v-bg`/`--v-sunk`). No drop shadows (inherited Pacecraft rule).
5. **Family colors:** field notes → clay, guidebook → moss, playbook → ember-edge,
   crystal → blaze. Use them as 3px top borders / icon tints, not fills.
6. Type: Oswald (display, now 600 weight for hero headlines), Inter (body),
   JetBrains Mono (timestamps, slugs, counts, source counters).

> **Dark mode:** invert ground/ink against slate-dark (`#2A2E33` floor, never pure
> black) but keep blaze/ember/moss/clay unchanged — same as the existing dark-mode
> rule. Not yet mocked; follow the v0.3 dark-mode approach.

---

## 3. Vocabulary (final)

| Concept                 | Label                | Schema (unchanged)                       |
|-------------------------|----------------------|------------------------------------------|
| Container               | **Thread** (in copy) | `project`                                |
| Dashboard primary cut   | **In focus**         | items ordered by `last_touched_at`       |
| Durable outcome (kind)  | **Crystal** / Crystallization | `kind = 'crystallization'`      |
| Open inquiry (kind)     | **Question**         | `kind = 'question'`                      |
| The holding place       | **The bench**        | `state = 'inbox'` — **relabel only**     |
| Processing the bench    | **Sort**             | (the action/screen)                      |
| Soft archive            | **Filed**            | `state = 'filed'`                        |
| My observations         | **Field notes**      | doc with `doctype = 'field_notes'`       |
| Curated references      | **Guidebook**        | doc with `doctype = 'guidebook'`         |
| Reproducible how-to     | **Playbook**         | doc with `doctype = 'playbook'`          |

> **"The bench"** replaces "Inbox" everywhere in copy. It's where raw, context-free
> captures land before they're sorted into a thread. Schema value stays `inbox`.
> "Clear the bench" is the mental model, not "process your inbox".

---

## 4. Data-model facets to add

Small additions; everything else from v0.1–v0.3 stays.

```sql
-- Crystallization type — what KIND of salient artifact this is.
-- Applies to items where kind = 'crystallization'.
ALTER TABLE items ADD COLUMN ctype TEXT;   -- 'principle'|'quote'|'reminder'|'hint'|'memory'
                                           -- null for non-crystallization items

-- Crystallization lineage — which items/docs/chats it was distilled from.
-- (If you already added sources_from in v0.3, reuse it.)
ALTER TABLE items ADD COLUMN sources_from JSON;  -- array of source item/doc ids

-- Doc subtype — distinguishes the three supporting structures.
ALTER TABLE docs ADD COLUMN doctype TEXT DEFAULT 'doc';
                                           -- 'doc'|'field_notes'|'guidebook'|'playbook'

-- A doc/playbook/guidebook may attach to a crystal it supports.
ALTER TABLE docs ADD COLUMN supports_crystal TEXT;  -- nullable item id (a crystallization)

-- Crystal "freshness" — when it last re-surfaced (for "kept fresh" + resurfacing).
ALTER TABLE items ADD COLUMN last_surfaced_at TIMESTAMP;
```

No new tables. Crystals, field notes, guidebooks, and playbooks are all existing
entities (items / docs) with a facet column.

---

## 5. The three screens (see `v4-flow.jsx`)

### Screen 1 · Dashboard — `V4Dashboard`
Cross-theme home. Top to bottom:
- **Crystallized this week** — a masonry of blaze crystal cards across all themes.
  The light leads. Empty? Hide the section.
- **In focus** — actions grouped under the crystal/idea they serve (see §6). Each
  group header reads `in service of · <crystal or idea>` with the theme pill.
  Ordered by `last_touched_at`.
- **Themes** — cards where the headline number is the **crystal count** (blaze gem),
  gathered-material count secondary, last-touched timestamp.

### Screen 2 · Theme landing — `V4ThemeLanding`
The funnel. Top to bottom:
- **Dust header band** — theme pill, big ink headline (the thread's framing), one-
  line description.
- **The salient layer** — the blaze crystal gallery. The front page of the theme.
  Typed cards (principle/quote/hint/memory/reminder) at mixed sizes.
- **The pipeline** — a 4-stage bar: `THEME → GATHER → SHAPE → CRYSTALLIZE`, dust
  track with a glowing blaze endpoint. Counts are live (`1 / 23 / 3 / 11`). The
  active stage carries an ember top border.
- **Three doorways** — Field notes / Guidebooks / Playbooks panels (clay / moss /
  ember top borders), each with a count and an "open →".
- **Trace teaser** — a dust strip linking to the Trace.

### Screen 3 · Crystal detail — `V4CrystalDetail`
The hub. Two-pane:
- **Left (blaze wash):** the crystal — type chip, big headline, body, a "distilled
  into" list of the smaller artifacts it spawned (quote, reminder), and a
  `crystallized Nd ago · re-surfaced N× · kept fresh` line.
- **Right (dust):** "Built on" — the three doorways of supporting material grouped
  (Field notes / Guidebook / Playbook), each listing real sources.

---

## 6. Actions serve thinking (critical — see `actions-in-context.jsx`)

The single most important behavioural rule. **An action is never context-free.**

- Capture stays frictionless: drop a to-do in <5s, no required fields, it lands on
  **the bench**, context-free — briefly fine.
- At **Sort**, the action is attached to the crystal / idea / thread it serves. One
  keystroke. This is where context enters.
- From then on the action **travels with its thinking** — it renders nested under
  that crystal/idea (with an `in service of` label), in the trace, and in search.
  Never as a loose checkbox.
- A **to-do lens** still exists: filtering any view to "actionable now" yields a
  flat list on demand. But it is a *view*, not the home. The home is the thinking.

Implementation: an action item carries `serves_id` (nullable item id of the
crystal/idea/thread it's attached to). Unsorted actions on the bench have
`serves_id = null`; Sort sets it.

```sql
ALTER TABLE items ADD COLUMN serves_id TEXT;  -- nullable; the thinking this action serves
```

---

## 7. Supporting structures — field notes / guidebook / playbook

See `crystal-structures.jsx` for the model and the Playbook / Guidebook detail
views. All three are docs (`doctype` facet) and may attach to a crystal
(`supports_crystal`).

- **Field notes** (clay) — first-person observations & notes. Already exists from
  v0.3; just gains the family color + the ability to attach to a crystal.
- **Guidebook** (moss) — a curated, annotated collection of topical references that
  sit *behind* a crystal. Rendered as grouped reference rows with a "why it matters"
  annotation per source.
- **Playbook** (ember) — reproducible steps + an **artefacts panel** (where the demo
  lives, repo, prototype URL, and a keys/access block). This is the "how do I do
  this again / where are the hard artefacts" surface. Numbered-step layout with a
  dark mono code block per step.

---

## 8. Trace — "go back through your thinking" (see `trace.jsx`)

A new view per theme: a reverse-chronological timeline of how the thinking evolved.
- **Crystals** are blaze milestones on the spine.
- **Discarded forks** stay visible but faded + struck-through (so you remember *why*
  you let something go).
- **Gathered material** clusters into "N items gathered here" nodes rather than
  scattering.
- **Forks** show parallel branches with their outcomes (one became a crystal, one
  was discarded).

Derive from the activity log + item lineage (`sources_from`, `serves_id`,
state-transition activity). The "Behind an idea" view (`BehindAnIdea` in `trace.jsx`)
shows one not-yet-firm idea with its sprawl auto-organized into the three doorways +
dead-ends, and the move-it-forward actions (crystallize / shape into guidebook /
draft playbook / let go).

---

## 9. Rollout order

1. **Palette swap** — introduce the `.km-v4` token set; migrate component styles to
   the new variables. Biggest visual change, lowest logic risk.
2. **Rename pass** — "Inbox" → "The bench" everywhere in copy.
3. **Facets** — `ctype`, `doctype`, `supports_crystal`, `serves_id`,
   `last_surfaced_at` (schema + API enums).
4. **Crystal-as-salient-layer** — typed crystal cards; the gallery; the theme
   landing's salient layer.
5. **Theme landing reflow** — funnel pipeline + three doorways + trace teaser.
6. **Dashboard reflow** — Crystallized-this-week, In-focus-with-context, theme rail.
7. **Actions-in-context** — `serves_id`, the nested rendering, the to-do lens.
8. **Playbook / Guidebook detail views.**
9. **Trace + Behind-an-idea.**

---

## 10. What's NOT changing

- Core entities (projects/items/docs/chats/skills/activity). Only facet columns added.
- The Create Project modal (§6.9) flow and validation.
- Keyboard shortcuts.
- The "quiet by default / no notifications / flat fills / no gradients except the
  subtle crystal-glow gradient border" principles.
- The Pacecraft brand constraints: no Lily, no pure black in dark mode, logo slot
  stays empty until commissioned.
