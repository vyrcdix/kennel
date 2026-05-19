import type { CSSProperties, ReactNode } from 'react';
import type { Temp } from '../lib/temperature';

type Meta = {
  topEdge: string;
  edgeWidth: number;
  tint: string;
  opacity: number;
};

const TEMP_META: Record<Temp, Meta> = {
  fresh:   { topEdge: 'var(--ember-deep)',  edgeWidth: 2, tint: 'rgba(217,98,44,.04)',   opacity: 1 },
  active:  { topEdge: 'transparent',        edgeWidth: 0, tint: 'transparent',           opacity: 1 },
  aging:   { topEdge: 'var(--dust)',        edgeWidth: 2, tint: 'rgba(201,168,124,.06)', opacity: 0.96 },
  dormant: { topEdge: 'var(--slate-light)', edgeWidth: 2, tint: 'rgba(201,168,124,.04)', opacity: 0.82 },
};

export type ThermalPanelProps = {
  temp: Temp;
  children: ReactNode;
  /** Inline style overrides — merged AFTER the temperature treatment. */
  style?: CSSProperties;
  /** Optional className override; defaults to "km-card". */
  className?: string;
};

/** Wraps a panel with the temperature treatment: 2px top edge + subtle tint
 *  + opacity, per the level. `active` renders neutral (no chrome). */
export const ThermalPanel = ({
  temp,
  children,
  style,
  className = 'km-card',
}: ThermalPanelProps) => {
  const m = TEMP_META[temp];
  const base: CSSProperties = {
    padding: 0,
    borderTop: m.edgeWidth
      ? `${m.edgeWidth}px solid ${m.topEdge}`
      : '1px solid var(--line)',
    background:
      temp === 'active'
        ? 'var(--surface-1)'
        : `linear-gradient(${m.tint}, ${m.tint}), var(--surface-1)`,
    opacity: m.opacity,
  };
  return (
    <div className={className} style={{ ...base, ...style }}>
      {children}
    </div>
  );
};

export default ThermalPanel;
