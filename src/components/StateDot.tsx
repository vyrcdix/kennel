import type { ItemState } from '../../shared/types';
import { STATE_DOT_CLASS, STATE_LABEL } from '../lib/lifecycle';

export type StateDotProps = { state: ItemState };

export const StateDot = ({ state }: StateDotProps) => {
  const klass = STATE_DOT_CLASS[state];
  if (!klass) return null;
  return <span className={`km-dot ${klass}`} title={STATE_LABEL[state]} />;
};

export default StateDot;
