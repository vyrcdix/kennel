import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const DARK_CLASS = 'km-dark';
const STORAGE_KEY = 'km.theme';

const prefersDark = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-color-scheme: dark)').matches;

const isMode = (s: string | null): s is ThemeMode =>
  s === 'light' || s === 'dark' || s === 'system';

const load = (): ThemeMode => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isMode(raw)) return raw;
  } catch {
    /* no storage — fall through */
  }
  return 'system';
};

const apply = (mode: ThemeMode) => {
  const html = document.documentElement;
  const dark = mode === 'dark' || (mode === 'system' && prefersDark());
  html.classList.toggle(DARK_CLASS, dark);
};

const listeners = new Set<(m: ThemeMode) => void>();
let current: ThemeMode = typeof window === 'undefined' ? 'light' : load();

// Apply on module load so a hard reload starts in the right mode.
if (typeof window !== 'undefined') apply(current);

export const setTheme = (mode: ThemeMode) => {
  current = mode;
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  apply(mode);
  listeners.forEach((fn) => fn(mode));
};

export const useTheme = (): [ThemeMode, (m: ThemeMode) => void] => {
  const [mode, setMode] = useState<ThemeMode>(current);

  useEffect(() => {
    listeners.add(setMode);
    return () => {
      listeners.delete(setMode);
    };
  }, []);

  useEffect(() => {
    if (mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [mode]);

  return [mode, setTheme];
};
