// Compass shared atoms — the small building blocks reused across the band, the
// lens card, and the orientation page. Layout-only, sacred-family dress; they
// re-skin through the .cmp-* token remaps. See docs/compass-build-plan.md P3.
import type { CSSProperties, ReactNode } from 'react';
import { Icons } from '../Icon';
import { getProjectById } from '../../data/selectors';

/** A calm, fixed scatter of stars with one lodestar (top-right). Decorative. */
const CMP_STARS = [
  { x: 7, y: 42, r: 2, o: 0.5 }, { x: 16, y: 70, r: 1.5, o: 0.35 }, { x: 25, y: 30, r: 2.5, o: 0.55 },
  { x: 36, y: 64, r: 1.5, o: 0.3 }, { x: 46, y: 24, r: 2, o: 0.45 }, { x: 57, y: 58, r: 1.5, o: 0.35 },
  { x: 66, y: 36, r: 2, o: 0.5 }, { x: 77, y: 64, r: 1.5, o: 0.3 }, { x: 90, y: 28, r: 5, o: 1, lode: true },
  { x: 94, y: 54, r: 2, o: 0.4 },
];

export const CompassStars = () => (
  <div className="cmp-stars" aria-hidden="true">
    {CMP_STARS.map((s, i) => (
      <span
        key={i}
        className={'cmp-star' + (s.lode ? ' lode' : '')}
        style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.r, height: s.r, opacity: s.o }}
      />
    ))}
  </div>
);

/** The amber eyebrow (sacred); on a .cmp-sky it picks up the sky-ink tone. */
export const CompassEyebrow = ({
  icon,
  children,
  style,
}: {
  icon?: ReactNode;
  children: ReactNode;
  style?: CSSProperties;
}) => (
  <div className="cmp-eyebrow" style={style}>
    {icon}
    {children}
  </div>
);

/** Resolve a bearing's tint from its owning thread (falls back to sacred). */
const tintVar = (color?: string | null) => (color ? `var(--tint-${color})` : 'var(--sacred)');

/** The bearing medallion — a forward star in the thread's tint. */
export const BearingGlyph = ({
  projectId,
  size = 32,
}: {
  projectId?: string;
  size?: number;
}) => {
  const color = projectId ? getProjectById(projectId)?.color : undefined;
  const tint = tintVar(color);
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        flex: '0 0 auto',
        background: `color-mix(in oklab, ${tint} 16%, transparent)`,
        color: tint,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icons.star4 size={Math.round(size * 0.54)} />
    </span>
  );
};

/** The "orientation" type label — the forward-pointed sibling of CType. */
export const OrientationType = ({ children = 'orientation' }: { children?: ReactNode }) => (
  <span
    className="km-mono-sm"
    style={{
      fontSize: 10.5,
      letterSpacing: '.12em',
      textTransform: 'uppercase',
      color: 'var(--cmp-ink)',
      background: 'var(--sacred-soft)',
      padding: '2px 8px',
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
    }}
  >
    <Icons.star4 size={11} />
    {children}
  </span>
);
