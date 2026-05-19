import { useEffect, useMemo, useState } from 'react';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Icons } from '../components/Icon';
import {
  getProjects,
  getTriageQueue,
  type TriageEntry,
} from '../data/selectors';
import { transitionItem } from '../data/actions';
import { useStoreVersion } from '../data/store';
import { formatRelative } from '../data/time';
import type { Item, ItemState, Project } from '../data/types';

const FilterChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) => (
  <span
    className="km-tag"
    onClick={onClick}
    style={{
      background: active ? 'rgba(217,98,44,.16)' : 'rgba(201,168,124,.18)',
      color: active ? 'var(--ember-deep)' : 'var(--fg)',
      padding: '2px 8px',
      cursor: 'pointer',
    }}
  >
    {label}
  </span>
);

const TriageRowItem = ({
  item,
  project,
  selected,
  onClick,
  onAction,
}: {
  item: Item;
  project: Project;
  selected: boolean;
  onClick: () => void;
  onAction: (to: ItemState) => void;
}) => {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      onClick={onClick}
      className={`km-row ${selected ? 'km-active-row' : ''}`}
      style={{
        padding: '10px 16px',
        borderBottom: '1px solid var(--line)',
        background: selected ? 'rgba(217,98,44,.05)' : 'transparent',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: item.body ? 6 : 0,
        }}
      >
        <KindIcon kind={item.kind} />
        <ProjectTag slug={project.slug} />
        <span className="km-body" style={{ flex: 1, fontWeight: selected ? 500 : 400 }}>
          {item.title}
        </span>
        <Mono>{formatRelative(item.createdAt)}</Mono>
      </div>
      {item.body && (
        <div
          className="km-body-sm"
          style={{ paddingLeft: 22, lineHeight: 1.5, color: 'var(--fg-muted)' }}
        >
          {item.body.split('\n')[0]}
        </div>
      )}
      {selected && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 10,
            paddingLeft: 22,
          }}
        >
          <button
            className="km-btn km-btn-primary"
            onClick={(e) => { stop(e); onAction('active'); }}
          >
            Activate{' '}
            <span
              className="km-kbd"
              style={{
                marginLeft: 4,
                background: 'rgba(0,0,0,.18)',
                borderColor: 'transparent',
                color: '#fff',
              }}
            >
              A
            </span>
          </button>
          <button className="km-btn" onClick={(e) => { stop(e); onAction('parked'); }}>
            Park <span className="km-kbd" style={{ marginLeft: 4 }}>P</span>
          </button>
          <button className="km-btn" onClick={stop} title="convert (not wired)">
            Convert <span className="km-kbd" style={{ marginLeft: 4 }}>C</span>
          </button>
          <button className="km-btn" onClick={(e) => { stop(e); onAction('done'); }}>
            Done <span className="km-kbd" style={{ marginLeft: 4 }}>D</span>
          </button>
          <button
            className="km-btn km-btn-ghost"
            onClick={(e) => { stop(e); onAction('dismissed'); }}
          >
            Dismiss <span className="km-kbd" style={{ marginLeft: 4 }}>X</span>
          </button>
        </div>
      )}
    </div>
  );
};

const TriageRowProposal = ({
  title,
  project,
  capturedAt,
  body,
}: {
  title: string;
  project?: Project;
  capturedAt: Date;
  body?: string;
}) => (
  <div
    className="km-row km-proposal"
    style={{
      padding: '10px 16px',
      borderBottom: '1px solid var(--line)',
      background: 'rgba(92,122,62,.03)',
    }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: body ? 6 : 0,
      }}
    >
      <span className="km-display-sm" style={{ color: 'var(--moss)', fontSize: 10 }}>
        PROPOSAL
      </span>
      {project && <ProjectTag slug={project.slug} />}
      <span className="km-body" style={{ flex: 1 }}>{title}</span>
      <Mono>{formatRelative(capturedAt)}</Mono>
    </div>
    {body && (
      <div
        className="km-body-sm"
        style={{ paddingLeft: 22, lineHeight: 1.5, color: 'var(--fg-muted)' }}
      >
        {body}
      </div>
    )}
  </div>
);

