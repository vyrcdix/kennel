// Domain types — single source of truth, imported by both server and client.
// Timestamps are JS Date in-memory; serialised as ISO-8601 strings over the wire
// and stored as TEXT in SQLite. The server converts at the DB boundary; the
// client converts at the HTTP boundary via materializeDates().

export type ItemKind =
  | 'idea'
  | 'note'
  | 'action'
  | 'doc'
  | 'ref'
  | 'question'
  | 'crystallization';

export type ItemState =
  | 'inbox'
  | 'active'
  | 'reflecting'
  | 'crystallized'
  | 'filed'
  | 'dismissed';

export type ProjectStatus = 'active' | 'paused' | 'archived';

/** Cadence (recurring actions) — see docs/cadence-build-plan.md. Both are
 *  meaningful only on a `kind=action` item; a cadence is "present" when
 *  `cadence` is set. Vitality (fresh/active/aging/dormant) is derived from
 *  lastDoneAt vs the cadence interval, weighted by commitment — never stored. */
export type Cadence = 'daily' | 'weekly' | 'monthly';
export type Commitment = 'trying' | 'committed' | 'core';

export type Actor = 'craig' | 'claude' | 'cli' | 'system';

/** v0.5 thread label palette (handoff §A). Six low-chroma label colours
 *  with no semantic meaning, so the family language (blaze=crystals,
 *  ember=action, moss=guidebook, clay=field-notes) stays unique. The
 *  pre-v0.5 enum (moss/ember/dust/blaze/slate) migrates via
 *  server/migrations/0011_thread_label_palette.sql. */
export type ProjectColor =
  | 'stone'
  | 'sage'
  | 'dusk'
  | 'plum'
  | 'slate'
  | 'teal';

