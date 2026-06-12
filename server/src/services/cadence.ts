// Cadence engine (recurring actions) — the behavioral contract the UI depends
// on (docs/cadence-build-plan.md C1, handoff/design_handoff_cadence-2 §A3).
//
// A cadence is an `action` item with a rhythm. It can only be *done* or *roll*
// — never late, never deleted, no deficit. Vitality (fresh/active/aging/
// dormant) is DERIVED elsewhere (client lib/cadence.ts) from last_done_at vs
// the interval; this module only mutates the schedule + the gentle streak.

import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { nowIso, toIso } from '../time.js';
import { getItemById } from './item.js';
import type { Cadence, Commitment, Item, Settings } from '../../../shared/types.js';

const CADENCES = new Set<Cadence>(['daily', 'weekly', 'monthly']);
const COMMITMENTS = new Set<Commitment>(['trying', 'committed', 'core']);
const FIELD_SECTIONS = new Set([
  'premise',
  'whatIKnow',
  'openQuestions',
  'sources',
  'crystallizations',
]);
const DAY = 86_400_000;
const SNOOZE_DAYS = 3;

/** Advance a date by exactly one cadence period (UTC). */
export const addWindow = (d: Date, cadence: Cadence): Date => {
  const n = new Date(d.getTime());
  if (cadence === 'daily') n.setUTCDate(n.getUTCDate() + 1);
  else if (cadence === 'weekly') n.setUTCDate(n.getUTCDate() + 7);
  else n.setUTCMonth(n.getUTCMonth() + 1);
  return n;
};

/** The next window strictly after `now` — advance from `from` by whole periods
 *  until it lands in the future. This is the no-deficit roll: skipping several
 *  windows still lands you at the next future one, never owing the missed ones. */
export const nextWindow = (from: Date, cadence: Cadence, now: Date): Date => {
  let w = addWindow(from, cadence);
  let guard = 0;
  while (w.getTime() <= now.getTime() && guard++ < 100_000) {
    w = addWindow(w, cadence);
  }
  return w;
};

/** Cooling tolerance (consecutive skipped windows) for a commitment level —
 *  the configurable A4 dial. Consumed by the aging query (C2/C4). */
export const coolingWindows = (
  commitment: Commitment,
  settings: Pick<
    Settings,
    'cadenceToleranceTrying' | 'cadenceToleranceCommitted' | 'cadenceToleranceCore'
  >,
): number => {
  if (commitment === 'core') return settings.cadenceToleranceCore;
  if (commitment === 'committed') return settings.cadenceToleranceCommitted;
  return settings.cadenceToleranceTrying;
};

const requireItem = (db: DB, id: string): Item => {
  const item = getItemById(db, id);
  if (!item) throw notFound('item', id);
  return item;
};

const requireCadence = (db: DB, id: string): Item & { cadence: Cadence } => {
  const item = requireItem(db, id);
  if (!item.cadence) throw validationError({ cadence: 'not_a_cadence' });
  return item as Item & { cadence: Cadence };
};

export type RecurInput = {
  cadence: Cadence;
  commitment: Commitment;
  resourceRefId?: string | null;
  servesId?: string | null;
  noteDefaultSection?: string | null;
};

/** Promote an action into a recurring practice: set the rhythm + dial, attach
 *  to what it serves, open the first window now (do it this window), and make
 *  it a live `active` action. */
