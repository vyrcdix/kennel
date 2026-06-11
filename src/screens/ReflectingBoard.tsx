// Reflecting lens — items deliberately set aside ("Set aside" / P at
// Sort) land in `reflecting`. This board is the door back out. Scope with
// ?project=<slug> (per-project counts on Dashboard/ProjectLanding link here
// scoped).
//
// Two skins, one data path: Workshop keeps the AgingRow grid; Life
// ("Tidewater") renders the centered shelf with a selected-row inline action
// bar. Both share getReflectingItems and the same lifecycle actions; Life
// routes removals through removeItem so they animate + offer Undo.

import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgingRow } from '../components/AgingRow';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { ThermalPanel } from '../components/ThermalPanel';
import { Wave } from '../components/Wave';
import {
  crystallizeItem,
  fileItem,
  transitionItem,
} from '../data/actions';
import {
  getProjectById,
  getProjectBySlug,
  getReflectingItems,
  getTagsFor,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { formatRelativeLoose } from '../data/time';
import type { Item, Project } from '../data/types';
import { removeItem, type RemovalAction } from '../lib/permanence';
import { useSkin } from '../lib/skin';
import { useKeyedListNav } from '../lib/useKeyedListNav';

const DAY = 86400_000;
const shelvedLabel = (days: number) =>
  days === 0 ? 'shelved today' : `shelved ${days}d`;

export const ReflectingBoard = () => {
  const v = useStoreVersion();
  const [skin] = useSkin();
  const [params, setParams] = useSearchParams();
  const projectSlug = params.get('project') ?? undefined;
  const project = projectSlug ? getProjectBySlug(projectSlug) : undefined;
  const reflecting = useMemo(
    () => getReflectingItems(project?.id),
    [v, project?.id],
  );

  return skin === 'life' ? (
    <ReflectingLife
      reflecting={reflecting}
      project={project}
      clearProject={() => setParams({})}
    />
  ) : (
    <ReflectingWorkshop
      reflecting={reflecting}
      project={project}
      setParams={setParams}
    />
  );
};

// ─────────────────────────── Workshop ──────────────────────────────────
const ReflectingWorkshop = ({
  reflecting,
  project,
  setParams,
}: {
  reflecting: Item[];
  project?: Project;
  setParams: (p: Record<string, string>) => void;
}) => {
  const [selectedId] = useKeyedListNav(reflecting, {
    u: (id) => void transitionItem(id, 'active'),
    c: (id) => void crystallizeItem(id, { promoteKind: true }),
    f: (id) => void fileItem(id),
    x: (id) => void transitionItem(id, 'dismissed'),
  });

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="reflecting" activeProjectSlug={project?.slug} />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '22px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
            <div className="km-display-lg">Reflecting</div>
            <Mono dim>
              {project ? `thread "${project.slug}"` : 'across all threads'} ·{' '}
              {reflecting.length} set aside · pick up / crystallize / file / let go
            </Mono>
            {project && (
              <button
                className="km-btn km-btn-ghost"
                onClick={() => setParams({})}
                style={{ padding: '3px 9px', fontSize: 11.5 }}
              >
                Show all threads
              </button>
            )}
          </div>
          <div
            className="km-body"
            style={{ color: 'var(--fg-muted)', maxWidth: 720, marginBottom: 22, lineHeight: 1.55 }}
          >
            Things you set aside on purpose. Come back through them deliberately —
            pick up what's ripened, crystallize what settled, let go of the rest.
          </div>

          {reflecting.length === 0 ? (
            <div
              style={{
                padding: 32,
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 3,
              }}
            >
              <div className="km-display-md" style={{ marginBottom: 4 }}>Nothing's set aside.</div>
              <Mono dim>
                {project
                  ? `nothing reflecting in "${project.slug}" — Show all threads to widen`
                  : 'set aside from Sort lands here'}
              </Mono>
            </div>
          ) : (
            <ThermalPanel temp="active">
              {reflecting.map((item) => (
                <AgingRow
                  key={item.id}
                  item={item}
                  project={getProjectById(item.projectId)}
                  selected={item.id === selectedId}
                  agedLabel={shelvedLabel}
                  onPickUp={() => transitionItem(item.id, 'active')}
                  onCrystallize={() => crystallizeItem(item.id, { promoteKind: true })}
                  onFile={() => fileItem(item.id)}
                  onLetGo={() => transitionItem(item.id, 'dismissed')}
                />
              ))}
            </ThermalPanel>
          )}

          <div
            style={{
              marginTop: 18,
              padding: '10px 14px',
              background: 'var(--surface-1)',
              borderRadius: 3,
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Mono dim>shortcuts</Mono>
            <span className="km-kbd">J</span>
            <span className="km-kbd">K</span>
            <span className="km-body-sm">navigate</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">U</span>
            <span className="km-body-sm">pick up</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">C</span>
            <span className="km-body-sm">crystallize</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">F</span>
            <span className="km-body-sm">file</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">X</span>
            <span className="km-body-sm">let go</span>
          </div>
        </main>
      </div>
    </div>
  );
};

// ──────────────────────────── Life ─────────────────────────────────────
const rowEl = (id: string) =>
  typeof document !== 'undefined'
    ? document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)
    : null;

const ReflectingLife = ({
  reflecting,
  project,
  clearProject,
}: {
  reflecting: Item[];
  project?: Project;
  clearProject: () => void;
}) => {
  // Client-side thread filter over the (possibly URL-scoped) list. Chips are
  // derived from the threads actually present on the shelf.
  const [filter, setFilter] = useState<string | null>(null);
  const chips = useMemo(() => {
    const seen = new Map<string, Project>();
    for (const it of reflecting) {
      if (seen.has(it.projectId)) continue;
      const p = getProjectById(it.projectId);
      if (p) seen.set(it.projectId, p);
    }
    return [...seen.values()];
  }, [reflecting]);
  const view = filter ? reflecting.filter((i) => i.projectId === filter) : reflecting;

  // Each removal restores to `reflecting` on Undo (where it came from).
  const act = (id: string, action: RemovalAction) => {
    const el = rowEl(id);
    const undo = () => transitionItem(id, 'reflecting');
    if (action === 'pickBackUp') {
      void removeItem({ action, el, mutate: () => transitionItem(id, 'active'), undo });
    } else if (action === 'crystallize') {
      void removeItem({ action, el, mutate: () => crystallizeItem(id, { promoteKind: true }), undo });
    } else if (action === 'file') {
      void removeItem({ action, el, mutate: () => fileItem(id), undo });
    } else {
      void removeItem({ action: 'letGo', el, mutate: () => transitionItem(id, 'dismissed'), undo });
    }
  };

  const [selectedId, setSelectedId] = useKeyedListNav(view, {
    u: (id) => act(id, 'pickBackUp'),
    c: (id) => act(id, 'crystallize'),
    f: (id) => act(id, 'file'),
    x: (id) => act(id, 'letGo'),
  });

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="reflecting" activeProjectSlug={project?.slug} />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 40px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ marginBottom: 8, color: 'var(--fg-faint)' }}>
              <Icons.archive size={22} />
            </div>
            <div className="km-display-lg" style={{ fontSize: 32, marginBottom: 6 }}>
              Reflecting
            </div>
            <div className="km-body" style={{ fontSize: 16, color: 'var(--fg-muted)', marginBottom: 6 }}>
              Not a backlog — the shallows. Things you set aside, drifting where you
              can still see them.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wave width={90} opacity={0.5} />
              <Mono dim>longest-shelved first · everything's recoverable from search</Mono>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                margin: '22px 0 6px',
                flexWrap: 'wrap',
              }}
            >
              <ThreadChip
                label="All threads"
                active={!filter}
                onClick={() => {
                  setFilter(null);
                  if (project) clearProject();
                }}
              />
              {chips.map((p) => (
                <ThreadChip
                  key={p.id}
                  label={p.slug}
                  color={p.color}
                  active={filter === p.id}
                  onClick={() => setFilter(p.id)}
                />
              ))}
              <span style={{ flex: 1 }} />
              <span className="kbdhint" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-faint)', fontSize: 12 }}>
                <span className="km-kbd">J</span>
                <span className="km-kbd">K</span> walk · <span className="km-kbd">U</span> pick up ·{' '}
                <span className="km-kbd">X</span> release
              </span>
            </div>

            {view.length === 0 ? (
              <div className="km-card" style={{ padding: 32 }}>
                <div className="km-display-md" style={{ marginBottom: 4 }}>Nothing's set aside.</div>
                <Mono dim>An empty shelf is allowed. Capture something when it comes.</Mono>
              </div>
            ) : (
              <div className="km-card" style={{ padding: 8 }}>
                {view.map((item) => (
                  <ReflectingLifeRow
                    key={item.id}
                    item={item}
                    project={getProjectById(item.projectId)}
                    selected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                    onAct={(action) => act(item.id, action)}
                  />
                ))}
              </div>
            )}

            <p style={{ textAlign: 'center', margin: '20px 0 0' }}>
              <Mono dim>
                That's the shallows. Walk it when the mood's right — Sunday coffee is
                the classic.
              </Mono>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
};

