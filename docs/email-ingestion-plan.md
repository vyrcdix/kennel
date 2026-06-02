# Steep — Smart Routing (implementation plan)

> Status: **plan only, not started.** Companion to
> `docs/email-ingestion-frd.md` (what & why). This doc covers schema,
> services, routes, UI surfaces, and the slice order for Phase 0
> (Paste & route). Phase 1+ (email transport, review UX, attachments)
> get their own plan sections once Phase 0 ships and we know what the
> classifier's failure modes actually are in practice.
>
> File kept as `email-ingestion-plan.md` for git history; rename to
> `routing-plan.md` whenever convenient.

## Scope

Phase 0: ship the paste-driven smart routing pipeline end-to-end.
A new modal accepts pasted content + optional hint + a thread; the
server runs an Anthropic classifier call (with prompt caching on
per-thread context); the resulting `{action, payload}` dispatches
into existing CRUD services (`captureItem`, `createDoc`, `addEntry`,
`updateRunbookSection`, `updateFieldNotes`); every routing persists
to a new table that drives a "Recently sorted" strip on each thread
landing. One new table, one new service module, one new route, one
new modal, one new strip, one new Settings panel, one new env var.

What is **not** in Phase 0: email transport, Re-route control, the
rejected log, the confidence-histogram view. Those are Phases 1–2.

## Schema

### New table

```sql
CREATE TABLE routings (
  id                       TEXT PRIMARY KEY,
  project_id               TEXT NOT NULL REFERENCES projects(id),

  source_kind              TEXT NOT NULL
                             CHECK (source_kind IN ('paste','email')),
  source_meta              TEXT,    -- JSON: { sender? } for email; null for paste
  raw_content              TEXT NOT NULL,
  hint                     TEXT,    -- nullable; one of 'bench','doc','guidebook','runbook','field-notes'

  classifier_action        TEXT NOT NULL
                             CHECK (classifier_action IN
                               ('bench','doc','guidebook','runbook','field-notes')),
  classifier_confidence    REAL,    -- 0..1; nullable when over_ai_budget
  classifier_explanation   TEXT,    -- nullable; one-line rationale from Claude
  over_ai_budget           INTEGER NOT NULL DEFAULT 0,

  artefact_kind            TEXT NOT NULL
                             CHECK (artefact_kind IN
                               ('item','doc','guidebook_entry','runbook','field_notes')),
  artefact_id              TEXT NOT NULL,

  rejected_at              TEXT,    -- nullable; set by Undo (Phase 2)
  created_at               TEXT NOT NULL
);

CREATE INDEX idx_routings_project_recent
  ON routings(project_id, created_at DESC);
CREATE INDEX idx_routings_artefact
  ON routings(artefact_kind, artefact_id);
```

- `artefact_kind` + `artefact_id` together identify what got created;
  the application layer resolves it to the right table when the
  strip renders.
- `source_kind` already supports `'email'` so Phase 1 doesn't need a
  schema migration — just a new route that writes routings rows with
  `source_kind = 'email'`.
- `rejected_at` is reserved for Phase 2's Undo upgrade; in Phase 0
  nothing writes to it, but the column exists so the indexes and
  selectors don't change shape.
- No FK on `artefact_id` — it points across five different tables.
  The lookup is by `artefact_kind` first, then by id within the
  resolved table. Application-layer integrity.

### Settings additions

`settings` already exists; this slice adds two columns:

```sql
ALTER TABLE settings ADD COLUMN routing_daily_cap INTEGER NOT NULL DEFAULT 200;
ALTER TABLE settings ADD COLUMN routing_confidence_threshold REAL NOT NULL DEFAULT 0.55;
```

`routing_confidence_threshold` follows the same 0.3–0.85 range from
the FRD; enforced at the application layer.

## Domain types

`shared/types.ts` additions:

```ts
export type RoutingAction =
  | 'bench'
  | 'doc'
  | 'guidebook'
  | 'runbook'
  | 'field-notes';

export type RoutingArtefactKind =
  | 'item'
  | 'doc'
  | 'guidebook_entry'
  | 'runbook'
  | 'field_notes';

export type RoutingSourceKind = 'paste' | 'email';

export type Routing = {
  id: string;
  projectId: string;
  sourceKind: RoutingSourceKind;
  /** Provenance for email; null for paste. */
  sourceMeta?: { sender?: string };
  rawContent: string;
  hint?: RoutingAction;
  classifier: {
    action: RoutingAction;
    confidence?: number;
    explanation?: string;
    overAiBudget: boolean;
  };
  artefact: {
    kind: RoutingArtefactKind;
    id: string;
  };
  rejectedAt?: Date;
  createdAt: Date;
};
```