export const TriageQueue = () => {
  const v = useStoreVersion();
  const projects = getProjects();
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const queue = useMemo(() => getTriageQueue(projectFilter), [projectFilter, v]);

  const inboxCount = queue.filter((q) => q.kind === 'item').length;
  const proposalCount = queue.filter((q) => q.kind === 'proposal').length;

  const [selectedId, setSelectedId] = useState<string>('');

  // Selected item leaves the queue after an action; reselect the first remaining.
  useEffect(() => {
    const stillThere = queue.some(
      (q) => q.kind === 'item' && q.item.id === selectedId,
    );
    if (!stillThere) {
      const first = queue.find((q) => q.kind === 'item') as
        | Extract<TriageEntry, { kind: 'item' }>
        | undefined;
      setSelectedId(first?.item.id ?? '');
    }
  }, [queue, selectedId]);

  const selected = queue.find(
    (q) => q.kind === 'item' && q.item.id === selectedId,
  ) as Extract<TriageEntry, { kind: 'item' }> | undefined;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const itemEntries = queue.filter((q) => q.kind === 'item') as Extract<TriageEntry, { kind: 'item' }>[];
      const idx = itemEntries.findIndex((q) => q.item.id === selectedId);
      switch (e.key.toLowerCase()) {
        case 'j': {
          const next = itemEntries[Math.min(idx + 1, itemEntries.length - 1)];
          if (next) setSelectedId(next.item.id);
          break;
        }
        case 'k': {
          const prev = itemEntries[Math.max(idx - 1, 0)];
          if (prev) setSelectedId(prev.item.id);
          break;
        }
        case 'a': if (selected) transitionItem(selected.item.id, 'active'); break;
        case 'p': if (selected) transitionItem(selected.item.id, 'parked'); break;
        case 'd': if (selected) transitionItem(selected.item.id, 'done'); break;
        case 'x': if (selected) transitionItem(selected.item.id, 'dismissed'); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queue, selectedId, selected]);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="triage" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 28px 12px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
              <div className="km-display-lg">Triage queue</div>
              <Mono>
                {inboxCount} inbox · {proposalCount} proposals ·{' '}
                {projectFilter ?? 'global'} view
              </Mono>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="km-display-sm">project</span>
              <FilterChip
                label="all"
                active={!projectFilter}
                onClick={() => setProjectFilter(undefined)}
              />
              {projects.slice(0, 4).map((p) => (
                <FilterChip
                  key={p.slug}
                  label={p.slug}
                  active={projectFilter === p.slug}
                  onClick={() => setProjectFilter(p.slug)}
                />
              ))}
              <span style={{ width: 18 }} />
              <span className="km-display-sm">kind</span>
              <FilterChip label="idea" />
              <FilterChip label="note" />
              <FilterChip label="action" />
              <FilterChip label="ref" />
              <FilterChip label="proposal" active />
              <span style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mono dim>shortcuts</Mono>
                <span className="km-kbd">J</span>
                <span className="km-kbd">K</span>
                <span className="km-kbd">A</span>
                <span className="km-kbd">P</span>
                <span className="km-kbd">X</span>
                <span className="km-kbd">D</span>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr',
              overflow: 'hidden',
            }}
          >
            {/* Item list */}
            <div
              className="km-scroll"
              style={{ overflow: 'auto', borderRight: '1px solid var(--line)' }}
            >
              {queue.length === 0 && (
                <div style={{ padding: 32 }}>
                  <div className="km-display-lg">Inbox is clear.</div>
                  <Mono dim>nothing to triage</Mono>
                </div>
              )}
              {queue.map((entry) => {
                if (entry.kind === 'item') {
                  return (
                    <TriageRowItem
                      key={entry.item.id}
                      item={entry.item}
                      project={entry.project}
                      selected={entry.item.id === selectedId}
                      onClick={() => setSelectedId(entry.item.id)}
                      onAction={(to) => transitionItem(entry.item.id, to)}
                    />
                  );
                }
                return (
                  <TriageRowProposal
                    key={entry.proposal.id}
                    title={`${entry.skill.name} — ${entry.proposal.rationale.split('.')[0]}`}
                    project={entry.project}
                    capturedAt={entry.capturedAt}
                  />
                );
              })}
            </div>

            {/* Preview pane */}
            <aside
              className="km-scroll"
              style={{ overflow: 'auto', padding: '18px 24px', background: 'var(--surface-1)' }}
            >
              {selected ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 14,
                    }}
                  >
                    <KindIcon kind={selected.item.kind} muted={false} />
                    <ProjectTag slug={selected.project.slug} />
                    <span style={{ flex: 1 }} />
                    <Mono>
                      id {selected.item.id} · captured via desktop ⌘⇧K
                    </Mono>
                  </div>
                  <div className="km-display-md" style={{ marginBottom: 10 }}>
                    {selected.item.title}
                  </div>
                  <div className="km-body" style={{ lineHeight: 1.6, color: 'var(--fg)' }}>
                    {selected.item.body
                      ? selected.item.body
                          .split('\n\n')
                          .map((para, i) => (
                            <p key={i} style={{ margin: '0 0 10px' }}>{para}</p>
                          ))
                      : (
                        <p style={{ margin: 0, color: 'var(--fg-muted)' }}>
                          No body. Captured with the title only — promote or dismiss.
                        </p>
                      )}
                  </div>

                  <div
                    style={{
                      marginTop: 24,
                      paddingTop: 18,
                      borderTop: '1px solid var(--line)',
                    }}
                  >
                    <Label style={{ marginBottom: 8 }}>Convert to</Label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      <button className="km-btn">
                        <Icons.check size={12} /> action
                      </button>
                      <button className="km-btn">
                        <Icons.doc size={12} /> doc
                      </button>
                      <button className="km-btn">
                        <Icons.note size={12} /> note
                      </button>
                      <button className="km-btn">
                        <Icons.link size={12} /> reference
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Mono dim>select an item to preview</Mono>
              )}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TriageQueue;