const ThreadChip = ({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active?: boolean;
  color?: Project['color'];
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="km-body-sm"
    style={{
      fontWeight: 500,
      padding: '5px 12px',
      borderRadius: 999,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      border: active ? '1px solid var(--fg)' : '1px solid var(--line-strong)',
      background: active ? 'var(--fg)' : 'transparent',
      color: active ? 'var(--surface-1)' : 'var(--fg-muted)',
      borderLeft: color && !active ? `3px solid var(--tint-${color})` : undefined,
    }}
  >
    {label}
  </button>
);

const ReflectingLifeRow = ({
  item,
  project,
  selected,
  onSelect,
  onAct,
}: {
  item: Item;
  project?: Project;
  selected: boolean;
  onSelect: () => void;
  onAct: (action: RemovalAction) => void;
}) => {
  const last = item.lastTouchedAt ?? item.updatedAt;
  const days = Math.floor((Date.now() - last.getTime()) / DAY);
  const tag = getTagsFor('item', item.id)[0];
  const hasBody = Boolean(item.body) || item.kind === 'ref' || item.kind === 'doc';
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      data-row-id={item.id}
      className={`km-row ${selected ? 'sel' : ''}`}
      onClick={onSelect}
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: selected ? 16 : '15px 16px',
        cursor: 'pointer',
        background: selected ? 'var(--card-2)' : 'transparent',
        boxShadow: selected ? 'inset 3px 0 0 var(--action)' : 'none',
        borderRadius: 'var(--r-ctrl)',
      }}
    >
      <span className="km-dot km-dot-dust" style={{ marginTop: 7 }} />
      <span style={{ color: 'var(--fg-faint)', display: 'flex', marginTop: 2 }}>
        <KindIcon kind={item.kind} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="km-body" style={{ fontSize: 15.5, lineHeight: 1.45 }}>
          {item.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, flexWrap: 'wrap' }}>
          {project && (
            <span onClick={stop}>
              <ProjectTag slug={project.slug} />
            </span>
          )}
          {tag && <span className="km-tag">#{tag.name}</span>}
          <Mono dim>shelved {shelvedAge(days, last)}</Mono>
        </div>
        {selected && (
          <div
            onClick={stop}
            style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}
          >
            <button className="km-btn km-btn-ghost km-btn-soft" onClick={() => onAct('pickBackUp')} style={ACTBTN}>
              <Icons.arrowUp size={14} /> Pick back up <span className="km-kbd" style={{ marginLeft: 2 }}>U</span>
            </button>
            <button className="km-btn km-btn-ghost" onClick={() => onAct('crystallize')} style={{ ...ACTBTN, color: 'var(--sacred-ink)' }}>
              <Icons.gem size={14} /> Crystallize <span className="km-kbd" style={{ marginLeft: 2 }}>C</span>
            </button>
            <button className="km-btn km-btn-ghost" onClick={() => onAct('file')} style={ACTBTN}>
              <Icons.archive size={14} /> File <span className="km-kbd" style={{ marginLeft: 2 }}>F</span>
            </button>
            {hasBody && (
              <button className="km-btn km-btn-ghost" onClick={() => onAct('pickBackUp')} style={ACTBTN}>
                <Icons.arrowR size={14} /> Open
              </button>
            )}
            <span style={{ flex: 1 }} />
            <button className="km-btn km-btn-ghost" onClick={() => onAct('letGo')} style={{ ...ACTBTN, color: 'var(--fg-faint)' }}>
              <Icons.x size={14} /> Let the tide take it <span className="km-kbd" style={{ marginLeft: 2 }}>X</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ACTBTN = { padding: '6px 11px', fontSize: 12.5 } as const;

// Friendly shelved-age: "today" / "Xd" / loose relative for older.
const shelvedAge = (days: number, last: Date): string =>
  days <= 0 ? 'today' : days < 14 ? `${days}d` : formatRelativeLoose(last);

export default ReflectingBoard;