`Settings` gains:

```ts
export type Settings = {
  // existing fields …
  routingDailyCap: number;
  routingConfidenceThreshold: number;
};
```

## Server

### New env var

`ANTHROPIC_API_KEY` — read once at boot via `process.env`. When
absent, the classifier service refuses to run and the route returns
a `503` with `{error: 'classifier_unavailable'}`. Documented in
`kennel-sys-admin-guide.md` under the systemd unit additions for
v0.5.1.

### Anthropic client

`server/package.json` gets `@anthropic-ai/sdk` as a dep.

`server/src/services/anthropic.ts` (new):
- Lazy client construction (single shared instance per process).
- A typed wrapper around `messages.create` that takes the prompt
  pieces (system, cached system block, per-call user content) and
  returns the structured-output payload.
- Forces prompt caching on the system + cached blocks by setting
  `cache_control: { type: 'ephemeral' }` on those content items.
- Uses Sonnet 4.6 (`claude-sonnet-4-6`) — the latest tier appropriate
  for classification; the model id is a constant so a model bump is
  one-line change.

### Classifier

`server/src/services/routingClassifier.ts` (new):
- `classifyPasted(db, projectId, body, hint?) → ClassifierResult`
  where `ClassifierResult = { action, confidence, explanation } |
  { overBudget: true }`.
- Builds the per-thread cached context from existing selectors:
  - Project name + description + context (from `projects`).
  - List of guidebooks: `name + description + entry count`.
  - Runbook section presence (which of the six exist for the
    project) + summary.
  - Field-notes mode + which sections have content.
- Sends one structured-output call with `response_format` describing
  the routing schema. Schema:
  ```json
  {
    "type": "object",
    "required": ["action", "confidence", "explanation", "payload"],
    "properties": {
      "action": { "enum": ["bench","doc","guidebook","runbook","field-notes"] },
      "confidence": { "type": "number", "minimum": 0, "maximum": 1 },
      "explanation": { "type": "string", "maxLength": 240 },
      "payload": { "type": "object" }  // shape varies by action; validated server-side
    }
  }
  ```
- Validates the payload against the action's specific schema (a tiny
  zod schema per action) before returning. If validation fails,
  downgrades to `action='bench'` and records the failure in
  `explanation`.
