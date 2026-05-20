# Steep — Field Notes mode toggle + instructional copy

> Status: **planned, approved, not started.** Build before auth /
> MCP-resources, per the agreed sequence.

## Context

Field Notes is a per-thread sense-making notebook — five sections
(Premise / What I know / Open questions / Sources / Crystallizations),
a sibling to the runbook. Today every section is a single markdown
blob stored in a column on the `field_notes` row (one row per
project, `project_id` UNIQUE).

Two gaps:

1. **One entry per type.** Open questions and sources genuinely want
   to be *multiple managed items* — resolvable, age-aware, linkable —
   not one flat blob. But Premise and What-I-know are genuinely prose;
   forcing structure on them is wrong.
2. **"Ask Claude to flesh these out"** — the view says this but never
   says *how*. The mechanism (the `read_field_notes` /
   `write_field_notes` MCP tools) exists but is invisible to the user.

## The decision: a per-thread mode, switch-not-migrate

`field_notes` gains a `mode` column: **`scratchpad`** (default —
today's behavior) or **`managed`**. Per-thread, because contexts
differ — a quick-notes thread wants a loose pad, a research thread
wants real lists.

Section behavior per mode:

| Section | Scratchpad | Managed |
| --- | --- | --- |
| Premise | text blob | text blob *(prose — never changes)* |
| What I know | text blob | text blob *(same)* |
| Open questions | blob, newline → `?` callouts | live list of the thread's `question`-kind **items** |
| Sources | text blob | live list of the thread's **references** |
| Crystallizations | entity list | entity list *(already entities — never changes)* |

**Locked: toggling switches the *view*, never migrates data.**
- Scratchpad blobs stay in their columns (dormant) when in managed
  mode; `question` items / references stay as normal project entities
  when in scratchpad mode. Only one representation renders per mode.
- Auto-migration is lossy — you cannot cleanly collapse N
  question-items (each with state, age, links) back into a flat blob.
- Reversible and honest — flip back and scratchpad text is intact.
- Managed-mode questions/sources are **the same `question` items and
  `reference` entities that already exist** — they also appear in the
  thread's normal item lists, Sort, aging. Field Notes managed mode is
  a *lens*, not a second store. This is the property that keeps the
  data model coherent: no parallel `field_note_entries` table, no
  drift between "question-as-item" and "question-as-field-note".

Carrying scratchpad text into managed entities is a manual move (or
"ask Claude to turn these question lines into question items"). Not
automated.

## Slices

### Slice 1 — schema + mode field
- Migration `0006_field_notes_mode.sql`: `ALTER TABLE field_notes ADD
  COLUMN mode TEXT NOT NULL DEFAULT 'scratchpad'`.
- `shared/types.ts` — `FieldNotes` gains `mode: 'scratchpad' |
  'managed'`.
- `server/src/services/fieldNotes.ts` — `rowToFieldNotes` maps it;
  `upsertFieldNotes` leaves it alone.
- New: `setFieldNotesMode(db, projectId, mode)` service.

### Slice 2 — managed-mode data wiring
- Server route: `PATCH /api/projects/:slug/field-notes/mode`.
- Client action: `setFieldNotesMode(projectId, mode)`.
- Selector: `getProjectQuestions(projectId)` — items where
  `kind === 'question'`, scoped to the project. (`getProjectReferences`
  already exists from the ProjectLanding tabs work.)
- `write_field_notes` MCP tool + the field-notes routes are
  unaffected — they still read/write the prose blobs.

### Slice 3 — FieldNotesView mode toggle + managed rendering
- A mode toggle control in the FieldNotesView header
  (scratchpad / managed segmented control).
- Open Questions tab:
  - scratchpad → today's blob + `?`-callout rendering.
  - managed → list of `question` items; "+ new question" creates an
    item (`captureItem` with `kind: 'question'`, or `create_item`
    semantics); each row can resolve (transition state) and links to
    the item.
- Sources tab:
  - scratchpad → blob.
  - managed → list of references; "+ add reference" creates a
    `reference` entity.
- Premise / What I know / Crystallizations — unchanged in both modes.
- A one-line note in the UI explaining what the active mode means.

### Slice 4 — instructional copy + MCP cheat-sheet
- **Per-section "Ask Claude" button** in FieldNotesView — copies a
  ready-made prompt to the clipboard, e.g. *"Using the Steep MCP
  tools, read the field notes for `kennel` and draft the Open
  questions section — list what's genuinely unresolved about this
  thread."* Closes the "but how" gap with zero new infrastructure.
- **MCP cheat-sheet** — a "Working with Claude" reference card in
  Settings, near the MCP connection block. Lists example prompts
  ("what's gone cold in X", "crystallize this doc", "draft field
  notes for Y", "what's in my sort queue"). Framed as example *asks*,
  not commands — you ask Claude in plain language; it picks the tool.

## Critical files

**Server (new):**
- `server/migrations/0006_field_notes_mode.sql`

**Server (modified):**
- `shared/types.ts` — `FieldNotes.mode`
- `server/src/services/fieldNotes.ts` — map + `setFieldNotesMode`
- `server/src/routes/fieldNotes.ts` — mode PATCH route

**Frontend (modified):**
- `src/data/types.ts` (re-export, automatic)
- `src/data/actions.ts` — `setFieldNotesMode`
- `src/data/selectors.ts` — `getProjectQuestions`
- `src/screens/FieldNotesView.tsx` — mode toggle, managed rendering,
  Ask-Claude buttons
- `src/screens/SettingsScreen.tsx` — the MCP cheat-sheet card

## Out of scope

- A generic `field_note_entries` table — rejected. It would duplicate
  the `question` item kind and the `reference` entity, guaranteeing
  drift. Managed mode leans on the entities that already exist.
- Auto-migrating blob ↔ entity content on toggle — see "switch-not-
  migrate" above.
- A registered MCP `draft_field_notes` prompt — the elegant version of
  the Ask-Claude flow, but it depends on MCP-prompts support (backlog
  #21), which is not on the near-term list. Slice 4's copy-prompt
  button is the near-term answer; revisit when prompts land.

## Effort

~half a day to a day. Four slices, one branch, `npm test` green at
every slice boundary.
