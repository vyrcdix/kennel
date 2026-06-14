import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import {
  getAllCrystals,
  getProjectCounts,
  getProjects,
  getTotalReflectingCount,
  getTriageBadgeCount,
} from '../data/selectors';
import { getBearings } from '../lib/compass';
import { useStoreVersion } from '../data/store';
import { useSkin } from '../lib/skin';
import { copy } from '../lib/copy';
import { openCreateProject } from '../lib/modals';

export type NavRailActive =
  | 'compass'
  | 'dashboard'
  | 'crystals'
  | 'triage'
  | 'reflecting'
  | 'search'
  | 'skills'
  | 'chart'
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
  useSkin(); // re-render the renamed labels (Harbour / Currents) on skin toggle

  const triageCount = getTriageBadgeCount();
  const crystalCount = getAllCrystals().length;
  const reflectingCount = getTotalReflectingCount();
  const bearingCount = getBearings().length;
  // Harbour (the dashboard) is the landing page and sits at the top of the
  // nav; Compass follows just beneath it (Craig, 2026-06-14 — reverses the
  // earlier "Compass above Harbour" override). Compass keeps its sacred-family
  // accent, like Crystals.
  const sys: SysItem[] = [
    { id: 'dashboard', icon: Icons.menu,   label: copy('nav.dashboard'), to: '/' },
    { id: 'compass',   icon: Icons.compass, label: 'Compass',      to: '/compass', n: bearingCount },
    { id: 'crystals',  icon: Icons.gem,    label: 'All crystals',  to: '/crystals', n: crystalCount },
    { id: 'triage',    icon: Icons.filter, label: 'The bench',     to: '/triage', n: triageCount },
    { id: 'reflecting', icon: Icons.park,  label: 'Reflecting',    to: '/reflecting', n: reflectingCount },
    { id: 'search',    icon: Icons.search, label: 'Search',        to: '/search' },
    { id: 'skills',    icon: Icons.star,   label: 'Skills',        to: '/proposal' },
    { id: 'chart',     icon: Icons.book,   label: 'The Chart',     to: '/chart' },
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
        // Crystals row uses the blaze family colour (per v0.5 reserved-
        // colour rule: blaze = crystallization). All other rows keep the
        // ember "primary action" tint.
        const isSacred = s.id === 'crystals' || s.id === 'compass';
        const activeBg = isSacred
          ? 'color-mix(in srgb, var(--sacred) 16%, transparent)'
          : 'color-mix(in srgb, var(--action) 10%, transparent)';
        const activeBorder = isSacred ? 'var(--sacred-ink)' : 'var(--ember)';
        const activeColor = isSacred ? 'var(--sacred-ink-deep)' : 'var(--ember-deep)';
        const idleColor = isSacred ? 'var(--sacred-ink-deep)' : 'var(--fg)';
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
              background: isActive ? activeBg : 'transparent',
              boxShadow: isActive ? `inset 2px 0 0 ${activeBorder}` : 'none',
              color: isActive ? activeColor : idleColor,
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
        <Label>{copy('nav.pinnedThreads')}</Label>
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
              background: isActive ? 'color-mix(in srgb, var(--fam-guide) 10%, transparent)' : 'transparent',
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
        <span style={{ flex: 1, fontSize: 13 }}>{copy('nav.newThread')}</span>
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
