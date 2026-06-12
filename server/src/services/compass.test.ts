import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { HttpError } from '../errors.js';
import { createProject } from './project.js';
import { createItem, getItemById, resurfaceCrystal } from './item.js';
import { recurItem } from './cadence.js';
import {
  letGoBearing,
  promiseCadence,
  rewordBearing,
  setBearing,
  setBearingHorizon,
} from './compass.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };
let projectId: string;

const mkItem = (title = 'See more of the world') =>
  createItem(db, { projectId, kind: 'idea', title }).id;

const mkCadence = (title = 'lace up the shoes') => {
  const id = createItem(db, { projectId, kind: 'action', title }).id;
  recurItem(db, id, { cadence: 'daily', commitment: 'trying' });
  return id;
};

beforeEach(() => {
  content = useTempContent();
  db = makeTestDb();
  projectId = createProject(db, { name: 'Test' }).id;
});
afterEach(() => {
  db.close();
  content.cleanup();
});

describe('setBearing', () => {
  test('promotes an item into a forward-pointed crystal', () => {
    const id = mkItem();
    const b = setBearing(db, id, { persona: 'life' });
    expect(b.ctype).toBe('orientation');
    expect(b.kind).toBe('crystallization');
    expect(b.state).toBe('crystallized');
    expect(b.persona).toBe('life');
    expect(b.doneAt instanceof Date).toBe(true);
    // resurface clock seeded so "still about?" starts from now
    expect(b.lastSurfacedAt instanceof Date).toBe(true);
  });

  test('stores an optional horizon and revives the dates', () => {
    const id = mkItem('Run Chicago 2027');
    const b = setBearing(db, id, {
      horizonStartAt: '2026-06-12T00:00:00Z',
      horizonTargetAt: '2027-10-10T00:00:00Z',
    });
    expect(b.horizonStartAt instanceof Date).toBe(true);
    expect(b.horizonTargetAt?.getUTCFullYear()).toBe(2027);
  });

  test('rejects a horizon whose target precedes its start', () => {
    const id = mkItem();
    expect(() =>
      setBearing(db, id, {
        horizonStartAt: '2027-01-01T00:00:00Z',
        horizonTargetAt: '2026-01-01T00:00:00Z',
      }),
    ).toThrow(HttpError);
  });

  test('rejects an unparseable horizon date', () => {
    const id = mkItem();
    expect(() => setBearing(db, id, { horizonTargetAt: 'someday' })).toThrow(HttpError);
  });

  test('attaches existing items to serve the bearing (seeds the roll-up)', () => {
    const childA = createItem(db, { projectId, kind: 'action', title: 'book flights' }).id;
    const childB = createItem(db, { projectId, kind: 'action', title: 'learn some Japanese' }).id;
    const bearingId = mkItem();
    setBearing(db, bearingId, { attach: [childA, childB] });
    expect(getItemById(db, childA)!.servesId).toBe(bearingId);
    expect(getItemById(db, childB)!.servesId).toBe(bearingId);
  });

  test('rejects an unknown attach id', () => {
    const bearingId = mkItem();
    expect(() => setBearing(db, bearingId, { attach: ['no-such-item'] })).toThrow(HttpError);
  });
});

describe('setBearingHorizon', () => {
  test('sets then clears the horizon', () => {
    const id = mkItem();
    setBearing(db, id);
    const set = setBearingHorizon(db, id, '2026-06-12T00:00:00Z', '2027-10-10T00:00:00Z');
    expect(set.horizonTargetAt?.getUTCFullYear()).toBe(2027);
    const cleared = setBearingHorizon(db, id, null, null);
    expect(cleared.horizonStartAt).toBeUndefined();
    expect(cleared.horizonTargetAt).toBeUndefined();
  });

  test('rejects horizon ops on a non-bearing', () => {
    const id = mkItem(); // still a plain idea
    expect(() => setBearingHorizon(db, id, null, null)).toThrow(HttpError);
  });

  test('rejects target before start', () => {
    const id = mkItem();
    setBearing(db, id);
    expect(() =>
      setBearingHorizon(db, id, '2027-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
    ).toThrow(HttpError);
  });
});

describe('rewordBearing', () => {
  test('edits the statement and the note', () => {
    const id = mkItem('see the world');
    setBearing(db, id);
    const out = rewordBearing(db, id, {
      title: 'See more of the world, deliberately',
      description: 'the trips that matter, not all of them',
    });
    expect(out.title).toBe('See more of the world, deliberately');
    expect(out.description).toBe('the trips that matter, not all of them');
  });

  test('rejects an empty statement', () => {
    const id = mkItem();
    setBearing(db, id);
    expect(() => rewordBearing(db, id, { title: '   ' })).toThrow(HttpError);
  });

  test('rejects rewording a non-bearing', () => {
    const id = mkItem();
    expect(() => rewordBearing(db, id, { title: 'nope' })).toThrow(HttpError);
  });
});

describe('promiseCadence', () => {
  test('turns a cadence into a promise of a bearing', () => {
    const bearingId = mkItem();
    setBearing(db, bearingId);
    const cadenceId = mkCadence();
    const out = promiseCadence(db, cadenceId, bearingId);
    expect(out.role).toBe('promise');
    expect(out.servesId).toBe(bearingId);
  });

  test('rejects promising a non-cadence', () => {
    const bearingId = mkItem();
    setBearing(db, bearingId);
    const plain = createItem(db, { projectId, kind: 'action', title: 'one-off' }).id;
    expect(() => promiseCadence(db, plain, bearingId)).toThrow(HttpError);
  });

  test('rejects a promise pointed at a non-bearing', () => {
    const cadenceId = mkCadence();
    const notABearing = mkItem();
    expect(() => promiseCadence(db, cadenceId, notABearing)).toThrow(HttpError);
  });
});

describe('letGoBearing', () => {
  test('reverts promises to free-standing practices and files the bearing', () => {
    const bearingId = mkItem();
    setBearing(db, bearingId);
    const cadenceId = mkCadence();
    promiseCadence(db, cadenceId, bearingId);

    const filed = letGoBearing(db, bearingId);
    expect(filed.state).toBe('filed');
    // ctype preserved (it WAS a bearing) — it's just out of the active set
    expect(filed.ctype).toBe('orientation');

    const reverted = getItemById(db, cadenceId)!;
    expect(reverted.role).toBe('practice');
    expect(reverted.servesId).toBeUndefined(); // free-standing
    // the rhythm survives — still a live daily cadence
    expect(reverted.cadence).toBe('daily');
    expect(reverted.state).toBe('active');
  });

  test('rejects letting go of a non-bearing', () => {
    const id = mkItem();
    expect(() => letGoBearing(db, id)).toThrow(HttpError);
  });
});

describe('still-about (resurface re-pointed)', () => {
  test('"Still true" acks a bearing like any crystal', () => {
    const id = mkItem();
    const before = setBearing(db, id);
    const acked = resurfaceCrystal(db, id, { ack: true });
    expect(acked.surfaceCount).toBe(before.surfaceCount + 1);
    expect(acked.lastSurfacedAt instanceof Date).toBe(true);
  });
});
