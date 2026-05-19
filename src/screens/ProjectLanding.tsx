import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { CrystallizationCard } from '../components/CrystallizationCard';
import { NavRail } from '../components/NavRail';
import { NextUpRow } from '../components/NextUpRow';
import { NextStepsStrip } from '../components/NextStepsStrip';
import { ProjectTag } from '../components/ProjectTag';
import { TabButton } from '../components/TabButton';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { SectionHead } from '../components/SectionHead';
import { ChatRow } from '../components/ChatRow';
import { Icons } from '../components/Icon';
import {
  crystallizeItem,
  fileItem,
  touchItem,
} from '../data/actions';
import {
  getAgingItems,
  getCrystallizations,
  getFieldNotes,
  getNextUp,
  getPinnedDocs,
  getProjectBySlug,
  getProjectChats,
  getProjectCounts,
  getProjectDocs,
  getProjectItems,
  getProjectLastTouched,
  getRunbook,
  getSettings,
} from '../data/selectors';
import {
  formatIsoDate,
  formatRelative,
  formatRelativeLoose,
} from '../data/time';
import { stripFence } from '../lib/markdown';
import { openCapture } from '../lib/modals';
import { useStoreVersion } from '../data/store';
import type { Doc, Item } from '../data/types';

const DAY = 86400_000;

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

const AgingStripRow = ({ item }: { item: Item }) => {
  const last = item.lastTouchedAt ?? item.updatedAt;
  const days = Math.floor((Date.now() - last.getTime()) / DAY);
  return (
    <div
      className="km-row"
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 1fr 90px auto',
        alignItems: 'center',
        gap: 12,
        padding: '8px 14px',
        opacity: 0.78,
        borderBottom: '1px solid var(--line)',
      }}
    >
      <KindIcon kind={item.kind} />
      <span className="km-body">{item.title}</span>
      <Mono>{days}d cold</Mono>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => touchItem(item.id)}
          style={{ padding: '3px 8px', fontSize: 11 }}
        >
          Pick up
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => crystallizeItem(item.id, { promoteKind: true })}
          style={{ padding: '3px 8px', fontSize: 11 }}
        >
          Crystallize
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => fileItem(item.id)}
          style={{ padding: '3px 8px', fontSize: 11, color: 'var(--ember-deep)' }}
        >
          Let go
        </button>
      </div>
    </div>
  );
};

