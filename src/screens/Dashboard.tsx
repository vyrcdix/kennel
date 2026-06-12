import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatRow } from '../components/ChatRow';
import { ChromeBar } from '../components/ChromeBar';
import { CrystalCard } from '../components/CrystalCard';
import { KindIcon } from '../components/KindIcon';
import { ResurfacingSlot } from '../components/ResurfacingSlot';
import { NavRail } from '../components/NavRail';
import { NextUpRow } from '../components/NextUpRow';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { SectionHead } from '../components/SectionHead';
import { Icons } from '../components/Icon';
import { RegisterChatModal } from '../components/RegisterChatModal';
import { ThermalPanel } from '../components/ThermalPanel';
import { ThermalStamp } from '../components/ThermalStamp';
import { crystallizeItem, fileItem, setChatUrl, touchItem } from '../data/actions';
import {
  getAgingItems,
  getAllProjectCounts,
  getAllProjectLastTouched,
  getCrystallizedThisWeek,
  getDueCrystals,
  getInboxRollup,
  getItemById,
  getNextUp,
  getPinnedProjects,
  getProjectById,
  getProjects,
  getRecentChats,
  getSettings,
} from '../data/selectors';
import {
  panelTemperature,
  temperatureForDate,
  TOP_EDGE_BY_TEMP,
  type Temp,
} from '../lib/temperature';
import { useFocusMode } from '../lib/focusMode';
import {
  formatDashboardDate,
  formatRelative,
  formatRelativeLoose,
} from '../data/time';
import { useStoreVersion } from '../data/store';
import { openCreateProject, openItem } from '../lib/modals';
import { useSkin } from '../lib/skin';
import { Wave } from '../components/Wave';
import { DoThisWeek } from '../components/DoThisWeek';
import { CompassBand } from '../components/compass/CompassBand';
import { groupFocusUnderBearings } from '../lib/compass';
import type { Item, Project } from '../data/types';

const DAY = 86400_000;

type ProjectCardProps = {
  project: Project;
  active?: boolean;
  temp: Temp;
  counts: { inbox: number; active: number; reflecting: number; crystallized: number };
};

const ProjectCard = ({ project, active, temp, counts }: ProjectCardProps) => {
  const navigate = useNavigate();
  const edge = TOP_EDGE_BY_TEMP[temp];
  return (
    <div
      className="km-card"
      onClick={() => navigate(`/project/${project.slug}`)}
      style={{
        minWidth: 248,
        maxWidth: 248,
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        background: active ? 'color-mix(in srgb, var(--action) 6%, transparent)' : 'var(--surface-1)',
        borderColor: active ? 'color-mix(in srgb, var(--action) 30%, transparent)' : 'var(--line)',
        borderTop: `${edge.width}px solid ${edge.color}`,
        opacity: temp === 'dormant' ? 0.82 : 1,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          <ProjectTag slug={project.slug} />
          <div className="km-body-lg" style={{ fontSize: 14, marginTop: 4 }}>
            {project.name}
          </div>
        </div>
        {project.pinned && (
          <span className="km-pin">
            <Icons.pin size={12} />
          </span>
        )}
      </div>
      <div
        className="km-body-sm"
        style={{
          lineHeight: 1.4,
          minHeight: 32,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {project.description}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 'auto',
          paddingTop: 6,
          borderTop: '1px solid var(--line)',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="km-mono-sm" style={{ color: 'var(--fg-faint)' }}>in</span>
          <Mono>{counts.inbox}</Mono>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span className="km-dot km-dot-ember" />
          <Mono>{counts.active}</Mono>
        </span>
        <span
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/reflecting?project=${project.slug}`);
          }}
          title="Set-aside items in this thread · open the Reflecting lens"
          style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}
        >
          <span className="km-dot km-dot-dust" />
          <Mono>{counts.reflecting}</Mono>
        </span>
        <span style={{ flex: 1 }} />
        <span
          className="km-mono-sm"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/runbook/${project.slug}`);
          }}
          style={{
            color: 'var(--ember-deep)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Icons.runbook size={11} /> run
        </span>
      </div>
    </div>
  );
};

const AgingDashboardRow = ({ item }: { item: Item }) => {
  const navigate = useNavigate();
  const project = getProjectById(item.projectId);
  const last = item.lastTouchedAt ?? item.updatedAt;
  const days = Math.floor((Date.now() - last.getTime()) / DAY);
  // Clicking a row opens the item itself (shared openItem policy); the
  // aging board stays reachable via the section's "Review all" affordance.
  const onOpen = () => openItem(item, navigate);
  return (
    <div
      className="km-row"
      onClick={onOpen}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 90px 1fr 70px auto',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        opacity: 0.82,
        cursor: 'pointer',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <KindIcon kind={item.kind} />
      {project && <ProjectTag slug={project.slug} />}
      <span
        className="km-body"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 13,
        }}
      >
        {item.title}
      </span>
      <Mono>{days}d cold</Mono>
      <div
        style={{ display: 'flex', gap: 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="km-btn km-btn-ghost"
          onClick={() => touchItem(item.id)}
          style={{ padding: '2px 7px', fontSize: 10.5 }}
          title="Pick up"
        >
          Pick up
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => crystallizeItem(item.id, { promoteKind: true })}
          style={{ padding: '2px 7px', fontSize: 10.5 }}
          title="Crystallize"
        >
          Crystallize
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => fileItem(item.id)}
          style={{ padding: '2px 7px', fontSize: 10.5, color: 'var(--ember-deep)' }}
          title="Let go"
        >
          Let go
        </button>
      </div>
    </div>
  );
};

const NoProjectsState = () => (
  <main
    style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 32px',
      gap: 16,
    }}
  >
    <div className="km-display-sm" style={{ color: 'var(--fg-faint)' }}>NO THREADS</div>
    <div className="km-display-lg" style={{ textAlign: 'center' }}>
      No threads. Create one to start.
    </div>
    <div
      className="km-body"
      style={{
        color: 'var(--fg-muted)',
        textAlign: 'center',
        lineHeight: 1.55,
        maxWidth: 420,
      }}
    >
      A thread is the unit that holds items, docs, references, and chats. Most users start with one for active work and one for reading.
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <button className="km-btn km-btn-primary" onClick={openCreateProject}>
        <Icons.plus size={12} /> New thread
      </button>
      <button className="km-btn" disabled style={{ opacity: 0.5 }} title="CLI import only for now">
        Import from filesystem
      </button>
    </div>
  </main>
);

