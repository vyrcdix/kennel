import { Mono } from './Mono';
import { Actor, type ActorWho } from './Actor';

export type ActivityEntryProps = {
  time: string;
  who: ActorWho;
  verb: string;
  target: string;
  payload?: string;
};

export const ActivityEntry = ({ time, who, verb, target, payload }: ActivityEntryProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'baseline',
      gap: 10,
      padding: '5px 0',
      fontSize: 13,
    }}
  >
    <Mono style={{ minWidth: 50 }}>{time}</Mono>
    <Actor who={who} />
    <span className="km-display-sm" style={{ fontSize: 10, minWidth: 62 }}>{verb}</span>
    <span className="km-link" style={{ borderBottomStyle: 'dashed' }}>{target}</span>
    <span className="km-body-sm" style={{ flex: 1 }}>{payload}</span>
  </div>
);

export default ActivityEntry;
