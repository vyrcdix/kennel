# Steep — Guidebooks per Topic (implementation plan)

> Status: **plan only, not started.** Companion to
> `docs/guidebook-frd.md` (what & why). This doc covers schema,
> services, routes, UI surfaces, and the slice order.

## Scope

Ship the v1 of Guidebooks described in the FRD: per-topic ordered
collections of entries, each entry pointing at a Doc or Reference,
with per-membership name/description/order/tags. Manual fields only;
no LLM calls; same-topic only. Two new tables, one ALTER for doc
provenance, one new screen, one new ProjectLanding tab + pinned
section, REST routes, no MCP changes in v1.

## Schema

### New tables

```sql
CREATE TABLE guidebooks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  name            TEXT NOT NULL,
  description     TEXT,
  pinned          INTEGER NOT NULL DEFAULT 0,
  rank            REAL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_guidebooks_project ON guidebooks(project_id);
CREATE INDEX idx_guidebooks_project_rank ON guidebooks(project_id, rank);

CREATE TABLE guidebook_entries (
  id              TEXT PRIMARY KEY,
  guidebook_id    TEXT NOT NULL REFERENCES guidebooks(id),
  doc_id          TEXT REFERENCES docs(id),
  reference_id    TEXT REFERENCES refs(id),
  name            TEXT NOT NULL,
  description     TEXT,
  tags            TEXT,                              -- JSON array of strings
  rank            REAL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  CHECK ((doc_id IS NOT NULL) <> (reference_id IS NOT NULL))
);

CREATE INDEX idx_gb_entries_guidebook ON guidebook_entries(guidebook_id, rank);
CREATE INDEX idx_gb_entries_doc ON guidebook_entries(doc_id);
CREATE INDEX idx_gb_entries_ref ON guidebook_entries(reference_id);
```

- The `CHECK` enforces "exactly one source" at the storage layer; the
  service layer enforces it again before insert for friendly errors.
- `tags` is a JSON array of strings; the API parses on read and
  stringifies on write. Free-text only — no `tags`-table relationship
  (per FRD).
- `rank REAL` matches the project-wide pattern (`items.rank`,
  `projects.rank`). Drag-to-reorder picks a value between neighbours;
  rebalance lazily.

### Doc provenance

```sql
ALTER TABLE docs ADD COLUMN source_filename TEXT;
ALTER TABLE docs ADD COLUMN source_kind TEXT;       -- 'md' | 'docx' | 'inline'
ALTER TABLE docs ADD COLUMN source_uploaded_at TEXT;
```

Backfill: all existing rows get `source_kind = 'inline'`,
`source_filename = NULL`, `source_uploaded_at = created_at`. New
uploads via the Guidebook UI populate all three.

