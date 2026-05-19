import { useEffect, useState } from 'react';

const KEY = 'kennel.focus-mode';

const read = (): boolean => {
  try {
    return localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

const listeners = new Set<(v: boolean) => void>();

export const isFocusMode = read;

export const setFocusMode = (on: boolean): void => {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
  for (const fn of listeners) fn(on);
};

export const toggleFocusMode = (): void => setFocusMode(!read());

export const useFocusMode = (): [boolean, (on: boolean) => void] => {
  const [on, setOn] = useState<boolean>(read);
  useEffect(() => {
    const fn = (v: boolean) => setOn(v);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);
  return [on, setFocusMode];
};
