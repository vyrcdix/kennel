// Compass (orientation layer) — bearing services.
//
// A bearing is a forward-pointed crystal (ctype='orientation'): what you're
// moving toward. This module owns the bearing mutations; the roll-up / wake /
// horizon-derivation *reads* live in the client selectors (P2). Everything
// reuses existing machinery — crystals, serves_id, the cadence engine, the
// activity log — so net-new persistence is just the four 0016 columns.
//
// See docs/compass-build-plan.md P1.

import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { nowIso } from '../time.js';
import { getItemById, transitionItem } from './item.js';
import type { Item } from '../../../shared/types.js';

type Actor = 'craig' | 'claude' | 'cli';

const requireItem = (db: DB, id: string): Item => {
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);
  return item;
};

/** Guard: the item must already be a bearing (a forward-pointed crystal). */
const requireBearing = (db: DB, id: string): Item => {
  const item = requireItem(db, id);
  if (item.ctype !== 'orientation') throw validationError({ ctype: 'not_a_bearing' });
  return item;
};

/** Normalize an ISO date input to canonical ISO, or reject. */
const normDate = (v: string, field: string): string => {
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) throw validationError({ [field]: 'invalid_date' });
  return d.toISOString();
};

/** Validate an optional horizon pair: each may be null (cleared); when both
 *  are present the target must not precede the start. Returns the canonical
 *  pair to store. */
const resolveHorizon = (
  startAt: string | null | undefined,
  targetAt: string | null | undefined,
): { start: string | null; target: string | null } => {
  const start = startAt != null ? normDate(startAt, 'horizonStartAt') : null;
  const target = targetAt != null ? normDate(targetAt, 'horizonTargetAt') : null;
  if (start && target && new Date(target) < new Date(start)) {
    throw validationError({ horizonTargetAt: 'before_start' });
  }
  return { start, target };
};

export type SetBearingInput = {
  /** Optional finish line. Intangible bearings carry neither date. */
  horizonStartAt?: string | null;
  horizonTargetAt?: string | null;
  /** Bearing/workspace key. null = the single set rendered now. */
  persona?: string | null;
  /** Existing item ids to point at this bearing (set their serves_id), seeding
   *  the "what's built toward this" roll-up. The current-picker in the
   *  SetBearingSheet maps to this. */
  attach?: string[];
};

/** Set (or re-affirm) a bearing: promote an item into a forward-pointed crystal
 *  (ctype='orientation'). Crystallizes the item, applies an optional horizon +
 *  persona, and optionally attaches existing items to serve it. Works whether
 *  the source is a fresh capture or an existing crystal — the two SetBearingSheet
 *  entry points both land here. */
export const setBearing = (
  db: DB,
  id: string,
  input: SetBearingInput = {},
  actor: Actor = 'craig',
): Item => {
  const item = requireItem(db, id);
  const { start, target } = resolveHorizon(input.horizonStartAt, input.horizonTargetAt);

  const now = nowIso();
  db.prepare(
    `UPDATE items
       SET kind = 'crystallization',
           state = 'crystallized',
           ctype = 'orientation',
           done_at = COALESCE(done_at, ?),
           horizon_start_at = ?,
           horizon_target_at = ?,
           persona = ?,
           last_surfaced_at = COALESCE(last_surfaced_at, ?),
           updated_at = ?,
           last_touched_at = ?
     WHERE id = ?`,
  ).run(now, start, target, input.persona ?? null, now, now, now, id);

  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'BEARING SET',
    target: `bearing / ${item.title}`,
    payload: target ? 'with horizon' : undefined,
    actor,
    occurredAt: now,
  });

  // Seed the roll-up: point each attached item at the bearing.
  for (const childId of input.attach ?? []) {
    const child = getItemById(db, childId);
    if (!child) throw validationError({ attach: `unknown_item:${childId}` });
    db.prepare(
      'UPDATE items SET serves_id = ?, updated_at = ?, last_touched_at = ? WHERE id = ?',
    ).run(id, now, now, childId);
    logActivity(db, {
      projectId: child.projectId,
      entityType: 'item',
      entityId: childId,
      verb: 'ATTACHED',
      target: `${child.kind} / ${child.title}`,
      payload: id,
      actor,
      occurredAt: now,
    });
  }

  return getItemById(db, id)!;
};

/** Set or clear a bearing's horizon. Pass null for either date to clear it;
 *  pass both to set "day N / total" (derived downstream, never stored). */
