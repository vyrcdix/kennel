// v0.3/v0.5 vocabulary mapping — state → user-facing label / dot color /
// verb / confirmation copy. Imported by screens and atoms; keeps the
// canonical mapping in one place. v0.5: "Dismissed" is now shown as "Let go"
// in copy; schema value stays `dismissed`.

import type { ItemState, ItemKind } from '../../shared/types';

export const STATE_LABEL: Record<ItemState, string> = {
  inbox: 'On the bench',
  active: 'In focus',
  reflecting: 'Reflecting',
  crystallized: 'Crystallized',
  filed: 'Filed',
  dismissed: 'Let go',
};

/** Maps a state to one of the existing `km-dot-*` classes in tokens.css. */
export const STATE_DOT_CLASS: Record<ItemState, string | null> = {
  inbox: null,           // no dot in inbox
  active: 'km-dot-ember',
  reflecting: 'km-dot-dust',
  crystallized: 'km-dot-moss',
  filed: 'km-dot-slate',
  dismissed: null,
};

/** Triage-screen action labels (Sort buttons). */
export const ACTION_LABEL = {
  pickUp: 'Pick up',          // active
  setAside: 'Set aside',      // reflecting
  done: 'Done',               // crystallized (via Sort screen)
  letGo: 'Let go',            // dismissed
  convert: 'Convert',
  file: 'File',               // filed (Aging board only)
} as const;

/** Activity-feed verbs (the actor's perspective — past tense). */
export const TRANSITION_VERB: Record<ItemState, string> = {
  inbox: 'RESET',
  active: 'PICKED UP',
  reflecting: 'SET ASIDE',
  crystallized: 'CRYSTALLIZED',
  filed: 'FILED',
  dismissed: 'LET GO',
};

/** Confirmation toasts / status copy per state transition target. */
export const TRANSITION_CONFIRMATION: Record<ItemState, string> = {
  inbox: 'Returned to the bench.',
  active: 'Picked up.',
  reflecting: 'Set aside.',
  crystallized: 'Crystallized.',
  filed: 'Filed. Still searchable.',
  dismissed: 'Let go.',
};

export const KIND_LABEL: Record<ItemKind, string> = {
  idea: 'Idea',
  note: 'Note',
  action: 'Action',
  doc: 'Doc',
  ref: 'Reference',
  question: 'Question',
  crystallization: 'Crystallization',
};
