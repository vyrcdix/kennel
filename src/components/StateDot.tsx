export type ItemState = 'inbox' | 'active' | 'parked' | 'done' | 'archived' | 'dismissed';

export type StateDotProps = { state: ItemState };

export const StateDot = ({ state }: StateDotProps) => {
  if (state === 'inbox' || state === 'dismissed') return null;
  if (state === 'active') return <span className="km-dot km-dot-ember" title="active" />;
  if (state === 'parked') return <span className="km-dot km-dot-dust" title="parked" />;
  if (state === 'done') return <span className="km-dot km-dot-moss" title="done" />;
  if (state === 'archived') return <span className="km-dot km-dot-slate" title="archived" />;
  return null;
};

export default StateDot;
