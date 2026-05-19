import type { ReactNode } from 'react';
import { Label } from './Label';

export type SectionHeadProps = { title: ReactNode; right?: ReactNode; dense?: boolean };

export const SectionHead = ({ title, right, dense }: SectionHeadProps) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: dense ? '8px 14px' : '12px 16px',
    }}
  >
    <Label>{title}</Label>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>{right}</div>
  </div>
);

export default SectionHead;
