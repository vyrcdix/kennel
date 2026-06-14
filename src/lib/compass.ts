// Compass derivation (client) — the read-side of the orientation layer.
//
// Everything here DERIVES from existing storage (the four 0016 columns + the
// activity log + serves_id), never stores. Horizon is room-remaining, never a
// countdown; the wake counts only kept days, gaps simply absent. See
// docs/compass-build-plan.md P2.

import type { Item, Project } from '../data/types';
import { windowOpen, cadenceSortCmp } from './cadence';
import {
  getCrystallizations,
  getItemsServing,
  getCadencesServing,
  getActivitySince,
  getProjects,
} from '../data/selectors';

const DAY = 86_400_000;

/** A bearing is a forward-pointed crystal (ctype='orientation'). */
export const isBearing = (it: Item): boolean => it.ctype === 'orientation';

/** The active bearings — orientation crystals not yet let-go (filed) or
 *  dismissed. `persona` is forward-insurance: omit it (the default) to get the
 *  single set rendered now; pass a value (incl. null) to scope to one persona. */
export const getBearings = (persona?: string | null): Item[] =>
  getCrystallizations()
    .filter(
      (b) =>
        isBearing(b) && b.state !== 'filed' && b.state !== 'dismissed',
    )
    .filter((b) => persona === undefined || (b.persona ?? null) === (persona ?? null))
    .sort((a, b) => (b.doneAt ?? b.updatedAt).getTime() - (a.doneAt ?? a.updatedAt).getTime());

/** Map of active bearings by id — for grouping focus items quickly. */
const bearingMap = (persona?: string | null): Map<string, Item> =>
  new Map(getBearings(persona).map((b) => [b.id, b]));

/** "What's built toward this" — the roll-up. Every live item pointed at the
 *  bearing (focus actions, cadences/promises, supporting crystals). Reuses the
 *  attach relation; already excludes filed/dismissed. */
export const getBearingBuilt = (bearingId: string): Item[] => getItemsServing(bearingId);

/** The currents under this bearing — threads that point at it
 *  (`serves_bearing_id`), assigned from within each thread. Many per bearing;
 *  ephemeral. The bearing's own storage thread is incidental, not listed here
 *  unless it has explicitly pointed back. */
export const getBearingThreads = (bearingId: string): Project[] =>
  getProjects().filter((p) => p.servesBearingId === bearingId);

/** The small promises of a bearing — daily cadences with role='promise'
 *  serving it, in cadence order (the due/warm ones first). */
export const getBearingPromises = (bearingId: string, now: Date = new Date()): Item[] =>
  getCadencesServing(bearingId)
    .filter((c) => c.role === 'promise' && c.state === 'active')
    .sort((a, b) => cadenceSortCmp(a, b, now));

/** Today's small promise — the one a bearing surfaces on the band / its card.
 *  Prefers a promise whose window is open (asking for a touch now); otherwise
 *  the warmest by cadence order. Undefined if the bearing has no promise. */
export const getBearingPromise = (
  bearingId: string,
  now: Date = new Date(),
): Item | undefined => {
  const promises = getBearingPromises(bearingId, now);
  return promises.find((p) => windowOpen(p, now)) ?? promises[0];
};

export type Horizon = {
  /** Day N of the journey (clamped to [0, total]). */
  day: number;
  /** Total span in days (start → target). */
  total: number;
  /** Room remaining — "days of water still ahead". Never negative, never a
   *  percentage, never a countdown badge. */
  ahead: number;
  startAt: Date;
  targetAt: Date;
};

/** Derive a bearing's horizon, or null for an intangible (no finish line).
 *  Requires both dates — a horizon is "day N / total" + room-remaining; a lone
 *  date can't frame that, so it reads as no clock. */
export const getHorizon = (bearing: Item, now: Date = new Date()): Horizon | null => {
  const start = bearing.horizonStartAt;
  const target = bearing.horizonTargetAt;
  if (!start || !target) return null;
  const total = Math.max(1, Math.round((target.getTime() - start.getTime()) / DAY));
  const dayRaw = Math.round((now.getTime() - start.getTime()) / DAY);
  const day = Math.min(Math.max(0, dayRaw), total);
  const ahead = Math.max(0, Math.round((target.getTime() - now.getTime()) / DAY));
  return { day, total, ahead, startAt: start, targetAt: target };
};

export type Wake = {
  /** Total kept touches across this bearing's promises (mono count). */
  kept: number;
  /** Distinct days on which something was kept (only kept days render). */
  days: number;
  /** The kept timestamps, oldest → newest (the wake's marks). */
  marks: Date[];
  firstAt?: Date;
  lastAt?: Date;
};

/** The wake — compounding evidence behind a bearing. Derived from the activity
 *  log: every KEPT event on a cadence that serves the bearing. Only kept days;
 *  missed windows leave no trace (no entry to find), so gaps are simply absent.
 *  Never a streak — a count and its marks, nothing punitive. */
export const getWake = (bearingId: string): Wake => {
  const promiseIds = new Set(getCadencesServing(bearingId).map((c) => c.id));
  if (promiseIds.size === 0) return { kept: 0, days: 0, marks: [] };
  const marks = getActivitySince(new Date(0))
    .filter((a) => a.verb === 'KEPT' && a.entityId != null && promiseIds.has(a.entityId))
    .map((a) => a.occurredAt)
    .sort((x, y) => x.getTime() - y.getTime());
  const dayKeys = new Set(marks.map((d) => d.toISOString().slice(0, 10)));
  return {
    kept: marks.length,
    days: dayKeys.size,
    marks,
    firstAt: marks[0],
    lastAt: marks[marks.length - 1],
  };
};

export type BearingGroup = { bearing: Item; items: Item[] };
export type FocusUnderBearings = { groups: BearingGroup[]; loose: Item[] };

/** Group a set of focus items under the bearing each serves — the "Under a
 *  bearing" lens (groupFocus('orient')). Items whose serves_id points at a live
 *  bearing nest under it (in bearing order); everything else falls loose
 *  ("loose in the water — not under a bearing yet"). Pure: the caller supplies
 *  the focus list, so the same lens the dashboard already builds can re-group. */
export const groupFocusUnderBearings = (
  focus: Item[],
  persona?: string | null,
): FocusUnderBearings => {
  const bearings = bearingMap(persona);
  const order = [...bearings.keys()];
  const groups = new Map<string, BearingGroup>();
  const loose: Item[] = [];
  for (const it of focus) {
    const bearing = it.servesId ? bearings.get(it.servesId) : undefined;
    if (!bearing) {
      loose.push(it);
      continue;
    }
    let g = groups.get(bearing.id);
    if (!g) {
      g = { bearing, items: [] };
      groups.set(bearing.id, g);
    }
    g.items.push(it);
  }
  return {
    groups: order.filter((id) => groups.has(id)).map((id) => groups.get(id)!),
    loose,
  };
};
