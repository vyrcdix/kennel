import { KindIcon } from './KindIcon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import type { Item, Project } from '../data/types';
import { formatDate } from '../data/time';

const DAY = 86400_000;

export type AgingRowProps = {
  item: Item;
  project?: Project;
  selected?: boolean;
  /** Age column copy; defaults to "Xd cold". The Reflecting lens passes
   *  "shelved Xd" — same row, different framing. */
  agedLabel?: (days: number) => string;
  onPickUp: () => void;
  onCrystallize: () => void;
  onFile: () => void;
  /** When present, renders a fourth "Let go" button (Reflecting lens). */
  onLetGo?: () => void;
};

export const AgingRow = ({
  item,
  project,
  selected,
  agedLabel,
  onPickUp,
  onCrystallize,
  onFile,
  onLetGo,
}: AgingRowProps) => {
  const last = item.lastTouchedAt ?? item.updatedAt;
  const days = Math.floor((Date.now() - last.getTime()) / DAY);
  return (
    <div
      className={`km-row ${selected ? 'km-active-row' : ''}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 110px 1fr 110px 80px auto',
        alignItems: 'center',
        gap: 12,
        padding: '10px 14px',
        background: selected ? 'color-mix(in srgb, var(--action) 5%, transparent)' : 'transparent',
        opacity: selected ? 1 : 0.82,
        borderBottom: '1px solid var(--line)',
      }}
    >
      <KindIcon kind={item.kind} />
      {project && <ProjectTag slug={project.slug} />}
      <span className="km-body" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </span>
      <Mono>{agedLabel ? agedLabel(days) : `${days}d cold`}</Mono>
      <Mono dim>{formatDate(last)}</Mono>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="km-btn km-btn-ghost"
          onClick={onPickUp}
          style={{ padding: '4px 9px', fontSize: 11.5 }}
        >
          Pick up
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={onCrystallize}
          style={{ padding: '4px 9px', fontSize: 11.5 }}
        >
          Crystallize
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={onFile}
          style={{
            padding: '4px 9px',
            fontSize: 11.5,
            // The terminal action carries the ember warning tint; with a
            // Let go button present, File is the milder of the two.
            color: onLetGo ? undefined : 'var(--ember-deep)',
          }}
        >
          File
        </button>
        {onLetGo && (
          <button
            className="km-btn km-btn-ghost"
            onClick={onLetGo}
            style={{ padding: '4px 9px', fontSize: 11.5, color: 'var(--ember-deep)' }}
          >
            Let go
          </button>
        )}
      </div>
    </div>
  );
};

export default AgingRow;
