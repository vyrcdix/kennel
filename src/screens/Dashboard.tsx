import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { NextUpRow } from '../components/NextUpRow';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { SectionHead } from '../components/SectionHead';
import { ActivityEntry as ActivityEntryRow } from '../components/ActivityEntry';
import { toActorWho } from '../components/Actor';
import { Icons } from '../components/Icon';
import {
  getAllProjectCounts,
  getInboxRollup,
  getNextUp,
  getPinnedProjects,
  getYesterdayActivity,
} from '../data/selectors';
import { formatDashboardDate, formatTime } from '../data/time';
import { useStoreVersion } from '../data/store';
import { openCreateProject } from '../lib/modals';
import type { ActivityEntry, Project } from '../data/types';

type ProjectCardProps = {
  project: Project;
  active?: boolean;
  counts: { inbox: number; active: number; parked: number; done: number };
};

const ProjectCard = ({ project, active, counts }: ProjectCardProps) => {
  const navigate = useNavigate();
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
          <Mono>{counts.parked}</Mono>
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

const renderActivity = (a: ActivityEntry) => (
  <ActivityEntryRow
    key={a.id}
    time={formatTime(a.occurredAt)}
    who={toActorWho(a.actor)}
    verb={a.verb}
    target={a.target}
    payload={a.payload ?? ''}
  />
);

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
  const pinned = getPinnedProjects();
  const nextUp = getNextUp(undefined, 7);
  const inboxRollup = getInboxRollup();
  const yesterday = getYesterdayActivity(4);
  const totalActive = nextUp.length;
  const countsById = useMemo(() => getAllProjectCounts(), [v]);
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
              <button className="km-btn">
                <Icons.eye size={12} /> Focus mode
              </button>
              <button className="km-btn">
                <Icons.filter size={12} /> Weekly review
              </button>
            </div>
          </div>

          {/* Project rail */}
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
                counts={countsById.get(p.id) ?? { inbox: 0, active: 0, parked: 0, done: 0 }}
              />
            ))}
          </div>

          {/* Next up + side panels */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
            <section className="km-card" style={{ padding: 0 }}>
              <SectionHead
                title="Next up"
                right={<Mono>{totalActive} active · ranked</Mono>}
              />
              <div className="km-rule" />
              {nextUp.map((item, i) => {
                const project = projectsById.get(item.projectId);
                if (!project) return null;
                return (
                  <NextUpRow key={item.id} item={item} project={project} selected={i < 2} />
                );
              })}
            </section>

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
                        Triage all <Icons.arrowR size={12} />
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
                        triage
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Yesterday */}
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="Yesterday"
                  right={<Mono>{yesterday.length} events · collapsed</Mono>}
                />
                <div className="km-rule" />
                <div
                  style={{
                    padding: '8px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                  }}
                >
                  {yesterday.map(renderActivity)}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
