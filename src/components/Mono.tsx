import type { CSSProperties, ReactNode } from 'react';

export type MonoProps = { children: ReactNode; style?: CSSProperties; dim?: boolean };

export const Mono = ({ children, style, dim }: MonoProps) => (
  <span
    className="km-mono-sm"
    style={{ color: dim ? 'var(--fg-faint)' : undefined, ...style }}
  >
    {children}
  </span>
);

export default Mono;
