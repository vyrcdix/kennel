// Per-skin voice strings. The editable resource is `copy.json` (one entry per
// dotted key, with a `workshop` and a `life` value); this module loads it as the
// built-in defaults and merges any runtime overrides on top. Look up with
// copy(key) — it resolves against the active skin at call time, so any component
// that re-renders on a skin change (i.e. uses useSkin) gets the right voice.
//
// Editing copy:
//  • build-time — edit copy.json (round-trip via `node scripts/copy.mjs`), rebuild.
//  • runtime    — drop an edited copy.json in the instance's content dir
//    (KENNEL_COPY_FILE); it arrives via /api/bootstrap and overrides the
//    defaults per-field, no rebuild. See docs/copy.md.
import { getSkin } from './skin';
import defaults from './copy.json';

export type CopyEntry = { workshop: string; life: string };
type PartialEntry = { workshop?: string; life?: string };

const DEFAULTS = defaults as Record<string, CopyEntry>;
let overrides: Record<string, PartialEntry> = {};

/** Runtime overrides (set from the bootstrap payload). Merged per-field over the
 *  defaults, so an override file may touch one key, or one skin of one key. */
export const setCopyOverrides = (o?: Record<string, PartialEntry> | null): void => {
  overrides = o && typeof o === 'object' ? o : {};
};

/** The effective merged table (defaults ⊕ overrides) — for export / seeding an
 *  override file with the current full set. */
export const getEffectiveCopy = (): Record<string, CopyEntry> => {
  const out: Record<string, CopyEntry> = {};
  for (const k of new Set([...Object.keys(DEFAULTS), ...Object.keys(overrides)])) {
    out[k] = { ...DEFAULTS[k], ...overrides[k] } as CopyEntry;
  }
  return out;
};

/** Resolve a copy key for the active skin, with optional {var} interpolation.
 *  Unknown keys return the key itself (handy for spotting gaps). */
export const copy = (key: string, vars?: Record<string, string | number>): string => {
  const entry: PartialEntry = { ...DEFAULTS[key], ...overrides[key] };
  let s = (getSkin() === 'life' ? entry.life : entry.workshop) ?? DEFAULTS[key]?.workshop ?? key;
  if (vars) {
    for (const [k, val] of Object.entries(vars)) {
      s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(val));
    }
  }
  return s;
};
