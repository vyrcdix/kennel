import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { ensureProjectDirs, removeProjectDir } from '../content.js';
import { notFound, slugConflict, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { nowIso, toIso, fromIso } from '../time.js';
import type {
  Project,
  ProjectColor,
  ProjectStatus,
} from '../../../shared/types.js';

type ProjectRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  context: string | null;
  status: ProjectStatus;
  pinned: number;
  rank: number | null;
  color: ProjectColor | null;
  next_steps_dismissed: number;
  serves_bearing_id: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

const rowToProject = (r: ProjectRow): Project => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  description: r.description ?? '',
  context: r.context ?? undefined,
  status: r.status,
  pinned: r.pinned === 1,
  rank: r.rank ?? 0,
  color: r.color ?? undefined,
  nextStepsDismissed: r.next_steps_dismissed === 1,
  servesBearingId: r.serves_bearing_id ?? undefined,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

const NAME_MAX = 80;
const DESCRIPTION_MAX = 140;
const CONTEXT_MAX = 8000;
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export type CreateProjectInput = {
  name: string;
  slug?: string;
  description?: string;
  context?: string;
  color?: ProjectColor | null;
  pinned?: boolean;
};

const deriveSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

export const listProjects = (db: DB): Project[] =>
  db
    .prepare<[], ProjectRow>('SELECT * FROM projects ORDER BY rank, name')
    .all()
    .map(rowToProject);

export const getProjectById = (db: DB, id: string): Project | undefined => {
  const row = db
    .prepare<[string], ProjectRow>('SELECT * FROM projects WHERE id = ?')
    .get(id);
  return row ? rowToProject(row) : undefined;
};

export const getProjectBySlug = (db: DB, slug: string): Project | undefined => {
  const row = db
    .prepare<[string], ProjectRow>('SELECT * FROM projects WHERE slug = ?')
    .get(slug);
  return row ? rowToProject(row) : undefined;
};

export const createProject = (
  db: DB,
  input: CreateProjectInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Project => {
  const name = input.name?.trim() ?? '';
  const slug = (input.slug?.trim() || deriveSlug(name));
  const description = input.description?.trim() ?? '';
  const context = input.context?.trim() ?? '';

  const fields: Record<string, string> = {};
  if (!name) fields.name = 'required';
  else if (name.length > NAME_MAX) fields.name = 'too_long';
  if (!slug) fields.slug = 'required';
  else if (!SLUG_RE.test(slug) || slug.length > 40) fields.slug = 'format_invalid';
  if (description.length > DESCRIPTION_MAX) fields.description = 'too_long';
  if (context.length > CONTEXT_MAX) fields.context = 'too_long';
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const existing = db
    .prepare<[string], { id: string; name: string }>(
      'SELECT id, name FROM projects WHERE slug = ?',
    )
    .get(slug);
  if (existing) throw slugConflict(existing);

  const now = nowIso();
  const id = newId();
  const project: Project = {
    id,
    slug,
    name,
    description,
    context: context || undefined,
    status: 'active',
    pinned: input.pinned ?? false,
    rank: 0,
    color: input.color ?? undefined,
    nextStepsDismissed: false,
    createdAt: new Date(now),
    updatedAt: new Date(now),
  };

  // Filesystem + DB atomic via tx + rollback of created directory on failure
  let dirCreated = false;
  try {
    ensureProjectDirs(slug);
    dirCreated = true;
    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO projects
         (id, slug, name, description, context, status, pinned, rank, color,
          next_steps_dismissed, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, 0, ?, ?)`,
      ).run(
        id,
        slug,
        name,
        description || null,
        context || null,
        'active',
        project.pinned ? 1 : 0,
        project.color ?? null,
        now,
        now,
      );
      logActivity(db, {
        projectId: id,
        verb: 'CREATED',
        target: `project / ${name}`,
        actor,
        occurredAt: now,
      });
    });
    tx();
  } catch (err) {
    if (dirCreated) removeProjectDir(slug);
    throw err;
  }

  return project;
};

export type UpdateProjectPatch = {
  name?: string;
  description?: string;
  context?: string | null;
  color?: ProjectColor | null;
  pinned?: boolean;
  status?: ProjectStatus;
};

export const updateProject = (
  db: DB,
  slug: string,
  patch: UpdateProjectPatch,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Project => {
  const existing = getProjectBySlug(db, slug);
  if (!existing) throw notFound('project', slug);

  const fields: Record<string, string> = {};
  const name = patch.name?.trim();
  if (patch.name !== undefined) {
    if (!name) fields.name = 'required';
    else if (name.length > NAME_MAX) fields.name = 'too_long';
  }
  const description =
    patch.description !== undefined ? patch.description.trim() : undefined;
  if (description !== undefined && description.length > DESCRIPTION_MAX) {
    fields.description = 'too_long';
  }
  const context =
    patch.context === null ? null : patch.context?.trim();
  if (typeof context === 'string' && context.length > CONTEXT_MAX) {
    fields.context = 'too_long';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const next: Project = {
    ...existing,
    name: name ?? existing.name,
    description: description ?? existing.description,
    context:
      patch.context === null
        ? undefined
        : context !== undefined
        ? context || undefined
        : existing.context,
    color:
      patch.color === null
        ? undefined
        : patch.color !== undefined
        ? patch.color
        : existing.color,
    pinned: patch.pinned ?? existing.pinned,
    status: patch.status ?? existing.status,
    updatedAt: new Date(),
  };
  const now = next.updatedAt.toISOString();

  db.prepare(
    `UPDATE projects
     SET name = ?, description = ?, context = ?, color = ?, pinned = ?,
         status = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    next.name,
    next.description || null,
    next.context ?? null,
    next.color ?? null,
    next.pinned ? 1 : 0,
    next.status,
    now,
    existing.id,
  );

  const changedKeys = Object.entries(patch)
    .filter(([, v]) => v !== undefined)
    .map(([k]) => k);
  logActivity(db, {
    projectId: existing.id,
    verb: 'EDITED',
    target: `project / ${next.name}`,
    payload: changedKeys.length > 0 ? `fields: ${changedKeys.join(', ')}` : undefined,
    actor,
    occurredAt: now,
  });
  return next;
};

export const dismissNextSteps = (db: DB, projectId: string): Project => {
  const project = getProjectById(db, projectId);
  if (!project) throw notFound('project', projectId);
  if (project.nextStepsDismissed) return project;
  const now = nowIso();
  db.prepare(
    'UPDATE projects SET next_steps_dismissed = 1, updated_at = ? WHERE id = ?',
  ).run(now, projectId);
  return { ...project, nextStepsDismissed: true, updatedAt: new Date(now) };
};

export type CloseOutResult = {
  project: Project;
  archivedItemCount: number;
};

/** Archive a project plus any items still in `done` state. Single transaction.
 *  Per §6.1 of the brief: "Archive project plus its done items in one tx." */
export const closeOutProject = (
  db: DB,
  slug: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): CloseOutResult => {
  const project = getProjectBySlug(db, slug);
  if (!project) throw notFound('project', slug);
  if (project.status === 'archived') return { project, archivedItemCount: 0 };

  const now = nowIso();
  let archivedItemCount = 0;
  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `UPDATE items
         SET state = 'archived', archived_at = ?, updated_at = ?
         WHERE project_id = ? AND state = 'done'`,
      )
      .run(now, now, project.id);
    archivedItemCount = result.changes;
    db.prepare('UPDATE projects SET status = ?, updated_at = ? WHERE id = ?').run(
      'archived',
      now,
      project.id,
    );
    logActivity(db, {
      projectId: project.id,
      verb: 'CLOSED OUT',
      target: `project / ${project.name}`,
      payload: archivedItemCount > 0 ? `${archivedItemCount} items archived` : undefined,
      actor,
      occurredAt: now,
    });
  });
  tx();
  return {
    project: { ...project, status: 'archived', updatedAt: new Date(now) },
    archivedItemCount,
  };
};

