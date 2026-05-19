import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import { getProjectBySlug } from './project.js';
import type { Reference } from '../../../shared/types.js';

type RefRow = {
  id: string;
  project_id: string;
  type: string;
  label: string;
  description: string | null;
  context: string | null;
  url: string | null;
  notes: string | null;
  metadata: string | null;
  last_checked_at: string | null;
  created_at: string;
  updated_at: string;
};

export const rowToRef = (r: RefRow): Reference => ({
  id: r.id,
  projectId: r.project_id,
  type: r.type,
  label: r.label,
  description: r.description ?? undefined,
  url: r.url ?? undefined,
  notes: r.notes ?? undefined,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listRefs = (db: DB): Reference[] =>
  db
    .prepare<[], RefRow>('SELECT * FROM refs ORDER BY updated_at DESC')
    .all()
    .map(rowToRef);

export const getRefById = (db: DB, id: string): Reference | undefined => {
  const row = db.prepare<[string], RefRow>('SELECT * FROM refs WHERE id = ?').get(id);
  return row ? rowToRef(row) : undefined;
};

export type CreateReferenceInput = {
  projectSlug: string;
  type?: string;
  label: string;
  url?: string;
  notes?: string;
  description?: string;
};

const LABEL_MAX = 200;

export const createReference = (
  db: DB,
  input: CreateReferenceInput,
  actor: 'craig' | 'claude' | 'cli' = 'claude',
): Reference => {
  const label = input.label?.trim() ?? '';
  if (!label) throw validationError({ label: 'required' });
  if (label.length > LABEL_MAX) throw validationError({ label: 'too_long' });
  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  const id = newId();
  const now = nowIso();
  const type = (input.type ?? 'link').trim() || 'link';
  db.prepare(
    `INSERT INTO refs
     (id, project_id, type, label, description, url, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    project.id,
    type,
    label,
    input.description?.trim() || null,
    input.url?.trim() || null,
    input.notes?.trim() || null,
    now,
    now,
  );
  logActivity(db, {
    projectId: project.id,
    entityType: 'reference',
    entityId: id,
    verb: 'CREATED',
    target: `reference / ${label}`,
    payload: input.url,
    actor,
    occurredAt: now,
  });
  return getRefById(db, id)!;
};