export type Project = {
  id: string;
  slug: string;
  name: string;
  description: string;
  context?: string;
  status: ProjectStatus;
  pinned: boolean;
  rank: number;
  color?: ProjectColor;
  nextStepsDismissed?: boolean;
  /** Compass: the bearing this current is currently under (a forward crystal),
   *  assigned from within the thread. null = not under a bearing. A bearing
   *  gathers many such currents. See docs/compass-build-plan.md. */
  servesBearingId?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Crystallization sub-type (v0.5). Nullable; only meaningful when
 *  `kind === 'crystallization'`. Drives the typed card treatment on the
 *  salient layer; `principle` gets the hero-sized card, others (and
 *  null) get the default card.
 *  `orientation` (Compass) is the forward-pointed 6th type — a bearing: what
 *  you're moving toward. See docs/compass-build-plan.md. */
export type CrystalType =
  | 'principle'
  | 'quote'
  | 'reminder'
  | 'hint'
  | 'memory'
  | 'orientation';

/** Cadence role (Compass). A `promise` is a daily cadence attached to a
 *  bearing (requires `servesId`, suppressed from "Do this week"); a `practice`
 *  is an ordinary free-standing cadence. Default 'practice'. */
export type CadenceRole = 'promise' | 'practice';

export type Item = {
  id: string;
  projectId: string;
  kind: ItemKind;
  state: ItemState;
  title: string;
  description?: string;
  context?: string;
  body?: string;
  expectedOutcome?: string;
  dueAt?: Date;
  doneAt?: Date;
  archivedAt?: Date;
  rank: number;
  docId?: string;
  referenceId?: string;
  hash?: string;
  lastTouchedAt?: Date;
  /** v0.5 facets — see handoff/kennel_v05_handoff/README.md §2. */
  ctype?: CrystalType;
  /** Backward lineage: source item / doc / chat ids the crystal was
   *  distilled from. */
  sourcesFrom?: string[];
  /** Forward intent: the crystal / idea / thread anchor this action
   *  serves. Orthogonal to sourcesFrom. */
  servesId?: string;
  /** Resurfacing cadence — when the crystal was last shown / acked. */
  lastSurfacedAt?: Date;
  surfaceCount: number;
  /** Cadence facets (recurring actions) — only meaningful on kind=action;
   *  present when `cadence` is set. See docs/cadence-build-plan.md. */
  cadence?: Cadence;
  commitment?: Commitment;
  /** When this re-enters the "do this week" surface. */
  windowOpensAt?: Date;
  /** Last logged contact ("Did it"). */
  lastDoneAt?: Date;
  /** Gentle streak readout — not a score. Bumped by "Did it", not by Skip. */
  keptCount?: number;
  /** Optional on-card resource (a reference of type 'link'). */
  resourceRefId?: string;
  /** UI default for where a memo files (a field-notes section). */
  noteDefaultSection?: FieldNotesSectionKey;
  /** Compass facets — see docs/compass-build-plan.md.
   *  Horizon: optional finish line on a bearing (ctype='orientation');
   *  "day N / total" + "days ahead" are derived, never stored. */
  horizonStartAt?: Date;
  horizonTargetAt?: Date;
  /** Cadence role: 'promise' (belongs to a bearing) vs 'practice'. Default
   *  'practice'; only meaningful on a cadence. */
  role?: CadenceRole;
  /** Bearing persona/workspace key. null = the single set rendered now. */
  persona?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Settings = {
  agingThresholdDays: number;
  filingPromptDays: 0 | 90 | 180;
  dormantThresholdDays: number;
  showTemperature: boolean;
  /** v0.5: resurface cadence in days. Range 7–180; default 30. */
  resurfaceIntervalDays: number;
  /** Smart Routing — max classifier calls per day. Range 1–500; default 200. */
  routingDailyCap: number;
  /** Smart Routing — confidence floor; classifier picks under this
   *  threshold get rewritten to 'bench'. Range 0.3–0.85; default 0.55. */
  routingConfidenceThreshold: number;
  /** Cadence cooling tolerance — consecutive skipped windows before a cadence
   *  drifts onto the Aging board, per commitment (A4). Range 1–60; defaults
   *  3 / 6 / 10. */
  cadenceToleranceTrying: number;
  cadenceToleranceCommitted: number;
  cadenceToleranceCore: number;
  createdAt: Date;
  updatedAt: Date;
};

export type FieldNotesMode = 'scratchpad' | 'managed';

export type FieldNotesSectionKey =
  | 'premise'
  | 'whatIKnow'
  | 'openQuestions'
  | 'sources'
  | 'crystallizations';

export type FieldNotes = {
  id: string;
  projectId: string;
  /** scratchpad: every section is a markdown blob. managed: Open
   *  Questions + Sources render as entity lists (question items /
   *  references). Premise + What I know stay prose either way. */
  mode: FieldNotesMode;
  premise?: string;
  whatIKnow?: string;
  openQuestions?: string;
  sources?: string;
  crystallizations?: string;
  revision: number;
  /** v0.5: section-level crystal links. Map of section key →
   *  crystallization item id. Section-split-into-its-own-table is a
   *  future migration; until then this column holds the linkage. */
  supportsCrystals?: Partial<Record<FieldNotesSectionKey, string>>;
  createdAt: Date;
  updatedAt: Date;
};

export type DocSourceKind = 'md' | 'docx' | 'inline';

/** v0.5: reserved for future plain-doc subtypes. Only `'doc'` is valid
 *  today; enforced at the application layer so adding a subtype later
 *  doesn't need a fresh migration. */
export type DocType = 'doc';

export type Doc = {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  context?: string;
  filePath: string;
  body: string;
  revision: number;
  pinned: boolean;
  /** Original uploaded filename, when the doc came from an upload. */
  sourceFilename?: string;
  /** How the doc's body got here. 'inline' = composed in-app / via MCP. */
  sourceKind?: DocSourceKind;
  sourceUploadedAt?: Date;
  /** v0.5: plain-doc subtype. Defaults to 'doc'. */
  doctype: DocType;
  /** v0.5: nullable link to the crystallization this doc supports.
   *  Set automatically when crystallizing if this doc is in
   *  `sourcesFrom`; can also be set manually from the Crystal detail
   *  "Built on" panel. */
  supportsCrystal?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Reference = {
  id: string;
  projectId: string;
  type: string;
  label: string;
  description?: string;
  url?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** A labelled environment URL on a runbook — Admin, Dev, Prod, etc. */
export type RunbookUrl = {
  label: string;
  url: string;
};

export type Runbook = {
  id: string;
  projectId: string;
  /** Environment URLs — labelled pairs (Admin / Dev / Prod / …). */
  urls: RunbookUrl[];
  prerequisites?: string;
  setup?: string;
  run?: string;
  deploy?: string;
  troubleshoot?: string;
  notes?: string;
  revision: number;
  /** v0.5: nullable link to the crystallization this runbook supports. */
  supportsCrystalItemId?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Chat = {
  id: string;
  projectId: string;
  claudeUrl?: string;
  tagline: string;
  status: 'active' | 'archived';
  startedAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type Skill = {
  id: string;
  projectId?: string;
  name: string;
  slug: string;
  source: 'local_path' | 'git_url' | 'inline';
  sourcePath?: string;
  body: string;
  revision: number;
  status: 'active' | 'archived';
  lastSyncedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SkillProposal = {
  id: string;
  skillId: string;
  /** What Claude originally proposed. Immutable after creation. */
  proposedBody: string;
  /** What was actually written to the skill — set when the reviewer edited
   *  the body before accepting. NULL means the original proposedBody was
   *  applied verbatim (the common case). */
  appliedBody?: string;
  rationale: string;
  triggeredBy?: { chatId?: string; itemId?: string; docId?: string };
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  decisionNote?: string;
  createdAt: Date;
  reviewedAt?: Date;
};

/** Entities that participate in the comments + tag systems. The DB
 *  enforces this set via CHECK constraints on entity_comments.entity_type
 *  and entity_tags.entity_type; widening these is a schema change. */
export type EntityType = 'item' | 'doc' | 'reference' | 'runbook';

/** Superset of EntityType used by the activity feed, which has no
 *  CHECK constraint on entity_type. Guidebooks log activity but do
 *  not (yet) accept comments or shared tags. */
export type ActivityEntityType =
  | EntityType
  | 'guidebook'
  | 'guidebook_entry'
  | 'routing'
  | 'field_notes'
  | 'chat';

export type EntityComment = {
  id: string;
  entityType: EntityType;
  entityId: string;
  parentId?: string;
  body: string;
  author: 'craig' | 'claude';
  createdAt: Date;
};

export type ActivityEntry = {
  id: string;
  projectId: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  verb: string;
  target: string;
  payload?: string;
  actor: Actor;
  occurredAt: Date;
};

export type Tag = {
  id: string;
  projectId?: string;
  name: string;
  color?: string;
};

/** One row of the entity_tags join table — a tag applied to an entity.
 *  Shipped in bootstrap so the client can render and filter by shared
 *  tags without per-entity fetches. */
export type EntityTag = {
  entityType: EntityType;
  entityId: string;
  tagId: string;
};

/** A per-topic ordered collection of source references. Hosts entries
 *  that point at Docs or References already in the topic; the entry's
 *  name/description form the guidebook's scannable spine. See
 *  docs/guidebook-frd.md. */
export type Guidebook = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  /** Pinned guidebooks surface on ProjectLanding alongside pinned docs. */
  pinned: boolean;
  /** Sort order among guidebooks within the same topic. */
  rank: number;
  /** v0.5: nullable link to the crystallization this guidebook supports. */
  supportsCrystalItemId?: string;
  createdAt: Date;
  updatedAt: Date;
};

/** Discriminated source pointer — exactly one variant per entry,
 *  matching the (doc_id, reference_id) XOR enforced at the DB. */
export type GuidebookEntrySource =
  | { kind: 'doc'; docId: string }
  | { kind: 'reference'; referenceId: string };

export type GuidebookEntry = {
  id: string;
  guidebookId: string;
  source: GuidebookEntrySource;
  /** Spine-level short title. Defaults to the source's title on attach
   *  but is independently editable per entry. */
  name: string;
  description?: string;
  /** Free-text tags, per-entry only — not rows in `tags`/`entity_tags`. */
  tags: string[];
  /** Position within the guidebook (drag-to-reorder). */
  rank: number;
  createdAt: Date;
  updatedAt: Date;
};

// ─── Smart Routing (Phase 0+) ─────────────────────────────────────────

/** Where the classifier dispatched a routing. 1:1 with existing Steep
 *  artefact services — no new entity types. */
export type RoutingAction =
  | 'bench'
  | 'doc'
  | 'guidebook'
  | 'runbook'
  | 'field-notes';

/** What the dispatcher actually created or modified. Used together
 *  with `artefactId` to resolve back to the underlying row. */
export type RoutingArtefactKind =
  | 'item'
  | 'doc'
  | 'guidebook_entry'
  | 'runbook'
  | 'field_notes';

/** Phase 0 ships 'paste'; Phase 1 adds 'email'. The column already
 *  accepts both so the email transport doesn't need a fresh migration. */
export type RoutingSourceKind = 'paste' | 'email';

/** One classifier event — the raw source, what Claude said, what got
 *  created. Drives the Recently sorted strip and the activity feed. */
export type Routing = {
  id: string;
  projectId: string;
  sourceKind: RoutingSourceKind;
  /** Provenance for email (`{ sender }`); null for paste. */
  sourceMeta?: { sender?: string };
  rawContent: string;
  /** User's optional hint at dispatch time. */
  hint?: RoutingAction;
  classifier: {
    action: RoutingAction;
    /** 0–1; null when over the daily cap (no Anthropic call was made). */
    confidence?: number;
    /** One-line rationale (or downgrade reason) from the dispatcher. */
    explanation?: string;
    overAiBudget: boolean;
  };
  artefact: {
    kind: RoutingArtefactKind;
    id: string;
  };
  /** Lightweight view of the dispatch result, safe to serve over the
   *  API. Carries the section name for runbook/field-notes routings
   *  so the Recently-sorted strip can render
   *  "appended to runbook · deploy" without an extra round-trip. The
   *  full undo state (previousValue) stays server-side in
   *  routings.dispatch_snapshot. */
  dispatch?:
    | { kind: 'bench' }
    | { kind: 'doc' }
    | { kind: 'guidebook'; docId: string }
    | { kind: 'runbook'; section: string }
    | { kind: 'field-notes'; section: string };
  /** Phase 2: set when the user marks the routing as rejected via Undo. */
  rejectedAt?: Date;
  createdAt: Date;
};
