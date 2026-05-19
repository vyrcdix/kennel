import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import type { Item, ItemKind, ItemState } from '../../../shared/types.js';

type ItemRow = {
  id: string;
  project_id: string;
  kind: ItemKind;
  state: ItemState;
  title: string;
  description: string | null;
  context: string | null;
  body: string | null;
  expected_outcome: string | null;
  due_at: string | null;
  done_at: string | null;
  archived_at: string | null;
  rank: number | null;
  doc_id: string | null;
  reference_id: string | null;
  hash: string | null;
  metadata: string | null;
  created_at: string;
  updated_at: string;
};

export const rowToItem = (r: ItemRow): Item => ({
  id: r.id,
  projectId: r.project_id,
  kind: r.kind,
  state: r.state,
  title: r.title,
  description: r.description ?? undefined,
  context: r.context ?? undefined,
  body: r.body ?? undefined,
  expectedOutcome: r.expected_outcome ?? undefined,
  dueAt: fromIso(r.due_at),
  doneAt: fromIso(r.done_at),
  archivedAt: fromIso(r.archived_at),
  rank: r.rank ?? 0,
  docId: r.doc_id ?? undefined,
  referenceId: r.reference_id ?? undefined,
  hash: r.hash ?? undefined,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listItems = (db: DB): Item[] =>
  db
    .prepare<[], ItemRow>('SELECT * FROM items ORDER BY created_at DESC')
    .all()
    .map(rowToItem);

/** Inbox items + items in `parked` state worth re-reviewing. Matches the UI's
 *  triage queue concept. Optional project filter. */
export const listQueue = (db: DB, projectId?: string): Item[] => {
  const rows = projectId
    ? db
        .prepare<[string], ItemRow>(
          `SELECT * FROM items WHERE state = 'inbox' AND project_id = ? ORDER BY created_at DESC`,
        )
        .all(projectId)
    : db
        .prepare<[], ItemRow>(
          `SELECT * FROM items WHERE state = 'inbox' ORDER BY created_at DESC`,
        )
        .all();
  return rows.map(rowToItem);
};

/** Active items, ranked by manual rank then due_at, then updated_at desc.
 *  Mirrors `query.next_up` in §8 of the data model. */
export const listNextUp = (db: DB, projectId?: string, limit = 20): Item[] => {
  const sql = `
    SELECT * FROM items
    WHERE state = 'active' ${projectId ? 'AND project_id = ?' : ''}
    ORDER BY COALESCE(rank, 9.99e9) ASC,
             COALESCE(due_at, '9999-99-99') ASC,
             updated_at DESC
    LIMIT ?`;
  const rows = projectId
    ? db.prepare<[string, number], ItemRow>(sql).all(projectId, limit)
    : db.prepare<[number], ItemRow>(sql).all(limit);
  return rows.map(rowToItem);
};

export const getItemById = (db: DB, id: string): Item | undefined => {
  const row = db.prepare<[string], ItemRow>('SELECT * FROM items WHERE id = ?').get(id);
  return row ? rowToItem(row) : undefined;
};

export type CreateItemInput = {
  projectId: string;
  kind: ItemKind;
  title: string;
  body?: string;
  dueAt?: string;
  hash?: string;
};

const KINDS: ItemKind[] = ['idea', 'note', 'action', 'doc', 'ref'];

export const createItem = (
  db: DB,
  input: CreateItemInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const fields: Record<string, string> = {};
  if (!input.projectId) fields.projectId = 'required';
  if (!input.kind || !KINDS.includes(input.kind)) fields.kind = 'invalid';
  if (!input.title?.trim()) fields.title = 'required';
  if (Object.keys(fields).length) throw validationError(fields);

  const proj = db
    .prepare<[string], { id: string }>('SELECT id FROM projects WHERE id = ?')
    .get(input.projectId);
  if (!proj) throw notFound('project', input.projectId);

  const now = nowIso();
  const id = newId();
  db.prepare(
    `INSERT INTO items
     (id, project_id, kind, state, title, body, due_at, hash,
      rank, created_at, updated_at)
     VALUES (?, ?, ?, 'inbox', ?, ?, ?, ?, NULL, ?, ?)`,
  ).run(
    id,
    input.projectId,
    input.kind,
    input.title.trim(),
    input.body ?? null,
    input.dueAt ?? null,
    input.hash ?? null,
    now,
    now,
  );
  logActivity(db, {
    projectId: input.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'CAPTURED',
    target: `${input.kind} / ${input.title.trim()}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

const TRANSITION_VERB: Record<ItemState, string> = {
  inbox: 'RESET',
  active: 'ACTIVATED',
  parked: 'PARKED',
  done: 'COMPLETED',
  archived: 'ARCHIVED',
  dismissed: 'DISMISSED',
};

export const transitionItem = (db: DB, id: string, to: ItemState): Item => {
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);
  if (item.state === to) return item;
  const now = nowIso();
  db.prepare(
    `UPDATE items
     SET state = ?,
         updated_at = ?,
         done_at = CASE WHEN ? = 'done' THEN ? ELSE done_at END,
         archived_at = CASE WHEN ? = 'archived' THEN ? ELSE archived_at END
     WHERE id = ?`,
  ).run(to, now, to, now, to, now, id);
  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: TRANSITION_VERB[to],
    target: `${item.kind} / ${item.title}`,
    actor: 'craig',
    occurredAt: now,
  });
  return getItemById(db, id)!;
};
