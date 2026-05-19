import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import {
  getProjectCounts,
  getProjects,
  getTriageBadgeCount,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { openCreateProject } from '../lib/modals';

export type NavRailActive =
  | 'dashboard'
  | 'triage'
  | 'search'
  | 'skills'
  | 'settings'
  | '';

export type NavRailProps = {
  active?: NavRailActive;
  /** Slug of the currently-open project, if any (for the moss highlight). */
  activeProjectSlug?: string;
};

type SysItem = {
  id: NavRailActive;
  icon: (p?: { size?: number }) => JSX.Element;
  label: string;
  n?: number;
  to: string;
};

export const NavRail = ({ active = 'dashboard', activeProjectSlug }: NavRailProps) => {
  const navigate = useNavigate();
  useStoreVersion();

  const triageCount = getTriageBadgeCount();
  const sys: SysItem[] = [
    { id: 'dashboard', icon: Icons.menu,   label: 'Dashboard',     to: '/' },
    { id: 'triage',    icon: Icons.filter, label: 'Triage queue',  to: '/triage', n: triageCount },
    { id: 'search',    icon: Icons.search, label: 'Search',        to: '/search' },
    { id: 'skills',    icon: Icons.star,   label: 'Skills',        to: '/proposal' },
    { id: 'settings',  icon: Icons.cog,    label: 'Settings',      to: '/settings' },
  ];

  const allProjects = getProjects();

  return (
    <aside
      style={{
        width: 224,
        flex: '0 0 224px',
        borderRight: '1px solid var(--line)',
        padding: '14px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        background: 'var(--surface-0)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '2px 16px 6px' }}>
        <Label>Workspace</Label>
      </div>
      {sys.map((s) => {
        const isActive = active === s.id;
        return (
          <button
            key={s.id}
            className="km-row"
            onClick={() => navigate(s.to)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '5px 16px',
              border: 0,
              background: isActive ? 'rgba(217,98,44,.10)' : 'transparent',
              boxShadow: isActive ? 'inset 2px 0 0 var(--ember)' : 'none',
              color: isActive ? 'var(--ember-deep)' : 'var(--fg)',
              fontSize: 13,
              fontFamily: 'var(--ff-sans)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <s.icon size={14} />
            <span style={{ flex: 1 }}>{s.label}</span>
            {s.n != null && s.n > 0 && <Mono>{s.n}</Mono>}
          </button>
        );
      })}
      <div style={{ padding: '14px 16px 6px' }}>
        <Label>Pinned projects</Label>
      </div>
      {allProjects.map((p) => {
        const isActive = activeProjectSlug === p.slug;
        const counts = getProjectCounts(p.id);
        const total = counts.active + counts.reflecting;
        return (
          <button
            key={p.slug}
            className="km-row"
            onClick={() => navigate(`/project/${p.slug}`)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '5px 16px',
              border: 0,
              background: isActive ? 'rgba(92,122,62,.10)' : 'transparent',
              boxShadow: isActive ? 'inset 2px 0 0 var(--moss)' : 'none',
              color: 'var(--fg)',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <span
              className="km-mono-sm"
              style={{
                color: isActive ? 'var(--moss)' : 'var(--fg-faint)',
                flex: '0 0 auto',
                width: 6,
                textAlign: 'center',
              }}
            >
              {isActive ? '●' : '○'}
            </span>
            <span
              style={{
                flex: 1,
                fontSize: 13,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {p.name}
            </span>
            {total > 0 && <Mono>{total}</Mono>}
          </button>
        );
      })}
      <button
        className="km-row"
        onClick={openCreateProject}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          width: '100%',
          padding: '8px 16px 5px',
          border: 0,
          background: 'transparent',
          color: 'var(--fg-muted)',
          cursor: 'pointer',
          textAlign: 'left',
          marginTop: 4,
        }}
      >
        <Icons.plus size={13} />
        <span style={{ flex: 1, fontSize: 13 }}>New project</span>
        <Mono dim>⌘⇧N</Mono>
      </button>
      <div style={{ flex: 1 }} />
      <div
        style={{
          padding: '10px 16px',
          borderTop: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <Mono>v0.1.4</Mono>
        <span style={{ flex: 1 }} />
        <Mono dim>↻ synced 14:32</Mono>
      </div>
    </aside>
  );
};

export default NavRail;
