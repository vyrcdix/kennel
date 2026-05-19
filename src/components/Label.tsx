import type { CSSProperties, ReactNode } from 'react';

export type LabelProps = { children: ReactNode; style?: CSSProperties };

export const Label = ({ children, style }: LabelProps) => (
  <div className="km-display-sm" style={style}>{children}</div>
);

export default Label;
