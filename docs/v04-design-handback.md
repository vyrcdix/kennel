# v0.4 design hand-back — questions + reconciliation requests

> **From:** Steep / Kennel build side · **To:** Claude design ·
> **Re:** `handoff/kennel_v04_handoff/` (README + JSX reference set)
>
> This document is a **hand-back, not a rejection.** The v0.4 direction
> — blaze + dust palette, crystallization as the visual hero, actions
> nested in their thinking, the three-doorways model — is welcome. The
> notes below flag where the handoff collides with what's already
> shipped on the build side so a revised v0.4 spec doesn't ask the
> build to undo work that's working as intended. Where the underlying
> intent really has shifted (and the existing implementation needs to
> follow), we'd like that called out explicitly so we can migrate
> deliberately.

---

## How the build will use this document

For each conflict / question below, please respond in the revised v0.4
spec with **one** of:

- **Keep build as-is** — design adapts. (Cosmetic refinement only, no
  schema change. The existing component / table stays.)
- **Build follows design** — schema or model change is intentional;
  spec the migration path.
- **Both, parallel** — the existing concept stays, a new concept is
  added alongside it. Spec how they relate.

That keeps the next round tight and unambiguous.

---

## 1. What v0.3+ already shipped that v0.4 must respect

The v0.4 README claims "data model essentially unchanged." Mostly
true, but several v0.3 / v0.3.x additions aren't reflected in the
handoff's vocabulary, and the design treats some of them as if they're
about to be introduced when they already exist. Quick inventory:

| Concept | Status in current build | Tables / files |
|---|---|---|
| **Thread / Project** | live, with user-pickable colour | `projects` table; `ProjectColor` union `moss \| ember \| dust \| blaze \| slate`; just wired through `ProjectTag` to `.km-proj-{color}` |
| **Item kinds + states** | live including `crystallization` kind and `crystallized` state with `crystallizeItem` action | `items` table + `server/src/services/item.ts` |
| **Capture > Doc** | live, with upload (.md / .docx) via mammoth + provenance columns | `CaptureModal`, `createDocFromUpload`, `docs.source_filename/source_kind/source_uploaded_at` |
| **Field notes** | live, **own table** with scratchpad / managed mode toggle | `field_notes` table; `FieldNotesView` screen; `0006_field_notes_mode.sql` |
| **Guidebooks** | live, **own pair of tables** (per-topic ordered collection of doc + reference entries; pin, drag-reorder, tags, Order/Tags view, upload + link entry creation, peer-panel surface on the project landing) | `guidebooks` + `guidebook_entries` tables; `GuidebookView`, `AddGuidebookEntryModal`, `CreateGuidebookModal`; `0009_guidebooks.sql` |
| **Runbook** | live, **own table**, per-project, with multiple labeled URLs | `runbooks` table; `RunbookView` |
| **Chats** | live, with last-seen, claudeUrl, stale fade, delete | `chats` table; `ChatRow` |
| **Activity log** | live, every CRUD on every entity logged with actor + verb + payload — Trace is derivable from this | `activity` table |
| **Doc provenance** | live: `source_filename`, `source_kind` (`md\|docx\|inline`), `source_uploaded_at` | `docs.source_*` columns |
| **The bench / Sort** | The label is new; the underlying state `state='inbox'` and the Sort screen (today: TriageQueue) exist | rename only |

The biggest divergences below are around **Guidebook**, **Field
notes**, and **Playbook vs Runbook**.

---

## 2. Reconciliation questions

### 2.1 Guidebook — table vs `docs.doctype`

**v0.4 design says:** Guidebook is a doc subtype
(`docs.doctype = 'guidebook'`) that may attach to a crystal
(`supports_crystal`). Rendered as "grouped reference rows with a 'why
it matters' annotation per source."

**Build state:** Guidebook is its own pair of tables
(`guidebooks` + `guidebook_entries`). Each guidebook is a per-topic
**ordered collection** of doc + reference entries, drag-reorderable,
tag-grouped, pin-to-landing, with `name`/`description` and per-entry
overrides. v0.4 slices 1–6 shipped end of May 2026; the user has
confirmed: **"the current implementation of guidebooks is as
intended."**

**Implication:** The handoff's description of guidebook as a doc
subtype with "annotated source rows" is **conceptually close** to
what shipped, but it's a different data shape (one doc with
annotations vs. one collection-row with entries).

**Ask:**

