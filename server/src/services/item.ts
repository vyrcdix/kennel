import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import { createDoc } from './doc.js';
import { createReference } from './reference.js';
import { getProjectById } from './project.js';
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
  // v0.5 facets
  ctype: string | null;
  sources_from: string | null;     // JSON array of ids
  serves_id: string | null;
  last_surfaced_at: string | null;
  surface_count: number;
  created_at: string;
  updated_at: string;
  last_touched_at: string | null;
};

/** Defensive parse for sources_from — corrupt rows yield []. */
const parseSourcesFrom = (raw: string | null): string[] | undefined => {
  if (!raw) return undefined;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return undefined;
    return v.filter((s): s is string => typeof s === 'string');
  } catch {
    return undefined;
  }
};

const CRYSTAL_TYPES = new Set(['principle', 'quote', 'reminder', 'hint', 'memory']);

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
  ctype: r.ctype && CRYSTAL_TYPES.has(r.ctype)
    ? (r.ctype as Item['ctype'])
    : undefined,
  sourcesFrom: parseSourcesFrom(r.sources_from),
  servesId: r.serves_id ?? undefined,
  lastSurfacedAt: fromIso(r.last_surfaced_at),
  surfaceCount: r.surface_count ?? 0,
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

/** Title + body edit on an existing item. The state machine still owns
 *  transitions — this path only touches the free-text payload. */
export type UpdateItemInput = Partial<{
  title: string;
  body: string | null;
}>;

