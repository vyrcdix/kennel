import { describe, expect, test } from 'vitest';
import { cadenceVitality, isCooled, windowsBehind } from './cadence';
import type { Item } from '../data/types';

const DAY = 86_400_000;
const TOL = { cadenceToleranceTrying: 3, cadenceToleranceCommitted: 6, cadenceToleranceCore: 10 };

// Minimal cadence item; lastDoneAt drives windows-behind.
const cad = (over: Partial<Item>): Item =>
  ({
    id: 'i',
    projectId: 'p',
    kind: 'action',
    state: 'active',
    title: 't',
    rank: 0,
    surfaceCount: 0,
    keptCount: 0,
    cadence: 'weekly',
    commitment: 'committed',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    ...over,
  }) as Item;

const NOW = new Date('2026-06-01T00:00:00Z');
const weeksAgo = (n: number) => new Date(NOW.getTime() - n * 7 * DAY);

describe('windowsBehind', () => {
  test('counts whole cadence windows since lastDoneAt', () => {
    expect(windowsBehind(cad({ lastDoneAt: weeksAgo(0) }), NOW)).toBe(0);
    expect(windowsBehind(cad({ lastDoneAt: weeksAgo(1) }), NOW)).toBe(1);
    expect(windowsBehind(cad({ lastDoneAt: weeksAgo(4) }), NOW)).toBe(4);
  });
  test('daily is window-relative (not the 21/60-day temperature scale)', () => {
    const it = cad({ cadence: 'daily', lastDoneAt: new Date(NOW.getTime() - 3 * DAY) });
    expect(windowsBehind(it, NOW)).toBe(3);
  });
});

describe('cadenceVitality (A4)', () => {
  test('committed (grace 1): effective = behind − 1', () => {
    const v = (w: number) => cadenceVitality(cad({ commitment: 'committed', lastDoneAt: weeksAgo(w) }), NOW);
    expect(v(0)).toBe('fresh');   // eff 0
    expect(v(1)).toBe('fresh');   // eff 0 (grace)
    expect(v(2)).toBe('active');  // eff 1
    expect(v(3)).toBe('aging');   // eff 2
    expect(v(5)).toBe('dormant'); // eff ≥3
  });
  test('core gets the most grace (2); trying gets none', () => {
    expect(cadenceVitality(cad({ commitment: 'core', lastDoneAt: weeksAgo(2) }), NOW)).toBe('fresh');
    expect(cadenceVitality(cad({ commitment: 'trying', lastDoneAt: weeksAgo(2) }), NOW)).toBe('aging');
  });
});

describe('isCooled (cooling tolerance)', () => {
  test('trips at the per-commitment tolerance (3 / 6 / 10 windows)', () => {
    expect(isCooled(cad({ commitment: 'trying', lastDoneAt: weeksAgo(2) }), TOL, NOW)).toBe(false);
    expect(isCooled(cad({ commitment: 'trying', lastDoneAt: weeksAgo(3) }), TOL, NOW)).toBe(true);
    expect(isCooled(cad({ commitment: 'core', lastDoneAt: weeksAgo(9) }), TOL, NOW)).toBe(false);
    expect(isCooled(cad({ commitment: 'core', lastDoneAt: weeksAgo(10) }), TOL, NOW)).toBe(true);
  });
});
