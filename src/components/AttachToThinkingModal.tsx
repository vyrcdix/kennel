// v0.5 §C — "Attach this action to its thinking." Typeahead over the
// item's project: crystals first (blaze gem), ideas next, and the
// thread anchor on top. Selecting sets serves_id; "Detach" clears it.
//
// Opens from TriageQueue when the user presses `S` on a selected item
// (or from the action's row overflow menu in any other surface).

import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icon';
import { KindIcon } from './KindIcon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { setItemServes, ValidationError } from '../data/actions';
import { getProjectById, getProjectItems } from '../data/selectors';
import type { Item } from '../data/types';

export type AttachToThinkingModalProps = {
  open: boolean;
  item: Item | null;
  onClose: () => void;
};

type Pick =
  | { kind: 'thread'; projectId: string; label: string }
  | { kind: 'item'; item: Item };

const itemMatches = (item: Item, q: string): boolean => {
  if (!q) return true;
  const lower = q.toLowerCase();
  return (
    item.title.toLowerCase().includes(lower) ||
    (item.body?.toLowerCase().includes(lower) ?? false)
  );
};

export const AttachToThinkingModal = ({
  open,
  item,
  onClose,
}: AttachToThinkingModalProps) => {
  const [filter, setFilter] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement | null>(null);
  const project = item ? getProjectById(item.projectId) : undefined;

  useEffect(() => {
    if (!open) return;
    setFilter('');
    setSelectedIdx(0);
    setSaving(false);
    setError(null);
    const t = setTimeout(() => filterRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const choices = useMemo<Pick[]>(() => {
    if (!item || !project) return [];
    const projectItems = getProjectItems(project.id);
    // Crystals first (kind=crystallization OR state=crystallized),
    // then ideas, then questions — actions don't serve other actions.
    // Filed/dismissed items are excluded.
    const crystals = projectItems.filter(
      (it) =>
        (it.kind === 'crystallization' || it.state === 'crystallized') &&
        it.state !== 'filed' &&
        it.state !== 'dismissed',
    );
    const ideas = projectItems.filter(
      (it) =>
        it.kind === 'idea' &&
        it.state !== 'crystallized' &&
        it.state !== 'filed' &&
        it.state !== 'dismissed',
    );
    const questions = projectItems.filter(
      (it) =>
        it.kind === 'question' &&
        it.state !== 'filed' &&
        it.state !== 'dismissed',
    );
    const pool: Pick[] = [
      { kind: 'thread', projectId: project.id, label: project.name },
      ...crystals.map((it): Pick => ({ kind: 'item', item: it })),
      ...ideas.map((it): Pick => ({ kind: 'item', item: it })),
      ...questions.map((it): Pick => ({ kind: 'item', item: it })),
    ];
    return pool;
  }, [item, project]);

  const filtered = useMemo(() => {
    const q = filter.trim();
    return choices.filter((p) => {
      if (p.kind === 'thread') {
        return !q || p.label.toLowerCase().includes(q.toLowerCase());
      }
      return itemMatches(p.item, q);
    });
  }, [choices, filter]);

  useEffect(() => {
    if (selectedIdx >= filtered.length) setSelectedIdx(0);
  }, [filtered.length, selectedIdx]);

  const apply = async (pick: Pick | null) => {
    if (!item) return;
    setSaving(true);
    setError(null);
    try {
      const servesId =
        pick === null
          ? null
          : pick.kind === 'thread'
            ? `thread:${pick.projectId}`
            : pick.item.id;
      await setItemServes(item.id, servesId);
      onClose();
    } catch (err) {
      setSaving(false);
      if (err instanceof ValidationError) {
        setError(Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(', '));
      } else {
        setError((err as Error).message);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((i) => Math.min(filtered.length - 1, i + 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIdx]) void apply(filtered[selectedIdx]);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, selectedIdx, item]);

  if (!open || !item) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,46,51,.34)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        zIndex: 110,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 560,
          maxWidth: '94%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxHeight: 'calc(100vh - 132px)',
        }}
      >
        <div
          style={{
            padding: '13px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <KindIcon kind={item.kind} size={13} muted />
          <span style={{ fontWeight: 500, flex: 1 }}>{item.title}</span>
          {project && <ProjectTag slug={project.slug} />}
        </div>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--line)' }}>
          <Mono dim>
            attach to a crystal · idea · question — or to the thread itself
          </Mono>
          <input
            ref={filterRef}
            className="km-input"
            placeholder="filter…"
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setSelectedIdx(0);
            }}
            style={{ marginTop: 8, width: '100%', fontSize: 13 }}
          />
        </div>
        <div style={{ overflow: 'auto', maxHeight: 380 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <Mono dim>nothing matches</Mono>
            </div>
          ) : (
            filtered.map((p, i) => {
              const selected = i === selectedIdx;
              const bg = selected ? 'rgba(217,98,44,.10)' : 'transparent';
              if (p.kind === 'thread') {
                return (
                  <div
                    key={`thread:${p.projectId}`}
                    onClick={() => void apply(p)}
                    onMouseEnter={() => setSelectedIdx(i)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 18px',
                      cursor: 'pointer',
                      background: bg,
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <Icons.menu size={13} stroke="var(--fg-muted)" />
                    <span style={{ flex: 1, fontWeight: 500 }}>{p.label}</span>
                    <Mono dim>thread anchor</Mono>
                  </div>
                );
              }
              const it = p.item;
              const isCrystal =
                it.kind === 'crystallization' || it.state === 'crystallized';
              return (
                <div
                  key={it.id}
                  onClick={() => void apply(p)}
                  onMouseEnter={() => setSelectedIdx(i)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 18px',
                    cursor: 'pointer',
                    background: bg,
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  {isCrystal ? (
                    <Icons.gem size={13} stroke="#B07E12" />
                  ) : (
                    <KindIcon kind={it.kind} size={13} muted />
                  )}
                  <span style={{ flex: 1, fontWeight: 500 }}>{it.title}</span>
                  <Mono dim>{isCrystal ? (it.ctype ?? 'crystal') : it.kind}</Mono>
                </div>
              );
            })
          )}
        </div>
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {item.servesId && (
            <button
              className="km-btn km-btn-ghost"
              disabled={saving}
              onClick={() => void apply(null)}
              style={{ color: 'var(--ember-deep)' }}
            >
              Detach
            </button>
          )}
          {error && (
            <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
          )}
          <span style={{ flex: 1 }} />
          <Mono dim>↑↓ to navigate · enter to attach · esc to cancel</Mono>
        </div>
      </div>
    </div>
  );
};

export default AttachToThinkingModal;