export const updateItem = (
  db: DB,
  id: string,
  patch: UpdateItemInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const existing = getItemById(db, id);
  if (!existing) throw notFound('item', id);

  let nextTitle = existing.title;
  let nextBody: string | null = existing.body ?? null;
  const fields: Record<string, string> = {};

  if (patch.title !== undefined) {
    const trimmed = patch.title.trim();
    if (!trimmed) fields.title = 'required';
    else if (trimmed.length > 500) fields.title = 'too_long';
    else nextTitle = trimmed;
  }
  if (patch.body !== undefined) {
    if (patch.body === null) {
      nextBody = null;
    } else {
      const trimmed = patch.body.trim();
      nextBody = trimmed || null;
    }
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const changed: string[] = [];
  if (nextTitle !== existing.title) changed.push('title');
  if ((nextBody ?? null) !== (existing.body ?? null)) changed.push('body');
  if (changed.length === 0) return existing;

  const now = nowIso();
  db.prepare(
    'UPDATE items SET title = ?, body = ?, updated_at = ?, last_touched_at = ? WHERE id = ?',
  ).run(nextTitle, nextBody, now, now, id);
  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'EDITED',
    target: `${existing.kind} / ${nextTitle}`,
    payload: changed.join(', '),
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
 *  flips kind→'crystallization'. v0.5: sources_from now stores as its own
 *  column; last_surfaced_at seeds to now so the resurface cadence starts
 *  from the crystallisation moment. */
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

  db.prepare(
    `UPDATE items
     SET state = 'crystallized',
         kind = CASE WHEN ? = 1 THEN 'crystallization' ELSE kind END,
         done_at = ?, updated_at = ?, last_touched_at = ?,
         sources_from = ?,
         last_surfaced_at = ?
     WHERE id = ?`,
  ).run(
    opts.promoteKind ? 1 : 0,
    now, now, now,
    sources.length > 0 ? JSON.stringify(sources) : null,
    now,
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

/** v0.5: assign / clear the crystal sub-type. Idempotent; no activity log
 *  if unchanged. Only meaningful on items whose kind is 'crystallization'
 *  or state is 'crystallized' — the application layer allows it on any
 *  item so the type can be picked before the crystallize step lands. */
export const setItemCtype = (
  db: DB,
  id: string,
  ctype: string | null,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const existing = getItemById(db, id);
  if (!existing) throw notFound('item', id);
  if (ctype !== null && !CRYSTAL_TYPES.has(ctype)) {
    throw validationError({ ctype: 'invalid' });
  }
  if ((existing.ctype ?? null) === (ctype ?? null)) return existing;

  const now = nowIso();
  db.prepare(
    'UPDATE items SET ctype = ?, updated_at = ?, last_touched_at = ? WHERE id = ?',
  ).run(ctype, now, now, id);

  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'item',
    entityId: id,
    verb: ctype ? 'TYPED' : 'UNTYPED',
    target: `crystal / ${existing.title}`,
    payload: ctype ?? undefined,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** v0.5: attach / detach an action from its "thinking." `serves_id`
 *  is the forward intent pointer (a crystal id, idea id, or a
 *  thread-anchor sentinel `thread:<project_id>`); null clears.
 *  Orthogonal to `sources_from` — actions serve, crystals draw from. */
export const setItemServes = (
  db: DB,
  id: string,
  servesId: string | null,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const existing = getItemById(db, id);
  if (!existing) throw notFound('item', id);
  if ((existing.servesId ?? null) === (servesId ?? null)) return existing;

  if (servesId !== null) {
    // Accept either a thread-anchor sentinel `thread:<id>` (where the id
    // is a real project) or a real item id. Anything else is rejected so
    // we don't silently store dangling references.
    if (servesId.startsWith('thread:')) {
      const projectId = servesId.slice('thread:'.length);
      const exists = db
        .prepare<[string], { c: number }>(
          'SELECT COUNT(*) AS c FROM projects WHERE id = ?',
        )
        .get(projectId);
      if (!exists?.c) throw validationError({ servesId: 'unknown_thread' });
    } else {
      const exists = db
        .prepare<[string], { c: number }>(
          'SELECT COUNT(*) AS c FROM items WHERE id = ?',
        )
        .get(servesId);
      if (!exists?.c) throw validationError({ servesId: 'unknown_item' });
    }
  }

  const now = nowIso();
  db.prepare(
    'UPDATE items SET serves_id = ?, updated_at = ?, last_touched_at = ? WHERE id = ?',
  ).run(servesId, now, now, id);

  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'item',
    entityId: id,
    verb: servesId ? 'ATTACHED' : 'DETACHED',
    target: `${existing.kind} / ${existing.title}`,
    payload: servesId ?? undefined,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** v0.5 resurfacing — touch / ack a crystal. Touch (default) resets
 *  `last_surfaced_at` so the resurface cadence restarts; ack also bumps
 *  `surface_count`. Touch is fired implicitly when the user opens a
 *  CrystalDetail; ack runs from the explicit "Still true" control on
 *  the Dashboard / theme-landing resurfacing slots. */
export const resurfaceCrystal = (
  db: DB,
  id: string,
  opts: { ack?: boolean } = {},
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const existing = getItemById(db, id);
  if (!existing) throw notFound('item', id);
  if (existing.kind !== 'crystallization' && existing.state !== 'crystallized') {
    throw validationError({ id: 'not_a_crystal' });
  }

  const now = nowIso();
  if (opts.ack) {
    db.prepare(
      `UPDATE items
         SET last_surfaced_at = ?,
             surface_count = surface_count + 1,
             updated_at = ?,
             last_touched_at = ?
       WHERE id = ?`,
    ).run(now, now, now, id);
  } else {
    db.prepare(
      `UPDATE items
         SET last_surfaced_at = ?,
             updated_at = ?,
             last_touched_at = ?
       WHERE id = ?`,
    ).run(now, now, now, id);
  }

  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'item',
    entityId: id,
    verb: opts.ack ? 'RESURFACED' : 'TOUCHED',
    target: `crystal / ${existing.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** Hard-delete an item row. Comments and activity rows referencing the
 *  item stay as an audit trail — they store entity_id as opaque text and
 *  don't carry FKs back here. */
export const deleteItem = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): void => {
  const existing = getItemById(db, id);
  if (!existing) throw notFound('item', id);
  const now = nowIso();
  db.prepare('DELETE FROM items WHERE id = ?').run(id);
  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'REMOVED',
    target: `${existing.kind} / ${existing.title}`,
    actor,
    occurredAt: now,
  });
};

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

const CONVERTIBLE_KINDS: ItemKind[] = [
  'idea',
  'note',
  'action',
  'ref',
  'question',
];

export type ConvertTarget = ItemKind | 'doc' | 'reference';

/** Convert an item to another shape.
 *  - Kind targets (idea/note/action/ref/question): flip `kind` and lift out of
 *    inbox to 'active'.
 *  - target='doc' / 'reference': orchestrated by `convertItemToDoc` /
 *    `convertItemToReference` below, which create the new entity and call
 *    back into this function with the link id.
 *  Same-kind targets are silent no-ops. */
export const convertItem = (
  db: DB,
  id: string,
  target: ConvertTarget,
  opts: { linkedDocId?: string; linkedReferenceId?: string } = {},
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);
  const now = nowIso();

  const finish = (sql: string, params: unknown[], suffix: string): Item => {
    db.prepare(sql).run(...params, now, now, id);
    logActivity(db, {
      projectId: item.projectId,
      entityType: 'item',
      entityId: id,
      verb: 'CONVERTED',
      target: `${item.kind} → ${suffix} / ${item.title}`,
      actor,
      occurredAt: now,
    });
    return getItemById(db, id)!;
  };

  if (target === 'doc') {
    if (!opts.linkedDocId) throw validationError({ linkedDocId: 'required' });
    return finish(
      `UPDATE items SET kind = 'doc', doc_id = ?, state = 'dismissed', updated_at = ?, last_touched_at = ? WHERE id = ?`,
      [opts.linkedDocId],
      'doc',
    );
  }

  if (target === 'reference') {
    if (!opts.linkedReferenceId)
      throw validationError({ linkedReferenceId: 'required' });
    return finish(
      `UPDATE items SET kind = 'ref', reference_id = ?, state = 'dismissed', updated_at = ?, last_touched_at = ? WHERE id = ?`,
      [opts.linkedReferenceId],
      'reference',
    );
  }

  if (!CONVERTIBLE_KINDS.includes(target)) {
    throw validationError({ target: 'unsupported_kind' });
  }
  if (item.kind === target) return item;
  const newState = item.state === 'inbox' ? 'active' : item.state;
  return finish(
    `UPDATE items SET kind = ?, state = ?, updated_at = ?, last_touched_at = ? WHERE id = ?`,
    [target, newState],
    target,
  );
};

/** Convert an item to a Doc — orchestrates createDoc + convertItem so the
 *  route and MCP tool both call one function. */
export const convertItemToDoc = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  // Wrap createDoc + convertItem in one tx — if the item UPDATE fails after
  // the doc row is inserted, we don't end up with an orphan doc.
  // createDoc's filesystem write is atomic on its own (temp + rename).
  return db.transaction((): Item => {
    const item = getItemById(db, id);
    if (!item) throw notFound('item', id);
    const project = getProjectById(db, item.projectId);
    if (!project) throw notFound('project', item.projectId);
    const doc = createDoc(
      db,
      {
        projectSlug: project.slug,
        title: item.title,
        body: item.body
          ? item.body
          : `# ${item.title}\n`,
      },
      actor,
    );
    return convertItem(db, id, 'doc', { linkedDocId: doc.id }, actor);
  })();
};

/** Convert an item to a Reference. */
export const convertItemToReference = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  return db.transaction((): Item => {
    const item = getItemById(db, id);
    if (!item) throw notFound('item', id);
    const project = getProjectById(db, item.projectId);
    if (!project) throw notFound('project', item.projectId);
    const firstToken = item.body?.trim().split(/\s/)[0];
    const looksLikeUrl = !!firstToken && /^https?:\/\//.test(firstToken);
    const reference = createReference(
      db,
      {
        projectSlug: project.slug,
        label: item.title,
        url: looksLikeUrl ? firstToken : undefined,
        notes: looksLikeUrl ? undefined : item.body ?? undefined,
      },
      actor,
    );
    return convertItem(db, id, 'reference', { linkedReferenceId: reference.id }, actor);
  })();
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
