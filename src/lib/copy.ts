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
  'aging.title': { workshop: 'Aging', life: 'Aging' },
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
