import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import { notFound, validationError } from '../errors.js';
import type { EntityTag, EntityType, Tag } from '../../../shared/types.js';

type TagRow = {
  id: string;
  project_id: string | null;
  name: string;
  color: string | null;
  created_at: string;
};

export const rowToTag = (r: TagRow): Tag => ({
  id: r.id,
  projectId: r.project_id ?? undefined,
  name: r.name,
  color: r.color ?? undefined,
});

export const listTags = (db: DB): Tag[] =>
  db.prepare<[], TagRow>('SELECT * FROM tags ORDER BY name').all().map(rowToTag);

type EntityTagRow = {
  entity_type: EntityType;
  entity_id: string;
  tag_id: string;
};

/** Every tag assignment — shipped in bootstrap alongside the tag
 *  definitions so the client mirror can render shared tags. */
export const listEntityTags = (db: DB): EntityTag[] =>
  db
    .prepare<[], EntityTagRow>(
      'SELECT entity_type, entity_id, tag_id FROM entity_tags',
    )
    .all()
    .map((r) => ({
      entityType: r.entity_type,
      entityId: r.entity_id,
      tagId: r.tag_id,
    }));

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;

const validateTagName = (name: string): string => {
  const trimmed = name.trim().replace(/^#/, '').toLowerCase();
  if (!trimmed) throw validationError({ name: 'required' });
  if (!NAME_RE.test(trimmed) || trimmed.length > 40) {
    throw validationError({ name: 'format_invalid' });
  }
  return trimmed;
};

/** Find an existing tag by (project, name) or create one. Tags are
 *  per-project by default; pass projectId=null for a global tag. */
export const findOrCreateTag = (
  db: DB,
  name: string,
  projectId: string | null = null,
): Tag => {
  const cleaned = validateTagName(name);
  const existing = db
    .prepare<[string, string | null], TagRow>(
      `SELECT * FROM tags WHERE name = ? AND IFNULL(project_id, '') = IFNULL(?, '')`,
    )
    .get(cleaned, projectId);
  if (existing) return rowToTag(existing);
  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO tags (id, project_id, name, color, created_at) VALUES (?, ?, ?, NULL, ?)`,
  ).run(id, projectId, cleaned, now);
  return { id, projectId: projectId ?? undefined, name: cleaned };
};

/** Existence check + the project id / label the activity log needs.
 *  Logging matters beyond the trace: SSE 'activity' events are the only
 *  cache-invalidation signal clients get, so an unlogged mutation leaves
 *  every other tab/device with a stale entity_tags mirror. */
const ENTITY_LOOKUP: Record<EntityType, string> = {
  item: `SELECT project_id, kind || ' / ' || title AS label FROM items WHERE id = ?`,
  doc: `SELECT project_id, 'doc / ' || title AS label FROM docs WHERE id = ?`,
  reference: `SELECT project_id, 'reference / ' || label AS label FROM refs WHERE id = ?`,
  runbook: `SELECT project_id, 'runbook' AS label FROM runbooks WHERE id = ?`,
};

const describeEntity = (
  db: DB,
  entityType: EntityType,
  entityId: string,
): { project_id: string; label: string } => {
  const row = db
    .prepare<[string], { project_id: string; label: string }>(
      ENTITY_LOOKUP[entityType],
    )
    .get(entityId);
  if (!row) throw notFound(entityType, entityId);
  return row;
};

export const applyTag = (
  db: DB,
  entityType: EntityType,
  entityId: string,
  tagName: string,
  projectId: string | null = null,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Tag => {
  const entity = describeEntity(db, entityType, entityId);
  const tag = findOrCreateTag(db, tagName, projectId);
  const now = nowIso();
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id, created_at)
       VALUES (?, ?, ?, ?)`,
    )
    .run(entityType, entityId, tag.id, now);
  if (result.changes > 0) {
    logActivity(db, {
      projectId: entity.project_id,
      entityType,
      entityId,
      verb: 'TAGGED',
      target: entity.label,
      payload: `#${tag.name}`,
      actor,
      occurredAt: now,
    });
  }
  return tag;
};

export const removeTag = (
  db: DB,
  entityType: EntityType,
  entityId: string,
  tagId: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): void => {
  const entity = describeEntity(db, entityType, entityId);
  const tag = db
    .prepare<[string], TagRow>('SELECT * FROM tags WHERE id = ?')
    .get(tagId);
  const result = db
    .prepare(
      `DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?`,
    )
    .run(entityType, entityId, tagId);
  if (result.changes > 0) {
    logActivity(db, {
      projectId: entity.project_id,
      entityType,
      entityId,
      verb: 'UNTAGGED',
      target: entity.label,
      payload: tag ? `#${tag.name}` : undefined,
      actor,
      occurredAt: nowIso(),
    });
  }
};