export const setBearingHorizon = (
  db: DB,
  id: string,
  startAt: string | null,
  targetAt: string | null,
  actor: Actor = 'craig',
): Item => {
  const bearing = requireBearing(db, id);
  const { start, target } = resolveHorizon(startAt, targetAt);
  const now = nowIso();
  db.prepare(
    `UPDATE items
       SET horizon_start_at = ?, horizon_target_at = ?, updated_at = ?, last_touched_at = ?
     WHERE id = ?`,
  ).run(start, target, now, now, id);
  logActivity(db, {
    projectId: bearing.projectId,
    entityType: 'item',
    entityId: id,
    verb: start || target ? 'HORIZON SET' : 'HORIZON CLEARED',
    target: `bearing / ${bearing.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** "Reword" a bearing — edit the statement (and optional note). Bearings are
 *  load-bearing and rarely changed; this is the deliberate edit path from the
 *  "still about?" block. */
export const rewordBearing = (
  db: DB,
  id: string,
  input: { title?: string; description?: string | null },
  actor: Actor = 'craig',
): Item => {
  const bearing = requireBearing(db, id);

  let nextTitle = bearing.title;
  if (input.title !== undefined) {
    const trimmed = input.title.trim();
    if (!trimmed) throw validationError({ title: 'required' });
    if (trimmed.length > 500) throw validationError({ title: 'too_long' });
    nextTitle = trimmed;
  }
  const nextDesc =
    input.description === undefined
      ? (bearing.description ?? null)
      : input.description === null
        ? null
        : input.description.trim() || null;

  const changed =
    nextTitle !== bearing.title || (nextDesc ?? null) !== (bearing.description ?? null);
  if (!changed) return bearing;

  const now = nowIso();
  db.prepare(
    'UPDATE items SET title = ?, description = ?, updated_at = ?, last_touched_at = ? WHERE id = ?',
  ).run(nextTitle, nextDesc, now, now, id);
  logActivity(db, {
    projectId: bearing.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'REWORDED',
    target: `bearing / ${nextTitle}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** Turn a daily cadence into a small promise of a bearing: role='promise' +
 *  serves_id = the bearing. A promise belongs to a bearing — it requires the
 *  target to be an orientation crystal and the subject to be a cadence. */
export const promiseCadence = (
  db: DB,
  cadenceId: string,
  bearingId: string,
  actor: Actor = 'craig',
): Item => {
  const cadence = requireItem(db, cadenceId);
  if (!cadence.cadence) throw validationError({ cadence: 'not_a_cadence' });
  const bearing = requireBearing(db, bearingId);

  const now = nowIso();
  db.prepare(
    `UPDATE items
       SET role = 'promise', serves_id = ?, updated_at = ?, last_touched_at = ?
     WHERE id = ?`,
  ).run(bearingId, now, now, cadenceId);
  logActivity(db, {
    projectId: cadence.projectId,
    entityType: 'item',
    entityId: cadenceId,
    verb: 'PROMISED',
    target: `promise / ${cadence.title}`,
    payload: `to ${bearing.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, cadenceId)!;
};

/** Let a bearing set. Its promises revert to free-standing practices (the
 *  daily rhythm survives the bearing and drops back into "Do this week"); the
 *  bearing itself is filed — it leaves the active orientation set but the
 *  keepsake is preserved. Reverting runs BEFORE the file so the serves_id
 *  lookups still resolve. */
export const letGoBearing = (db: DB, id: string, actor: Actor = 'craig'): Item => {
  const bearing = requireBearing(db, id);
  const now = nowIso();

  const promises = db
    .prepare<[string], { id: string }>(
      `SELECT id FROM items WHERE serves_id = ? AND role = 'promise' AND cadence IS NOT NULL`,
    )
    .all(id);
  for (const p of promises) {
    db.prepare(
      `UPDATE items
         SET role = 'practice', serves_id = NULL, updated_at = ?, last_touched_at = ?
       WHERE id = ?`,
    ).run(now, now, p.id);
  }

  logActivity(db, {
    projectId: bearing.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'BEARING LET GO',
    target: `bearing / ${bearing.title}`,
    payload: promises.length
      ? `${promises.length} promise(s) → practice`
      : undefined,
    actor,
    occurredAt: now,
  });

  // The bearing sets — filed, preserved, out of the active orientation set.
  return transitionItem(db, id, 'filed', actor);
};
