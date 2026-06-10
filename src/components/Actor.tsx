import type { Actor as ActorRole } from '../data/types';

export type ActorWho = 'C' | 'Cl' | 'CLI' | 'sys';

const map: Record<ActorWho, { label: string; bg: string; fg: string }> = {
  C:   { label: 'C', bg: 'var(--slate)',      fg: 'var(--bone)' },
  Cl:  { label: '⌬', bg: 'var(--ember-deep)', fg: 'var(--bone)' },
  CLI: { label: '⎈', bg: 'var(--moss)',       fg: 'var(--bone)' },
  sys: { label: '•', bg: 'var(--surface-2)',  fg: 'var(--fg-muted)' },
};

const roleToWho: Record<ActorRole, ActorWho> = {
  craig: 'C',
  claude: 'Cl',
  cli: 'CLI',
  system: 'sys',
};

export const toActorWho = (role: ActorRole): ActorWho => roleToWho[role];

export type ActorProps = { who: ActorWho };

export const Actor = ({ who }: ActorProps) => {
  const a = map[who] ?? map.sys;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 16,
        height: 16,
        borderRadius: 3,
        background: a.bg,
        color: a.fg,
        fontFamily: 'var(--ff-mono)',
        fontSize: 10,
        lineHeight: 1,
      }}
    >
      {a.label}
    </span>
  );
};

export default Actor;
