// Per-skin voice strings (product decision 1; slice 6). Workshop keeps the
// current strings verbatim; Life ("Tidewater") carries the kinder, tide-and-
// sediment voice. Look up by dotted key with copy(key) — it resolves against
// the active skin at call time, so any component that re-renders on a skin
// change (i.e. uses useSkin) gets the right voice.
//
// This table is the single home for skin-divergent copy and grows as surfaces
// are migrated onto it. The A5 design review of the Tidewater column is
// post-hoc — strings here are the build's best extraction from the prototype.

import { getSkin } from './skin';

type Entry = { workshop: string; life: string };

const COPY: Record<string, Entry> = {
  // ── Aging board (B2) ──────────────────────────────────────────────────
  'aging.title': { workshop: 'Aging', life: 'Driftwood' },
  'aging.subtitle': {
    workshop:
      "Items that haven't been touched in a while. Most should be let go; some are worth picking back up. Each decision is one keystroke.",
    life: "Threads settling deeper. Nothing's wrong with that — just so you know.",
  },
  'aging.lead': {
    workshop: 'across all threads',
    life: 'the cold material, asking honestly to be released',
  },
  'aging.threshold': { workshop: 'threshold', life: 'show threads quiet for' },
  'aging.empty.line': { workshop: "Nothing's gone cold.", life: "Nothing's gone cold." },
  'aging.empty.sub': {
    workshop: "everything's been touched within the last {n} days",
    life: "Everything's still within reach.",
  },
  'aging.verb.pickup': { workshop: 'Pick up', life: 'Bring back up' },
  'aging.verb.crystallize': { workshop: 'Crystallize', life: 'Crystallize' },
  'aging.verb.file': { workshop: 'File', life: 'File' },

  // ── Reflecting (the shelf) ────────────────────────────────────────────
  'reflecting.empty.line': { workshop: "Nothing's set aside.", life: "Nothing's set aside." },
  'reflecting.empty.sub': {
    workshop: 'set aside from Sort lands here',
    life: 'An empty shelf is allowed. Capture something when it comes.',
  },

  // ── Dashboard ─────────────────────────────────────────────────────────
  'dashboard.calm': { workshop: 'Dashboard', life: "The tide's calm." },
  'bench.empty': { workshop: 'nothing to sort', life: 'The bench is clear.' },

  // ── Cadence vitality — one shared state, two labelings (B2) ───────────
  'vitality.fresh': { workshop: 'fresh', life: 'sunlit' },
  'vitality.active': { workshop: 'active', life: 'active' },
  'vitality.aging': { workshop: 'aging', life: 'deepening' },
  'vitality.dormant': { workshop: 'dormant', life: 'still' },
  // ── Cadence "Do this week" slot ───────────────────────────────────────
  'cadence.doThisWeek': { workshop: 'Do this week', life: 'Do this week' },
  'cadence.doThisWeek.sub': {
    workshop: 'recurring actions whose window is open — invitations, never due',
    life: "what's asking for a touch this window — an invitation, never a deadline",
  },
  'cadence.cooled': { workshop: 'Cooled cadences', life: 'Cooled cadences' },
  'cadence.cooled.sub': {
    workshop: 'rhythms you stopped feeding — keep, crystallize the lesson, or let go',
    life: 'sweeping the workshop — not confronting failures',
  },

  // ── Compass (orientation layer) ───────────────────────────────────────
  // Both columns filled now (A2): the navigation words stay in both skins;
  // only the water metaphor + Harbour/Driftwood/Currents are Life-only. The
  // visible Life naming sweep wires these in staged (P6); keys are dormant
  // until each surface consumes them.
  'compass.lens': { workshop: 'Compass', life: 'Compass' },
  'compass.bearing': { workshop: 'bearing', life: 'bearing' },
  'compass.bearings': { workshop: 'bearings', life: 'bearings' },
  'compass.setBearing': { workshop: 'Set a new bearing', life: 'Set a new bearing' },
  'compass.lodestar': { workshop: 'lodestar', life: 'lodestar' },
  // The accumulation visual.
  'compass.wake': { workshop: 'the trail', life: 'the wake' },
  'compass.wake.caption': {
    workshop: '{kept} kept across {days} days',
    life: '{kept} kept across {days} days',
  },
  // Room-remaining — never a countdown. {n} = days ahead.
  'compass.ahead': {
    workshop: '{n} days of road ahead',
    life: '{n} days of water still ahead',
  },
  'compass.horizon.none': { workshop: 'no clock', life: 'no clock' },
  // The orphan group in the "Under a bearing" lens.
  'compass.loose': { workshop: 'loose on the bench', life: 'loose in the water' },
  'compass.loose.sub': {
    workshop: 'not under a bearing yet',
    life: 'not under a bearing yet',
  },
  // "still about?" block.
  'compass.still': { workshop: 'still what you’re about?', life: 'still what you’re about?' },
  'compass.still.true': { workshop: 'Still true', life: 'Still true' },
  'compass.still.reword': { workshop: 'Reword', life: 'Reword' },
  'compass.still.letgo': { workshop: 'Let it set', life: 'Let it set' },
  // Nav renames — Life-only words over the same routes (P6). Aging→Driftwood
  // rides the existing 'aging.title' key (life value flipped above).
  'nav.dashboard': { workshop: 'Dashboard', life: 'Harbour' },
  'nav.pinnedThreads': { workshop: 'Pinned threads', life: 'Currents' },
  'nav.newThread': { workshop: 'New thread', life: 'New current' },
};

/** Resolve a copy key for the active skin, with optional {var} interpolation. */
export const copy = (key: string, vars?: Record<string, string | number>): string => {
  const entry = COPY[key];
  let s = entry ? (getSkin() === 'life' ? entry.life : entry.workshop) : key;
  if (vars) {
    for (const [k, val] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
    }
  }
  return s;
};
