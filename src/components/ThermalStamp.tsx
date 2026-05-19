import { Mono } from './Mono';
import type { Temp } from '../lib/temperature';

export type ThermalStampProps = {
  temp: Temp;
  /** Human-readable "12m ago", "yesterday", "27d ago" — same formatter
   *  used by Mono for timestamps elsewhere in the app. */
  since: string;
};

/** Header-right timestamp that gives the temperature an explicit time.
 *  active: lowercase muted "touched X"
 *  fresh: ember-deep dot + "FRESH · X"
 *  aging: ember-deep "AGING · X cold"
 *  dormant: muted slate-light "DORMANT · X" */
export const ThermalStamp = ({ temp, since }: ThermalStampProps) => {
  if (temp === 'active') return <Mono dim>touched {since}</Mono>;
  if (temp === 'fresh') {
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--ember)',
            boxShadow: '0 0 0 3px rgba(217,98,44,.18)',
          }}
        />
        <Mono style={{ color: 'var(--ember-deep)' }}>FRESH · {since}</Mono>
      </span>
    );
  }
  if (temp === 'aging') {
    return (
      <Mono style={{ color: 'var(--ember-deep)' }}>AGING · {since} cold</Mono>
    );
  }
  return (
    <Mono dim style={{ textTransform: 'uppercase', letterSpacing: '.08em' }}>
      DORMANT · {since}
    </Mono>
  );
};

export default ThermalStamp;
