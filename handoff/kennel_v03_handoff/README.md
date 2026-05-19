# Handoff: Kennel v0.1 → v0.3 reframe

> **Scope:** rename a handful of concepts, add three new ones, build two new
> surfaces, and add settings. The existing v0.1 implementation stays — this is
> a migration on top of it, not a rebuild.

## What's in this bundle

```
kennel_v03_handoff/
├── README.md                ← you are here
└── design/
    └── reframe.jsx          ← reference React component for v0.3 surfaces
                               (Recommendations · Project landing v0.3 · Aging board)
```

`reframe.jsx` is a **design reference** — port the same components into the
existing Kennel codebase using its established stack and tokens. Don't ship
the file itself.

---

## Goal of v0.3

Kennel is an information-organization tool around the cycle
**think → research → consolidate → reflect → repeat**. v0.1 inherited
task-flavoured vocabulary from PM tools ("next up", "active", "done") that
doesn't match how it's actually used. v0.3 fixes the language and adds the
missing concept (durable outcome) and the missing surface (let-go review).

---

## Locked vocabulary

| Concept                | v0.1                    | v0.3                  | Notes                                                                 |
|------------------------|-------------------------|-----------------------|-----------------------------------------------------------------------|
| Container (copy)       | "Project"               | **"Thread"**          | Schema column stays `project`. URLs `/projects/:slug` unchanged. Copy in headers / empty states / onboarding uses "thread". |
| Dashboard primary cut  | "Next up"               | **"In focus"**        | Ordered by `last_touched_at` + rank, not `due_at`.                    |
| Item states            | active / parked / done / archived | **active / reflecting / crystallized / filed** | "parked" implied deferred task; "reflecting" describes most of an item's real life. "Archived" → "Filed". |
| Inbox-processing screen| "Triage queue"          | **"Sort"**            | Same screen, same shortcuts (J/K/A/P/X). Header label changes; action labels change (below). |
| Triage action labels   | Activate / Park / Dismiss | **Pick up / Set aside / Let go** | Lifecycle metaphor. Keyboard shortcuts unchanged. |
| Soft archive           | "Archive"               | **"File"**            | "Composted" was considered and rejected as too twee.                 |
| Durable outcome (kind) | _none_                  | **"Crystallization"** | New first-class kind. Renders distinctly from doc.                    |
| Open inquiry (kind)    | _none_                  | **"Question"**        | Distinct from idea (a spark) or note (an observation).                |
| Action (kind)          | exists                  | **unchanged**         | Stays as a kind. Just no longer the dashboard's primary axis.         |
| Sense-making notes     | _none_                  | **"Field notes"**     | New sibling concept to Runbook. See below.                            |
| Runbook                | exists                  | **unchanged**         | Stays as designed. Operational reference for hard artefacts (demo access, deploy/test, keys, app links). Do **not** rename. |

---

## Lifecycle (replaces the old state model)

```
CAPTURED ──→ REFLECTING ──→ IN FOCUS ──→ CRYSTALLIZED ──┐
   │              │              │                       │
   └──────────────┴──────────────┴──────→  FILED  ←──────┘
        (any state may move to FILED on let-go)
```

- **CAPTURED** · in the inbox, not yet sorted. (Was: inbox.)
- **REFLECTING** · in a thread, being touched occasionally. The default
  state for most items most of the time. (New — replaces silent "parked".)
- **IN FOCUS** · currently active and ranked. Renders with the existing
  ember active-row treatment.
- **CRYSTALLIZED** · the durable outcome. A new kind, but also reachable
  as a state transition for items that get promoted.
- **FILED** · soft-archived. Searchable; drops from default surfaces.

---

## Schema migration

Add / rename, preserving existing data:

```sql
-- Item state enum
-- v0.1: 'inbox' | 'active' | 'parked' | 'done' | 'archived' | 'dismissed'
-- v0.3: 'inbox' | 'active' | 'reflecting' | 'crystallized' | 'filed' | 'dismissed'

UPDATE items SET state = 'reflecting'    WHERE state = 'parked';
UPDATE items SET state = 'crystallized'  WHERE state = 'done';
UPDATE items SET state = 'filed'         WHERE state = 'archived';
-- 'inbox', 'active', 'dismissed' carry over unchanged

-- Item kind enum: add 'question' and 'crystallization'
-- v0.1: 'idea' | 'note' | 'action' | 'doc' | 'ref' | 'chat'
-- v0.3: + 'question' + 'crystallization'

-- New column for "Aging" surface
ALTER TABLE items ADD COLUMN last_touched_at TIMESTAMP;
UPDATE items SET last_touched_at = COALESCE(updated_at, created_at);

-- Project gains a field-notes content path (sibling to runbook).
-- Runbook stays at content/<slug>/runbook.md.
-- Field notes live at content/<slug>/field-notes.md with five sections:
--   Premise / What I know / Open questions / Sources / Crystallizations

-- Settings table gains:
ALTER TABLE settings ADD COLUMN aging_threshold_days INT DEFAULT 21;
ALTER TABLE settings ADD COLUMN filing_prompt_days INT DEFAULT 90;  -- 'never' = 0
```