- We propose **keep build as-is.** Guidebook stays a two-table
  collection. The v0.4 visual treatment (moss family colour, the
  "Guidebook · others'" doorway card, "open →" affordance) maps onto
  the existing Guidebook list and Guidebook detail screens without
  re-platforming.
- Drop `docs.doctype = 'guidebook'` from the migration in §4 unless
  there's a different concept being introduced that should NOT reuse
  the existing guidebook tables.
- The "supports a crystal" linkage probably belongs on the
  **guidebook row** (`guidebooks.supports_crystal_item_id`), not on
  docs. Please confirm and we'll add the column there.
- The "why it matters per source" annotation already exists on each
  entry (`guidebook_entries.description`). That's the field your
  spec calls out — please re-use it by name in v0.5 copy.

### 2.2 Field notes — table vs `docs.doctype`

**v0.4 design says:** Field notes is a doc subtype
(`docs.doctype = 'field_notes'`), clay family colour, may attach to a
crystal via `supports_crystal`.

**Build state:** Field notes is its own `field_notes` table, one row
per project, with named sections (`premise`, `whatIKnow`,
`openQuestions`, `sources`, `crystallizations`) and a `scratchpad
mode` toggle that switches between freeform body and structured
sections. Lives at `/project/:slug/field-notes`.

**Ask:**

- We propose **keep build as-is.** Same logic as guidebook: the
  visual treatment (clay accent, "Field notes · mine" card, first-
  person voice) maps onto the existing screen without re-platforming.
- Drop `docs.doctype = 'field_notes'` unless v0.4's intent is *also*
  to allow ad-hoc field-note **documents** to be created alongside
  the per-project structured one. If yes, please specify that as a
  separate concept (working title "field memo"?) so the table-backed
  Field Notes view stays unambiguous.
- The "field notes attaches to a crystal" linkage is interesting but
  awkward against the current 1-per-project shape. **Question:** do
  you intend field notes to remain per-project (and the
  "supports_crystal" link is at the section level), or do you want to
  switch to multiple field-note artifacts per project, each one
  optionally tied to a crystal?

### 2.3 Playbook — new or rename of Runbook?

**v0.4 design says:** Playbook is "reproducible steps + artefacts
panel (where the demo lives, repo, prototype URL, keys/access
block)." Ember family colour. Per-crystal.

**Build state:** Runbook is *already* "reproducible steps +
operational context" — a per-project document with `prerequisites`,
`setup`, `run`, `deploy`, `troubleshoot`, `notes` sections plus
**multiple labeled URLs** (just shipped in v0.3.x). Lives at
`/runbook/:slug`.

**Ask:**

- **Three possible reconciliations**, please pick:
  1. **Playbook is the rename of Runbook.** Then we ship: copy
     change in nav + screen header, optional addition of the
     "artefacts panel" structure to the existing runbook (keys /
     repo / demo URL groups, layered on top of the existing
     `urls[]`). Schema unchanged.
  2. **Playbook is per-crystal, Runbook is per-project, both
     exist.** A project keeps one runbook; a crystal can spawn
     focused playbooks. Then we add a `playbooks` table parallel to
     guidebooks. Spec should clarify what differentiates the two
     beyond scope — same six sections? Different?
  3. **Playbook replaces Runbook entirely; Runbook is gone.**
     Destructive migration. Probably not what you want, but call
     it out if so.

  We lean (1) for the v0.4 cycle since it's a smaller migration and
  the existing runbook UX is good. (2) is the right thing in the
  long run if crystals warrant per-crystal playbooks.

### 2.4 Thread color picker — palette collision

**v0.4 design says:** The five palette tokens have **reserved
meanings**: `blaze` = crystals only, `ember` = sparing action only,
`moss` = guidebook family, `clay` = field notes family,
`ember-dark` = playbook family.

**Build state:** Each project picks a color from
`moss | ember | dust | blaze | slate` (CreateProjectModal +
EditProjectModal). That value is stored in `project.color` and now
washes the `.km-proj` slug pill across every screen. So:

- A user can pick "blaze" for a project today, which would conflict
  with v0.4's "blaze means crystal."
- The choices `dust` and `slate` are fine; `moss / ember / blaze`
  collide.

**Ask** — pick one:

