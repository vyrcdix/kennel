import { useEffect, useState } from 'react';

// The skin is the "dress" — palette, type, shape, density, motion and voice —
// swapped by toggling one class on the document root, mirroring theme.ts.
// 'workshop' is the base (no class); 'life' is Tidewater (.km-skin-life).
// Night composes with the existing .km-dark from theme.ts, so Tidewater's
// cool night is `.km-skin-life.km-dark`.
export type Skin = 'workshop' | 'life';

const LIFE_CLASS = 'km-skin-life';
const STORAGE_KEY = 'km.skin';

const isSkin = (s: string | null): s is Skin => s === 'workshop' || s === 'life';

const load = (): Skin => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isSkin(raw)) return raw;
  } catch {
    /* no storage — fall through */
  }
  return 'workshop';
};

const apply = (skin: Skin) => {
  document.documentElement.classList.toggle(LIFE_CLASS, skin === 'life');
};

const listeners = new Set<(s: Skin) => void>();
let current: Skin = typeof window === 'undefined' ? 'workshop' : load();

// Apply on module load so a hard reload starts in the right skin.
if (typeof window !== 'undefined') apply(current);

export const getSkin = (): Skin => current;

export const setSkin = (skin: Skin) => {
  current = skin;
  try {
    localStorage.setItem(STORAGE_KEY, skin);
  } catch {
    /* ignore */
  }
  apply(skin);
  listeners.forEach((fn) => fn(skin));
};

export const useSkin = (): [Skin, (s: Skin) => void] => {
  const [skin, setSkinState] = useState<Skin>(current);

  useEffect(() => {
    listeners.add(setSkinState);
    return () => {
      listeners.delete(setSkinState);
    };
  }, []);

  return [skin, setSkin];
};
