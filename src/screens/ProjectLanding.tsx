import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { NextUpRow } from '../components/NextUpRow';
import { NextStepsStrip } from '../components/NextStepsStrip';
import { ProjectTag } from '../components/ProjectTag';
import { TabButton } from '../components/TabButton';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { SectionHead } from '../components/SectionHead';
import { ChatRow } from '../components/ChatRow';
import { Icons } from '../components/Icon';
import {
  getNextUp,
  getPinnedDocs,
  getProjectBySlug,
  getProjectChats,
  getProjectCounts,
  getProjectDocs,
  getProjectItems,
  getRunbook,
} from '../data/selectors';
import { formatIsoDate, formatRelativeLoose, formatTime } from '../data/time';
import { stripFence } from '../lib/markdown';
import { openCapture } from '../lib/modals';
import { useStoreVersion } from '../data/store';
import type { Doc } from '../data/types';

const PinnedDocCard = ({ doc, onClick }: { doc: Doc; onClick: () => void }) => (
  <div
    className="km-card"
    onClick={onClick}
    style={{
      padding: '10px 12px',
      minWidth: 220,
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      cursor: 'pointer',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{ color: 'var(--fg-muted)' }}>
        <Icons.doc size={12} />
      </span>
      <span
        className="km-body"
        style={{
          fontWeight: 500,
          flex: 1,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {doc.title}
      </span>
      <span className="km-pin">
        <Icons.pin size={10} />
      </span>
    </div>
    <div
      className="km-body-sm"
      style={{
        lineHeight: 1.4,
        display: '-webkit-box',
        WebkitLineClamp: 1,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
      }}
    >
      {doc.body.replace(/^#.+\n+/, '').slice(0, 140)}
    </div>
    <Mono>rev {doc.revision}</Mono>
  </div>
);

const ProjectNotFound = ({ slug }: { slug: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No project named "{slug}".</div>
        <Mono>try the dashboard for the full list</Mono>
      </main>
    </div>
  </div>
);

export const ProjectLanding = () => {
  const navigate = useNavigate();
  useStoreVersion();
  const { slug = 'kennel' } = useParams<{ slug?: string }>();
  const project = getProjectBySlug(slug);
  if (!project) return <ProjectNotFound slug={slug} />;

  const counts = getProjectCounts(project.id);
  const nextUp = getNextUp(project.id, 6);
  const pinnedDocs = getPinnedDocs(project.id);
  const allDocs = getProjectDocs(project.id);
  const activeItems = getProjectItems(project.id, 'active').slice(0, 4);
  const runbook = getRunbook(project.id);
  const { active: activeChats, stale: staleChats } = getProjectChats(project.id);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar
        projectChip={<ProjectTag slug={project.slug} />}
        captureProjectSlug={project.slug}
      />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" activeProjectSlug={project.slug} />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto' }}>
          <NextStepsStrip
            project={project}
            onCapture={() => openCapture(project.slug)}
            onAddDescription={() => {
              // Inline project editor lands with MCP's update_project work.
            }}
            onAddContext={() => {
              // Same — Claude will populate this via MCP shortly.
            }}
            onOpenRunbook={() => navigate(`/runbook/${project.slug}`)}
          />
          {/* Project header */}
          <div style={{ padding: '22px 32px 14px', borderBottom: '1px solid var(--line)' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <ProjectTag slug={project.slug} />
                  {project.pinned && (
                    <span className="km-pin">
                      <Icons.pin size={12} />
                    </span>
                  )}
                  <Mono>created {formatIsoDate(project.createdAt)}</Mono>
                </div>
                <div className="km-display-lg" style={{ marginBottom: 4 }}>
                  {project.name}
                </div>
                <div
                  className="km-body"
                  style={{ maxWidth: 760, color: 'var(--fg-muted)' }}
                >
                  {project.description}
                </div>
                {project.context && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Icons.arrowDown size={12} />
                    <span
                      className="km-link"
                      style={{ fontSize: 13, borderBottomStyle: 'dashed' }}
                    >
                      show context
                    </span>
                    <span className="km-body-sm">
                      — full markdown shipped to Claude with chat sessions
                    </span>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="km-btn">
                  <Icons.plus size={12} /> New item
                </button>
                <button
                  className="km-btn"
                  onClick={() => navigate(`/runbook/${project.slug}`)}
                >
                  <Icons.runbook size={12} /> Run
                </button>
                <button className="km-btn km-btn-ghost">
                  <Icons.cog size={13} />
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '18px 32px 32px',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}
          >
            {/* Next up strip */}
            <section className="km-card" style={{ padding: 0 }}>
              <SectionHead
                title="Next up"
                right={
                  <Mono>
                    {counts.active} active · {counts.parked} parked
                  </Mono>
                }
              />
              <div className="km-rule" />
              {nextUp.length === 0 ? (
                <div style={{ padding: '14px 16px' }}>
                  <Mono dim>nothing active in this project</Mono>
                </div>
              ) : (
                nextUp.map((item, i) => (
                  <NextUpRow key={item.id} item={item} project={project} selected={i === 0} />
                ))
              )}
            </section>

            {/* Runbook panel */}
            {runbook && (
              <section className="km-card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                  <span style={{ color: 'var(--fg-muted)', marginRight: 8 }}>
                    <Icons.runbook size={14} />
                  </span>
                  <Label>Runbook</Label>
                  <span style={{ flex: 1 }} />
                  <Rev n={runbook.revision} />
                  <span style={{ margin: '0 10px', color: 'var(--fg-faint)' }}>·</span>
                  <Mono>updated {formatTime(runbook.updatedAt)}</Mono>
                  <button
                    className="km-btn km-btn-ghost"
                    style={{ marginLeft: 8 }}
                    onClick={() => navigate(`/runbook/${project.slug}`)}
                  >
                    Edit
                  </button>
                  <button className="km-btn km-btn-ghost">
                    <Icons.arrowDown size={12} />
                  </button>
                </div>
                <div className="km-rule" />
                <div
                  style={{
                    display: 'flex',
                    gap: 0,
                    padding: '0 16px',
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <TabButton label="Prerequisites" />
                  <span style={{ width: 18 }} />
                  <TabButton label="Setup" />
                  <span style={{ width: 18 }} />
                  <TabButton label="Run" active />
                  <span style={{ width: 18 }} />
                  <TabButton label="Deploy" />
                  <span style={{ width: 18 }} />
                  <TabButton label="Troubleshoot" />
                  <span style={{ width: 18 }} />
                  <TabButton label="Notes" />
                </div>
                <div style={{ padding: '14px 16px 16px' }}>
                  <pre className="km-code-block">{stripFence(runbook.run)}</pre>
                </div>
              </section>
            )}

            {/* Pinned docs row */}
            {pinnedDocs.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <Label>Pinned docs</Label>
                  <span style={{ flex: 1 }} />
                  <Mono>
                    {pinnedDocs.length} of {allDocs.length}
                  </Mono>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {pinnedDocs.slice(0, 3).map((d) => (
                    <PinnedDocCard
                      key={d.id}
                      doc={d}
                      onClick={() => navigate(`/doc/${d.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* All items tabs */}
            <section className="km-card" style={{ padding: 0 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 16px',
                  borderBottom: '1px solid var(--line)',
                }}
              >
                <TabButton label="Items" active />
                <span style={{ width: 18 }} />
                <TabButton label="Docs" />
                <span style={{ width: 18 }} />
                <TabButton label="References" />
                <span style={{ width: 18 }} />
                <TabButton label="Chats" />
                <span style={{ flex: 1 }} />
                <span className="km-body-sm" style={{ marginRight: 8 }}>state</span>
                <span className="km-tag">active</span>
                <span style={{ width: 6 }} />
                <span className="km-tag">parked</span>
                <span style={{ width: 12 }} />
                <button className="km-btn km-btn-ghost">
                  <Icons.filter size={12} /> Filter
                </button>
              </div>
              <div>
                {activeItems.map((item) => (
                  <NextUpRow key={item.id} item={item} project={project} />
                ))}
              </div>
            </section>

            {/* Chats panel */}
            {(activeChats.length > 0 || staleChats.length > 0) && (
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="Chats"
                  right={
                    <>
                      <Mono>
                        {activeChats.length} active · {staleChats.length} stale
                      </Mono>
                      <button className="km-btn km-btn-ghost" style={{ padding: '4px 6px' }}>
                        <Icons.arrowDown size={12} />
                      </button>
                    </>
                  }
                />
                <div className="km-rule" />
                <div
                  style={{
                    padding: '6px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                  }}
                >
                  {activeChats.map((c) => (
                    <ChatRow
                      key={c.id}
                      tagline={c.tagline}
                      since={formatRelativeLoose(c.lastSeenAt)}
                      claudeUrl={!!c.claudeUrl}
                    />
                  ))}
                  {staleChats.length > 0 && (
                    <>
                      <div style={{ padding: '10px 8px 4px' }}>
                        <Mono>Stale · {'>'}60 days</Mono>
                      </div>
                      {staleChats.map((c) => (
                        <ChatRow
                          key={c.id}
                          tagline={c.tagline}
                          since={formatRelativeLoose(c.lastSeenAt)}
                          claudeUrl={!!c.claudeUrl}
                          stale
                        />
                      ))}
                    </>
                  )}
                </div>
              </section>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectLanding;
