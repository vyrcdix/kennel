import type { DB } from '../db.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import { notFound, validationError } from '../errors.js';
import type { EntityType, Tag } from '../../../shared/types.js';

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

const ENTITY_TABLE: Record<EntityType, string> = {
  item: 'items',
  doc: 'docs',
  reference: 'refs',
  runbook: 'runbooks',
};

const ensureEntityExists = (db: DB, entityType: EntityType, entityId: string) => {
  const row = db
    .prepare<[string], { id: string }>(
      `SELECT id FROM ${ENTITY_TABLE[entityType]} WHERE id = ?`,
    )
    .get(entityId);
  if (!row) throw notFound(entityType, entityId);
};

export const applyTag = (
  db: DB,
  entityType: EntityType,
  entityId: string,
  tagName: string,
  projectId: string | null = null,
): Tag => {
  ensureEntityExists(db, entityType, entityId);
  const tag = findOrCreateTag(db, tagName, projectId);
  db.prepare(
    `INSERT OR IGNORE INTO entity_tags (entity_type, entity_id, tag_id, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(entityType, entityId, tag.id, nowIso());
  return tag;
};

export const removeTag = (
  db: DB,
  entityType: EntityType,
  entityId: string,
  tagId: string,
): void => {
  ensureEntityExists(db, entityType, entityId);
  db.prepare(
    `DELETE FROM entity_tags WHERE entity_type = ? AND entity_id = ? AND tag_id = ?`,
  ).run(entityType, entityId, tagId);
};
