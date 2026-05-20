import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatRow } from '../components/ChatRow';
import { ChromeBar } from '../components/ChromeBar';
import { KindIcon } from '../components/KindIcon';
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
  getInboxRollup,
  getNextUp,
  getPinnedProjects,
  getProjectById,
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
import { openCreateProject } from '../lib/modals';
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
        background: active ? 'rgba(217,98,44,.06)' : 'var(--surface-1)',
        borderColor: active ? 'rgba(217,98,44,.30)' : 'var(--line)',
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
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
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
  return (
    <div
      className="km-row"
      onClick={() => navigate('/aging')}
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

const CrystallizedRow = ({ item }: { item: Item }) => {
  const navigate = useNavigate();
  const project = getProjectById(item.projectId);
  return (
    <div
      onClick={() => item.docId && navigate(`/doc/${item.docId}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 90px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        borderBottom: '1px solid var(--line)',
        cursor: item.docId ? 'pointer' : 'default',
      }}
    >
      <span style={{ color: 'var(--moss)' }}>
        <Icons.star size={12} />
      </span>
      {project && <ProjectTag slug={project.slug} />}
      <span
        className="km-body"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        {item.title}
      </span>
      <Mono>{formatRelative(item.doneAt ?? item.updatedAt)}</Mono>
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
    <div className="km-display-sm" style={{ color: 'var(--fg-faint)' }}>NO PROJECTS</div>
    <div className="km-display-lg" style={{ textAlign: 'center' }}>
      No projects. Create one to start.
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
      A project is the unit that holds items, docs, references, and chats. Most users start with one for active work and one for reading.
    </div>
    <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
      <button className="km-btn km-btn-primary" onClick={openCreateProject}>
        <Icons.plus size={12} /> New project
      </button>
      <button className="km-btn" disabled style={{ opacity: 0.5 }} title="CLI import only for now">
        Import from filesystem
      </button>
    </div>
  </main>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const v = useStoreVersion();
  const [focusMode, setFocusMode] = useFocusMode();
  const [registerChatOpen, setRegisterChatOpen] = useState(false);
  const pinned = getPinnedProjects();
  const recentChats = getRecentChats(4);
  const nextUp = getNextUp(undefined, 7);
  const inboxRollup = getInboxRollup();
  const settings = getSettings();
  const aging = getAgingItems(settings.agingThresholdDays);
  const crystallizedWeek = getCrystallizedThisWeek();
  const totalActive = nextUp.length;
  const inFocusTemp = panelTemperature(nextUp, settings);
  const inFocusSince = formatRelative(
    nextUp[0]?.lastTouchedAt ?? nextUp[0]?.updatedAt ?? new Date(0),
  );
  const crystTemp = panelTemperature(crystallizedWeek, settings);
  const crystSince = formatRelative(
    crystallizedWeek[0]?.doneAt ?? crystallizedWeek[0]?.updatedAt ?? new Date(0),
  );
  const countsById = useMemo(() => getAllProjectCounts(), [v]);
  const lastTouchedById = useMemo(() => getAllProjectLastTouched(), [v]);
  const projectsById = useMemo(
    () => new Map(pinned.map((p) => [p.id, p])),
    [pinned],
  );
  const hasProjects = pinned.length > 0 || nextUp.length > 0 || inboxRollup.length > 0;

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
                title="⌘⇧F · hide side panels and project rail"
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

          {/* Project rail */}
          {!focusMode && (
            <>
              <Label style={{ marginBottom: 10 }}>Pinned projects</Label>
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
                {pinned.map((p, i) => (
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
          )}

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
                      <Mono dim>{totalActive} active</Mono>
                      <ThermalStamp temp={inFocusTemp} since={inFocusSince} />
                    </>
                  }
                />
                <div className="km-rule" />
                {nextUp.map((item, i) => {
                  const project = projectsById.get(item.projectId);
                  if (!project) return null;
                  return (
                    <NextUpRow key={item.id} item={item} project={project} selected={i < 2} />
                  );
                })}
              </ThermalPanel>

              {/* Crystallized this week — moss accent retained on side borders;
                  top edge yields to the temperature signal. */}
              {crystallizedWeek.length > 0 && (
                <ThermalPanel
                  temp={crystTemp}
                  style={{
                    borderLeftColor: 'rgba(92,122,62,.35)',
                    borderRightColor: 'rgba(92,122,62,.35)',
                    borderBottomColor: 'rgba(92,122,62,.35)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                    <span style={{ color: 'var(--moss)', marginRight: 8 }}>
                      <Icons.star size={13} />
                    </span>
                    <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                      CRYSTALLIZED THIS WEEK
                    </span>
                    <span style={{ flex: 1 }} />
                    <Mono dim>{crystallizedWeek.length} durable outcomes</Mono>
                    <span style={{ width: 12 }} />
                    <ThermalStamp temp={crystTemp} since={crystSince} />
                  </div>
                  <div className="km-rule" />
                  {crystallizedWeek.slice(0, 4).map((item) => (
                    <CrystallizedRow key={item.id} item={item} />
                  ))}
                </ThermalPanel>
              )}

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
              {/* Inbox roll-up */}
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="Inbox"
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
                style={{ padding: 0, background: 'rgba(201,168,124,.06)' }}
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

export default Dashboard;