- Honors `settings.routingConfidenceThreshold`: under-threshold
  results get re-stamped to `action='bench'` before return, with the
  original action preserved in `explanation` ("low confidence; would
  have routed to runbook").
- Honors `settings.routingDailyCap` by checking the count of
  routings created today before the API call; over-cap returns
  `{overBudget: true}` without calling Anthropic.

### Dispatcher

`server/src/services/routingDispatcher.ts` (new):
- `dispatch(db, projectId, action, payload, rawContent) → Artefact`
  where Artefact is a discriminated union of the matching CRUD
  return types.
- Per action:
  | action | service called | payload shape |
  |---|---|---|
  | `bench` | `captureItem({projectId, kind:'note', title, body})` | `{title, body}` |
  | `doc` | `createDoc({projectSlug, title, body, pinned:false})` | `{title, body}` |
  | `guidebook` | resolve target guidebook → `addEntry({guidebookId, body, name, description, tags})` | `{guidebookId?, name, description?, tags?}` plus the body becomes the new doc the entry points at via `createDocFromUpload` with `kind:'md'` |
  | `runbook` | look up runbook for the project; call `updateRunbookSection(section, currentBody + dateDivider + newBody)` | `{section, body}` |
  | `field-notes` | similar append-with-divider into the matching `field_notes` column | `{section, body}` |
- Each dispatch returns `{kind: RoutingArtefactKind, id: string}` so
  the caller writes it into the routings row.
- Guidebook target resolution: if Claude's payload includes a
  `guidebookId` and it's valid for the project, use it. Otherwise
  pick the project's most-recently-touched guidebook. If the
  project has no guidebook at all, the dispatcher returns
  `{action:'bench', reason:'no_guidebook'}` so the caller writes a
  bench item instead and stamps that in the explanation.
- Date divider: `\n\n---\n*Routed {YYYY-MM-DD}*\n\n` so the append
  is obviously machine-added.

### Routing service

`server/src/services/routing.ts` (new):
- `createPasteRouting(db, {projectSlug, hint, body}) → Routing`
  - Resolves project from slug; throws `notFound` if missing.
  - Calls `classifyPasted`. On `overBudget`, sets
    `classifier.action='bench'`, `confidence=null`, dispatches to
    bench, records `over_ai_budget=1`.
  - Calls `dispatch`. If dispatch returns a downgraded bench (e.g.
    `no_guidebook`), the routings row records the original
    classifier action in `explanation` but `classifier_action` and
    `artefact_kind` reflect what actually shipped.
  - Inserts the routings row with everything assembled.
  - Logs activity (`ROUTED`).
- `listRecentRoutingsByProject(db, projectId, days=7) → Routing[]`
  for the strip.
- `getRoutingById(db, id) → Routing | undefined`.

### Routes

`server/src/routes/routing.ts` (new):

| Method + path | Purpose |
| --- | --- |
| `POST /api/routing/paste` | `{projectSlug, hint?, body}` → returns the new Routing |
| `GET /api/projects/:slug/routings` | last-7-day routings for the project |

Mounted in `server/src/index.ts` alongside the existing routers.

### Activity

Extend the activity `entity_type` whitelist to add `'routing'`. New
verbs:
- `ROUTED` — fired on every successful routing dispatch.

Phase 2 will add `REROUTED` and `REJECTED`.

### Tests

- `services/routing.test.ts` — dispatcher unit tests per action
  (bench, doc, guidebook with + without target, runbook append,
  field-notes append), classifier downgrade on low confidence,
  over-budget short-circuit.
- `services/anthropic.test.ts` — narrow tests around prompt
  assembly + structured-output parsing. Real API calls live behind
  `KENNEL_RUN_LIVE_ANTHROPIC=1` so CI stays cheap.
- `routes/routing.test.ts` — the happy path through the paste
  endpoint with a mocked classifier (vitest mock).

## Frontend

### State / data layer

`src/data/types.ts` — re-export `Routing`, `RoutingAction`,
`RoutingArtefactKind`, `RoutingSourceKind`.

`src/data/fixtures.ts` — add a `routings: Routing[] = []` slice so
the store cache + bootstrap path can carry them.

`src/data/api.ts` — `pasteRouting`, `listProjectRoutings`.

`src/data/actions.ts` — `submitPasteRouting(input)` wraps the API
call + writes the new routing into the cache + notifies. Failure
modes:
- `503 classifier_unavailable` → surfaces a custom
  `ClassifierUnavailableError` so the UI can show the right copy.
- `429 daily_cap` → surfaces `RoutingCapError` similarly.
- Anything else → standard `ValidationError` / `ApiError`.

`src/data/selectors.ts` — `getProjectRoutings(projectId, days=7)`,
`getRoutingsForArtefact(kind, id)`.

### Components

**New modal** — `src/components/PasteRouteModal.tsx`:
- Thread picker (default per the open-context).
- Hint segmented control: `Let Claude pick` · `Bench` · `Doc` ·
  `Guidebook` · `Runbook` · `Field notes`.
- Body textarea (resizes; min 8 rows). Drag-drop a `.md` / `.docx`
  file into the textarea → file contents replace the body.
- Submit closes the modal immediately and dispatches a toast on
  completion. The store's optimistic shape is a placeholder Routing
  with `classifier.action = hint ?? 'bench'` until the API resolves.
- Errors surface in the toast with a "Try again" affordance that
  re-opens the modal with the content preserved.

**Recently sorted strip** — `src/components/RecentlySortedStrip.tsx`:
- One row per routing (last 7 days, max 8 visible with a "show all"
  link to a future Phase 2 filter panel).
- Row shape: artefact icon · title · `from` chip (`pasted` or
  `email · sender`) · routing label (`captured to bench` /
  `appended to runbook · deploy` / etc.) · **Undo** button.
- Undo (Phase 0 version): deletes the artefact via the matching
  delete action (`deleteItem` / `deleteDoc` / `removeEntry` / a
  new "revert runbook append" / "revert field-notes append") and
  removes the routing from the cache. Phase 2 makes this a soft
  reject + a rejected log.

**Settings → Routing panel** — `src/screens/SettingsScreen.tsx`
gains a new `'routing'` section that renders:
- A read-only "Anthropic API key" line showing the first 8 + last
  4 characters of the key fingerprint (or "not set — paste
  classification is disabled").
- The per-day cap (number input, 1–500).
- The confidence threshold (slider, 0.3–0.85).
- A note: "Email transport ships in Phase 1; address + allowlist
  controls land then."

### Surfacing the modal

- Global `openPasteRoute(projectSlug?)` via `src/lib/modals.ts`,
  same bus pattern as `openCapture` and `openEditItem`.
- Bound to `⌘⇧V` in `GlobalShortcuts`.
- New "Paste & route" entry in `CaptureModal`'s kind row (or a
  separate top-bar button on the thread landing — design picks one
  before plan finalises; build supports both).
- A "Paste & route" button on the project landing's chrome strip.

### Selector additions for the strip

The strip needs both routings AND the resolved artefacts (so it can
render the artefact title + icon). Add a small selector:

```ts
export type ResolvedRouting = {
  routing: Routing;
  artefact:
    | { kind: 'item'; item: Item }
    | { kind: 'doc'; doc: Doc }
    | { kind: 'guidebook_entry'; entry: GuidebookEntry }
    | { kind: 'runbook'; runbook: Runbook }
    | { kind: 'field_notes'; fieldNotes: FieldNotes };
};

export const getResolvedRoutingsForProject = (
  projectId: string,
  days = 7,
): ResolvedRouting[] => { ... }
```

Routings whose artefact has since been deleted are filtered out (so
the strip stays clean after Undo).

### Tests

- `data/selectors.test.ts` — `getProjectRoutings` ordering +
  window, `getResolvedRoutingsForProject` post-delete filtering.
- Component smoke tests for `PasteRouteModal` (existing-pattern:
  prefers the cheap selector tests + manual verify per CLAUDE
  conventions; the modal is light enough that this is fine).

## Slices

Each slice ends with `npm test` green and a usable feature state.

### Slice 1 — schema + types + Anthropic shim

- Migration `0012_routings.sql` (the new table + the two settings
  columns).
- `shared/types.ts` additions (`Routing`, the union types, `Settings`
  additions).
- `server/package.json` adds `@anthropic-ai/sdk`.
- `services/anthropic.ts` shell — env var read, client construction,
  one passing test against a mocked transport.
- `services/routing.ts` shell — `rowToRouting`, `listRecentRoutingsByProject`,
  `getRoutingById`. No `createPasteRouting` yet.
- `routes/routing.ts` shell — the `GET` endpoint only.
- Activity `entity_type` whitelist updated; `ROUTED` verb defined.

After this slice, the DB knows the shape and a manual `INSERT` into
`routings` shows up in `GET /api/projects/:slug/routings`. Nothing
yet creates routings.

### Slice 2 — dispatcher + classifier (no UI yet)

- Full `routingDispatcher.ts` — the per-action map, the
  date-divider helper, the guidebook-target resolver, the
  no-guidebook downgrade.
- Full `routingClassifier.ts` — the per-thread context assembler,
  the prompt cache markers, the structured-output schema +
  validation, the confidence threshold check, the daily cap check.
- `createPasteRouting` lands in `services/routing.ts`.
- `POST /api/routing/paste` lands in the router.
- Dispatcher + classifier tests pass against mocked Anthropic.

After this slice, `curl POST /api/routing/paste` end-to-end works
with a real Anthropic key set. UI doesn't exist yet.

### Slice 3 — Paste & route modal

- API client + store + actions + the `openPasteRoute` bus.
- `PasteRouteModal.tsx` — full surface.
- Bound to `⌘⇧V`.
- A "Paste & route" entry in CaptureModal's kind row + a top-bar
  button on ProjectLanding.
- Toast surface for the success / failure cases.
- Manually verify: paste a chunk of text, watch it land in the
  right place.

### Slice 4 — Recently sorted strip + Undo

- `RecentlySortedStrip.tsx`.
- ProjectLanding mounts the strip below the Worth-revisiting slot.
- Undo path: delete the matching artefact + remove the routing from
  the cache. The new "revert runbook append" and "revert
  field-notes append" helpers go into the dispatcher service
  (Phase 2 will reuse them for soft reject).
- Manually verify: route a paste into the runbook, click Undo, the
  appended block is gone and the original runbook state is restored.

### Slice 5 — Settings panel + caps

- Settings → Routing section with the API-key fingerprint, the
  per-day cap, the confidence threshold.
- Wire the cap into `createPasteRouting` (already wired in Slice 2;
  this is just the UI to tune it).
- Manually verify: dial the cap to 1, route once, route again,
  second one falls through to bench with the "over daily AI budget"
  marker.

After Slice 5, Phase 0 is complete and shippable.

## Critical files

**Server (new):**
- `server/migrations/0012_routings.sql`
- `server/src/services/anthropic.ts`
- `server/src/services/routingClassifier.ts`
- `server/src/services/routingDispatcher.ts`
- `server/src/services/routing.ts`
- `server/src/routes/routing.ts`

**Server (modified):**
- `server/src/index.ts` — router wiring
- `server/src/services/settings.ts` — new columns + patch shape
- `server/src/activity.ts` — `'routing'` entity_type + `ROUTED` verb
- `server/package.json` — `@anthropic-ai/sdk` dep

**Shared:**
- `shared/types.ts` — Routing + union types + Settings additions

**Frontend (new):**
- `src/components/PasteRouteModal.tsx`
- `src/components/RecentlySortedStrip.tsx`

**Frontend (modified):**
- `src/data/api.ts`, `src/data/actions.ts`, `src/data/store.ts`,
  `src/data/selectors.ts`, `src/data/types.ts`, `src/data/fixtures.ts`
- `src/lib/modals.ts` — `openPasteRoute` bus
- `src/App.tsx` — `useEffect` shortcut binding, modal host
- `src/screens/ProjectLanding.tsx` — strip + top-bar button
- `src/components/CaptureModal.tsx` — Paste & route entry
- `src/screens/SettingsScreen.tsx` — Routing section

## Effort

~1½ focused sessions end-to-end for Phase 0, five slices, one
branch. The largest unknowns are the classifier prompt iteration
(hard to nail the rubric on the first attempt — expect to iterate
during Slice 4 once real-world content is going through) and the
guidebook-target resolution heuristic (if Claude struggles to pick
the right guidebook for a paste, the runtime UX gets noisy).

## Phase 1 — Email transport (sketch, not committed)

When Phase 0 ships and the classifier is behaving:

1. Pick an inbound provider — Cloudflare Email Workers if
   `steep.work` moves to CF; Postmark or Mailgun otherwise.
2. Add `POST /api/routing/email` route. Verifies the provider's
   signing secret. Parses `{from, to, subject, text, html,
   attachments}`.
3. HTML → markdown via `turndown`; quoted-reply / signature
   stripping.
4. Thread tag parser (the four-pattern subject parser from the
   FRD).
5. Sender allowlist + DKIM/SPF check.
6. Attachment handling: `.md`/`.docx` through `createDocFromUpload`;
   others as references under `content/<slug>/uploads/email/`.
7. Per-day email cap (separate from the Claude cap).
8. Per-user secret rotation.
9. Settings → Routing panel gains the email config: address,
   rotate, allowlist, default-thread, email cap.

Reuses Phase 0's classifier, dispatcher, routings table, and
recently-sorted strip verbatim. The strip's `from` chip switches to
`email · <sender>` for routings where `source_kind = 'email'`.

Effort: ~½ session on top of Phase 0.

## Phase 2 — Review UX (sketch, not committed)

- **Re-route…** control on the strip rows.
- Soft Undo: `rejected_at` instead of delete; rejected log on the
  Settings panel.
- `REROUTED` and `REJECTED` activity verbs.
- Taxonomy view + confidence histogram on Settings → Routing.

Effort: ~½ session on top of Phase 1.

## Phase 3 — Better attachments (sketch, not committed)

Image extraction from HTML, PDF text extraction, HEIC
normalisation. Quality-of-life only; nothing structural. Defer
unless Phase 1 attachment behaviour proves limiting.

Effort: ~¼ session.

## Out of scope (this plan)

- Outbound mail (Steep never sends).
- Multi-user routing.
- Conversation tracking across reply chains.
- Inline editing during routing.
- Multipart paste UX (one body per submission).
- Real-time SSE push of new routings (Phase 0 polls on page
  navigation; SSE is fine to add later).
