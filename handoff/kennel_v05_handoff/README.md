# Kennel v0.5 — reconciled spec (answers the v0.4 hand-back)

> **From:** Claude design · **To:** Steep / Kennel build · **Re:** your
> `v04-design-handback.md`.
>
> Every conflict you raised is resolved below with one of **Keep build as-is**,
> **Build follows design**, or **Both, parallel** — plus the product decisions
> the owner made. This supersedes the migration block in the original v0.4
> handoff (`README.md` §4) wherever they differ. Where this doc is silent, the
> v0.4 handoff stands.

---

## 0. Headline decisions (owner-confirmed)

1. **"Playbook" is retired.** It was a redundant synonym for **Runbook**, which
   already exists and is good. The third doorway is **Runbook**. No `playbooks`
   table. (Resolves §2.3 → option **(a)**.)
2. **Field notes stays one-per-project**, structured, table-backed. Crystal links
   attach at the **section** level. (Resolves §2.2 / §2.8.)
3. **Thread color picker is replaced** with a 6-color non-semantic **label**
   palette (spec in §A below). (Resolves §2.4 → option **(1)**.)
4. **"Kept fresh" ships with a cadence now**, and resurfacing events appear in
   **both** the Dashboard and the theme-landing (dedicated "resurfacing" slots).
   (Resolves §2.6.)

---

## 1. Per-item resolutions

| # | Topic | Verdict | What the build does |
|---|---|---|---|
| 2.1 | **Guidebook** | **Keep build as-is** | Guidebook stays the `guidebooks` + `guidebook_entries` two-table collection. **Drop `docs.doctype='guidebook'`** from the migration. Add `guidebooks.supports_crystal_item_id` (nullable). The "why it matters" annotation **is** `guidebook_entries.description` — reuse by name. v0.4 visual treatment (moss family color, "Guidebook · others'" doorway, "open →") maps onto the existing list + detail screens. |
| 2.2 | **Field notes** | **Keep build as-is** | Field notes stays the `field_notes` table, one row per project, sectioned, with scratchpad/managed toggle. **Drop `docs.doctype='field_notes'`.** No ad-hoc field-note documents. Crystal link is section-level (see §2.8). |
| 2.3 | **Playbook vs Runbook** | **Keep build as-is** | Runbook is unchanged: per-project, six sections, labelled `urls[]`. "Playbook" disappears from all design copy. Optional (non-blocking) enhancement: group the existing `urls[]` into labelled clusters (demo / repo / keys) in the Runbook header — cosmetic, schema unchanged. |
| 2.4 | **Thread colors** | **Build follows design** | Replace the `moss\|ember\|dust\|blaze\|slate` picker with the 6 label colors in §A. Migrate existing values per §A. |
| 2.5 | **Bench rename** | **Confirmed** | User-facing strings + MCP tool **descriptions** only. **Not** tool names (`list_queue` stays). "Sort" = the existing TriageQueue screen. **Schema `state='inbox'` unchanged.** "Filed" keeps its label; "Dismissed" → **"Let go"** in copy (schema `dismissed` unchanged). |
| 2.6 | **Kept fresh** | **Build follows design** | Ship cadence now. See §B. |
| 2.7 | **serves_id / Sort** | **Build follows design** | `serves_id` is a new nullable edge, **orthogonal** to `sources_from`. Sort UX in §C. Sort can mint a crystal in one step. |
| 2.8 | **Attachment edges** | **Both, parallel** | `guidebooks.supports_crystal_item_id` + `runbooks.supports_crystal_item_id` + `docs.supports_crystal` (all nullable). Field notes has no sections table, so section-level links use a JSON map `field_notes.supports_crystals` (Option 2). Construction in §D. |
| 2.9 | **ctype** | **Build follows design** | Nullable, retypeable, no backfill. See §E. |
| 2.10 | **Trace** | **Build follows design** | Discarded = `dismissed` only. Cluster + fork rules in §F. |

---

## 2. Corrected migration (replaces original handoff §4)