---

## API changes

### Items endpoint

```jsonc
// state enum updated everywhere it appears (POST /items, PATCH /items/:id,
// query params on GET /items)
"state": "inbox" | "active" | "reflecting" | "crystallized" | "filed" | "dismissed"

// kind enum updated
"kind":  "idea" | "note" | "action" | "doc" | "ref" | "chat" | "question" | "crystallization"

// items gain a touch endpoint (cheaper than full update) — increments
// last_touched_at without bumping updated_at or creating an activity entry
POST /items/:id/touch  →  204 No Content
```

### New endpoints

```
GET /aging?threshold=21      → items where last_touched_at < now - threshold,
                               grouped by project, filtered to state != filed
                               and state != dismissed

GET /crystallizations        → all items where kind = 'crystallization',
                               grouped by project, ordered by created_at DESC

POST /items/:id/crystallize  → promotes item: sets state to 'crystallized'
                               (and optionally kind to 'crystallization' if
                               the caller passes promote_kind=true).
                               Sources linked from the new crystallization's
                               metadata.sources_from = [<id>, ...]
                               Writes activity verb='crystallized'.

POST /items/:id/file          → state = 'filed', activity verb='filed'.
```

### Project content paths

`content/<slug>/field-notes.md` is added alongside the existing
`content/<slug>/runbook.md`. Same markdown rendering. Five fixed sections —
treat them like the runbook's six sections in your existing implementation:

```
# Field notes

## Premise
(the working hypothesis for the thread)

## What I know
(observations, evidence, findings to date)

## Open questions
(what you're trying to figure out — renders as `?` items)

## Sources
(items, docs, refs, chats this is built on)

## Crystallizations
(links to the durable outcomes that have emerged)
```

---

## Screen changes

### 1. Dashboard
- "Next up" section heading → **"In focus"**.
- Ordering: `ORDER BY last_touched_at DESC, rank ASC`. (Was: `due_at`, `rank`.)
- Replace the "Yesterday" tertiary section with **"Aging — let go?"** linking to
  the new Aging surface. Show the top 3 cold items inline; "See all 23 →" link.
- Add a new tertiary strip: **"Crystallized this week"** — items whose
  state moved to `crystallized` in the last 7 days, grouped by project.
  Empty? Hide the strip entirely.

### 2. Project landing (`projects/:slug`)
Add three things to the existing landing:

**(a) Project header actions** — add a **Runbook** button next to the
existing Field notes button. They live side-by-side as siblings.

**(b) Crystallizations panel** — new section *above* the existing pinned-docs
row. Use the moss accent. Each card shows:
- title (body 500)
- 2–3 line body
- a "DURABLE" mono stamp top-right
- `from N items, M chats · crystallized X ago` in muted mono

Empty? Hide the panel entirely; no empty state.

**(c) Field notes + Runbook side-by-side** — two cards in a `1.4fr 1fr` grid.
Field notes is the wider one (sense-making body, 5 tabs). Runbook is the
narrower one (operational, with code blocks and live links). The brief calls
out the distinction explicitly: Runbook is "how to access hard artefacts"
(demo, deploy, keys, app links); Field notes is the thinking around the thread.

**(d) Conversations panel** — promote the existing Chats panel up the page
to sit above the All-items tabs. (It was at the bottom in v0.1 specifically
to keep chats "background"; the reframe argues that chats are a primary
input to the cycle and deserve real estate.)

**(e) Aging strip** — small dust-toned strip on the project landing, similar
in shape to the next-steps strip from §6.9, that surfaces 3 cold items in
this thread with inline Pick up / Crystallize / File buttons. Hidden if zero
cold items in the thread.

See `design/reframe.jsx` → `ProjectLandingReframed` for the reference layout.

### 3. Sort (was Triage queue)
- Header label: **Sort**.
- Action labels: **Pick up** (was Activate), **Set aside** (was Park),
  **Let go** (was Dismiss).
- Shortcuts unchanged: A / P / X. Show in the new labels.
- Right preview pane "Convert to" affordance gains two options: **Question**
  and **Crystallization**.

### 4. Doc editor
- Header gains a **"Promote to crystallization"** affordance. Promoted docs
  show a small `DURABLE` stamp (moss display-sm) next to the title and a
  moss left-border on the doc card wherever it renders.

### 5. Runbook view
- **Unchanged.** Stays as designed. Same six sections, same code-block
  treatment, same edit affordances.

