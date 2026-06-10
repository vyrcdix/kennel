import { useEffect, useMemo, useState } from 'react';
import { AttachToThinkingModal } from '../components/AttachToThinkingModal';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Icons } from '../components/Icon';
import { TagChips } from '../components/TagChips';
import {
  getEntityIdsWithTag,
  getProjects,
  getTagUsage,
  getTriageQueue,
  type TriageEntry,
} from '../data/selectors';
import {
  convertItem,
  crystallizeItem,
  transitionItem,
  type ConvertTarget,
} from '../data/actions';
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

const CONVERT_OPTIONS: { target: ConvertTarget; label: string }[] = [
  { target: 'idea', label: 'idea' },
  { target: 'note', label: 'note' },
  { target: 'action', label: 'action' },
  { target: 'ref', label: 'ref' },
  { target: 'question', label: 'question' },
  { target: 'doc', label: 'doc' },
  { target: 'reference', label: 'reference' },
];

const TriageRowItem = ({
  item,
  project,
  selected,
  convertOpen,
  onClick,
  onAction,
  onToggleConvert,
  onConvert,
  onAttach,
  onCrystallize,
}: {
  item: Item;
  project: Project;
  selected: boolean;
  convertOpen: boolean;
  onClick: () => void;
  onAction: (to: ItemState) => void;
  onToggleConvert: () => void;
  onAttach: () => void;
  onCrystallize: () => void;
  onConvert: (target: ConvertTarget) => void;
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
            Pick up{' '}
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
          <button className="km-btn" onClick={(e) => { stop(e); onAction('reflecting'); }}>
            Set aside <span className="km-kbd" style={{ marginLeft: 4 }}>P</span>
          </button>
          <button
            className="km-btn"
            onClick={(e) => { stop(e); onAttach(); }}
            title="Attach this action to the crystal / idea / thread it serves"
          >
            Attach <span className="km-kbd" style={{ marginLeft: 4 }}>S</span>
          </button>
          <button
            className="km-btn"
            onClick={(e) => { stop(e); onCrystallize(); }}
            style={{ color: '#B07E12' }}
            title="Promote this thought to a crystallization"
          >
            Crystallize <span className="km-kbd" style={{ marginLeft: 4 }}>C</span>
          </button>
          <button
            className={`km-btn${convertOpen ? ' km-btn-active' : ''}`}
            onClick={(e) => { stop(e); onToggleConvert(); }}
            style={convertOpen ? { color: 'var(--ember-deep)' } : undefined}
            title="Convert to a different kind"
          >
            Convert <span className="km-kbd" style={{ marginLeft: 4 }}>V</span>
          </button>
          <button className="km-btn" onClick={(e) => { stop(e); onAction('crystallized'); }}>
            Done <span className="km-kbd" style={{ marginLeft: 4 }}>D</span>
          </button>
          <button
            className="km-btn km-btn-ghost"
            onClick={(e) => { stop(e); onAction('dismissed'); }}
          >
            Let go <span className="km-kbd" style={{ marginLeft: 4 }}>X</span>
          </button>
        </div>
      )}
      {selected && convertOpen && (
        <div
          onClick={stop}
          style={{
            marginTop: 10,
            marginLeft: 22,
            padding: '8px 10px',
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
          }}
        >
          <Mono dim>convert to →</Mono>
          {CONVERT_OPTIONS.filter((o) => o.target !== item.kind).map((o) => (
            <button
              key={o.target}
              className="km-btn km-btn-ghost"
              onClick={() => onConvert(o.target)}
              style={{ padding: '3px 8px', fontSize: 11.5 }}
            >
              {o.label}
            </button>
          ))}
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

type KindFilter =
  | 'idea'
  | 'note'
  | 'action'
  | 'ref'
  | 'doc'
  | 'question'
  | 'crystallization'
  | 'proposal';

const ITEM_KINDS: KindFilter[] = ['idea', 'note', 'action', 'ref', 'question'];

export const TriageQueue = () => {
  const v = useStoreVersion();
  const projects = getProjects();
  const [projectFilter, setProjectFilter] = useState<string | undefined>(undefined);
  const [kindFilter, setKindFilter] = useState<Set<KindFilter>>(() => new Set());
  const rawQueue = useMemo(() => getTriageQueue(projectFilter), [projectFilter, v]);

  const toggleKind = (k: KindFilter) =>
    setKindFilter((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  const clearKindFilter = () => setKindFilter(new Set());

  const [tagFilter, setTagFilter] = useState<string | null>(null);
  // Item assignments only — the queue filter matches items, so chips must
  // not advertise doc/ref/runbook-only tags or counts.
  const tagUsage = useMemo(() => getTagUsage('item'), [v]);
  // The chip row (and its "all" clearer) unmounts when usage hits zero;
  // drop the filter with it so the queue can't get stuck invisibly empty.
  useEffect(() => {
    if (tagFilter && !tagUsage.some((u) => u.tag.id === tagFilter)) {
      setTagFilter(null);
    }
  }, [tagFilter, tagUsage]);
  const taggedIds = useMemo(
    () => (tagFilter ? getEntityIdsWithTag('item', tagFilter) : null),
    [tagFilter, v],
  );

  const queue = useMemo(() => {
    let entries = rawQueue;
    if (kindFilter.size > 0) {
      entries = entries.filter((entry) => {
        if (entry.kind === 'item') return kindFilter.has(entry.item.kind as KindFilter);
        return kindFilter.has('proposal');
      });
    }
    if (taggedIds) {
      entries = entries.filter(
        (entry) => entry.kind === 'item' && taggedIds.has(entry.item.id),
      );
    }
    return entries;
  }, [rawQueue, kindFilter, taggedIds]);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const entry of rawQueue) {
      const key = entry.kind === 'item' ? entry.item.kind : 'proposal';
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return counts;
  }, [rawQueue]);

  const inboxCount = queue.filter((q) => q.kind === 'item').length;
  const proposalCount = queue.filter((q) => q.kind === 'proposal').length;

  const [selectedId, setSelectedId] = useState<string>('');
  const [convertOpen, setConvertOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

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
        case 'p': if (selected) transitionItem(selected.item.id, 'reflecting'); break;
        case 'd': if (selected) transitionItem(selected.item.id, 'crystallized'); break;
        case 'x': if (selected) transitionItem(selected.item.id, 'dismissed'); break;
        // v0.5 §C: C now also one-step-promotes to a crystallization
        // (was: open the convert popover). The convert flow is still
        // reachable via the V key.
        case 'c':
          if (selected) {
            void crystallizeItem(selected.item.id, { promoteKind: true });
          }
          break;
        case 'v': if (selected) setConvertOpen((v) => !v); break;
        // v0.5 §C: S opens the attach-to-thinking typeahead.
        case 's': if (selected) setAttachOpen(true); break;
        case 'escape':
          if (attachOpen) setAttachOpen(false);
          else if (convertOpen) setConvertOpen(false);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queue, selectedId, selected, convertOpen, attachOpen]);

  // Close the popover whenever the selection changes.
  useEffect(() => {
    setConvertOpen(false);
  }, [selectedId]);

  const doConvert = (target: ConvertTarget) => {
    if (!selected) return;
    setConvertOpen(false);
    void convertItem(selected.item.id, target);
  };

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="triage" />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '18px 28px 12px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 10 }}>
              <div className="km-display-lg">Sort</div>
              <Mono>
                {inboxCount} on the bench · {proposalCount} proposals ·{' '}
                {projectFilter ?? 'global'} view
              </Mono>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="km-display-sm">thread</span>
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
              <FilterChip
                label={kindFilter.size === 0 ? 'all' : `all · clear`}
                active={kindFilter.size === 0}
                onClick={clearKindFilter}
              />
              {ITEM_KINDS.map((k) => {
                const count = kindCounts[k] ?? 0;
                if (count === 0) return null;
                return (
                  <FilterChip
                    key={k}
                    label={`${k} · ${count}`}
                    active={kindFilter.has(k)}
                    onClick={() => toggleKind(k)}
                  />
                );
              })}
              {(kindCounts.proposal ?? 0) > 0 && (
                <FilterChip
                  label={`proposal · ${kindCounts.proposal}`}
                  active={kindFilter.has('proposal')}
                  onClick={() => toggleKind('proposal')}
                />
              )}
              {tagUsage.length > 0 && (
                <>
                  <span style={{ width: 18 }} />
                  <span className="km-display-sm">tag</span>
                  <FilterChip
                    label="all"
                    active={!tagFilter}
                    onClick={() => setTagFilter(null)}
                  />
                  {tagUsage.map(({ tag, count }) => (
                    <FilterChip
                      key={tag.id}
                      label={`#${tag.name} · ${count}`}
                      active={tagFilter === tag.id}
                      onClick={() =>
                        setTagFilter((cur) => (cur === tag.id ? null : tag.id))
                      }
                    />
                  ))}
                </>
              )}
              <span style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Mono dim>shortcuts</Mono>
                <span className="km-kbd">J</span>
                <span className="km-kbd">K</span>
                <span className="km-kbd">A</span>
                <span className="km-kbd">P</span>
                <span className="km-kbd">S</span>
                <span className="km-kbd">C</span>
                <span className="km-kbd">V</span>
                <span className="km-kbd">D</span>
                <span className="km-kbd">X</span>
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
                  <div className="km-display-lg">The bench is clear.</div>
                  <Mono dim>nothing to sort</Mono>
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
                      convertOpen={convertOpen && entry.item.id === selectedId}
                      onClick={() => setSelectedId(entry.item.id)}
                      onAction={(to) => transitionItem(entry.item.id, to)}
                      onToggleConvert={() => setConvertOpen((v) => !v)}
                      onConvert={(target) => {
                        setSelectedId(entry.item.id);
                        setConvertOpen(false);
                        void convertItem(entry.item.id, target);
                      }}
                      onAttach={() => {
                        setSelectedId(entry.item.id);
                        setAttachOpen(true);
                      }}
                      onCrystallize={() => {
                        setSelectedId(entry.item.id);
                        void crystallizeItem(entry.item.id, {
                          promoteKind: true,
                        });
                      }}
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
                  <div style={{ marginBottom: 12 }}>
                    <TagChips entityType="item" entityId={selected.item.id} editable />
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
                      {CONVERT_OPTIONS.filter((o) => o.target !== selected.item.kind).map((o) => (
                        <button
                          key={o.target}
                          className="km-btn"
                          onClick={() => doConvert(o.target)}
                        >
                          {o.target === 'reference' ? (
                            <Icons.link size={12} />
                          ) : (
                            <KindIcon kind={o.target} />
                          )}{' '}
                          {o.label}
                        </button>
                      ))}
                    </div>
                    <Mono dim>
                      idea/note/action/ref/question swap kinds in place · doc & reference create
                      a new entity and dismiss the source
                    </Mono>
                  </div>
                </>
              ) : (
                <Mono dim>select an item to preview</Mono>
              )}
            </aside>
          </div>
        </main>
      </div>
      <AttachToThinkingModal
        open={attachOpen}
        item={selected?.item ?? null}
        onClose={() => setAttachOpen(false)}
      />
    </div>
  );
};

export default TriageQueue;
