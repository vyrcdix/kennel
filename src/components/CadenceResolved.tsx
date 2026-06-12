// Collapsed cadence row after an action (C3). "Did it" / "Skip" both fold the
// card down to this calm one-liner with Undo — the action is fed, not done, and
// it comes back next window. Both skins.
import type { ReactNode } from 'react';
import { Mono } from './Mono';
import { Icons } from './Icon';
import type { Item } from '../data/types';

export const CadenceResolved = ({
  item,
  kind,
  onUndo,
  onNote,
  memoSlot,
}: {
  item: Item;
  kind: 'did' | 'skip';
  onUndo: () => void;
  onNote?: () => void;
  memoSlot?: ReactNode;
}) => {
  const kept = kind === 'did';
  const comesBack =
    item.cadence === 'daily' ? 'tomorrow' : item.cadence === 'monthly' ? 'next month' : 'next week';
  return (
    <div className="km-card" style={{ padding: '12px 16px', opacity: 0.96, boxShadow: 'var(--shadow-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span
          style={{
            width: 22,
            height: 22,
            borderRadius: 999,
            flex: '0 0 auto',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: kept ? 'var(--sacred-soft)' : 'var(--sunk)',
            color: kept ? 'var(--sacred-ink)' : 'var(--ink-faint)',
          }}
        >
          {kept ? <Icons.check size={13} /> : <Icons.repeat size={12} />}
        </span>
        <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-muted)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{item.title}</span>
          {' — '}
          {kept ? 'kept up.' : 'rolled on.'}{' '}
          <Mono dim style={{ fontSize: 11.5 }}>comes back {comesBack}</Mono>
        </span>
        {kept && onNote && !memoSlot && (
          <button className="km-btn km-btn-ghost km-btn-sm" onClick={onNote}>
            <Icons.mic size={13} /> jot a note
          </button>
        )}
        <button className="km-btn km-btn-ghost km-btn-sm" style={{ color: 'var(--action-ink)' }} onClick={onUndo}>
          <Icons.arrowDown size={13} style={{ transform: 'rotate(90deg)' }} /> Undo
        </button>
      </div>
      {memoSlot && <div style={{ marginTop: 10 }}>{memoSlot}</div>}
    </div>
  );
};

export default CadenceResolved;
