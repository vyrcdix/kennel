import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  getBearings,
  getBearingBuilt,
  getBearingPromise,
  getHorizon,
  getWake,
  groupFocusUnderBearings,
  isBearing,
} from './compass';
import { items, activity } from '../data/fixtures';
import type { ActivityEntry, Item } from '../data/types';

const NOW = new Date('2026-06-12T00:00:00Z');

let n = 0;
const mk = (over: Partial<Item>): Item =>
  ({
    id: `i${n++}`,
    projectId: 'p',
    kind: 'action',
    state: 'active',
    title: 't',
    rank: 0,
    surfaceCount: 0,
    keptCount: 0,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  }) as Item;

const bearing = (over: Partial<Item> = {}): Item =>
  mk({
    kind: 'crystallization',
    state: 'crystallized',
    ctype: 'orientation',
    title: 'See more of the world',
    doneAt: new Date('2026-06-01T00:00:00Z'),
    ...over,
  });

const promise = (bearingId: string, over: Partial<Item> = {}): Item =>
  mk({
    kind: 'action',
    cadence: 'daily',
    commitment: 'trying',
    role: 'promise',
    servesId: bearingId,
    windowOpensAt: new Date('2026-06-11T00:00:00Z'),
    ...over,
  });

const kept = (entityId: string, occurredAt: Date): ActivityEntry =>
  ({
    id: `a${n++}`,
    projectId: 'p',
    entityId,
    verb: 'KEPT',
    target: 'x',
    actor: 'craig',
    occurredAt,
  }) as ActivityEntry;

beforeEach(() => {
  items.length = 0;
  activity.length = 0;
});
afterEach(() => {
  items.length = 0;
  activity.length = 0;
});

describe('getBearings', () => {
  test('returns orientation crystals, excludes filed (let-go) and non-bearings', () => {
    const b = bearing();
    items.push(b);
    items.push(bearing({ state: 'filed' })); // let-go
    items.push(mk({ kind: 'crystallization', state: 'crystallized', ctype: 'principle' }));
    const got = getBearings();
    expect(got.map((x) => x.id)).toEqual([b.id]);
    expect(isBearing(got[0])).toBe(true);
  });

  test('persona filter is opt-in (omitted = the single set)', () => {
    items.push(bearing({ persona: 'life' }));
    items.push(bearing({ persona: 'work' }));
    expect(getBearings()).toHaveLength(2); // omitted → all
    expect(getBearings('life')).toHaveLength(1);
    expect(getBearings(null)).toHaveLength(0); // none are null-persona
  });
});

describe('getHorizon', () => {
  test('derives day / total / room-remaining', () => {
    const b = bearing({
      horizonStartAt: new Date('2026-01-01T00:00:00Z'),
      horizonTargetAt: new Date('2027-01-01T00:00:00Z'), // 365 days
    });
    const h = getHorizon(b, NOW)!;
    expect(h.total).toBe(365);
    expect(h.day).toBe(162); // Jan 1 → Jun 12
    expect(h.ahead).toBe(203); // room remaining, never negative
    expect(h.day + h.ahead).toBe(h.total);
  });

  test('intangible (no finish line) has no clock', () => {
    expect(getHorizon(bearing(), NOW)).toBeNull();
    expect(getHorizon(bearing({ horizonStartAt: NOW }), NOW)).toBeNull(); // lone date
  });

  test('clamps past the target — never a negative countdown', () => {
    const b = bearing({
      horizonStartAt: new Date('2026-01-01T00:00:00Z'),
      horizonTargetAt: new Date('2026-03-01T00:00:00Z'), // already passed by NOW
    });
    const h = getHorizon(b, NOW)!;
    expect(h.ahead).toBe(0);
    expect(h.day).toBe(h.total); // clamped
  });
});

describe('getBearingBuilt / getBearingPromise', () => {
  test('roll-up lists live items serving the bearing', () => {
    const b = bearing();
    items.push(b);
    const a1 = mk({ servesId: b.id, title: 'book flights' });
    const a2 = mk({ servesId: b.id, state: 'filed', title: 'old' }); // excluded
    items.push(a1, a2);
    expect(getBearingBuilt(b.id).map((x) => x.id)).toEqual([a1.id]);
  });

  test('today’s promise prefers an open window', () => {
    const b = bearing();
    items.push(b);
    const closed = promise(b.id, { windowOpensAt: new Date('2026-07-01T00:00:00Z') });
    const open = promise(b.id, { windowOpensAt: new Date('2026-06-10T00:00:00Z') });
    items.push(closed, open);
    expect(getBearingPromise(b.id, NOW)!.id).toBe(open.id);
  });

  test('a bearing with no promise yields undefined', () => {
    const b = bearing();
    items.push(b);
    expect(getBearingPromise(b.id, NOW)).toBeUndefined();
  });
});

describe('getWake', () => {
  test('counts kept touches + distinct kept days; gaps leave no trace', () => {
    const b = bearing();
    const p = promise(b.id);
    items.push(b, p);
    // two keeps on one day, one on another → 3 kept across 2 days
    activity.push(kept(p.id, new Date('2026-06-10T08:00:00Z')));
    activity.push(kept(p.id, new Date('2026-06-10T20:00:00Z')));
    activity.push(kept(p.id, new Date('2026-06-12T09:00:00Z')));
    // a KEPT on some unrelated cadence is ignored
    activity.push(kept('other-cadence', new Date('2026-06-11T09:00:00Z')));
    const w = getWake(b.id);
    expect(w.kept).toBe(3);
    expect(w.days).toBe(2);
    expect(w.firstAt?.toISOString()).toBe('2026-06-10T08:00:00.000Z');
    expect(w.lastAt?.toISOString()).toBe('2026-06-12T09:00:00.000Z');
  });

  test('a bearing with no promises has an empty wake', () => {
    const b = bearing();
    items.push(b);
    expect(getWake(b.id)).toEqual({ kept: 0, days: 0, marks: [] });
  });
});

describe('groupFocusUnderBearings', () => {
  test('nests items under the bearing they serve; the rest fall loose', () => {
    const world = bearing({ title: 'See more of the world', doneAt: new Date('2026-06-02T00:00:00Z') });
    const chicago = bearing({ title: 'Run Chicago', doneAt: new Date('2026-06-01T00:00:00Z') });
    items.push(world, chicago);

    const japan = mk({ servesId: world.id, title: 'plan Japan' });
    const marathon = mk({ servesId: chicago.id, title: 'long run' });
    const dishwasher = mk({ title: 'fix dishwasher' }); // serves nothing → loose
    const orphanServe = mk({ servesId: 'not-a-bearing', title: 'serves a plain item' }); // loose

    const { groups, loose } = groupFocusUnderBearings([
      japan,
      marathon,
      dishwasher,
      orphanServe,
    ]);

    // groups follow bearing order (newest bearing first → world before chicago)
    expect(groups.map((g) => g.bearing.id)).toEqual([world.id, chicago.id]);
    expect(groups[0].items.map((i) => i.id)).toEqual([japan.id]);
    expect(groups[1].items.map((i) => i.id)).toEqual([marathon.id]);
    expect(loose.map((i) => i.id)).toEqual([dishwasher.id, orphanServe.id]);
  });
});