1. **Replace the user-pickable thread colors with a non-reserved
   palette** (e.g., from a Pacecraft-derived neutrals + accents set
   you'd specify). Threads then have visual differentiation without
   stealing from the family-color language.
2. **Keep the existing palette but drop the picker.** Threads aren't
   colored; differentiation comes from the slug. (We'd remove the
   picker block from both modals.)
3. **Keep both, accept the language overload.** Probably bad UX.

Recommend (1). If you can spec a 4–6 colour project palette in the
revised handoff, we'll wire it.

### 2.5 "Inbox" → "The bench" rename — scope

**v0.4 design says:** Rename "inbox" everywhere in copy; schema value
stays `'inbox'`. "Clear the bench" replaces "process the inbox."

**Build state:** "Inbox" appears in: NavRail, Dashboard inbox
rollup, Capture state defaults, item state labels (`StateDot`,
`AgingBoard`), TriageQueue copy, MCP tool descriptions
(`list_queue`), activity verb labels (`'CAPTURED'` lands an item in
"inbox"), and several seed strings. Plus inside the `claude_desktop_
config.json` examples in `mcp-setup.md`.

**Ask** — confirm:

- Rename touches **user-facing strings only**, including the MCP
  tool **descriptions** (the prose Claude sees) but **not** tool
  **names** like `list_queue`. ✓ or revise.
- The "Sort" verb refers to **the existing TriageQueue screen**, not
  a new one. ✓ or revise.
- "Filed" / "Dismissed" labels — unchanged, or also renamed?

### 2.6 Crystal "kept fresh" — cadence?

**v0.4 design says:** `last_surfaced_at` for "kept fresh" + spaced
resurfacing. Crystals can be "re-surfaced N×."

**Build state:** Nothing yet — the column is new. The verb "kept
fresh" implies an active behaviour (the system surfaces crystals
periodically), not just a counter.

**Ask:**

- Is there a defined **cadence**? (e.g., a crystal surfaces every N
  days unless touched; touched resets the clock; missed surfaces are
  marked stale.)
- Or is v0.4 shipping the **data shape** (column + a manual "I saw
  this" affordance to bump it) and the cadence ships later?
- Where in the UI does a "re-surfacing" event appear? — As a card on
  the Dashboard? An overlay on theme landing? A separate "today's
  crystals" surface?

### 2.7 `serves_id` / actions-in-context — the Sort step

**v0.4 design says:** Capture stays frictionless and lands on the
bench with `serves_id = null`. At **Sort**, the user attaches the
action to "the crystal, idea, or thread it serves" (one keystroke).
From then on it travels with that thinking.

**Build state:** TriageQueue exists. There's no attach-to-thinking
step today — Sort moves items between states (`inbox → active →
…`), and crystallize is a button on the item or doc.

**Ask:**

- Spec the **Sort UX** in more detail in the revised handoff:
  - Which keystroke attaches to thinking?
  - Is the target picker a typeahead over crystals + ideas + the
    thread itself?
  - Is "serves nothing yet, attach later" allowed (i.e., can `serves_
    id` stay null after Sort)?
- The relationship between `serves_id` and `sources_from`: is
  `sources_from` (lineage of a crystal) just the inverse of
  `serves_id`s pointing at it? Or are they orthogonal?
- Crystallization items have `crystallizeItem({ promoteKind:
  true })` today. Does v0.4 want **Sort** to also produce
  crystallizations directly (one-step "this thought is a crystal")?

### 2.8 Three doorways — attachment edges

**v0.4 design says:** A crystal is built on three kinds of material
(field notes / guidebook / playbook). The doorways panel on
`V4CrystalDetail` shows "Built on" sources grouped into the three.

**Build state:** Today, doc/reference/guidebook/field-note rows are
all keyed by **project**, not by **crystal**. There's no edge
"this doc supports this crystal" beyond the activity log linking the
crystallize event to its source item.

**Ask:**

- The handoff's `docs.supports_crystal` covers docs (and, by our
  proposal in §2.1/2.2, would not extend to guidebooks/field-notes
  because those have their own tables). So:
  - Should `guidebooks.supports_crystal_item_id` exist?
  - Should `field_notes` be promoted to allow N rows-per-project so
    that some of them can be "supports_crystal X" and others stay
    project-wide? Or, more likely, should there be a
    `field_notes_sections.supports_crystal_item_id` link at the
    section level (lighter footprint)?
- What's the **construction step** for these edges? Is the user
  expected to:
  1. Crystallize a thought,
  2. Then drag/click the supporting field-note / guidebook / runbook
     onto it, or
  3. Have the system infer the link from `sources_from`?