```sql
-- Crystallization typing (nullable; only meaningful when kind='crystallization')
ALTER TABLE items ADD COLUMN ctype TEXT;          -- principle|quote|reminder|hint|memory|null

-- Crystal lineage (backward: what a crystal was distilled from)
ALTER TABLE items ADD COLUMN sources_from JSON;   -- [item/doc/chat ids]   (reuse if already present)

-- Action intent (forward: the thinking an action advances) — orthogonal to sources_from
ALTER TABLE items ADD COLUMN serves_id TEXT;      -- nullable item id (crystal | idea | thread-anchor)

-- Crystal freshness / resurfacing
ALTER TABLE items ADD COLUMN last_surfaced_at TIMESTAMP;
ALTER TABLE items ADD COLUMN surface_count INT DEFAULT 0;

-- Crystal attachment edges on the EXISTING supporting-structure tables
ALTER TABLE guidebooks  ADD COLUMN supports_crystal_item_id TEXT;  -- nullable
ALTER TABLE runbooks    ADD COLUMN supports_crystal_item_id TEXT;  -- nullable
ALTER TABLE docs        ADD COLUMN supports_crystal TEXT;          -- nullable (plain docs only)

-- Field notes is one row per project with section columns (no field_notes_sections table).
-- Section-level crystal links via a JSON map { section_key -> crystal_item_id }. (Option 2.)
-- Normalizing into a field_notes_sections table is the right long-term shape but is a
-- SEPARATE future slice ("section split"), NOT part of v0.5.
ALTER TABLE field_notes ADD COLUMN supports_crystals JSON;  -- { premise|whatIKnow|openQuestions|sources|crystallizations -> item id }

-- Plain-doc subtype ONLY (guidebook/field_notes/runbook are their own tables — NOT doctypes).
-- No DB CHECK constraint — only 'doc' is valid now, enforced at the application layer so a
-- future subtype doesn't require another migration.
ALTER TABLE docs ADD COLUMN doctype TEXT DEFAULT 'doc';

-- Thread label color (replaces the old enum; see §A for value migration)
-- projects.color already exists; the ALLOWED SET changes, values migrate.
```

> **Dropped from the original handoff:** `docs.doctype='guidebook'`,
> `docs.doctype='field_notes'`, and any `playbooks` table. The `doctype` column is
> kept but only `'doc'` is valid for now (reserved so plain docs can subtype later
> without another migration).

---

## A. Thread label palette (resolves §2.4)

Six low-chroma **label** colors. They carry **no** semantic meaning, so
blaze/ember/moss/clay stay unique to the family language. Rendered as a 3px
**left-tint** on the slug pill, never a surface fill.

| Label | Hex |
|---|---|
| stone | `#8C8275` |
| sage  | `#79876F` |
| dusk  | `#6C7A8C` |
| plum  | `#87697C` |
| slate | `#5A6066` |
| teal  | `#5E807A` |

**Reserved (never selectable as a thread color):** `blaze` (crystals), `ember`
(action), `moss` (guidebook family), `clay` (field-notes family).

**Value migration for existing projects:**

| old value | new value |
|---|---|
| `slate` | `slate` |
| `dust`  | `stone` |
| `moss`  | `sage`  |
| `ember` | `stone` |
| `blaze` | `stone` |

One-time, reversible from Edit thread. (See the **"04 · Thread label colors"**
artboard in the canvas for the rendered pills + reserved-vs-selectable contrast.)

---

## B. "Kept fresh" cadence (resolves §2.6)

**Data shape:** `last_surfaced_at`, `surface_count` (above). On create,
`last_surfaced_at = created_at`, `surface_count = 0`.

**Cadence rule (default, user-configurable in Settings):**
- A crystal is **due to resurface** when `now - last_surfaced_at > resurface_interval_days`
  (default **30**; setting range 7–180).
- Touching a crystal (open, edit, or re-link) **resets** `last_surfaced_at = now`.
- When a due crystal is shown in a resurfacing slot **and acknowledged**
  (**"Still true"**), set `last_surfaced_at = now`, `surface_count += 1`.
- No notifications, no badges (quiet-by-default). Resurfacing only appears in the
  two dedicated slots below.

**Where resurfacing appears (both):**
1. **Dashboard** — a "Resurfacing" slot beneath "Crystallized this week": up to 3
   due crystals across all threads, each with an inline **Still true** (ack) /
   **Revisit** (open) / **Retire** (file) control. Empty when nothing is due.
2. **Theme landing** — a slim "Worth revisiting" slot directly under the salient
   layer, scoped to that thread's due crystals. Same controls.

Both slots are dust-toned with the blaze gem marker — they read as "the light
asking to be looked at," not as alerts.

---

## C. Sort UX + `serves_id` (resolves §2.7)

`serves_id` (forward intent) and `sources_from` (backward lineage) are
**orthogonal** — not inverses. An action *serves* a crystal/idea/thread it will
advance; a crystal *draws from* its sources. They can both be null.

**Sort screen (the existing TriageQueue), per item:**
- Existing state moves stay (`inbox → active / reflecting / filed / dismissed`).
- **New:** an **attach-to-thinking** affordance. Keystroke **`S`** opens a
  typeahead over **crystals + ideas + the thread anchor** in the item's project
  (and recent across projects). Selecting sets `serves_id`.
- **Attach is optional** — `serves_id` may stay null after Sort ("attach later").
  Unattached active actions still appear in the to-do lens; they just don't nest
  under a thinking group on the Dashboard.
- **One-step crystal:** key **`C`** on the selected item runs the existing
  `crystallizeItem({ promoteKind: true })` directly from Sort.

**Dashboard "In focus" rendering:** group active actions by `serves_id`; show the
`in service of · <crystal/idea>` header per group. Actions with null `serves_id`
collect under an "unattached" group at the bottom (not hidden — visible, gently
de-emphasized).

---

## D. Crystal attachment edges + construction (resolves §2.8)

Edges live on the existing supporting-structure tables (see §2 migration), plus
`docs.supports_crystal` for plain docs. **Construction is two-path:**

