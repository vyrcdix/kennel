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
  last_touched_at: string | null;
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
  lastTouchedAt: fromIso(r.last_touched_at),
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listItems = (db: DB): Item[] =>
  db
    .prepare<[], ItemRow>('SELECT * FROM items ORDER BY created_at DESC')
    .all()
    .map(rowToItem);

/** Inbox items worth sorting. Optional project filter. */
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

/** Active items, ordered by recency of touch then manual rank.
 *  v0.3 swap: was due_at-driven; now last-touched-driven. */
export const listNextUp = (db: DB, projectId?: string, limit = 20): Item[] => {
  const sql = `
    SELECT * FROM items
    WHERE state = 'active' ${projectId ? 'AND project_id = ?' : ''}
    ORDER BY COALESCE(last_touched_at, updated_at) DESC,
             COALESCE(rank, 9.99e9) ASC
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

const KINDS: ItemKind[] = [
  'idea', 'note', 'action', 'doc', 'ref', 'question', 'crystallization',
];

/** Translate legacy v0.1 state strings into v0.3. Quiet — old chats and
 *  stored prompts that say 'parked' / 'done' / 'archived' keep working. */
const STATE_ALIASES: Record<string, ItemState> = {
  parked: 'reflecting',
  done: 'crystallized',
  archived: 'filed',
};

const VALID_STATES: ReadonlySet<ItemState> = new Set([
  'inbox', 'active', 'reflecting', 'crystallized', 'filed', 'dismissed',
]);

export const normalizeState = (input: string): ItemState => {
  const aliased = STATE_ALIASES[input] ?? (input as ItemState);
  if (!VALID_STATES.has(aliased)) {
    throw validationError({ state: 'invalid' });
  }
  return aliased;
};

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
      rank, created_at, updated_at, last_touched_at)
     VALUES (?, ?, ?, 'inbox', ?, ?, ?, ?, NULL, ?, ?, ?)`,
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
  active: 'PICKED UP',
  reflecting: 'SET ASIDE',
  crystallized: 'CRYSTALLIZED',
  filed: 'FILED',
  dismissed: 'LET GO',
};

export const transitionItem = (
  db: DB,
  id: string,
  rawTo: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const to = normalizeState(rawTo);
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);
  if (item.state === to) return item;
  const now = nowIso();
  db.prepare(
    `UPDATE items
     SET state = ?,
         updated_at = ?,
         last_touched_at = ?,
         done_at = CASE WHEN ? = 'crystallized' THEN ? ELSE done_at END,
         archived_at = CASE WHEN ? = 'filed' THEN ? ELSE archived_at END
     WHERE id = ?`,
  ).run(to, now, now, to, now, to, now, id);
  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: TRANSITION_VERB[to],
    target: `${item.kind} / ${item.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** Cheap touch: bumps last_touched_at, doesn't change updated_at, doesn't
 *  log activity. Used by Aging-board "Pick up" without state change. */
export const touchItem = (db: DB, id: string): void => {
  const result = db
    .prepare('UPDATE items SET last_touched_at = ? WHERE id = ?')
    .run(nowIso(), id);
  if (result.changes === 0) throw notFound('item', id);
};

/** Promote an item to a crystallization. Sets state=crystallized; optionally
 *  flips kind→'crystallization'. Records sources_from in metadata so the
 *  lineage ("from N items, M chats") can be shown on the panel. */
export const crystallizeItem = (
  db: DB,
  id: string,
  opts: { promoteKind?: boolean; sourcesFrom?: string[] } = {},
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);

  const now = nowIso();
  const sources = opts.sourcesFrom ?? [];
  const meta = JSON.stringify({
    ...(item.body ? {} : {}),
    sources_from: sources,
  });

  db.prepare(
    `UPDATE items
     SET state = 'crystallized',
         kind = CASE WHEN ? = 1 THEN 'crystallization' ELSE kind END,
         done_at = ?, updated_at = ?, last_touched_at = ?,
         metadata = ?
     WHERE id = ?`,
  ).run(
    opts.promoteKind ? 1 : 0,
    now, now, now,
    meta,
    id,
  );

  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'CRYSTALLIZED',
    target: `${opts.promoteKind ? 'crystallization' : item.kind} / ${item.title}`,
    payload: sources.length > 0 ? `from ${sources.length} sources` : undefined,
    actor,
    occurredAt: now,
  });

  return getItemById(db, id)!;
};

/** Soft archive ("File"). Distinct from `transition_item({to:'filed'})` only
 *  in that it has a dedicated endpoint and tool — the data effect is the same. */
export const fileItem = (db: DB, id: string, actor: 'craig' | 'claude' | 'cli' = 'craig'): Item =>
  transitionItem(db, id, 'filed', actor);

/** Items in any non-terminal state that haven't been touched in `thresholdDays`. */
export const listAging = (db: DB, thresholdDays: number, projectId?: string): Item[] => {
  const cutoff = new Date(Date.now() - thresholdDays * 86400_000).toISOString();
  const sql = `
    SELECT * FROM items
    WHERE state NOT IN ('filed','dismissed','inbox')
      AND COALESCE(last_touched_at, updated_at) < ?
      ${projectId ? 'AND project_id = ?' : ''}
    ORDER BY COALESCE(last_touched_at, updated_at) ASC`;
  const rows = projectId
    ? db.prepare<[string, string], ItemRow>(sql).all(cutoff, projectId)
    : db.prepare<[string], ItemRow>(sql).all(cutoff);
  return rows.map(rowToItem);
};

/** Items that are either kind=crystallization OR state=crystallized. */
export const listCrystallizations = (db: DB, projectId?: string): Item[] => {
  const sql = `
    SELECT * FROM items
    WHERE (kind = 'crystallization' OR state = 'crystallized')
      ${projectId ? 'AND project_id = ?' : ''}
    ORDER BY done_at DESC, updated_at DESC`;
  const rows = projectId
    ? db.prepare<[string], ItemRow>(sql).all(projectId)
    : db.prepare<[], ItemRow>(sql).all();
  return rows.map(rowToItem);
};