export const togglePin = (db: DB, projectId: string): Project => {
  const project = getProjectById(db, projectId);
  if (!project) throw notFound('project', projectId);
  const now = nowIso();
  const next = !project.pinned;
  db.prepare(
    'UPDATE projects SET pinned = ?, updated_at = ? WHERE id = ?',
  ).run(next ? 1 : 0, now, projectId);
  return { ...project, pinned: next, updatedAt: new Date(now) };
};

/** Compass: point a current at the bearing it's under (or clear with null).
 *  The bearing must be an orientation crystal. A bearing gathers many currents
 *  this way — the inverse of the 1:1 binding the storage project_id implies. */
export const setProjectBearing = (
  db: DB,
  projectId: string,
  bearingId: string | null,
): Project => {
  const project = getProjectById(db, projectId);
  if (!project) throw notFound('project', projectId);
  if (bearingId !== null) {
    const b = db
      .prepare<[string], { ctype: string | null }>(
        'SELECT ctype FROM items WHERE id = ?',
      )
      .get(bearingId);
    if (!b) throw validationError({ bearingId: 'unknown_item' });
    if (b.ctype !== 'orientation') throw validationError({ bearingId: 'not_a_bearing' });
  }
  if ((project.servesBearingId ?? null) === (bearingId ?? null)) return project;

  const now = nowIso();
  db.prepare(
    'UPDATE projects SET serves_bearing_id = ?, updated_at = ? WHERE id = ?',
  ).run(bearingId, now, projectId);
  // Lightweight relation toggle — no activity log (mirrors togglePin).
  return { ...project, servesBearingId: bearingId ?? undefined, updatedAt: new Date(now) };
};

export { toIso, fromIso, deriveSlug };
