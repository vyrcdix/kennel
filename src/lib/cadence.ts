// Cadence derivation (client) — the read-side companion to the server engine.
// Vitality is DERIVED here (never stored): warmth from lastDoneAt vs the
// cadence interval, weighted by the commitment grace (A4). Window-relative,
// not the item temperature's absolute 21/60-day thresholds — a daily practice
// must not read "fresh" for three weeks. See docs/cadence-build-plan.md.

import type { Cadence, Commitment, Item, Settings } from '../data/types';
import type { Temp } from './temperature';
import { copy } from './copy';

const DAY = 86_400_000;
const WINDOW_MS: Record<Cadence, number> = {
  daily: DAY,
  weekly: 7 * DAY,
  monthly: 30 * DAY,
};

/** A1 grace: windows of slack before vitality starts cooling, per commitment. */
const GRACE: Record<Commitment, number> = { trying: 0, committed: 1, core: 2 };

/** A cadence is "present" when the rhythm is set on an action item. */
export const isCadence = (it: Item): boolean => it.cadence != null;

/** Whole windows elapsed since the last contact (or, if never done, since the
 *  window first opened). Skipping rolls the window but not lastDoneAt, so a
 *  skipped cadence still cools here. */
export const windowsBehind = (it: Item, now: Date = new Date()): number => {
  if (!it.cadence) return 0;
  const anchor = it.lastDoneAt ?? it.windowOpensAt ?? it.createdAt;
  const elapsed = now.getTime() - anchor.getTime();
  return Math.max(0, Math.floor(elapsed / WINDOW_MS[it.cadence]));
};

/** Derived vitality (A4): effective = max(0, windowsBehind − grace);
 *  0→fresh · 1→active · 2→aging · ≥3→dormant. Shares the temperature vocab. */
export const cadenceVitality = (it: Item, now: Date = new Date()): Temp => {
  if (!it.cadence || !it.commitment) return 'fresh';
  const effective = Math.max(0, windowsBehind(it, now) - GRACE[it.commitment]);
  if (effective <= 0) return 'fresh';
  if (effective === 1) return 'active';
  if (effective === 2) return 'aging';
  return 'dormant';
};

const tolerance = (
  commitment: Commitment,
  s: Pick<Settings, 'cadenceToleranceTrying' | 'cadenceToleranceCommitted' | 'cadenceToleranceCore'>,
): number =>
  commitment === 'core'
    ? s.cadenceToleranceCore
    : commitment === 'committed'
      ? s.cadenceToleranceCommitted
      : s.cadenceToleranceTrying;

/** Past its cooling tolerance → drifts onto the Aging board (B-side amnesty). */
export const isCooled = (
  it: Item,
  settings: Pick<Settings, 'cadenceToleranceTrying' | 'cadenceToleranceCommitted' | 'cadenceToleranceCore'>,
  now: Date = new Date(),
): boolean =>
  isCadence(it) && it.commitment != null &&
  windowsBehind(it, now) >= tolerance(it.commitment, settings);

/** The window is open → it surfaces in "Do this week". */
export const windowOpen = (it: Item, now: Date = new Date()): boolean =>
  it.windowOpensAt != null && it.windowOpensAt.getTime() <= now.getTime();

// ── Display helpers (skin-neutral except the vitality label) ──────────────

/** Vitality colour — shared depth map; both skins read the same tokens. */
export const VITALITY_COLOR: Record<Temp, string> = {
  fresh: 'var(--sacred)',
  active: 'var(--action)',
  aging: 'var(--fam-run)',
  dormant: 'var(--ink-faint, var(--fg-faint))',
};

/** Per-skin vitality word (Workshop fresh/active/aging/dormant; Life
 *  sunlit/active/deepening/still) via the copy table. */
export const vitalityLabel = (v: Temp): string => copy(`vitality.${v}`);

/** The "do today / this week / this month" window chip text. */
export const WINDOW_LABEL: Record<Cadence, string> = {
  daily: 'do today',
  weekly: 'do this week',
  monthly: 'do this month',
};

/** The cadence rhythm phrase. */
export const CADENCE_LABEL: Record<Cadence, string> = {
  daily: 'every day',
  weekly: 'every week',
  monthly: 'every month',
};

/** Commitment dial meta — bars (CommitMeter) + label. Skin-neutral. */
export const COMMIT: Record<Commitment, { bars: 1 | 2 | 3; label: string; blurb: string }> = {
  trying: { bars: 1, label: 'trying it', blurb: 'an experiment — ages out quickly and guiltlessly' },
  committed: { bars: 2, label: 'committed', blurb: 'a real intention — normal presence, normal patience' },
  core: { bars: 3, label: 'core practice', blurb: 'part of how I live right now — given the most grace' },
};

/** Approximate the recent-windows trace from the streak (newest last). We
 *  don't store per-window history, so the last min(keptCount, n) marks read as
 *  kept and the rest as skipped — honest about the streak we do know. */
export const deriveTrace = (keptCount: number, n = 6): number[] => {
  const kept = Math.min(Math.max(0, keptCount), n);
  return Array.from({ length: n }, (_, i) => (i >= n - kept ? 1 : 0));
};

/** Gentle streak text — warmth, never a metric to defend. No deficit shown. */
export const streakText = (keptCount: number, cadence: Cadence): string => {
  const unit = cadence === 'daily' ? 'days' : cadence === 'weekly' ? 'weeks' : 'months';
  if (keptCount >= 2) return `kept up ${keptCount} ${unit} running`;
  if (keptCount === 1) return 'one kept so far';
  return 'quiet just now';
};

const VITALITY_RANK: Record<Temp, number> = { fresh: 3, active: 2, aging: 1, dormant: 0 };

/** Do-this-week order: commitment bars desc, then vitality desc (kept-up core
 *  practices on top; a cooled one sinks within its group — gentle, not loud). */
export const cadenceSortCmp = (a: Item, b: Item, now: Date = new Date()): number => {
  const ba = a.commitment ? COMMIT[a.commitment].bars : 0;
  const bb = b.commitment ? COMMIT[b.commitment].bars : 0;
  if (ba !== bb) return bb - ba;
  return VITALITY_RANK[cadenceVitality(b, now)] - VITALITY_RANK[cadenceVitality(a, now)];
};