const DashboardWorkshop = () => {
  const navigate = useNavigate();
  const v = useStoreVersion();
  const [focusMode, setFocusMode] = useFocusMode();
  const [registerChatOpen, setRegisterChatOpen] = useState(false);
  const pinned = getPinnedProjects();
  // Active threads only (excludes archived) — drives the "no threads" gate
  // and the fallback rail when nothing is pinned yet.
  const allActiveProjects = getProjects().filter((p) => p.status !== 'archived');
  const recentChats = getRecentChats(4);
  const nextUp = getNextUp(undefined, 7);
  const inboxRollup = getInboxRollup();
  const settings = getSettings();
  const aging = getAgingItems(settings.agingThresholdDays);
  const crystallizedWeek = getCrystallizedThisWeek();
  const dueCrystals = getDueCrystals();
  const totalActive = nextUp.length;
  const inFocusTemp = panelTemperature(nextUp, settings);
  const inFocusSince = formatRelative(
    nextUp[0]?.lastTouchedAt ?? nextUp[0]?.updatedAt ?? new Date(0),
  );
  const countsById = useMemo(() => getAllProjectCounts(), [v]);
  const lastTouchedById = useMemo(() => getAllProjectLastTouched(), [v]);
  // All active projects, not just pinned ones — "In focus" pulls items
  // across every thread and NextUpRow needs the project resolved.
  const projectsById = useMemo(
    () => new Map(allActiveProjects.map((p) => [p.id, p])),
    [allActiveProjects],
  );
  const hasProjects =
    allActiveProjects.length > 0 ||
    pinned.length > 0 ||
    nextUp.length > 0 ||
    inboxRollup.length > 0;

  if (!hasProjects) {
    return (
      <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
        <ChromeBar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <NavRail active="dashboard" />
          <NoProjectsState />
        </div>
      </div>
    );
  }

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="dashboard" />
        <main
          className="km-scroll"
          style={{ flex: 1, padding: '22px 32px 0', overflow: 'auto' }}
        >
          {/* Page heading */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <div>
              <div className="km-display-lg">Dashboard</div>
              <Mono>{formatDashboardDate()}</Mono>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                className={`km-btn${focusMode ? ' km-btn-active' : ''}`}
                onClick={() => setFocusMode(!focusMode)}
                title="⌘⇧F · hide side panels and thread rail"
                style={focusMode ? { color: 'var(--ember-deep)' } : undefined}
              >
                <Icons.eye size={12} /> {focusMode ? 'Focus on' : 'Focus mode'}
              </button>
              <button
                className="km-btn"
                onClick={() => navigate('/review/weekly')}
                title="A 7-day sweep of what got captured, crystallized, picked up, and let go"
              >
                <Icons.filter size={12} /> Weekly review
              </button>
            </div>
          </div>

          {/* Compass — the orientation band, above everything (both skins) */}
          <CompassBand style={{ marginBottom: 18 }} />

          {/* Do this week — recurring actions (both skins, B1) */}
          <DoThisWeek />

          {/* Project rail — falls back to all active threads when none
              are pinned, so brand-new prod installs aren't a dead end. */}
          {!focusMode && (() => {
            const railProjects = pinned.length > 0 ? pinned : allActiveProjects;
            if (railProjects.length === 0) return null;
            return (
              <>
                <Label style={{ marginBottom: 10 }}>
                  {pinned.length > 0 ? 'Pinned threads' : 'All threads'}
                </Label>
                <div
                  className="km-scroll"
                  style={{
                    display: 'flex',
                    gap: 10,
                    overflowX: 'auto',
                    paddingBottom: 16,
                    marginBottom: 18,
                  }}
                >
                  {railProjects.map((p, i) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      active={i === 0}
                      temp={temperatureForDate(lastTouchedById.get(p.id), settings)}
                      counts={countsById.get(p.id) ?? { inbox: 0, active: 0, reflecting: 0, crystallized: 0 }}
                    />
                  ))}
                </div>
              </>
            );
          })()}

          {/* Next up + side panels */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: focusMode ? '1fr' : '1.6fr 1fr',
              gap: 24,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <ThermalPanel temp={inFocusTemp}>
                <SectionHead
                  title="In focus"
                  right={
                    <>
                      <Mono dim>
                        {totalActive} active · in service of their thinking
                      </Mono>
                      <ThermalStamp temp={inFocusTemp} since={inFocusSince} />
                    </>
                  }
                />
                <div className="km-rule" />
                {(() => {
                  // v0.5 §C: group active actions by what they serve.
                  // Crystals first, then ideas/questions, then thread
                  // anchors, then the unattached pool — gently
                  // de-emphasised so it reads as "needs a sort step,"
                  // not as something hidden.
                  type GroupKey =
                    | { kind: 'item'; servedId: string }
                    | { kind: 'thread'; projectId: string }
                    | { kind: 'unattached' };
                  const groupKeyFor = (servesId?: string): GroupKey => {
                    if (!servesId) return { kind: 'unattached' };
                    if (servesId.startsWith('thread:'))
                      return {
                        kind: 'thread',
                        projectId: servesId.slice('thread:'.length),
                      };
                    return { kind: 'item', servedId: servesId };
                  };
                  const groupKeyStr = (k: GroupKey) =>
                    k.kind === 'item'
                      ? `i:${k.servedId}`
                      : k.kind === 'thread'
                        ? `t:${k.projectId}`
                        : 'unattached';

                  const buckets = new Map<
                    string,
                    { key: GroupKey; items: typeof nextUp }
                  >();
                  for (const it of nextUp) {
                    const k = groupKeyFor(it.servesId);
                    const ks = groupKeyStr(k);
                    if (!buckets.has(ks)) buckets.set(ks, { key: k, items: [] });
                    buckets.get(ks)!.items.push(it);
                  }

                  // Crystal-served first, idea/question-served next, thread
                  // anchors after, unattached last.
                  const ordered = [...buckets.values()].sort((a, b) => {
                    const rank = (g: typeof a) => {
                      if (g.key.kind === 'unattached') return 3;
                      if (g.key.kind === 'thread') return 2;
                      const ti = getItemById(g.key.servedId);
                      if (!ti) return 2;
                      return ti.kind === 'crystallization' ||
                        ti.state === 'crystallized'
                        ? 0
                        : 1;
                    };
                    return rank(a) - rank(b);
                  });

                  return ordered.map((group) => {
                    const ks = groupKeyStr(group.key);
                    if (group.key.kind === 'unattached') {
                      return (
                        <div key={ks} style={{ opacity: 0.78 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '8px 16px 4px',
                              borderTop: '1px solid var(--line)',
                            }}
                          >
                            <Icons.note size={11} style={{ color: 'var(--fg-faint)' }} />
                            <span
                              className="km-mono-sm"
                              style={{
                                color: 'var(--fg-faint)',
                                letterSpacing: '.04em',
                              }}
                            >
                              unattached · sort to attach to a crystal or idea
                            </span>
                          </div>
                          {group.items.map((item) => {
                            const project = projectsById.get(item.projectId);
                            if (!project) return null;
                            return (
                              <NextUpRow
                                key={item.id}
                                item={item}
                                project={project}
                              />
                            );
                          })}
                        </div>
                      );
                    }
                    if (group.key.kind === 'thread') {
                      const proj = getProjectById(group.key.projectId);
                      return (
                        <div key={ks}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 7,
                              padding: '8px 16px 4px',
                              borderTop: '1px solid var(--line)',
                            }}
                          >
                            <span
                              className="km-mono-sm"
                              style={{
                                color: 'var(--fg-muted)',
                                letterSpacing: '.04em',
                              }}
                            >
                              in service of
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>
                              {proj?.name ?? 'a thread'}
                            </span>
                            {proj && <ProjectTag slug={proj.slug} />}
                          </div>
                          {group.items.map((item) => {
                            const project = projectsById.get(item.projectId);
                            if (!project) return null;
                            return (
                              <NextUpRow
                                key={item.id}
                                item={item}
                                project={project}
                              />
                            );
                          })}
                        </div>
                      );
                    }
                    const served = getItemById(group.key.servedId);
                    const isCrystal =
                      served &&
                      (served.kind === 'crystallization' ||
                        served.state === 'crystallized');
                    return (
                      <div key={ks}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            padding: '8px 16px 4px',
                            borderTop: '1px solid var(--line)',
                          }}
                        >
                          {isCrystal ? (
                            <Icons.gem size={12} stroke="var(--sacred-ink)" />
                          ) : (
                            served && <KindIcon kind={served.kind} size={12} muted={false} />
                          )}
                          <span
                            className="km-mono-sm"
                            style={{
                              color: isCrystal ? 'var(--sacred-ink)' : 'var(--ember-deep)',
                              letterSpacing: '.04em',
                            }}
                          >
                            in service of
                          </span>
                          <span
                            style={{ fontSize: 13, fontWeight: 600, flex: 1 }}
                            onClick={() =>
                              isCrystal
                                ? navigate(`/crystal/${served!.id}`)
                                : navigate(
                                    `/project/${
                                      projectsById.get(served?.projectId ?? '')?.slug ?? ''
                                    }`,
                                  )
                            }
                          >
                            {served?.title ?? '(deleted)'}
                          </span>
                          {served && projectsById.get(served.projectId) && (
                            <ProjectTag
                              slug={projectsById.get(served.projectId)!.slug}
                            />
                          )}
                        </div>
                        {group.items.map((item) => {
                          const project = projectsById.get(item.projectId);
                          if (!project) return null;
                          return (
                            <NextUpRow
                              key={item.id}
                              item={item}
                              project={project}
                            />
                          );
                        })}
                      </div>
                    );
                  });
                })()}
              </ThermalPanel>

              {/* Crystallized this week — v0.5 §5: blaze, the light, across
                  all threads. Renders the new CrystalCard so the typed
                  treatment lands here too. */}
              {crystallizedWeek.length > 0 && (
                <section className="km-v4">
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 12,
                    }}
                  >
                    <Icons.gem size={15} stroke="var(--sacred-ink)" />
                    <span
                      className="km-display-sm"
                      style={{ color: 'var(--sacred-ink)' }}
                    >
                      CRYSTALLIZED THIS WEEK
                    </span>
                    <span style={{ flex: 1 }} />
                    <Mono dim>
                      {crystallizedWeek.length} new this week
                    </Mono>
                    <button
                      className="km-btn km-btn-ghost"
                      onClick={() => navigate('/crystals')}
                      style={{ fontSize: 12, color: 'var(--sacred-ink)' }}
                    >
                      All crystals <Icons.arrowR size={11} />
                    </button>
                  </div>
                  <div style={{ columnCount: 3, columnGap: 12 }}>
                    {crystallizedWeek.slice(0, 6).map((c) => (
                      <CrystalCard key={c.id} item={c} />
                    ))}
                  </div>
                </section>
              )}

              {/* Resurfacing — due crystals, cross-thread (v0.5 §B) */}
              <ResurfacingSlot label="Resurfacing" crystals={dueCrystals} />

              {/* Recent conversations — primary input surface per v0.3 */}
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="Recent conversations"
                  right={
                    <>
                      <Mono>
                        {recentChats.length} active across all threads
                      </Mono>
                      <button
                        className="km-btn km-btn-ghost"
                        style={{ padding: '3px 8px', fontSize: 12 }}
                        onClick={() => setRegisterChatOpen(true)}
                      >
                        Register new
                      </button>
                    </>
                  }
                />
                <div className="km-rule" />
                {recentChats.length === 0 ? (
                  <div style={{ padding: '14px 16px' }}>
                    <Mono dim>no recent conversations · register one to start the trail</Mono>
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '6px 8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {recentChats.map((c) => {
                      const project = getProjectById(c.projectId);
                      return (
                        <div
                          key={c.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '110px 1fr',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          {project ? (
                            <ProjectTag slug={project.slug} />
                          ) : (
                            <span />
                          )}
                          <ChatRow
                            tagline={c.tagline}
                            since={formatRelativeLoose(c.lastSeenAt)}
                            claudeUrl={c.claudeUrl}
                            onClick={
                              c.claudeUrl
                                ? () =>
                                    window.open(c.claudeUrl!, '_blank', 'noopener,noreferrer')
                                : undefined
                            }
                            onSaveUrl={(url) => void setChatUrl(c.id, url)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            </div>

            {!focusMode && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Bench roll-up */}
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="The bench"
                  right={
                    <>
                      <Mono>{inboxRollup.reduce((s, r) => s + r.count, 0)} unsorted</Mono>
                      <button
                        className="km-btn km-btn-ghost"
                        style={{ padding: '4px 6px' }}
                        onClick={() => navigate('/triage')}
                      >
                        Sort all <Icons.arrowR size={12} />
                      </button>
                    </>
                  }
                />
                <div className="km-rule" />
                <div style={{ padding: '6px 0' }}>
                  {inboxRollup.map(({ project, count }) => (
                    <div
                      key={project.id}
                      className="km-row"
                      onClick={() => navigate('/triage')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 14px',
                        cursor: 'pointer',
                      }}
                    >
                      <ProjectTag slug={project.slug} />
                      <span style={{ flex: 1 }} />
                      <Mono>{count}</Mono>
                      <span className="km-mono-sm" style={{ color: 'var(--ember-deep)' }}>
                        sort
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Aging — let go? (replaces Yesterday) */}
              <section
                className="km-card"
                style={{ padding: 0, background: 'color-mix(in srgb, var(--dust) 6%, transparent)' }}
              >
                <SectionHead
                  title="Aging — let go?"
                  right={
                    <>
                      <Mono>
                        {aging.length} untouched ≥ {settings.agingThresholdDays}d
                      </Mono>
                      <button
                        className="km-btn km-btn-ghost"
                        style={{ padding: '4px 6px' }}
                        onClick={() => navigate('/aging')}
                      >
                        Review all <Icons.arrowR size={12} />
                      </button>
                    </>
                  }
                />
                <div className="km-rule" />
                {aging.length === 0 ? (
                  <div style={{ padding: '14px 16px' }}>
                    <Mono dim>nothing's gone cold — everything's been touched recently</Mono>
                  </div>
                ) : (
                  aging.slice(0, 4).map((item) => (
                    <AgingDashboardRow key={item.id} item={item} />
                  ))
                )}
              </section>
            </div>
            )}
          </div>
        </main>
      </div>
      <RegisterChatModal
        open={registerChatOpen}
        projectSlug={pinned[0]?.slug}
        onClose={() => setRegisterChatOpen(false)}
      />
    </div>
  );
};

// ════════════════════════════ Life (Tidewater) ═════════════════════════
// A calm re-orientation, not an audit: orientation strip → Worth-revisiting
// hearth → two-col grid (In focus + This week | Where you were + Lately).
// Same data as Workshop, reframed; every Workshop section stays reachable.

const FOCUS_LENS_KEY = 'km.focusLens';
type FocusLens = 'serves' | 'horizon' | 'orient';
const loadLens = (): FocusLens => {
  try {
    const r = localStorage.getItem(FOCUS_LENS_KEY);
    if (r === 'serves' || r === 'horizon' || r === 'orient') return r;
  } catch {
    /* no storage */
  }
  return 'serves';
};

const HORIZONS: { id: 'week' | 'soon' | 'whenever'; label: string; sub: string; tone: string }[] = [
  { id: 'week', label: 'This week', sub: 'soon', tone: 'var(--action)' },
  { id: 'soon', label: 'Soon', sub: 'this month', tone: 'var(--fam-guide)' },
  { id: 'whenever', label: 'When it comes around', sub: 'no rush', tone: 'var(--ink-faint)' },
];

const horizonOf = (due?: Date): 'week' | 'soon' | 'whenever' => {
  if (!due) return 'whenever';
  const days = (due.getTime() - Date.now()) / DAY;
  if (days <= 7) return 'week';
  if (days <= 30) return 'soon';
  return 'whenever';
};

type FocusGroup = { key: string; label: string; tone?: string; loose?: boolean; items: Item[] };

// Depth bar — temperature read as a vertical "how deep has this settled" rail.
const DEPTH: Record<Temp, { fill: number; label: string }> = {
  fresh: { fill: 1, label: 'FRESH' },
  active: { fill: 0.8, label: 'ACTIVE' },
  aging: { fill: 0.5, label: 'DEEPENING' },
  dormant: { fill: 0.28, label: 'STILL' },
};

const DepthBar = ({ temp }: { temp: Temp }) => {
  const d = DEPTH[temp];
  return (
    <div
      style={{
        width: 4,
        alignSelf: 'stretch',
        borderRadius: 999,
        background: 'var(--sunk)',
        position: 'relative',
        flex: '0 0 auto',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${(1 - d.fill) * 100}%`,
          bottom: 0,
          background:
            temp === 'fresh' || temp === 'active'
              ? 'linear-gradient(180deg, var(--action), color-mix(in srgb, var(--action) 40%, transparent))'
              : 'color-mix(in srgb, var(--ink) 22%, transparent)',
        }}
      />
    </div>
  );
};

const DashboardLife = () => {
  const v = useStoreVersion();
  const navigate = useNavigate();
  const settings = getSettings();
  const [lens, setLens] = useState<FocusLens>(loadLens);
  const setLensPersist = (l: FocusLens) => {
    setLens(l);
    try {
      localStorage.setItem(FOCUS_LENS_KEY, l);
    } catch {
      /* no storage */
    }
  };

  const inFocus = useMemo(() => getNextUp(undefined, 50), [v]);
  const dueCrystals = useMemo(() => getDueCrystals().slice(0, 3), [v]);
  const crystalsThisWeek = useMemo(() => getCrystallizedThisWeek(), [v]);
  const pinned = useMemo(() => getPinnedProjects(), [v]);
  const counts = useMemo(() => getAllProjectCounts(), [v]);
  const lastTouched = useMemo(() => getAllProjectLastTouched(), [v]);
  const aging = useMemo(
    () => getAgingItems(settings.agingThresholdDays),
    [v, settings.agingThresholdDays],
  );
  const recentChats = useMemo(() => getRecentChats(5), [v]);
  const washedIn = useMemo(
    () => getInboxRollup().reduce((n, r) => n + r.count, 0),
    [v],
  );

  const groups = useMemo<FocusGroup[]>(() => {
    if (lens === 'horizon') {
      return HORIZONS.map((h) => ({
        key: h.id,
        label: h.label,
        tone: h.tone,
        loose: h.id === 'whenever',
        items: inFocus.filter((it) => horizonOf(it.dueAt) === h.id),
      })).filter((g) => g.items.length > 0);
    }
    if (lens === 'orient') {
      // Under a bearing: nest focus items under the bearing each serves;
      // the rest fall "loose in the water — not under a bearing yet".
      const { groups: bgroups, loose } = groupFocusUnderBearings(inFocus);
      const out: FocusGroup[] = bgroups.map((g) => ({
        key: g.bearing.id,
        label: g.bearing.title,
        items: g.items,
      }));
      if (loose.length) {
        out.push({
          key: '__loose',
          label: 'loose in the water — not under a bearing yet',
          loose: true,
          items: loose,
        });
      }
      return out;
    }
    // serves: group by the crystal/idea/thread each action serves.
    const byServes = new Map<string, Item[]>();
    const loose: Item[] = [];
    for (const it of inFocus) {
      const anchor = it.servesId ? getItemById(it.servesId) : undefined;
      if (anchor) {
        const arr = byServes.get(anchor.id) ?? [];
        arr.push(it);
        byServes.set(anchor.id, arr);
      } else {
        loose.push(it);
      }
    }
    const out: FocusGroup[] = [...byServes.entries()].map(([id, items]) => ({
      key: id,
      label: getItemById(id)?.title ?? 'a thread',
      items,
    }));
    if (loose.length) out.push({ key: '__loose', label: 'loose in the water — not attached yet', loose: true, items: loose });
    return out;
  }, [inFocus, lens]);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="dashboard" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '26px 30px 44px' }}>
          {/* Orientation strip */}
          <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 22 }}>
            <div>
              <Mono dim>{formatDashboardDate()}</Mono>
              <div className="km-display-lg" style={{ fontSize: 28, margin: '4px 0 0' }}>
                The tide's calm.
              </div>
              <div className="km-body" style={{ fontSize: 14.5, color: 'var(--fg-muted)', marginTop: 5 }}>
                {aging.length === 0 ? "Nothing's gone cold." : `${aging.length} deepening on the shelf.`}{' '}
                {washedIn > 0
                  ? `${washedIn} ${washedIn === 1 ? 'thought' : 'thoughts'} washed in — sort them when you're ready.`
                  : 'The bench is clear.'}
              </div>
              <div style={{ marginTop: 8 }}>
                <Wave width={180} opacity={0.5} />
              </div>
            </div>
            <span style={{ flex: 1 }} />
            <button
              className="km-btn km-btn-primary"
              style={{ fontSize: 14.5, padding: '11px 18px' }}
              onClick={() => navigate('/triage')}
            >
              Sort the bench <Icons.arrowR size={16} />
            </button>
          </div>

          {/* Compass — the dawn band, above the hearth */}
          <CompassBand style={{ marginBottom: 22 }} />

          {/* Worth revisiting — hearth */}
          {dueCrystals.length > 0 && (
            <section
              className="km-card"
              style={{
                padding: '20px 22px 22px',
                marginBottom: 22,
                background:
                  'radial-gradient(90% 140% at 0% 0%, var(--sacred-soft), transparent 60%), var(--surface-1)',
                border: '1px solid color-mix(in srgb, var(--sacred) 30%, var(--line))',
                boxShadow: 'var(--shadow-lift)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
                <Icons.gem size={17} stroke="var(--sacred-ink)" />
                <div className="km-display-md" style={{ fontSize: 21 }}>Worth revisiting</div>
                <span style={{ flex: 1 }} />
                <Mono dim>what's settled, asking to be looked at</Mono>
              </div>
              <div className="km-body" style={{ margin: '0 0 16px 27px', color: 'var(--fg-muted)', fontSize: 13.5 }}>
                Things you decided were true. Still?
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, dueCrystals.length)}, 1fr)`, gap: 13 }}>
                {dueCrystals.map((c) => (
                  <CrystalCard key={c.id} item={c} />
                ))}
              </div>
            </section>
          )}

          {/* Do this week — recurring actions, directly below the hearth */}
          <DoThisWeek />

          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 372px', gap: 22, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* In focus + lens */}
              <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
                  <div className="km-display-md" style={{ fontSize: 19 }}>In focus</div>
                  <span style={{ flex: 1 }} />
                  <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
                    <LensBtn on={lens === 'serves'} onClick={() => setLensPersist('serves')}>What it serves</LensBtn>
                    <LensBtn on={lens === 'orient'} onClick={() => setLensPersist('orient')}>Under a bearing</LensBtn>
                    <LensBtn on={lens === 'horizon'} onClick={() => setLensPersist('horizon')}>By when</LensBtn>
                  </div>
                </div>
                {groups.length === 0 ? (
                  <Mono dim>Nothing in focus. Pick something up from the bench.</Mono>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {groups.map((g) => (
                      <FocusGroupView key={g.key} group={g} lens={lens} navigate={navigate} />
                    ))}
                  </div>
                )}
              </section>

              {/* This week */}
              <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
                  <div className="km-display-md" style={{ fontSize: 19 }}>This week</div>
                  <span style={{ flex: 1 }} />
                  <Mono dim>{crystalsThisWeek.length} kept</Mono>
                </div>
                {crystalsThisWeek.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                    {crystalsThisWeek.slice(0, 3).map((c) => (
                      <CrystalCard key={c.id} item={c} />
                    ))}
                  </div>
                )}
                <button
                  className="km-btn km-btn-soft"
                  style={{ width: '100%', justifyContent: 'space-between' }}
                  onClick={() => navigate('/review/weekly')}
                >
                  <span>The shape of your week</span>
                  <Icons.arrowR size={15} />
                </button>
              </section>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {/* Where you were */}
              <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                <div className="km-display-md" style={{ fontSize: 19, marginBottom: 6 }}>Where you were</div>
                <Mono dim>the bar shows depth — bright &amp; high is fresh, deep &amp; still is dormant</Mono>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginTop: 14 }}>
                  {pinned.map((p) => {
                    const c = counts.get(p.id) ?? { inbox: 0, active: 0, reflecting: 0, crystallized: 0 };
                    const last = lastTouched.get(p.id);
                    const temp: Temp = last ? temperatureForDate(last, settings) : 'dormant';
                    return (
                      <div
                        key={p.id}
                        className="km-row"
                        onClick={() => navigate(`/project/${p.slug}`)}
                        style={{
                          display: 'flex',
                          gap: 13,
                          padding: '13px 14px',
                          border: '1px solid var(--line)',
                          borderRadius: 'var(--r-ctrl)',
                          background: 'var(--card-2)',
                          cursor: 'pointer',
                        }}
                      >
                        <DepthBar temp={temp} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                            <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{p.name}</span>
                            <Mono dim>{DEPTH[temp].label}</Mono>
                          </div>
                          <div className="km-body-sm" style={{ color: 'var(--fg-muted)', marginBottom: 8 }}>
                            {last ? `last touched ${formatRelativeLoose(last)}` : 'quiet'}
                          </div>
                          <div style={{ display: 'flex', gap: 14 }}>
                            {c.active > 0 && <Mono dim>{c.active} in focus</Mono>}
                            {c.reflecting > 0 && (
                              <Mono dim style={{ color: 'var(--dot-reflect)' }}>{c.reflecting} on the shelf</Mono>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* C5 — aging whisper. No card, no badge: one quiet line. */}
                {aging.length > 0 && (
                  <div
                    onClick={() => navigate('/aging')}
                    className="km-body-sm"
                    style={{ marginTop: 14, color: 'var(--ink-muted)', cursor: 'pointer' }}
                  >
                    {aging.length} more deepening on the shelf →
                  </div>
                )}
              </section>

              {/* Lately */}
              {recentChats.length > 0 && (
                <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                  <div className="km-display-md" style={{ fontSize: 19, marginBottom: 14 }}>Lately</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {recentChats.map((chat) => {
                      const p = getProjectById(chat.projectId);
                      return (
                        <div
                          key={chat.id}
                          onClick={() => p && navigate(`/project/${p.slug}`)}
                          style={{ display: 'flex', gap: 11, alignItems: 'flex-start', cursor: p ? 'pointer' : 'default' }}
                        >
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: 999,
                              flex: '0 0 auto',
                              fontFamily: 'var(--ff-mono)',
                              fontSize: 10,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--action-soft)',
                              color: 'var(--action-ink)',
                            }}
                          >
                            AI
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="km-body-sm" style={{ lineHeight: 1.4 }}>{chat.tagline}</div>
                            <Mono dim>{formatRelative(chat.lastSeenAt)}</Mono>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const LensBtn = ({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className="km-body-sm"
    style={{
      fontWeight: 500,
      padding: '5px 11px',
      borderRadius: 999,
      border: 'none',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      background: on ? 'var(--card-2)' : 'transparent',
      color: on ? 'var(--fg)' : 'var(--fg-muted)',
      boxShadow: on ? 'var(--shadow-panel)' : 'none',
    }}
  >
    {children}
  </button>
);

const FocusGroupView = ({
  group,
  lens,
  navigate,
}: {
  group: FocusGroup;
  lens: FocusLens;
  navigate: (to: string) => void;
}) => {
  const rail = group.loose
    ? 'var(--line-strong)'
    : lens === 'horizon'
    ? group.tone
    : 'linear-gradient(180deg, var(--sacred), var(--action))';
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div
        style={{ width: 3, borderRadius: 999, alignSelf: 'stretch', flex: '0 0 auto', background: rail, opacity: group.loose ? 0.5 : 1 }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: group.loose ? 0.7 : 1 }}>
          {group.loose ? (
            <Mono dim>{group.label}</Mono>
          ) : lens === 'orient' ? (
            <>
              <Icons.star4 size={13} stroke="var(--sacred-ink)" />
              <Mono dim>under the bearing</Mono>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{group.label}</span>
            </>
          ) : lens === 'serves' ? (
            <>
              <Icons.gem size={13} stroke="var(--sacred-ink)" />
              <Mono dim>flowing toward</Mono>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{group.label}</span>
            </>
          ) : (
            <>
              <span style={{ width: 8, height: 8, borderRadius: 9, background: group.tone, flex: '0 0 auto' }} />
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>{group.label}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {group.items.map((it) => {
            const proj = getProjectById(it.projectId);
            return (
              <div
                key={it.id}
                className="km-row"
                onClick={() => proj && navigate(`/project/${proj.slug}`)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer', borderRadius: 'var(--r-ctrl)' }}
              >
                <span className="km-dot km-dot-ember" />
                <span style={{ color: 'var(--fg-faint)', display: 'flex' }}>
                  <KindIcon kind={it.kind} size={15} />
                </span>
                <span style={{ flex: 1, fontSize: 14.5 }}>{it.title}</span>
                {lens === 'serves'
                  ? it.dueAt && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--fg-faint)' }}>
                        <Icons.bell size={13} />
                        <Mono dim>{formatRelativeLoose(it.dueAt)}</Mono>
                      </span>
                    )
                  : proj && <ProjectTag slug={proj.slug} />}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = () => {
  const [skin] = useSkin();
  return skin === 'life' ? <DashboardLife /> : <DashboardWorkshop />;
};

export default Dashboard;
