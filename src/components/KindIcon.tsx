import { Icons } from './Icon';
import type { ItemKind } from '../data/types';

/** Includes `chat` even though it isn't a real item kind — useful for rendering
 *  chat rows / search hits with the same atom. */
export type IconKind = ItemKind | 'chat';

const map: Record<IconKind, (p?: { size?: number }) => JSX.Element> = {
  idea: Icons.bulb,
  note: Icons.note,
  action: Icons.check,
  doc: Icons.doc,
  ref: Icons.link,
  chat: Icons.chat,
  // v0.3 additions — Question reuses the bulb (a different render-time treatment
  // overrides this in screens that want the ember "?" glyph); Crystallization
  // reuses the doc icon (with moss accent + DURABLE stamp applied at use site).
  question: Icons.bulb,
  crystallization: Icons.doc,
};

export type KindIconProps = { kind: IconKind; size?: number; muted?: boolean };

export const KindIcon = ({ kind, size = 14, muted = true }: KindIconProps) => {
  const C = map[kind] ?? Icons.note;
  return (
    <span style={{ color: muted ? 'var(--fg-muted)' : 'var(--fg)' }}>
      <C size={size} />
    </span>
  );
};

export default KindIcon;
