// Temperature · panel-level time-since-touch signal.
//
// Rules (from handoff/kennel_temperature_handoff/README.md):
//   fresh   — last touched ≤ 24h
//   active  — 1d < touch < aging threshold (the silent default)
//   aging   — past aging threshold
//   dormant — past 60d (configurable via settings.dormantThresholdDays)
//
// `panelTemperature` takes the items already rendered inside a panel
// and returns the panel's temperature. The panel temp is `max(temp of
// items)` — empty panel falls through to 'active'.

import type { Item, Settings } from '../data/types';

export type Temp = 'fresh' | 'active' | 'aging' | 'dormant';

const DAY = 86_400_000;

/** Pure: a single date → temperature, given thresholds. */
export const temperatureFromDate = (
  lastTouched: Date | null | undefined,
  settings: Pick<Settings, 'agingThresholdDays' | 'dormantThresholdDays'>,
  now: Date = new Date(),
): Temp => {
  if (!lastTouched) return 'active';
  const ageDays = (now.getTime() - lastTouched.getTime()) / DAY;
  if (ageDays < 1) return 'fresh';
  if (ageDays > settings.dormantThresholdDays) return 'dormant';
  if (ageDays > settings.agingThresholdDays) return 'aging';
  return 'active';
};

/** Pure: a panel's temperature, taken as max-recency over its items. */
export const panelTemperature = (
  items: ReadonlyArray<Pick<Item, 'lastTouchedAt' | 'updatedAt'>>,
  settings: Pick<Settings, 'agingThresholdDays' | 'dormantThresholdDays' | 'showTemperature'>,
  now: Date = new Date(),
): Temp => {
  if (!settings.showTemperature) return 'active';
  if (items.length === 0) return 'active';
  let max = 0;
  for (const it of items) {
    const t = (it.lastTouchedAt ?? it.updatedAt).getTime();
    if (t > max) max = t;
  }
  return temperatureFromDate(new Date(max), settings, now);
};

/** Honour the global toggle for date-based callers (rail cards, doc cards). */
export const temperatureForDate = (
  lastTouched: Date | null | undefined,
  settings: Pick<Settings, 'agingThresholdDays' | 'dormantThresholdDays' | 'showTemperature'>,
  now: Date = new Date(),
): Temp => {
  if (!settings.showTemperature) return 'active';
  return temperatureFromDate(lastTouched, settings, now);
};
