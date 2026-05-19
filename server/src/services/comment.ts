import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import type { EntityComment, EntityType } from '../../../shared/types.js';

type CommentRow = {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  parent_id: string | null;
  body: string;
  author: 'craig' | 'claude';
  created_at: string;
};

export const rowToComment = (r: CommentRow): EntityComment => ({
  id: r.id,
  entityType: r.entity_type,
  entityId: r.entity_id,
  parentId: r.parent_id ?? undefined,
  body: r.body,
  author: r.author,
  createdAt: fromIso(r.created_at)!,
});

export const listComments = (db: DB): EntityComment[] =>
  db
    .prepare<[], CommentRow>('SELECT * FROM entity_comments ORDER BY created_at')
    .all()
    .map(rowToComment);

export const addComment = (
  db: DB,
  entityType: EntityType,
  entityId: string,
  body: string,
  author: 'craig' | 'claude' = 'craig',
): EntityComment => {
  const trimmed = body.trim();
  if (!trimmed) throw validationError({ body: 'required' });

  // Surface project id for the activity log if the parent is a doc / item / runbook
  let projectId: string | undefined;
  let targetLabel = `${entityType} / ${entityId}`;
  if (entityType === 'doc') {
    const doc = db
      .prepare<[string], { project_id: string; title: string }>(
        'SELECT project_id, title FROM docs WHERE id = ?',
      )
      .get(entityId);
    if (!doc) throw notFound('doc', entityId);
    projectId = doc.project_id;
    targetLabel = `doc / ${doc.title}`;
  } else if (entityType === 'item') {
    const item = db
      .prepare<[string], { project_id: string; title: string; kind: string }>(
        'SELECT project_id, title, kind FROM items WHERE id = ?',
      )
      .get(entityId);
    if (!item) throw notFound('item', entityId);
    projectId = item.project_id;
    targetLabel = `${item.kind} / ${item.title}`;
  } else if (entityType === 'reference') {
    const ref = db
      .prepare<[string], { project_id: string; label: string }>(
        'SELECT project_id, label FROM refs WHERE id = ?',
      )
      .get(entityId);
    if (!ref) throw notFound('reference', entityId);
    projectId = ref.project_id;
    targetLabel = `reference / ${ref.label}`;
  } else if (entityType === 'runbook') {
    const rb = db
      .prepare<[string], { project_id: string }>(
        'SELECT project_id FROM runbooks WHERE id = ?',
      )
      .get(entityId);
    if (!rb) throw notFound('runbook', entityId);
    projectId = rb.project_id;
    targetLabel = 'runbook';
  }

  const now = nowIso();
  const id = newId();
  db.prepare(
    `INSERT INTO entity_comments
     (id, entity_type, entity_id, parent_id, body, author, created_at)
     VALUES (?, ?, ?, NULL, ?, ?, ?)`,
  ).run(id, entityType, entityId, trimmed, author, now);
  if (projectId) {
    logActivity(db, {
      projectId,
      entityType,
      entityId,
      verb: 'COMMENTED',
      target: targetLabel,
      payload: `"${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}"`,
      actor: author,
      occurredAt: now,
    });
  }
  return {
    id,
    entityType,
    entityId,
    body: trimmed,
    author,
    createdAt: new Date(now),
  };
};
