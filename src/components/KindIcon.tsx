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
