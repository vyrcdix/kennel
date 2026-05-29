import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { KindIcon } from './KindIcon';
import { ProjectTag } from './ProjectTag';
import { StateDot } from './StateDot';
import { Mono } from './Mono';
import { formatDue } from '../data/time';
import { openEditItem } from '../lib/modals';
import type { Item, Project } from '../data/types';

export type NextUpRowProps = {
  item: Item;
  project: Project;
  selected?: boolean;
};

export const NextUpRow = ({ item, project, selected }: NextUpRowProps) => {
  const navigate = useNavigate();
  // Doc-backed items open the full editor; everything else opens the
  // lightweight title+body edit modal in-place. The old "fall through to
  // project landing" behaviour was a dead-end for raw items.
  const onOpen = () => {
    if (item.docId) {
      navigate(`/doc/${item.docId}`);
    } else {
      openEditItem(item.id);
    }
  };
  return (
    <div
      className={`km-row ${selected ? 'km-active-row' : ''}`}
      onClick={onOpen}
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 14px 110px 1fr 90px 16px',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
      }}
    >
      <span style={{ color: 'var(--fg-faint)', opacity: selected ? 1 : 0 }}>
        <Icons.grip size={12} />
      </span>
      <KindIcon kind={item.kind} />
      <ProjectTag slug={project.slug} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span
          className="km-body"
          style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {item.title}
        </span>
        {item.hash && (
          <span className="km-mono-sm" style={{ color: 'var(--fg-faint)' }}>{item.hash}</span>
        )}
      </div>
      <Mono>{formatDue(item.dueAt)}</Mono>
      <StateDot state={item.state} />
    </div>
  );
};

export default NextUpRow;
