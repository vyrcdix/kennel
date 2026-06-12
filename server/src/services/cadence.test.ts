import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { HttpError } from '../errors.js';
import { createProject } from './project.js';
import { createItem, getItemById } from './item.js';
import {
  addWindow,
  coolingWindows,
  didCadence,
  nextWindow,
  recommitCadence,
  recurItem,
  setCommitment,
  skipCadence,
  snoozeCadence,
} from './cadence.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };
let projectId: string;

const mkAction = () =>
  createItem(db, { projectId, kind: 'action', title: 'catch up on Foreign Affairs' }).id;

beforeEach(() => {
  content = useTempContent();
  db = makeTestDb();
  projectId = createProject(db, { name: 'Test' }).id;
});
afterEach(() => {
  db.close();
  content.cleanup();
});

describe('window math', () => {
  test('addWindow advances one period', () => {
    expect(addWindow(new Date('2026-06-01T00:00:00Z'), 'daily').toISOString()).toBe(
      '2026-06-02T00:00:00.000Z',
    );
    expect(addWindow(new Date('2026-06-01T00:00:00Z'), 'weekly').toISOString()).toBe(
      '2026-06-08T00:00:00.000Z',
    );
    expect(addWindow(new Date('2026-06-01T00:00:00Z'), 'monthly').toISOString()).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  test('nextWindow rolls to the next FUTURE window (no deficit on missed ones)', () => {
    const from = new Date('2026-06-01T00:00:00Z');
    const now = new Date('2026-06-20T12:00:00Z');
    // weekly steps: 06-08, 06-15, 06-22 → first > now is 06-22
    expect(nextWindow(from, 'weekly', now).toISOString()).toBe('2026-06-22T00:00:00.000Z');
    expect(nextWindow(from, 'daily', now).toISOString()).toBe('2026-06-21T00:00:00.000Z');
  });
});

describe('recurItem', () => {
  test('promotes an action to a recurring practice, window open now', () => {
    const id = mkAction();
    const it = recurItem(db, id, { cadence: 'weekly', commitment: 'committed' });
    expect(it.cadence).toBe('weekly');
    expect(it.commitment).toBe('committed');
    expect(it.kind).toBe('action');
    expect(it.state).toBe('active');
    expect(it.keptCount).toBe(0);
    expect(it.windowOpensAt).toBeInstanceOf(Date);
    // logs RECURRED activity
    const c = db.prepare("SELECT count(*) AS c FROM activity WHERE verb='RECURRED'").get() as {
      c: number;
    };
    expect(c.c).toBe(1);
  });

  test('400 on invalid cadence / commitment', () => {
    const id = mkAction();
    expect(() => recurItem(db, id, { cadence: 'fortnightly' as never, commitment: 'core' })).toThrow(
      HttpError,
    );
    expect(() => recurItem(db, id, { cadence: 'weekly', commitment: 'maybe' as never })).toThrow(
      HttpError,
    );
  });
});

describe('the loop', () => {
  test('Did it logs the contact, rolls the window, bumps the streak, never deletes', () => {
    const id = mkAction();
    recurItem(db, id, { cadence: 'weekly', commitment: 'committed' });
    const before = getItemById(db, id)!.windowOpensAt!.getTime();
    const after = didCadence(db, id);
    expect(after.keptCount).toBe(1);
    expect(after.lastDoneAt).toBeInstanceOf(Date);
    expect(after.windowOpensAt!.getTime()).toBeGreaterThan(before);
    // ~ one week ahead of now
    expect(after.windowOpensAt!.getTime() - Date.now()).toBeGreaterThan(6 * 86_400_000);
    // never completes/deletes — still a live action
    expect(getItemById(db, id)).toBeDefined();
    expect(after.state).toBe('active');
    // two "did it"s → streak 2
    expect(didCadence(db, id).keptCount).toBe(2);
  });

  test('Skip rolls the window with no streak change, no deficit', () => {
    const id = mkAction();
    recurItem(db, id, { cadence: 'weekly', commitment: 'committed' });
    const before = getItemById(db, id)!.windowOpensAt!.getTime();
    const after = skipCadence(db, id);
    expect(after.keptCount).toBe(0);
    expect(after.lastDoneAt).toBeUndefined();
    expect(after.windowOpensAt!.getTime()).toBeGreaterThan(before);
  });

  test('Snooze bumps within the current window (never past the next boundary)', () => {
    const id = mkAction();
    recurItem(db, id, { cadence: 'weekly', commitment: 'committed' });
    const open = getItemById(db, id)!.windowOpensAt!;
    const boundary = nextWindow(open, 'weekly', new Date());
    const after = snoozeCadence(db, id);
    expect(after.windowOpensAt!.getTime()).toBeGreaterThan(open.getTime());
    expect(after.windowOpensAt!.getTime()).toBeLessThan(boundary.getTime());
    expect(after.keptCount).toBe(0); // snooze doesn't advance the cadence
  });
});

describe('commitment + divergence', () => {
  test('re-commit freshens the vitality (last_done_at = now)', () => {
    const id = mkAction();
    recurItem(db, id, { cadence: 'weekly', commitment: 'core' });
    const after = recommitCadence(db, id);
    expect(after.lastDoneAt).toBeInstanceOf(Date);
    expect(Date.now() - after.lastDoneAt!.getTime()).toBeLessThan(5000);
    expect(after.commitment).toBe('core'); // keeps the declared level
  });

  test('ease off (setCommitment to trying) lowers the dial', () => {
    const id = mkAction();
    recurItem(db, id, { cadence: 'weekly', commitment: 'core' });
    expect(setCommitment(db, id, 'trying').commitment).toBe('trying');
    expect(() => setCommitment(db, id, 'nope')).toThrow(HttpError);
  });
});

describe('guards', () => {
  test('loop verbs reject a non-cadence action', () => {
    const id = mkAction(); // a plain action, no cadence
    expect(() => didCadence(db, id)).toThrow(HttpError);
    expect(() => skipCadence(db, id)).toThrow(HttpError);
    expect(() => setCommitment(db, id, 'core')).toThrow(HttpError);
  });
});

describe('coolingWindows', () => {
  test('returns the per-commitment tolerance from settings (A4 defaults)', () => {
    const s = { cadenceToleranceTrying: 3, cadenceToleranceCommitted: 6, cadenceToleranceCore: 10 };
    expect(coolingWindows('trying', s)).toBe(3);
    expect(coolingWindows('committed', s)).toBe(6);
    expect(coolingWindows('core', s)).toBe(10);
  });
});
