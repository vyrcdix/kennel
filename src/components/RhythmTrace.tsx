// Rhythm trace (C3) — recent windows as warmth, not a score. Kept = filled in
// the vitality hue with a gentle opacity ramp toward the newest; skipped = a
// hollow outline. Followed by the gentle streak text. No deficit number, ever.
import { Mono } from './Mono';
import { VITALITY_COLOR, streakText } from '../lib/cadence';
import type { Cadence } from '../data/types';
import type { Temp } from '../lib/temperature';

export const RhythmTrace = ({
  trace,
  vitality,
  keptCount,
  cadence,
}: {
  /** Recent windows, newest LAST: 1 = kept, 0 = skipped. */
  trace: number[];
  vitality: Temp;
  keptCount: number;
  cadence: Cadence;
}) => {
  const col = VITALITY_COLOR[vitality];
  const n = Math.max(1, trace.length - 1);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title="rhythm">
        {trace.map((k, i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 12,
              borderRadius: 999,
              flex: '0 0 auto',
              background: k ? col : 'transparent',
              border: k ? 'none' : '1.5px solid color-mix(in srgb, var(--ink) 18%, transparent)',
              opacity: k ? 0.55 + 0.45 * (i / n) : 1,
            }}
          />
        ))}
      </span>
      <Mono dim style={{ fontSize: 11.5 }}>{streakText(keptCount, cadence)}</Mono>
    </span>
  );
};

export default RhythmTrace;
