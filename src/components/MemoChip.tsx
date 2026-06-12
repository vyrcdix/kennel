// The saved-memo chip (C6) — shown on the card / resolved row after a memo
// files into field notes.
import { Icons } from './Icon';
import { Mono } from './Mono';
import { sectionLabel } from '../lib/cadenceMemo';
import type { Memo } from './MemoComposer';
import type { Project } from '../data/types';

export const MemoChip = ({
  project,
  memo,
  onEdit,
}: {
  project?: Project;
  memo: Memo;
  onEdit?: () => void;
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '9px 11px',
      borderRadius: 'var(--r-ctrl)',
      background: 'var(--card-2)',
      border: '1px solid var(--line)',
    }}
  >
    <Icons.note size={13} stroke="var(--action-ink)" />
    <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
      {memo.text}
    </span>
    <Mono dim style={{ fontSize: 10.5, flex: '0 0 auto' }}>
      → {project ? `${project.slug} ` : ''}field notes · {sectionLabel(memo.section)}
    </Mono>
    {onEdit && (
      <button className="km-btn km-btn-ghost km-btn-sm" style={{ padding: 5 }} onClick={(e) => { e.stopPropagation(); onEdit(); }}>
        <Icons.note size={13} />
      </button>
    )}
  </div>
);

export default MemoChip;