### 2.9 Crystal types — typing rules

**v0.4 design says:** `ctype ∈ {principle, quote, reminder, hint,
memory}`, with bespoke styling per type (italics for quote, big
hero treatment for principle, etc.).

**Build state:** No `ctype` today. Crystallization is just an item
with `kind='crystallization'`.

**Ask:**

- Is `ctype` **required** on every new crystal? Or nullable with a
  later sort step to assign?
- Can a crystal be **retyped** later? (e.g., a "hint" becomes a
  "principle" as it gets reinforced.)
- Existing crystallized items — left untyped on migration, or
  back-filled to a default like `'memory'`?

### 2.10 Trace — derivation + cost

**v0.4 design says:** Trace is "derived from the activity log + item
lineage." Renders crystals as milestones, gathered material as
clusters, discarded forks as faded entries, parallel forks with
outcomes.

**Build state:** Activity log records the right verbs. Item lineage
(`sources_from`) is new (per §4).

**Ask:**

- **Cluster heuristic**: "N items gathered here" — what makes a
  cluster? Same day + same project + same item kind? Spec the rule.
- **Fork detection**: two items linked back to the same parent? The
  current model doesn't have a "parent" edge — is `sources_from` the
  fork-parent linkage too?
- **Discarded label**: today we have `filed` (soft archive) and
  `dismissed` (let-go). Both map to "discarded" in Trace, or only
  `dismissed`?

---

## 3. Smaller specifics we'd like nailed in v0.5

Less load-bearing than the above; flagging so the next handoff
doesn't omit them:

- **Dark mode** for v0.4 tokens — the README defers but it's the
  next ask after the palette lands. A token table for the inverted
  set will keep us from improvising.
- **Crystal card density** — `v4-flow.jsx` mixes `big`-mode and
  default-mode cards in the gallery via a column layout. Is that
  arbitrary or driven by recency / `ctype` / surfacing count?
- **The bench affordance from the chrome bar** — the current Capture
  button stays as is (good), but the bench needs a "go to the bench"
  surface separate from the dashboard inbox-rollup. NavRail has
  "The bench · 14" in `V4Rail` — confirm that's the only entry
  point.
- **Empty states** — every doorway, the salient layer, the
  pipeline. Spec at least the "no crystals yet" empty state for the
  theme landing (today: the theme exists, no items captured, what
  do you see?).
- **Search / global** — v0.4 keeps `⌘K`, doesn't reframe search.
  Confirm search results respect the new family-color treatment
  (crystals show blaze, etc.) and the "in service of" labels.

---

## 4. What the build side is ready to do, given a clean v0.5 spec

Once the revised handoff lands, we can ship in this order without
needing further design input per step:

1. **Palette + tokens** — introduce `.km-v4` alongside `.km`, opt
   components in via class.
2. **Rename pass** — Inbox → The bench, scope from §2.5.
3. **Facets migration** — the columns in §4 of the original handoff,
   minus the ones that conflict per the resolutions above
   (`doctype = 'guidebook'`, `doctype = 'field_notes'`).
4. **Crystal layer** — typed cards, gallery, theme landing salient
   section, Crystal detail two-pane.
5. **Actions-in-context** — `serves_id`, Sort step, nested rendering,
   to-do lens.
6. **Three doorways** — Field notes / Guidebook / Playbook detail
   views + the crystal attachment edges per §2.8.
7. **Trace + Behind-an-idea** — derived from activity + lineage.
8. **Cleanup** — retire `.km` tokens once `.km-v4` is the only
   surface.

Estimated effort, end-to-end: ~3–4 focused build sessions assuming
the v0.5 spec resolves §2.1–§2.10. Trace (#7) is the wild card and
could grow.

---

## 5. One more thing

The build side just shipped (and deployed) `4 of 5 fixes` related to
operational gaps:

- Dashboard recognises unpinned threads (not "always blank" anymore).
- Project color picker is now wired through `ProjectTag` (this
  becomes the §2.4 collision).
- Capture > Doc supports `.md` / `.docx` upload.
- Inline item title + body edit (EditItemModal).
- Hard delete on items, docs, references, chats — with dependent
  handling for guidebook entries.

These don't conflict with v0.4 directionally, but they touch
surfaces v0.4 reflows (Dashboard, Capture, the item row's click
target). If anything in v0.4 reshuffles those interactions
(particularly Capture being subsumed by "Sort"), please call it out.
