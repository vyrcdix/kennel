// Reflecting lens — items deliberately set aside ("Set aside" / P at
// Sort) land in `reflecting` and used to have no surface listing them:
// they only resurfaced by accident once they aged past the threshold.
// This board is the door back out. Shares AgingRow and the keyboard
// driver with AgingBoard; scope with ?project=<slug> (per-project counts
// on Dashboard/ProjectLanding link here scoped).

import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AgingRow } from '../components/AgingRow';
import { ChromeBar } from '../components/ChromeBar';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ThermalPanel } from '../components/ThermalPanel';
import {
  crystallizeItem,
  fileItem,
  transitionItem,
} from '../data/actions';
import {
  getProjectById,
  getProjectBySlug,
  getReflectingItems,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { useKeyedListNav } from '../lib/useKeyedListNav';

const shelvedLabel = (days: number) =>
  days === 0 ? 'shelved today' : `shelved ${days}d`;

export const ReflectingBoard = () => {
  const v = useStoreVersion();
  const [params, setParams] = useSearchParams();
  const projectSlug = params.get('project') ?? undefined;
  const project = projectSlug ? getProjectBySlug(projectSlug) : undefined;
  const reflecting = useMemo(
    () => getReflectingItems(project?.id),
    [v, project?.id],
  );

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

export default ReflectingBoard;