These columns are not Guidebook-specific — they're a generally useful
upgrade to Docs. The FRD captures the user-facing reason ("re-find
the original Word version"); they live on `docs` because that's where
provenance belongs.

## Domain types

`shared/types.ts` additions:

```ts
export type Guidebook = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  pinned: boolean;
  rank: number;
  createdAt: Date;
  updatedAt: Date;
};

export type GuidebookEntry = {
  id: string;
  guidebookId: string;
  source: { kind: 'doc'; docId: string } | { kind: 'reference'; referenceId: string };
  name: string;
  description?: string;
  tags: string[];
  rank: number;
  createdAt: Date;
  updatedAt: Date;
};

// Extend Doc with the provenance fields:
export type Doc = {
  // existing fields …
  sourceFilename?: string;
  sourceKind?: 'md' | 'docx' | 'inline';
  sourceUploadedAt?: Date;
};
```

The `source` discriminated union keeps the "exactly one of" invariant
visible at the type boundary. Server marshalling chooses the variant
from whichever column is non-null.

## Server

### Services (new)

`server/src/services/guidebook.ts`
- `listGuidebooks(db, projectSlug): Guidebook[]` — sorted by `rank`.
- `getGuidebookById(db, id): Guidebook | undefined`
- `createGuidebook(db, { projectSlug, name, description?, pinned? }, actor)`
- `updateGuidebook(db, id, { name?, description?, pinned? })`
- `reorderGuidebooks(db, projectSlug, orderedIds)` — re-rank.
- `deleteGuidebook(db, id)` — removes the row + its entries (cascade
  by transaction, not by FK ON DELETE, to mirror the project's
  existing patterns).

`server/src/services/guidebookEntry.ts`
- `listEntries(db, guidebookId): GuidebookEntry[]` — sorted by
  `rank`.
- `addEntry(db, guidebookId, input)` — `input` accepts one of:
  `{ docId, name?, description?, tags? }`,
  `{ referenceId, name?, description?, tags? }`,
  `{ upload: { filename, kind, body }, name?, description?, tags? }` — creates a Doc + entry,
  `{ link: { url, label }, name?, description?, tags? }` — creates a Reference + entry.
- `updateEntry(db, id, { name?, description?, tags? })`
- `reorderEntries(db, guidebookId, orderedIds)`
- `removeEntry(db, id)` — drops the row; never the source.

Both services log activity (`logActivity`) with the entity types
`'guidebook'` and `'guidebook_entry'`. Extend the activity
`entity_type` allowed set; see "Activity / FTS" below.

### DOCX upload (mammoth)

Add `mammoth` to `server/package.json`. In `services/doc.ts`, add
`createDocFromUpload(db, { projectSlug, filename, kind, body, ... })`:

- `kind === 'docx'`: pass the buffer through `mammoth.convertToMarkdown`;
  on conversion failure throw a validationError so the UI can show
  *"Could not convert this .docx — please paste the contents instead."*
- `kind === 'md'`: take the body as-is.
- Title defaults to the stem of the original filename. Provenance
  columns set from the upload.

This sits alongside the existing `createDoc` rather than replacing
it. MCP's `write_doc` is unaffected.

### Routes

`server/src/routes/guidebooks.ts` (new):

| Method + path | Purpose |
| --- | --- |
| `GET /api/projects/:slug/guidebooks` | List guidebooks for a topic |
| `POST /api/projects/:slug/guidebooks` | Create guidebook |
| `PATCH /api/guidebooks/:id` | Update name / description / pinned |
| `PATCH /api/projects/:slug/guidebooks/reorder` | `{ orderedIds }` |
| `DELETE /api/guidebooks/:id` | Delete |
| `GET /api/guidebooks/:id/entries` | List entries |
| `POST /api/guidebooks/:id/entries` | Add entry (multipart for upload, JSON otherwise) |
| `PATCH /api/guidebook-entries/:id` | Update entry |
| `PATCH /api/guidebooks/:id/entries/reorder` | Reorder |
| `DELETE /api/guidebook-entries/:id` | Remove entry |

Mounted in `server/src/index.ts` alongside the existing routers.

### Activity / FTS

- Extend `entity_comments.entity_type` check + `entity_tags.entity_type`
  check + `activity.entity_type` check **only as needed**. Activity:
  yes, add `'guidebook'` and `'guidebook_entry'` so existing activity
  rendering picks them up. Comments and entity_tags: **no** — comments
  on guidebooks/entries are out of scope; tags are free-text strings,
  not `entity_tags` rows.
- No FTS in v1 — guidebooks and entries don't carry searchable
  bodies; the source Docs/References already participate in
  `docs_fts` / `refs_fts`. Global search hitting a Doc that's
  referenced by guidebooks can show "in N guidebooks" later if
  warranted; not v1.

### Tests

- `services/guidebook.test.ts` + `services/guidebookEntry.test.ts` —
  CRUD, reorder, "exactly one source" invariant, cascade on
  guidebook delete, source deletion soft-handling once Doc delete
  exists (skipped for now; documented).
- `services/doc.test.ts` extension — DOCX upload happy path,
  DOCX-with-images degraded path, provenance columns persisted.

## Frontend

### State / data layer

`src/data/types.ts` — re-export the new domain types.
`src/data/api.ts` — `listGuidebooks`, `createGuidebook`, `updateGuidebook`,
`reorderGuidebooks`, `deleteGuidebook`, `listEntries`, `addEntry`,
`updateEntry`, `reorderEntries`, `removeEntry`. Multipart for
`addEntry` when uploading.
`src/data/actions.ts` — thin action wrappers that dispatch optimistic
store updates the same way the existing Doc / Reference actions do.
`src/data/store.ts` — add `guidebooks` and `guidebookEntries` slices,
indexed by id + secondary index by projectId / guidebookId.
`src/data/selectors.ts` — `getProjectGuidebooks(projectId)`,
`getGuidebookEntries(guidebookId)`, `getPinnedGuidebooks(projectId)`.

### Screens / components

**New screen** — `src/screens/GuidebookView.tsx` at
`/project/:slug/guidebook/:id`. Header (name, description, pinned
toggle, view-mode toggle). View-mode toggle = Order / Tags. Add-entry
button opens a modal.

**New modal** — `src/components/AddGuidebookEntryModal.tsx`. Two
tabs: *Pick existing* (filterable list of the topic's Docs +
References) and *Upload / paste* (a file picker for `.md` / `.docx`
and a link-paste input). On submit, calls `addEntry` with the right
shape. Name + description + tags fields below in both cases.

**Entry rows** — drag handle, source-type icon, name, description
preview, tags chips, overflow menu (rename = inline edit, remove,
open source).

**ProjectLanding additions**
- New pinned section "Guidebooks" between Pinned docs and the
  bottom tabs section. Renders `getPinnedGuidebooks(projectId)` as
  cards (same `km-card` styling as PinnedDocCard).
- New `TabButton` "Guidebooks · N" in the lower-tabs row. Active
  state shows a list of every guidebook in the topic.
- A "+ New guidebook" button on the tab header opens
  `CreateGuidebookModal` (simple — name + optional description).

**Grouped view** — within `GuidebookView`, the Tags toggle re-groups
the entry list by tag. Entries with no tag fall into a final
"untagged" group. Within a group, drag-reorder is disabled (drag
order is preserved from the Order view).

### Tests

- `src/data/selectors.test.ts` — `getProjectGuidebooks`,
  `getPinnedGuidebooks`, `getGuidebookEntries` ordering.
- Component smoke tests for `AddGuidebookEntryModal` (existing-pick
  vs upload vs link) once the testing pattern in this repo allows it
  cheaply; otherwise rely on the service tests + manual verify per
  CLAUDE conventions.

## Slices

Each slice ends with `npm test` green and a usable feature state.

### Slice 1 — schema + types
- Migration `0009_guidebooks.sql` (the two new tables + the docs
  ALTER + activity entity_type check update).
- `shared/types.ts` additions (`Guidebook`, `GuidebookEntry`, Doc
  provenance fields).
- Service shells (`guidebook.ts`, `guidebookEntry.ts`) with
  `rowTo*` + `list*` + `get*ById` only. Tests for those.

### Slice 2 — server CRUD + DOCX upload
- Full service surface (create / update / reorder / delete for both
  entities; addEntry with all four source modes).
- `mammoth` dep + `createDocFromUpload`.
- Routes + wiring in `index.ts`.
- Service + route tests.

### Slice 3 — frontend list + create + pin
- API client + store + selectors + actions.
- ProjectLanding: tab + pinned section, "+ New guidebook" modal.
- GuidebookView shell: header, list (no entries yet, no add button).
- Manually verify: create, rename, pin, reorder, delete a guidebook
  on a seed topic.

### Slice 4 — entries: add, list, reorder, remove
- AddGuidebookEntryModal — pick-existing tab.
- Entry rows, drag-to-reorder, inline rename, remove.
- Manually verify: add an existing Doc and an existing Reference;
  reorder; remove.

### Slice 5 — entries: upload + link paste
- Upload tab in AddGuidebookEntryModal (`.md` and `.docx`).
- Link-paste path (creates a Reference).
- DOCX conversion fallback messaging.
- Provenance columns visible somewhere in the Doc editor header (a
  small "Originally `brief.docx`, uploaded 12 May" line). Out of
  scope if it adds too much; defer to a follow-up if so.

### Slice 6 — Tags + grouped view
- Tags input on entry (chip-style or comma-separated).
- View-mode toggle (Order / Tags) on GuidebookView.
- Tag-filter row in Order view.
- Manually verify: tag a few entries; filter by tag; switch to Tags
  view and confirm grouping.

## Critical files

**Server (new):**
- `server/migrations/0009_guidebooks.sql`
- `server/src/services/guidebook.ts`
- `server/src/services/guidebookEntry.ts`
- `server/src/routes/guidebooks.ts`

**Server (modified):**
- `server/src/services/doc.ts` — `createDocFromUpload`, provenance
  columns
- `server/src/index.ts` — router wiring
- `server/src/activity.ts` (or wherever the activity `entity_type`
  whitelist lives) — add `'guidebook'`, `'guidebook_entry'`
- `server/package.json` — `mammoth` dep

**Shared:**
- `shared/types.ts` — `Guidebook`, `GuidebookEntry`, Doc provenance
  fields

**Frontend (new):**
- `src/screens/GuidebookView.tsx`
- `src/components/AddGuidebookEntryModal.tsx`
- `src/components/CreateGuidebookModal.tsx`

**Frontend (modified):**
- `src/data/api.ts`, `src/data/actions.ts`, `src/data/store.ts`,
  `src/data/selectors.ts`, `src/data/types.ts`
- `src/screens/ProjectLanding.tsx` — pinned section + tab
- `src/App.tsx` — route for `/project/:slug/guidebook/:id`

## Effort

~2–3 days end-to-end, six slices, one branch. The biggest unknowns
are the DOCX conversion edge cases (mammoth quirks with embedded
images / complex Word styles — handle as "best effort, show
fallback") and the drag-to-reorder polish on the entries list.

## Out of scope (this plan)

- LLM-powered auto-generate (description, link enrichment). Reserved
  for a follow-up; data model already accommodates.
- Server-side `<title>` / OG-tag fetch for link entries. Same.
- Cross-topic sharing of Docs.
- MCP tools (`read_guidebook`, `write_guidebook`). Revisit after v1
  ships.
- Comments on guidebooks / entries (no `entity_comments` extension).
- Tag identity (no `entity_tags` rows for guidebook entries).
- FTS over guidebook names/descriptions.
- Export (PDF / markdown bundle).
- "In N guidebooks" badge on Docs in the topic's Docs list.
