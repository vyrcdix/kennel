import { describe, expect, test } from 'vitest';
import {
  formatDashboardDate,
  formatDate,
  formatDue,
  formatRelative,
  formatRelativeLoose,
  formatTime,
  isStale,
} from './time';

const REF = new Date('2026-05-17T14:32:00');

describe('formatTime', () => {
  test('pads to HH:MM 24h', () => {
    expect(formatTime(new Date('2026-05-17T03:07:00'))).toBe('03:07');
    expect(formatTime(new Date('2026-05-17T14:32:00'))).toBe('14:32');
  });
});

describe('formatDate', () => {
  test('lowercase short month + day', () => {
    expect(formatDate(new Date('2026-05-17T00:00:00'))).toBe('may 17');
    expect(formatDate(new Date('2026-01-03T00:00:00'))).toBe('jan 3');
  });
});

describe('formatRelative', () => {
  test('< 1m → "just now"', () => {
    expect(formatRelative(new Date(REF.getTime() - 30_000), REF)).toBe('just now');
  });

  test('minutes ago', () => {
    expect(formatRelative(new Date(REF.getTime() - 5 * 60_000), REF)).toBe('5m ago');
  });

  test('hours ago', () => {
    expect(formatRelative(new Date(REF.getTime() - 3 * 3600_000), REF)).toBe('3h ago');
  });

  test('yesterday', () => {
    expect(formatRelative(new Date(REF.getTime() - 26 * 3600_000), REF)).toBe('yesterday');
  });

  test('days ago up to ~60d', () => {
    expect(formatRelative(new Date(REF.getTime() - 4 * 86400_000), REF)).toBe('4d ago');
  });

  test('beyond 60d → absolute date', () => {
    const long = new Date(REF.getTime() - 90 * 86400_000);
    expect(formatRelative(long, REF)).toMatch(/^[a-z]{3} \d{1,2}$/);
  });

  test('future date defers to formatDue', () => {
    const future = new Date(REF.getTime() + 86400_000);
    expect(formatRelative(future, REF)).toBe('tomorrow');
  });
});

describe('formatRelativeLoose', () => {
  test('keeps "d ago" beyond 60d (used by chats)', () => {
    expect(formatRelativeLoose(new Date(REF.getTime() - 90 * 86400_000), REF)).toBe('90d ago');
  });
});

describe('formatDue', () => {
  test('undefined → em-dash', () => {
    expect(formatDue(undefined, REF)).toBe('—');
  });

  test('today / tomorrow', () => {
    expect(formatDue(REF, REF)).toBe('today');
    expect(formatDue(new Date(REF.getTime() + 86400_000), REF)).toBe('tomorrow');
  });

  test('within next week → weekday', () => {
    const wed = new Date(REF.getTime() + 2 * 86400_000); // sunday+2 = tue, +3 = wed
    expect(formatDue(wed, REF)).toMatch(/^(mon|tue|wed|thu|fri|sat|sun)$/);
  });

  test('beyond a week → absolute date', () => {
    const dist = new Date(REF.getTime() + 14 * 86400_000);
    expect(formatDue(dist, REF)).toMatch(/^[a-z]{3} \d{1,2}$/);
  });
});

describe('formatDashboardDate', () => {
  test('shape: weekday · DD mmm YYYY · HH:MM TZ', () => {
    const out = formatDashboardDate(REF);
    expect(out).toMatch(/^[a-z]+ · \d{1,2} [a-z]{3} \d{4} · \d{2}:\d{2}/);
  });
});

describe('isStale', () => {
  test('default threshold 60d', () => {
    const recent = new Date(REF.getTime() - 30 * 86400_000);
    const old = new Date(REF.getTime() - 90 * 86400_000);
    expect(isStale(recent, 60, REF)).toBe(false);
    expect(isStale(old, 60, REF)).toBe(true);
  });
});
