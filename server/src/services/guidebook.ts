import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import { getProjectBySlug } from './project.js';
import { notFound, validationError } from '../errors.js';
import type { Guidebook } from '../../../shared/types.js';

type GuidebookRow = {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  pinned: number;
  rank: number | null;
  supports_crystal_item_id: string | null;
  created_at: string;
  updated_at: string;
};

export const rowToGuidebook = (r: GuidebookRow): Guidebook => ({
  id: r.id,
  projectId: r.project_id,
  name: r.name,
  description: r.description ?? undefined,
  pinned: r.pinned === 1,
  rank: r.rank ?? 0,
  supportsCrystalItemId: r.supports_crystal_item_id ?? undefined,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

/** All guidebooks, across topics. Used by the activity feed / global views. */
export const listGuidebooks = (db: DB): Guidebook[] =>
  db
    .prepare<[], GuidebookRow>(
      'SELECT * FROM guidebooks ORDER BY project_id, rank, name',
    )
    .all()
    .map(rowToGuidebook);

/** Guidebooks within a topic, in user-defined order. */
export const listGuidebooksByProject = (
  db: DB,
  projectSlug: string,
): Guidebook[] => {
  const project = getProjectBySlug(db, projectSlug);
  if (!project) throw notFound('project', projectSlug);
  return db
    .prepare<[string], GuidebookRow>(
      'SELECT * FROM guidebooks WHERE project_id = ? ORDER BY rank, name',
    )
    .all(project.id)
    .map(rowToGuidebook);
};

export const getGuidebookById = (
  db: DB,
  id: string,
): Guidebook | undefined => {
  const row = db
    .prepare<[string], GuidebookRow>('SELECT * FROM guidebooks WHERE id = ?')
    .get(id);
  return row ? rowToGuidebook(row) : undefined;
};

// ─── Validation ────────────────────────────────────────────────────
const NAME_MAX = 80;
const DESCRIPTION_MAX = 280;

const validateName = (name: string, fields: Record<string, string>) => {
  if (!name) fields.name = 'required';
  else if (name.length > NAME_MAX) fields.name = 'too_long';
};

const validateDescription = (
  description: string,
  fields: Record<string, string>,
) => {
  if (description.length > DESCRIPTION_MAX) fields.description = 'too_long';
};

// ─── Create ────────────────────────────────────────────────────────
export type CreateGuidebookInput = {
  projectSlug: string;
  name: string;
  description?: string;
  pinned?: boolean;
};

/** Append-style rank: place new guidebooks at the bottom of the topic's
 *  list. The exact value isn't load-bearing — reorderGuidebooks
 *  re-stamps rank from position when the user drags. */
const nextRankForProject = (db: DB, projectId: string): number => {
  const row = db
    .prepare<[string], { max_rank: number | null }>(
      'SELECT COALESCE(MAX(rank), 0) AS max_rank FROM guidebooks WHERE project_id = ?',
    )
    .get(projectId);
  return (row?.max_rank ?? 0) + 1;
};

export const createGuidebook = (
  db: DB,
  input: CreateGuidebookInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Guidebook => {
  const name = input.name?.trim() ?? '';
  const description = input.description?.trim() ?? '';
  const fields: Record<string, string> = {};
  validateName(name, fields);
  validateDescription(description, fields);
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  const id = newId();
  const now = nowIso();
  const rank = nextRankForProject(db, project.id);

  db.prepare(
    `INSERT INTO guidebooks
     (id, project_id, name, description, pinned, rank, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    project.id,
    name,
    description || null,
    input.pinned ? 1 : 0,
    rank,
    now,
    now,
  );
  logActivity(db, {
    projectId: project.id,
    entityType: 'guidebook',
    entityId: id,
    verb: 'CREATED',
    target: `guidebook / ${name}`,
    actor,
    occurredAt: now,
  });
  return getGuidebookById(db, id)!;
};

// ─── Update ────────────────────────────────────────────────────────
export type UpdateGuidebookInput = Partial<{
  name: string;
  description: string | null;
  pinned: boolean;
}>;

export const updateGuidebook = (
  db: DB,
  id: string,
  patch: UpdateGuidebookInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Guidebook => {
  const existing = getGuidebookById(db, id);
  if (!existing) throw notFound('guidebook', id);

  // Resolve the patched values + validate.
  const fields: Record<string, string> = {};
  let nextName = existing.name;
  let nextDescription: string | null = existing.description ?? null;
  let nextPinned = existing.pinned;

  if (patch.name !== undefined) {
    nextName = patch.name.trim();
    validateName(nextName, fields);
  }
  if (patch.description !== undefined) {
    if (patch.description === null) {
      nextDescription = null;
    } else {
      const trimmed = patch.description.trim();
      validateDescription(trimmed, fields);
      nextDescription = trimmed || null;
    }
  }
  if (patch.pinned !== undefined) {
    nextPinned = patch.pinned;
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  // Detect no-op early to skip the activity log and the timestamp bump.
  const changed: string[] = [];
  if (nextName !== existing.name) changed.push('name');
  if ((nextDescription ?? null) !== (existing.description ?? null)) {
    changed.push('description');
  }
  if (nextPinned !== existing.pinned) changed.push(nextPinned ? 'pinned' : 'unpinned');
  if (changed.length === 0) return existing;

  const now = nowIso();
  db.prepare(
    `UPDATE guidebooks
     SET name = ?, description = ?, pinned = ?, updated_at = ?
     WHERE id = ?`,
  ).run(nextName, nextDescription, nextPinned ? 1 : 0, now, id);

  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'guidebook',
    entityId: id,
    verb: 'EDITED',
    target: `guidebook / ${nextName}`,
    payload: changed.join(', '),
    actor,
    occurredAt: now,
  });
  return getGuidebookById(db, id)!;
};

// ─── Reorder ───────────────────────────────────────────────────────
/** Re-stamp the rank of every guidebook in a topic by its position in
 *  the supplied list. Caller must supply every guidebook id in the
 *  topic exactly once — anything else is a 400. */
export const reorderGuidebooks = (
  db: DB,
  projectSlug: string,
  orderedIds: string[],
): Guidebook[] => {
  const project = getProjectBySlug(db, projectSlug);
  if (!project) throw notFound('project', projectSlug);
  const current = listGuidebooksByProject(db, projectSlug);

  if (orderedIds.length !== current.length) {
    throw validationError({ orderedIds: 'must_include_every_guidebook' });
  }
  const currentIds = new Set(current.map((g) => g.id));
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (!currentIds.has(id)) throw validationError({ orderedIds: 'unknown_id' });
    if (seen.has(id)) throw validationError({ orderedIds: 'duplicate_id' });
    seen.add(id);
  }

  const now = nowIso();
  const update = db.prepare(
    'UPDATE guidebooks SET rank = ?, updated_at = ? WHERE id = ?',
  );
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => {
      update.run(i + 1, now, id);
    });
  });
  tx();
  return listGuidebooksByProject(db, projectSlug);
};

// ─── Delete ────────────────────────────────────────────────────────
/** Removes a guidebook and all its entries. Never touches the source
 *  Docs/References — those stay in the topic. */
export const deleteGuidebook = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
) => {
  const existing = getGuidebookById(db, id);
  if (!existing) throw notFound('guidebook', id);

  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare('DELETE FROM guidebook_entries WHERE guidebook_id = ?').run(id);
    db.prepare('DELETE FROM guidebooks WHERE id = ?').run(id);
    logActivity(db, {
      projectId: existing.projectId,
      entityType: 'guidebook',
      entityId: id,
      verb: 'DELETED',
      target: `guidebook / ${existing.name}`,
      actor,
      occurredAt: now,
    });
  });
  tx();
};
