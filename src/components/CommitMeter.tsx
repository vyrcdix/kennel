// Commitment meter (C3) — three quiet bars + an optional label. The dial is
// DECLARED, not earned; this reads as state, never a score. Both skins.
import { Mono } from './Mono';
import { COMMIT } from '../lib/cadence';
import type { Commitment } from '../data/types';

export const CommitMeter = ({
  level,
  showLabel = true,
}: {
  level: Commitment;
  showLabel?: boolean;
}) => {
  const c = COMMIT[level];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} title={c.blurb}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 13 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              width: 3,
              height: 5 + i * 4,
              borderRadius: 2,
              background:
                i < c.bars
                  ? 'var(--ink-muted)'
                  : 'color-mix(in srgb, var(--ink) 13%, transparent)',
            }}
          />
        ))}
      </span>
      {showLabel && <Mono style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{c.label}</Mono>}
    </span>
  );
};

export default CommitMeter;