const ProjectNotFound = ({ slug }: { slug: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No thread named "{slug}".</div>
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
  const fieldNotes = getFieldNotes(project.id);
  const crystallizations = getCrystallizations(project.id);
  const settings = getSettings();
  const agingItems = getAgingItems(settings.agingThresholdDays, project.id);
  const { active: activeChats, stale: staleChats } = getProjectChats(project.id);
  const daysIn = Math.max(
    0,
    Math.floor((Date.now() - project.createdAt.getTime()) / DAY),
  );
  const lastTouched = getProjectLastTouched(project.id);

  const openFieldNotes = () => navigate(`/project/${project.slug}/field-notes`);
  const openRunbook = () => navigate(`/runbook/${project.slug}`);

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
            onOpenRunbook={openRunbook}
          />
          {/* Project header — thread framing */}
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
                  <Mono dim>
                    thread · {daysIn} days in · last touched {formatRelative(lastTouched)}
                  </Mono>
                  <Mono dim>· created {formatIsoDate(project.createdAt)}</Mono>
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
                <button className="km-btn" onClick={openFieldNotes}>
                  <Icons.note size={12} /> Field notes
                </button>
                <button className="km-btn" onClick={openRunbook}>
                  <Icons.runbook size={12} /> Runbook
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
            {/* In focus */}
            <section className="km-card" style={{ padding: 0 }}>
              <SectionHead
                title="In focus"
                right={
                  <Mono>
                    {counts.active} in focus · {counts.reflecting} reflecting · by last touched
                  </Mono>
                }
              />
              <div className="km-rule" />
              {nextUp.length === 0 ? (
                <div style={{ padding: '14px 16px' }}>
                  <Mono dim>nothing active in this thread</Mono>
                </div>
              ) : (
                nextUp.map((item, i) => (
                  <NextUpRow key={item.id} item={item} project={project} selected={i === 0} />
                ))
              )}
            </section>

            {/* Crystallizations — durable outcomes (moss accent) */}
            {crystallizations.length > 0 && (
              <section
                className="km-card"
                style={{ padding: 0, borderColor: 'rgba(92,122,62,.35)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                  <span style={{ color: 'var(--moss)', marginRight: 8 }}>
                    <Icons.star size={14} />
                  </span>
                  <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                    CRYSTALLIZATIONS
                  </span>
                  <span style={{ flex: 1 }} />
                  <Mono dim>
                    durable outcomes from this thread · {crystallizations.length}
                  </Mono>
                </div>
                <div className="km-rule" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  {crystallizations.slice(0, 4).map((item, i) => (
                    <div
                      key={item.id}
                      style={{
                        borderRight: i % 2 === 0 ? '1px solid var(--line)' : 0,
                        borderBottom: i < 2 && crystallizations.length > 2
                          ? '1px solid var(--line)'
                          : 0,
                      }}
                    >
                      <CrystallizationCard item={item} />
                    </div>
                  ))}
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

            {/* Field notes + Runbook — sense-making + operational, 1.4fr 1fr */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.4fr 1fr',
                gap: 14,
              }}
            >
              {/* Field notes */}
              <section className="km-card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                  <span style={{ color: 'var(--fg-muted)', marginRight: 8 }}>
                    <Icons.note size={13} />
                  </span>
                  <Label>Field notes</Label>
                  <Mono dim style={{ marginLeft: 8 }}>sense-making</Mono>
                  <span style={{ flex: 1 }} />
                  {fieldNotes && <Rev n={fieldNotes.revision} />}
                  <button
                    className="km-btn km-btn-ghost"
                    style={{ marginLeft: 8 }}
                    onClick={openFieldNotes}
                  >
                    Edit
                  </button>
                </div>
                <div className="km-rule" />
                <div style={{ padding: '12px 14px 14px' }}>
                  {fieldNotes?.openQuestions?.trim() ? (
                    <>
                      <div
                        className="km-display-sm"
                        style={{ fontSize: 10, marginBottom: 8, color: 'var(--ember-deep)' }}
                      >
                        OPEN QUESTIONS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {fieldNotes.openQuestions
                          .split('\n')
                          .filter((l) => l.trim())
                          .slice(0, 3)
                          .map((raw, i) => (
                            <div
                              key={i}
                              style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}
                            >
                              <span
                                style={{
                                  color: 'var(--ember-deep)',
                                  fontFamily: 'var(--ff-mono)',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  minWidth: 10,
                                }}
                              >
                                ?
                              </span>
                              <span
                                className="km-body"
                                style={{ flex: 1, lineHeight: 1.5, fontSize: 13 }}
                              >
                                {raw.replace(/^[?\-*•]\s*/, '')}
                              </span>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : fieldNotes?.premise?.trim() ? (
                    <>
                      <div className="km-display-sm" style={{ fontSize: 10, marginBottom: 6 }}>
                        PREMISE
                      </div>
                      <div className="km-body" style={{ lineHeight: 1.55, fontSize: 13 }}>
                        {fieldNotes.premise.slice(0, 320)}
                      </div>
                    </>
                  ) : (
                    <Mono dim>
                      no field notes yet — open to start a premise or capture an open question.
                    </Mono>
                  )}
                </div>
              </section>

              {/* Runbook */}
              <section className="km-card" style={{ padding: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                  <span style={{ color: 'var(--fg-muted)', marginRight: 8 }}>
                    <Icons.runbook size={13} />
                  </span>
                  <Label>Runbook</Label>
                  <Mono dim style={{ marginLeft: 8 }}>operational</Mono>
                  <span style={{ flex: 1 }} />
                  {runbook && <Rev n={runbook.revision} />}
                  <button
                    className="km-btn km-btn-ghost"
                    style={{ marginLeft: 8 }}
                    onClick={openRunbook}
                  >
                    Edit
                  </button>
                </div>
                <div className="km-rule" />
                <div style={{ padding: '12px 14px 14px' }}>
                  {runbook?.run?.trim() ? (
                    <>
                      <div className="km-display-sm" style={{ fontSize: 10, marginBottom: 6 }}>
                        RUN
                      </div>
                      <pre
                        className="km-code-block"
                        style={{
                          maxHeight: 140,
                          overflow: 'hidden',
                          marginBottom: 0,
                        }}
                      >
                        {stripFence(runbook.run).slice(0, 480)}
                      </pre>
                    </>
                  ) : (
                    <Mono dim>no runbook yet — operational reference lives here.</Mono>
                  )}
                </div>
              </section>
            </div>

            {/* Aging — per-thread let-go surface */}
            {agingItems.length > 0 && (
              <section
                className="km-card"
                style={{ padding: 0, background: 'rgba(201,168,124,.08)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
                  <Label>Aging</Label>
                  <Mono dim style={{ marginLeft: 8 }}>
                    untouched ≥ {settings.agingThresholdDays}d · let go or pick back up
                  </Mono>
                  <span style={{ flex: 1 }} />
                  <button
                    className="km-btn km-btn-ghost"
                    onClick={() => navigate('/aging')}
                    style={{ padding: '4px 6px' }}
                  >
                    Review all {agingItems.length} <Icons.arrowR size={11} />
                  </button>
                </div>
                <div className="km-rule" />
                {agingItems.slice(0, 3).map((item) => (
                  <AgingStripRow key={item.id} item={item} />
                ))}
              </section>
            )}

            {/* Conversations — promoted above all-items */}
            {(activeChats.length > 0 || staleChats.length > 0) && (
              <section className="km-card" style={{ padding: 0 }}>
                <SectionHead
                  title="Conversations"
                  right={
                    <>
                      <Mono>
                        {activeChats.length} active · {staleChats.length} stale
                      </Mono>
                      <button
                        className="km-btn km-btn-ghost"
                        style={{ padding: '3px 8px', fontSize: 12 }}
                      >
                        Start new
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
                <span style={{ flex: 1 }} />
                <span className="km-body-sm" style={{ marginRight: 8 }}>state</span>
                <span className="km-tag">active</span>
                <span style={{ width: 6 }} />
                <span className="km-tag">reflecting</span>
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
          </div>
        </main>
      </div>
    </div>
  );
};

export default ProjectLanding;
