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
  onPickUp: () => void;
  onCrystallize: () => void;
  onFile: () => void;
};

export const AgingRow = ({
  item,
  project,
  selected,
  onPickUp,
  onCrystallize,
  onFile,
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
        background: selected ? 'rgba(217,98,44,.05)' : 'transparent',
        opacity: selected ? 1 : 0.82,
        borderBottom: '1px solid var(--line)',
      }}
    >
      <KindIcon kind={item.kind} />
      {project && <ProjectTag slug={project.slug} />}
      <span className="km-body" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {item.title}
      </span>
      <Mono>{days}d cold</Mono>
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
          style={{ padding: '4px 9px', fontSize: 11.5, color: 'var(--ember-deep)' }}
        >
          File
        </button>
      </div>
    </div>
  );
};

export default AgingRow;
