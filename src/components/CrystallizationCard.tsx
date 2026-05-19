import { useNavigate } from 'react-router-dom';
import { Mono } from './Mono';
import type { Item } from '../data/types';
import { formatRelative } from '../data/time';

export type CrystallizationCardProps = {
  item: Item;
  lineage?: string; // e.g. "from 4 items, 1 chat"
};

export const CrystallizationCard = ({ item, lineage }: CrystallizationCardProps) => {
  const navigate = useNavigate();
  const onClick = () => {
    if (item.docId) navigate(`/doc/${item.docId}`);
  };
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        cursor: item.docId ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="km-body" style={{ fontWeight: 500, flex: 1, lineHeight: 1.4 }}>
          {item.title}
        </span>
        <span className="km-display-sm" style={{ color: 'var(--moss)', fontSize: 9 }}>
          DURABLE
        </span>
      </div>
      {item.body && (
        <div
          className="km-body-sm"
          style={{
            lineHeight: 1.55,
            color: 'var(--fg-muted)',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {item.body}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {lineage && <Mono dim>{lineage}</Mono>}
        {lineage && <Mono dim>·</Mono>}
        <Mono>
          crystallized {formatRelative(item.doneAt ?? item.updatedAt)}
        </Mono>
      </div>
    </div>
  );
};

export default CrystallizationCard;
