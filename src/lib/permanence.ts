// Object permanence (slice 3). Every list removal goes through removeItem so
// it (a) optionally animates the row off the list, (b) performs the mutation,
// and (c) fires a toast carrying Undo. Nothing is ever silently lost.
//
// Motion is CSS-only and scaled by --motion-scale: in Workshop the scale is 0,
// so the leave is instant (no animation) — but the Undo toast still fires, in
// Workshop voice. In Life the row animates out (pick-up / release / crystal)
// before it unmounts, then the toast appears in Tidewater voice.

import { getSkin } from './skin';
import { showToast, type ToastKind } from './toast';

// The leave gesture also selects the toast kind (they share names).
type Gesture = Extract<ToastKind, 'focus' | 'release' | 'crystal'>;

// Every removal we offer maps to one gesture + a per-skin line of copy.
export type RemovalAction =
  | 'activate'
  | 'setAside'
  | 'letGo'
  | 'crystallize'
  | 'file'
  | 'pickBackUp';

type Voice = { gesture: Gesture; message: string; detail?: string };

// Workshop = plain tool voice. Life = Tidewater: kind, recoverable, a choice.
const VOICE: Record<RemovalAction, { workshop: Voice; life: Voice }> = {
  activate: {
    workshop: { gesture: 'focus', message: 'Activated' },
    life: { gesture: 'focus', message: 'Picked up', detail: 'now in focus' },
  },
  setAside: {
    workshop: { gesture: 'focus', message: 'Parked' },
    life: { gesture: 'focus', message: 'Set aside', detail: 'on the shelf' },
  },
  letGo: {
    workshop: { gesture: 'release', message: 'Dismissed' },
    life: {
      gesture: 'release',
      message: 'Let the tide take it',
      detail: 'still in search if you want it back',
    },
  },
  crystallize: {
    workshop: { gesture: 'crystal', message: 'Crystallized' },
    life: { gesture: 'crystal', message: 'Crystallized', detail: 'a kept thing' },
  },
  file: {
    workshop: { gesture: 'focus', message: 'Filed' },
    life: { gesture: 'focus', message: 'Filed', detail: 'kept, out of the way' },
  },
  pickBackUp: {
    workshop: { gesture: 'focus', message: 'Picked back up' },
    life: { gesture: 'focus', message: 'Back in focus' },
  },
};

const BASE_MS: Record<Gesture, number> = { focus: 360, release: 420, crystal: 300 };
const LEAVE_MODIFIER: Record<Gesture, '' | 'release' | 'crystal'> = {
  focus: '',
  release: 'release',
  crystal: 'crystal',
};

const motionScale = (): number => {
  if (typeof window === 'undefined') return 0;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--motion-scale')
    .trim();
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
};

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Play the leave animation on the row, resolving when it's done. Returns
// immediately (no animation) when motion is off — Workshop or reduced-motion.
const playLeave = (el: HTMLElement | null, gesture: Gesture): Promise<void> => {
  const dur = prefersReducedMotion() ? 0 : BASE_MS[gesture] * motionScale();
  if (!el || dur <= 0) return Promise.resolve();
  el.classList.add('item-leave');
  const mod = LEAVE_MODIFIER[gesture];
  if (mod) el.classList.add(mod);
  return new Promise((resolve) => window.setTimeout(resolve, dur));
};

export type RemoveItemOpts = {
  /** The action being taken — selects gesture, copy and toast kind. */
  action: RemovalAction;
  /** The row element to animate out (omit/null for an instant removal). */
  el?: HTMLElement | null;
  /** Performs the removal. Awaited after the leave animation. */
  mutate: () => Promise<unknown>;
  /** Reverses the removal when the user clicks Undo. */
  undo: () => Promise<unknown>;
};

export const removeItem = async (opts: RemoveItemOpts): Promise<void> => {
  const voice = VOICE[opts.action][getSkin() === 'life' ? 'life' : 'workshop'];
  await playLeave(opts.el ?? null, voice.gesture);
  await opts.mutate();
  showToast(voice.message, {
    kind: voice.gesture,
    detail: voice.detail,
    onUndo: () => {
      void opts.undo();
    },
  });
};
