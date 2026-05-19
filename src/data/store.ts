// Tiny pub-sub backing the in-memory fixture store. Components subscribe via
// useStoreVersion() and re-render when any action mutates the data.
// When the real backend lands, swap this for the API client.

import { useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();
let version = 0;

export const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

export const getSnapshot = () => version;

/** Bump the version and notify all subscribers. Call from every action. */
export const notify = () => {
  version++;
  listeners.forEach((l) => l());
};

/** Hook: any change in the store re-renders the component. */
export const useStoreVersion = (): number =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