1. **Inferred at crystallize time** — when an item is crystallized, its
   `sources_from` seeds the "Built on" doorways automatically: any source that is
   a guidebook/runbook/doc gets its `supports_crystal*` set to the new crystal;
   a source that is a field-notes section adds an entry to that project's
   `field_notes.supports_crystals` map. This is the zero-effort default.
2. **Manual attach later** — from the Crystal detail "Built on" panel, the user
   can attach/detach a guidebook, runbook, field-note section, or doc. Never
   required.

No attachment is required at creation. A crystal with no attachments renders the
"Built on" panel empty (collapsed), not an error.

---

## E. Crystal types `ctype` (resolves §2.9)

- **Nullable.** A crystal may have no type; it renders as a generic card.
- **Assignable / retypeable anytime** (hint → principle as it's reinforced). A
  small type control on the Crystal detail header.
- **No backfill** — existing crystallized items stay `null` on migration.
- **Card density is driven by `ctype`:** `principle` → big card; all others
  (and null) → default card. (Answers §3 "crystal card density" — not arbitrary.)

---

## F. Trace derivation (resolves §2.10)

- **Discarded = `dismissed` only.** `filed` items are kept/searchable and render
  in Trace as a normal (un-struck) entry with a small "filed" marker, not as a
  discard.
- **Cluster ("N items gathered here") =** items sharing `project` + same calendar
  day + same `kind`, with no crystallization among them. Collapsed into one node.
- **Fork =** two+ items whose `sources_from` reference the same parent item.
  `sources_from` is the fork-parent linkage; no separate parent column needed.
- Everything is derived from the `activity` table + `sources_from`. No new Trace
  storage.

---

## G. Smaller items (your §3) — confirmed

- **Dark mode tokens — SHIP THE PARTIAL INVERSION NOW** (don't break v4 screens in
  dark mode, no feature flag). v0.5 dark set for `.km-v4.km-dark`:

  | token | light | dark (v0.5) |
  |---|---|---|
  | `--v-bg`   | `#EEE2C9` | `#2A2E33` (slate-dark floor, never deeper) |
  | `--v-sunk` | `#E5D4B4` | `#23262C` |
  | `--v-card` | `#F8F1E0` | `#32373D` (lighter than bg = lift) |
  | `--v-ink`  | `#2B2014` | `#ECE3D0` (warm bone tint) |
  | `--v-soft` | — | `rgba(236,227,208,.62)` |
  | `--v-faint`| — | `rgba(236,227,208,.40)` |
  | `--v-line` | — | `rgba(236,227,208,.12)` |
  | `--v-line2`| — | `rgba(236,227,208,.24)` |

  **Accents unchanged** (`--v-blaze` `#E8B547`, `--v-ember` `#D9622C`, `--v-moss`
  `#5C7A3E`, `--v-clay` `#BC7A4E`, plus `*-dk` variants). The fuller nuanced dark
  table (e.g. softening blaze on dark to avoid glare) comes next round; this set
  is shippable and correct now.
- **Crystal card density:** driven by `ctype` (§E), not arbitrary.
- **Bench entry point:** the NavRail **"The bench · N"** is the single canonical
  entry. The Dashboard inbox-rollup links to it. No third surface.
- **Empty states:** specced minimum — theme landing with a thread but no items:
  salient layer shows "Nothing's crystallized yet — capture, then sort." Pipeline
  shows all-zero counts. Doorways show their own "no field notes / guidebooks /
  runbook yet" lines. (Full empty-state set next round.)
- **Search:** `⌘K` unchanged; results adopt the family-color treatment (crystals
  show the blaze gem) and show `in service of` where an action has a `serves_id`.

---

## H. Interaction with your just-shipped fixes (your §5)

None of v0.5 reshuffles them:
- **Capture is NOT subsumed by Sort.** Capture stays the frictionless entry onto
  the bench; Sort is the separate processing pass. The shipped Capture > Doc
  upload and EditItemModal are untouched.
- **Project color picker** is the one surface that changes — per §A.
- Dashboard unpinned-thread handling, inline edit, and hard-delete are all
  compatible.

---

## I. Build order (your §4, updated)

1. Palette + tokens (`.km-v4` alongside `.km`).
2. Rename pass — Inbox → The bench; Dismissed → Let go (copy + MCP descriptions).
3. Facets migration — §2 of this doc (note the **dropped** doctypes and the
   per-table `supports_crystal*` edges).
4. Thread label palette + value migration (§A).
5. Crystal layer — typed cards, gallery, theme-landing salient section, Crystal
   detail two-pane.
6. Resurfacing — cadence + Dashboard & theme-landing slots (§B).
7. Actions-in-context — `serves_id`, Sort attach step, nested rendering, to-do lens (§C).
8. Three doorways + attachment edges (§D) — reusing the existing Guidebook /
   Field-notes / Runbook screens with family-color treatment.
9. Trace + Behind-an-idea (§F).
10. Cleanup — retire `.km` once `.km-v4` is the only surface.