export const recurItem = (
  db: DB,
  id: string,
  input: RecurInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const item = requireItem(db, id);
  const fields: Record<string, string> = {};
  if (!CADENCES.has(input.cadence)) fields.cadence = 'invalid';
  if (!COMMITMENTS.has(input.commitment)) fields.commitment = 'invalid';
  if (
    input.noteDefaultSection != null &&
    !FIELD_SECTIONS.has(input.noteDefaultSection)
  ) {
    fields.noteDefaultSection = 'invalid';
  }
  if (Object.keys(fields).length) throw validationError(fields);

  const now = nowIso();
  db.prepare(
    `UPDATE items
     SET kind = 'action',
         state = 'active',
         cadence = ?,
         commitment = ?,
         window_opens_at = ?,
         resource_ref_id = ?,
         serves_id = COALESCE(?, serves_id),
         note_default_section = ?,
         updated_at = ?,
         last_touched_at = ?
     WHERE id = ?`,
  ).run(
    input.cadence,
    input.commitment,
    now,
    input.resourceRefId ?? null,
    input.servesId ?? null,
    input.noteDefaultSection ?? null,
    now,
    now,
    id,
  );
  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'RECURRED',
    target: `${input.cadence} action / ${item.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** "Did it" — log the contact, roll to the next window, bump the streak. Never
 *  completes or deletes; the action returns next window. */
export const didCadence = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Item => {
  const item = requireCadence(db, id);
  const now = nowIso();
  const nowD = new Date(now);
  const win = nextWindow(item.windowOpensAt ?? nowD, item.cadence, nowD);
  db.prepare(
    `UPDATE items
     SET last_done_at = ?,
         window_opens_at = ?,
         kept_count = kept_count + 1,
         updated_at = ?,
         last_touched_at = ?
     WHERE id = ?`,
  ).run(now, toIso(win), now, now, id);
  logActivity(db, {
    projectId: item.projectId,
    entityType: 'item',
    entityId: id,
    verb: 'KEPT',
    target: `${item.cadence} action / ${item.title}`,
    actor,
    occurredAt: now,
  });
  return getItemById(db, id)!;
};

/** Skip this window — roll to the next, guilt-free: no streak change, no
 *  deficit recorded. */
export const skipCadence = (db: DB, id: string): Item => {
  const item = requireCadence(db, id);
  const now = nowIso();
  const nowD = new Date(now);
  const win = nextWindow(item.windowOpensAt ?? nowD, item.cadence, nowD);
  db.prepare(
    `UPDATE items SET window_opens_at = ?, updated_at = ?, last_touched_at = ? WHERE id = ?`,
  ).run(toIso(win), now, now, id);
  return getItemById(db, id)!;
};

/** Snooze — bump a few days, but stay inside the current window (never advance
 *  the cadence past the next boundary). */
export const snoozeCadence = (db: DB, id: string): Item => {
  const item = requireCadence(db, id);
  const now = nowIso();
  const nowD = new Date(now);
  const boundary = nextWindow(item.windowOpensAt ?? nowD, item.cadence, nowD);
  const naive = nowD.getTime() + SNOOZE_DAYS * DAY;
  // Keep strictly inside the current window.
  const snoozed = new Date(Math.min(naive, boundary.getTime() - 1));
  db.prepare(
    `UPDATE items SET window_opens_at = ?, updated_at = ?, last_touched_at = ? WHERE id = ?`,
  ).run(toIso(snoozed), now, now, id);
  return getItemById(db, id)!;
};

/** Re-commit (divergence) — keep the declared level, freshen the vitality so it
 *  reads warm again. Clears the divergence (which is derived). */
export const recommitCadence = (db: DB, id: string): Item => {
  requireCadence(db, id); // guard
  const now = nowIso();
  db.prepare(
    `UPDATE items SET last_done_at = ?, window_opens_at = ?, updated_at = ?, last_touched_at = ? WHERE id = ?`,
  ).run(now, now, now, now, id);
  return getItemById(db, id)!;
};

/** Set the commitment dial (RecurModal edits, and "Ease off → trying it"). */
export const setCommitment = (db: DB, id: string, commitment: string): Item => {
  requireCadence(db, id); // guard: 404 if missing, 400 if not a cadence
  if (!COMMITMENTS.has(commitment as Commitment)) {
    throw validationError({ commitment: 'invalid' });
  }
  const now = nowIso();
  db.prepare(
    `UPDATE items SET commitment = ?, updated_at = ?, last_touched_at = ? WHERE id = ?`,
  ).run(commitment, now, now, id);
  return getItemById(db, id)!;
};
