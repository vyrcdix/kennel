import { describe, expect, test } from 'vitest';
import { panelTemperature, temperatureForDate, temperatureFromDate } from './temperature';
import type { Item, Settings } from '../data/types';

const SETTINGS: Settings = {
  agingThresholdDays: 21,
  filingPromptDays: 0,
  dormantThresholdDays: 60,
  showTemperature: true,
  resurfaceIntervalDays: 30,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const NOW = new Date('2026-05-19T12:00:00Z');
const ago = (days: number) => new Date(NOW.getTime() - days * 86_400_000);

const item = (lastTouched: Date): Pick<Item, 'lastTouchedAt' | 'updatedAt'> => ({
  lastTouchedAt: lastTouched,
  updatedAt: lastTouched,
});

describe('temperatureFromDate', () => {
  test('< 24h is fresh', () => {
    expect(temperatureFromDate(ago(0.4), SETTINGS, NOW)).toBe('fresh');
    expect(temperatureFromDate(ago(0.99), SETTINGS, NOW)).toBe('fresh');
  });

  test('1d to aging threshold is active', () => {
    expect(temperatureFromDate(ago(2), SETTINGS, NOW)).toBe('active');
    expect(temperatureFromDate(ago(15), SETTINGS, NOW)).toBe('active');
    expect(temperatureFromDate(ago(21), SETTINGS, NOW)).toBe('active');
  });

  test('past aging threshold is aging', () => {
    expect(temperatureFromDate(ago(22), SETTINGS, NOW)).toBe('aging');
    expect(temperatureFromDate(ago(45), SETTINGS, NOW)).toBe('aging');
  });

  test('past dormant threshold is dormant', () => {
    expect(temperatureFromDate(ago(61), SETTINGS, NOW)).toBe('dormant');
    expect(temperatureFromDate(ago(180), SETTINGS, NOW)).toBe('dormant');
  });

  test('null / undefined is active (no signal)', () => {
    expect(temperatureFromDate(null, SETTINGS, NOW)).toBe('active');
    expect(temperatureFromDate(undefined, SETTINGS, NOW)).toBe('active');
  });

  test('respects custom dormant threshold', () => {
    const s = { ...SETTINGS, dormantThresholdDays: 90 };
    expect(temperatureFromDate(ago(75), s, NOW)).toBe('aging');
    expect(temperatureFromDate(ago(95), s, NOW)).toBe('dormant');
  });
});

describe('panelTemperature', () => {
  test('takes max recency over items', () => {
    const items = [item(ago(40)), item(ago(2)), item(ago(80))];
    expect(panelTemperature(items, SETTINGS, NOW)).toBe('active'); // newest is 2d → active
  });

  test('all old items → aging or dormant per most-recent', () => {
    const items = [item(ago(70)), item(ago(35))]; // most recent = 35d → aging
    expect(panelTemperature(items, SETTINGS, NOW)).toBe('aging');
  });

  test('empty panel is active, never dormant', () => {
    expect(panelTemperature([], SETTINGS, NOW)).toBe('active');
  });

  test('falls back to updatedAt when lastTouchedAt missing', () => {
    const items: Pick<Item, 'lastTouchedAt' | 'updatedAt'>[] = [
      { lastTouchedAt: undefined, updatedAt: ago(0.2) },
    ];
    expect(panelTemperature(items, SETTINGS, NOW)).toBe('fresh');
  });

  test('showTemperature=false flattens to active', () => {
    const items = [item(ago(100))];
    const off = { ...SETTINGS, showTemperature: false };
    expect(panelTemperature(items, off, NOW)).toBe('active');
  });
});

describe('temperatureForDate', () => {
  test('honours showTemperature toggle', () => {
    const off = { ...SETTINGS, showTemperature: false };
    expect(temperatureForDate(ago(80), off, NOW)).toBe('active');
    expect(temperatureForDate(ago(80), SETTINGS, NOW)).toBe('dormant');
  });
});
