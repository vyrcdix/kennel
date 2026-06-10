import { useEffect, useState } from 'react';

/** Selection + keyboard driver shared by the single-list boards (Aging,
 *  Reflecting): J/K move the selection, every other lowercase key maps to
 *  an action on the selected id. Skips modifier chords and events from
 *  form fields / contentEditable. Selection reconciles when the selected
 *  row leaves the list (after an action). */
export const useKeyedListNav = <T extends { id: string }>(
  list: T[],
  actions: Record<string, (id: string) => void>,
) => {
  const [selectedId, setSelectedId] = useState<string>(() => list[0]?.id ?? '');

  useEffect(() => {
    if (!list.some((i) => i.id === selectedId)) {
      setSelectedId(list[0]?.id ?? '');
    }
  }, [list, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (
        t &&
        (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
      ) {
        return;
      }
      const idx = list.findIndex((i) => i.id === selectedId);
      const key = e.key.toLowerCase();
      if (key === 'j') {
        const next = list[Math.min(idx + 1, list.length - 1)];
        if (next) setSelectedId(next.id);
        return;
      }
      if (key === 'k') {
        const prev = list[Math.max(idx - 1, 0)];
        if (prev) setSelectedId(prev.id);
        return;
      }
      const action = actions[key];
      if (action && selectedId) action(selectedId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [list, selectedId, actions]);

  return [selectedId, setSelectedId] as const;
};

export default useKeyedListNav;