### 6. Field notes view (NEW)
Build a new view at `/projects/:slug/field-notes` that mirrors the runbook
view's shell but renders the five sections above. Differences from runbook:
- No code block left-border treatment by default (this is prose, not commands).
- Section labels render in Display-sm uppercase (matches existing runbook tab labels).
- The "Open questions" section renders each `?` line as a callout with the
  ember-deep `?` glyph + last-touched mono stamp (see reference for shape).
- The "Crystallizations" section renders a link list pointing to crystallized
  items in the same project, with their `from N items, M chats` lineage.

### 7. Global search
- Add filter chips for state: `reflecting`, `crystallized`, `filed`.
- **Filed items are hidden from default results**; an "include filed" toggle
  in the syntax-hints bar opts them in. (Don't add a kind-level filter for
  crystallization — `kind:crystallization` works via the existing FTS5 syntax.)

### 8. Settings
Add to the **Capture / Lifecycle** section (create it if it doesn't exist):
- **Aging threshold** · numeric, default **21 days**. Range 7–180. Determines
  what counts as "cold" on the Aging surface and on per-thread aging strips.
- **Filing prompts** · select: `never` | `suggest at 90d` | `suggest at 180d`.
  When enabled, the Aging surface gets a small "X items past your filing
  threshold — file all?" affordance at the top.

---

## New surface: Aging

A new top-level dashboard view at `/aging` (also reachable from the
dashboard's tertiary section). Shows cold items across all threads with
**three action buttons per row**:

| Action       | Effect                                           | Shortcut |
|--------------|--------------------------------------------------|----------|
| Pick up      | `last_touched_at = now`, no state change         | **U**    |
| Crystallize  | opens "promote to crystallization" inline editor | **C**    |
| File         | `state = 'filed'`                                | **F**    |

Layout: same grid the existing Triage queue uses. Includes a threshold
selector in the header (`Threshold · 21d ▾`) sourced from settings;
overriding here is per-session.

See `design/reframe.jsx` → `AgingBoard` for the reference.

---

## Voice / copy updates

### Empty states
- "Inbox is clear." → unchanged.
- "No projects. Create one to start." → "No threads yet. Create one to start."
- Search-no-results: unchanged.
- **NEW** Aging surface empty: "Nothing's gone cold." with mono subtext
  `last sweep · {timestamp}`.
- **NEW** Crystallizations empty: "No crystallizations yet."
  with a faint hint: `promote a doc when an outcome has settled`.

### Confirmations
- "Archived." → **"Filed."**
- "Activated." → **"Picked up."**
- "Parked." → **"Set aside."**
- **NEW** "Crystallized. Linked N sources."
- **NEW** "Filed. Still searchable."

### Action labels (Sort screen)
- Activate → **Pick up**
- Park → **Set aside**
- Dismiss → **Let go**
  *(Note: in the cross-thread Aging view, "Let go" is replaced by **File**
  because filing is more deliberate than dismissal from inbox.)*

---

## Activity log verbs

Existing verbs (created, edited, archived, etc.) carry over. Add:

- `picked_up`     — item moved into active focus
- `set_aside`     — item moved to reflecting
- `crystallized`  — item promoted to a crystallization (payload includes
                    `sources_from: [<item_id>, ...]`)
- `filed`         — item soft-archived

The activity-entry component already supports these — they render as
uppercase Display-sm verbs like every other.

Backfill: leave historical `archived` verbs alone. New ones use `filed`.

---

## Suggested rollout order

1. **Schema migration** — state enum, kind enum, `last_touched_at`,
   settings columns.
2. **API rename pass** — update OpenAPI / MCP / CLI to accept the new
   state and kind values. Keep the old values working as aliases for two
   minor versions so external clients don't break.
3. **Activity verbs** — add the new verbs; update the renderer.
4. **Sort + action labels** — smallest visual change; lowest risk.
5. **Crystallization kind + state transition** — backend first, then UI
   ("Promote to crystallization" in the doc editor).
6. **Aging surface** — needs `last_touched_at` populated; ship after step 1.
7. **Field notes view** — net-new view; ship after the data layer for it.
8. **Project landing reflow** — Crystallizations panel, side-by-side Field
   notes + Runbook, Conversations promotion, aging strip.
9. **Dashboard reflow** — "In focus" header rename, ordering change,
   tertiary section swap.
10. **Settings additions** — aging threshold + filing prompts.

---

## What's NOT changing

- The eight core screens in their overall layout.
- The palette, type system, surface elevations.
- The Create Project modal (§6.9) — copy stays "New project" (not "New thread")
  because the modal trigger surfaces use "project" by convention; the
  *landing* copy uses "thread".
- The Triage queue's keyboard shortcuts.
- The Runbook view, in any way.
- The Pacecraft brand constraints (no Lily, no pure black, no gradients).
