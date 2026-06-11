import { useEffect, useState } from 'react';

// Density (B6) — a Life-only spacing dial. Tightens spacing only; type never
// shrinks. Mirrors theme.ts/skin.ts: persisted to km.density, applied as a
// class on the document root. 'roomy' is the default (no class). The density
// tokens are scoped to .km-skin-life, so the dial is a no-op under Workshop
// (Workshop has one density).
export type Density = 'roomy' | 'cozy' | 'compact';

const STORAGE_KEY = 'km.density';
const CLASS: Record<Density, string> = {
  roomy: '',
  cozy: 'km-density-cozy',
  compact: 'km-density-compact',
};

const isDensity = (s: string | null): s is Density =>
  s === 'roomy' || s === 'cozy' || s === 'compact';

const load = (): Density => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isDensity(raw)) return raw;
  } catch {
    /* no storage */
  }
  return 'roomy';
};

const apply = (d: Density) => {
  const html = document.documentElement;
  html.classList.remove(CLASS.cozy, CLASS.compact);
  if (CLASS[d]) html.classList.add(CLASS[d]);
};

const listeners = new Set<(d: Density) => void>();
let current: Density = typeof window === 'undefined' ? 'roomy' : load();

// Apply on module load so a hard reload starts at the right density.
if (typeof window !== 'undefined') apply(current);

export const getDensity = (): Density => current;

export const setDensity = (d: Density) => {
  current = d;
  try {
    localStorage.setItem(STORAGE_KEY, d);
  } catch {
    /* ignore */
  }
  apply(d);
  listeners.forEach((fn) => fn(d));
};

export const useDensity = (): [Density, (d: Density) => void] => {
  const [d, setD] = useState<Density>(current);
  useEffect(() => {
    listeners.add(setD);
    return () => {
      listeners.delete(setD);
    };
  }, []);
  return [d, setDensity];
};
