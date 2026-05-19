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

export type Actor = 'craig' | 'claude' | 'cli' | 'system';

export type ProjectColor = 'moss' | 'ember' | 'dust' | 'blaze' | 'slate';

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
  createdAt: Date;
  updatedAt: Date;
};

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
  createdAt: Date;
  updatedAt: Date;
};

export type Settings = {
  agingThresholdDays: number;
  filingPromptDays: 0 | 90 | 180;
  createdAt: Date;
  updatedAt: Date;
};

export type FieldNotes = {
  id: string;
  projectId: string;
  premise?: string;
  whatIKnow?: string;
  openQuestions?: string;
  sources?: string;
  crystallizations?: string;
  revision: number;
  createdAt: Date;
  updatedAt: Date;
};

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

export type Runbook = {
  id: string;
  projectId: string;
  /** Environment-specific URL (dev server, staging, etc.). User-entered. */
  url?: string;
  prerequisites?: string;
  setup?: string;
  run?: string;
  deploy?: string;
  troubleshoot?: string;
  notes?: string;
  revision: number;
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
  proposedBody: string;
  rationale: string;
  triggeredBy?: { chatId?: string; itemId?: string; docId?: string };
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  decisionNote?: string;
  createdAt: Date;
  reviewedAt?: Date;
};

export type EntityType = 'item' | 'doc' | 'reference' | 'runbook';

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
  entityType?: EntityType;
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
