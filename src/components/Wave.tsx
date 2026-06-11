// A quiet sine-wave divider — a Tidewater motif used under the wordmark
// (Login, B1), in the Dashboard orientation strip and on the Reflecting
// shelf. Pure stroke, no fill; rides --ink-faint by default so it reads as
// a whisper, not a rule. Workshop never renders it.
export type WaveProps = {
  width?: number;
  opacity?: number;
  color?: string;
};

export const Wave = ({ width = 160, opacity = 0.5, color = 'var(--ink-faint)' }: WaveProps) => {
  const h = 10;
  // Two gentle periods across the width.
  const period = width / 2;
  const path = `M0 ${h / 2} q ${period / 4} -${h / 2} ${period / 2} 0 t ${period / 2} 0 t ${period / 2} 0 t ${period / 2} 0`;
  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${width} ${h}`}
      fill="none"
      style={{ display: 'block', opacity }}
      aria-hidden="true"
    >
      <path d={path} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
};

export default Wave;
