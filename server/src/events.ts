import type { ActivityEntry } from '../../shared/types.js';

/** Tiny in-process pub-sub for server-side events. Subscribers are typically
 *  SSE connections; publishers are mutating service functions (via
 *  logActivity). Single-process means no cross-instance fan-out needed. */
type EventEnvelope = { type: 'activity'; entry: ActivityEntry };
type Listener = (event: EventEnvelope) => void;

const listeners = new Set<Listener>();

export const subscribe = (cb: Listener): (() => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const publish = (event: EventEnvelope): void => {
  for (const l of listeners) l(event);
};

export const listenerCount = (): number => listeners.size;
