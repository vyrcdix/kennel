import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { CreateGuidebookModal } from '../components/CreateGuidebookModal';
import { CrystalCard } from '../components/CrystalCard';
import { CrystallizationCard } from '../components/CrystallizationCard';
import { EditProjectModal } from '../components/EditProjectModal';
import { RegisterChatModal } from '../components/RegisterChatModal';
import { NavRail } from '../components/NavRail';
import { NextUpRow } from '../components/NextUpRow';
import { NextStepsStrip } from '../components/NextStepsStrip';
import { ProjectTag } from '../components/ProjectTag';
import { TabButton } from '../components/TabButton';
import { ThermalPanel } from '../components/ThermalPanel';
import { ThermalStamp } from '../components/ThermalStamp';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { SectionHead } from '../components/SectionHead';
import { ChatRow } from '../components/ChatRow';
import { Icons } from '../components/Icon';
import {
  panelTemperature,
  temperatureForDate,
  TOP_EDGE_BY_TEMP,
  type Temp,
} from '../lib/temperature';
import {
  crystallizeItem,
  deleteChat,
  deleteGuidebook,
  deleteReference,
  fileItem,
  reorderGuidebooks,
  setChatUrl,
  setDocPinned,
  setGuidebookPinned,
  touchItem,
  updateGuidebook,
  ValidationError,
} from '../data/actions';
import {
  getAgingItems,
  getCrystallizations,
  getFieldNotes,
  getGuidebookEntryCount,
  getNextUp,
  getPinnedDocs,
  getPinnedGuidebooks,
  getProjectBySlug,
  getProjectChats,
  getProjectCounts,
  getProjectDocs,
  getProjectGuidebooks,
  getProjectItems,
  getProjectLastTouched,
  getProjectReferences,
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
import type { Doc, Guidebook, Item } from '../data/types';

const DAY = 86400_000;

const PinnedGuidebookCard = ({
  guidebook,
  entryCount,
  onClick,
}: {
  guidebook: Guidebook;
  entryCount: number;
  onClick: () => void;
}) => (
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
      borderTop: '2px solid var(--ember)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          void setGuidebookPinned(guidebook.id, false);
        }}
        title="unpin from landing"
        style={{
          border: 0,
          background: 'transparent',
          padding: 0,
          color: 'var(--ember-deep)',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Icons.star size={12} />
      </button>
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
        {guidebook.name}
      </span>
    </div>
    {guidebook.description && (
      <div
        className="km-body-sm"
        style={{
          fontSize: 12,
          color: 'var(--fg-muted)',
          display: '-webkit-box',
          WebkitBoxOrient: 'vertical',
          WebkitLineClamp: 2,
          overflow: 'hidden',
        }}
      >
        {guidebook.description}
      </div>
    )}
    <Mono dim>{entryCount} {entryCount === 1 ? 'entry' : 'entries'}</Mono>
  </div>
);

const PinnedDocCard = ({
  doc,
  temp,
  onClick,
}: {
  doc: Doc;
  temp: Temp;
  onClick: () => void;
}) => {
  const edge = TOP_EDGE_BY_TEMP[temp];
  return (
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
      borderTop: `${edge.width}px solid ${edge.color}`,
      opacity: temp === 'dormant' ? 0.82 : 1,
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
      <button
        onClick={(e) => {
          e.stopPropagation();
          void setDocPinned(doc.id, false);
        }}
        title="unpin from landing"
        className="km-pin"
        style={{
          border: 0,
          background: 'transparent',
          padding: '2px 4px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          color: 'var(--ember-deep)',
        }}
      >
        <Icons.pin size={12} /> <span style={{ fontSize: 10, marginLeft: 3 }}>unpin</span>
      </button>
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
};

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
  const [activeTab, setActiveTab] = useState<
    'items' | 'docs' | 'references'
  >('items');
  const [contextOpen, setContextOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [registerChatOpen, setRegisterChatOpen] = useState(false);
  const [createGuidebookOpen, setCreateGuidebookOpen] = useState(false);
  const project = getProjectBySlug(slug);
  if (!project) return <ProjectNotFound slug={slug} />;

  const counts = getProjectCounts(project.id);
  const nextUp = getNextUp(project.id, 6);
  const pinnedDocs = getPinnedDocs(project.id);
  const allDocs = getProjectDocs(project.id);
  const allItems = getProjectItems(project.id);
  const refs = getProjectReferences(project.id);
  const runbook = getRunbook(project.id);
  const fieldNotes = getFieldNotes(project.id);
  const crystallizations = getCrystallizations(project.id);
  const allGuidebooks = getProjectGuidebooks(project.id);
  const pinnedGuidebooks = getPinnedGuidebooks(project.id);
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

  // Temperatures for each thermal panel. Panel temp = max recency of its
  // contents; empty panels fall through to 'active' (silent default).
  const inFocusTemp = panelTemperature(nextUp, settings);
  const inFocusSince = formatRelative(
    nextUp[0]?.lastTouchedAt ?? nextUp[0]?.updatedAt ?? new Date(0),
  );
  const crystTemp = panelTemperature(crystallizations, settings);
  const crystSince = formatRelative(
    crystallizations[0]?.doneAt ?? crystallizations[0]?.updatedAt ?? new Date(0),
  );
  const fieldNotesTemp = temperatureForDate(fieldNotes?.updatedAt, settings);
  const fieldNotesSince = formatRelative(fieldNotes?.updatedAt ?? new Date(0));
  const runbookTemp = temperatureForDate(runbook?.updatedAt, settings);
  const runbookSince = formatRelative(runbook?.updatedAt ?? new Date(0));
  // Newest guidebook drives the panel temp; matches how fieldNotes/runbook
  // colour their thermals.
  const newestGuidebookAt = allGuidebooks
    .map((g) => g.updatedAt)
    .sort((a, b) => b.getTime() - a.getTime())[0];
  const guidebooksTemp = temperatureForDate(newestGuidebookAt, settings);
  const guidebooksSince = formatRelative(newestGuidebookAt ?? new Date(0));
  // activeChats and staleChats are pre-sorted by lastSeenAt DESC; first
  // active beats any stale.
  const newestChat = activeChats[0] ?? staleChats[0];
  const chatsTemp = temperatureForDate(newestChat?.lastSeenAt, settings);
  const chatsSince = formatRelative(newestChat?.lastSeenAt ?? new Date(0));

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
            onAddDescription={() => setEditOpen(true)}
            onAddContext={() => setEditOpen(true)}
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
                  <>
                    <div
                      onClick={() => setContextOpen((v) => !v)}
                      style={{
                        marginTop: 8,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        cursor: 'pointer',
                        userSelect: 'none',
                      }}
                    >
                      <span
                        style={{
                          display: 'inline-flex',
                          transform: contextOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                        }}
                      >
                        <Icons.arrowDown size={12} />
                      </span>
                      <span
                        className="km-link"
                        style={{ fontSize: 13, borderBottomStyle: 'dashed' }}
                      >
                        {contextOpen ? 'hide context' : 'show context'}
                      </span>
                      <span className="km-body-sm">
                        — full markdown shipped to Claude with chat sessions
                      </span>
                    </div>
                    {contextOpen && (
                      <div
                        className="km-body"
                        style={{
                          marginTop: 10,
                          padding: '10px 12px',
                          background: 'var(--surface-1)',
                          border: '1px solid var(--line)',
                          borderRadius: 3,
                          fontSize: 13,
                          lineHeight: 1.55,
                          color: 'var(--fg)',
                          maxWidth: 760,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {project.context}
                      </div>
                    )}
                  </>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button className="km-btn" onClick={() => openCapture(project.slug)}>
                  <Icons.plus size={12} /> New item
                </button>
                <button className="km-btn" onClick={openFieldNotes}>
                  <Icons.note size={12} /> Field notes
                </button>
                <button className="km-btn" onClick={openRunbook}>
                  <Icons.runbook size={12} /> Runbook
                </button>
                <button
                  className="km-btn km-btn-ghost"
                  onClick={() => setEditOpen(true)}
                  title="Edit thread details"
                >
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
            <ThermalPanel temp={inFocusTemp}>
              <SectionHead
                title="In focus"
                right={
                  <>
                    <Mono dim>
                      {counts.active} in focus · {counts.reflecting} reflecting
                    </Mono>
                    <ThermalStamp temp={inFocusTemp} since={inFocusSince} />
                  </>
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
            </ThermalPanel>

            {/* Crystallizations — durable outcomes (moss accent retained on the side
                 borders; top edge yields to the temperature signal). */}
            {crystallizations.length > 0 && (
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
                    <Icons.star size={14} />
                  </span>
                  <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                    CRYSTALLIZATIONS
                  </span>
                  <span style={{ flex: 1 }} />
                  <Mono dim>
                    durable outcomes · {crystallizations.length}
                  </Mono>
                  <span style={{ width: 12 }} />
                  <ThermalStamp temp={crystTemp} since={crystSince} />
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
              </ThermalPanel>
            )}

            {/* v0.5 salient layer — the crystal gallery for this thread.
                Sits above pinned docs because the durable outcomes are
                the front page of a theme per v0.5 §5. Hidden when there
                are no crystals (the empty state lives on the dedicated
                /crystals gallery, not here). */}
            {crystallizations.length > 0 && (
              <section className="km-v4">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <Icons.gem size={15} stroke="#B07E12" />
                  <span
                    className="km-display-sm"
                    style={{ color: '#B07E12' }}
                  >
                    THE SALIENT LAYER · what this thread has crystallized
                  </span>
                  <span style={{ flex: 1 }} />
                  <Mono dim>{crystallizations.length} · kept fresh</Mono>
                </div>
                <div style={{ columnCount: 3, columnGap: 12 }}>
                  {crystallizations.slice(0, 6).map((c) => (
                    <CrystalCard key={c.id} item={c} />
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
                      temp={temperatureForDate(d.updatedAt, settings)}
                      onClick={() => navigate(`/doc/${d.id}`)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Pinned guidebooks row */}
            {pinnedGuidebooks.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                  <Label>Pinned guidebooks</Label>
                  <span style={{ flex: 1 }} />
                  <Mono>
                    {pinnedGuidebooks.length} of {allGuidebooks.length}
                  </Mono>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  {pinnedGuidebooks.slice(0, 3).map((g) => (
                    <PinnedGuidebookCard
                      key={g.id}
                      guidebook={g}
                      entryCount={getGuidebookEntryCount(g.id)}
                      onClick={() => navigate(`/project/${project.slug}/guidebook/${g.id}`)}
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
              <ThermalPanel temp={fieldNotesTemp}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                  <span style={{ color: 'var(--fg-muted)', marginRight: 8 }}>
                    <Icons.note size={13} />
                  </span>
                  <Label>Field notes</Label>
                  <Mono dim style={{ marginLeft: 8 }}>sense-making</Mono>
                  <span style={{ flex: 1 }} />
                  {fieldNotes && <Rev n={fieldNotes.revision} />}
                  <span style={{ width: 8 }} />
                  {fieldNotes && (
                    <ThermalStamp temp={fieldNotesTemp} since={fieldNotesSince} />
                  )}
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
              </ThermalPanel>

              {/* Runbook */}
              <ThermalPanel temp={runbookTemp}>
                <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
                  <span style={{ color: 'var(--fg-muted)', marginRight: 8 }}>
                    <Icons.runbook size={13} />
                  </span>
                  <Label>Runbook</Label>
                  <Mono dim style={{ marginLeft: 8 }}>operational</Mono>
                  <span style={{ flex: 1 }} />
                  {runbook && <Rev n={runbook.revision} />}
                  <span style={{ width: 8 }} />
                  {runbook && (
                    <ThermalStamp temp={runbookTemp} since={runbookSince} />
                  )}
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
              </ThermalPanel>
            </div>

            {/* Guidebooks — peer of Field notes / Runbook / Conversations */}
            <ThermalPanel temp={guidebooksTemp}>
              <SectionHead
                title="Guidebooks"
                right={
                  <>
                    <Mono dim>
                      {allGuidebooks.length === 0
                        ? 'ordered references per topic'
                        : `${allGuidebooks.length} in this thread`}
                    </Mono>
                    {allGuidebooks.length > 0 && (
                      <ThermalStamp temp={guidebooksTemp} since={guidebooksSince} />
                    )}
                    <button
                      className="km-btn km-btn-ghost"
                      style={{ padding: '3px 8px', fontSize: 12 }}
                      onClick={() => setCreateGuidebookOpen(true)}
                    >
                      <Icons.plus size={11} /> New guidebook
                    </button>
                  </>
                }
              />
              <div className="km-rule" />
              {allGuidebooks.length === 0 ? (
                <div
                  style={{
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <Mono dim>
                    no guidebooks yet — group docs and references into an ordered
                    spine
                  </Mono>
                </div>
              ) : (
                allGuidebooks.map((g, i) => {
                  const isFirst = i === 0;
                  const isLast = i === allGuidebooks.length - 1;
                  const entryCount = getGuidebookEntryCount(g.id);
                  const stop = (
                    e: React.MouseEvent | React.KeyboardEvent,
                  ): boolean => {
                    e.stopPropagation();
                    return true;
                  };
                  const swap = async (delta: 1 | -1) => {
                    const target = i + delta;
                    if (target < 0 || target >= allGuidebooks.length) return;
                    const next = [...allGuidebooks];
                    [next[i], next[target]] = [next[target], next[i]];
                    await reorderGuidebooks(
                      project.slug,
                      next.map((x) => x.id),
                    );
                  };
                  const rename = async () => {
                    const next = window.prompt('Rename guidebook', g.name);
                    if (next == null) return;
                    const trimmed = next.trim();
                    if (!trimmed || trimmed === g.name) return;
                    await updateGuidebook(g.id, { name: trimmed });
                  };
                  const onDelete = async () => {
                    if (
                      !window.confirm(
                        `Delete "${g.name}"? Source docs and references stay in the topic.`,
                      )
                    ) {
                      return;
                    }
                    await deleteGuidebook(g.id);
                  };
                  return (
                    <div
                      key={g.id}
                      className="km-row"
                      onClick={() =>
                        navigate(`/project/${project.slug}/guidebook/${g.id}`)
                      }
                      style={{
                        display: 'grid',
                        gridTemplateColumns:
                          '20px 1fr 90px 26px 26px 26px 26px',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 16px',
                        borderBottom:
                          isLast ? 'none' : '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                    >
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={(e) => {
                          stop(e);
                          void setGuidebookPinned(g.id, !g.pinned);
                        }}
                        title={g.pinned ? 'unpin' : 'pin to landing'}
                        style={{
                          padding: 0,
                          color: g.pinned
                            ? 'var(--ember-deep)'
                            : 'var(--fg-faint)',
                        }}
                      >
                        <Icons.star size={14} />
                      </button>
                      <div style={{ minWidth: 0 }}>
                        <div
                          className="km-body"
                          style={{
                            fontWeight: 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {g.name}
                        </div>
                        {g.description && (
                          <Mono
                            dim
                            style={{
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {g.description}
                          </Mono>
                        )}
                      </div>
                      <Mono dim>
                        {entryCount} {entryCount === 1 ? 'entry' : 'entries'}
                      </Mono>
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={(e) => {
                          stop(e);
                          void swap(-1);
                        }}
                        disabled={isFirst}
                        title="move up"
                        style={{
                          padding: 0,
                          opacity: isFirst ? 0.25 : 1,
                          cursor: isFirst ? 'default' : 'pointer',
                        }}
                      >
                        <Icons.arrowUp size={14} />
                      </button>
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={(e) => {
                          stop(e);
                          void swap(1);
                        }}
                        disabled={isLast}
                        title="move down"
                        style={{
                          padding: 0,
                          opacity: isLast ? 0.25 : 1,
                          cursor: isLast ? 'default' : 'pointer',
                        }}
                      >
                        <Icons.arrowDown size={14} />
                      </button>
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={(e) => {
                          stop(e);
                          void rename();
                        }}
                        title="rename"
                        style={{ padding: 0, color: 'var(--fg-muted)' }}
                      >
                        <Icons.note size={14} />
                      </button>
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={(e) => {
                          stop(e);
                          void onDelete();
                        }}
                        title="delete"
                        style={{ padding: 0, color: 'var(--ember-deep)' }}
                      >
                        <Icons.trash size={14} />
                      </button>
                    </div>
                  );
                })
              )}
            </ThermalPanel>

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
              <ThermalPanel temp={chatsTemp}>
                <SectionHead
                  title="Conversations"
                  right={
                    <>
                      <Mono dim>
                        {activeChats.length} active · {staleChats.length} stale
                      </Mono>
                      <ThermalStamp temp={chatsTemp} since={chatsSince} />
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
                      claudeUrl={c.claudeUrl}
                      onClick={
                        c.claudeUrl
                          ? () =>
                              window.open(c.claudeUrl!, '_blank', 'noopener,noreferrer')
                          : undefined
                      }
                      onSaveUrl={(url) => void setChatUrl(c.id, url)}
                      onDelete={async () => {
                        if (window.confirm(`Delete conversation "${c.tagline.slice(0, 60)}…"? This can't be undone.`)) {
                          await deleteChat(c.id);
                        }
                      }}
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
                          claudeUrl={c.claudeUrl}
                          onClick={
                            c.claudeUrl
                              ? () =>
                                  window.open(c.claudeUrl!, '_blank', 'noopener,noreferrer')
                              : undefined
                          }
                          onSaveUrl={(url) => void setChatUrl(c.id, url)}
                          onDelete={async () => {
                            if (window.confirm(`Delete conversation "${c.tagline.slice(0, 60)}…"? This can't be undone.`)) {
                              await deleteChat(c.id);
                            }
                          }}
                          stale
                        />
                      ))}
                    </>
                  )}
                </div>
              </ThermalPanel>
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
                <TabButton
                  label={`Items · ${allItems.length}`}
                  active={activeTab === 'items'}
                  onClick={() => setActiveTab('items')}
                />
                <span style={{ width: 18 }} />
                <TabButton
                  label={`Docs · ${allDocs.length}`}
                  active={activeTab === 'docs'}
                  onClick={() => setActiveTab('docs')}
                />
                <span style={{ width: 18 }} />
                <TabButton
                  label={`References · ${refs.length}`}
                  active={activeTab === 'references'}
                  onClick={() => setActiveTab('references')}
                />
                <span style={{ flex: 1 }} />
              </div>
              <div>
                {activeTab === 'items' && (
                  allItems.length === 0 ? (
                    <div style={{ padding: '14px 16px' }}>
                      <Mono dim>no items in this thread</Mono>
                    </div>
                  ) : (
                    allItems
                      .slice(0, 20)
                      .map((item) => (
                        <NextUpRow key={item.id} item={item} project={project} />
                      ))
                  )
                )}
                {activeTab === 'docs' && (
                  allDocs.length === 0 ? (
                    <div style={{ padding: '14px 16px' }}>
                      <Mono dim>no docs in this thread</Mono>
                    </div>
                  ) : (
                    allDocs.map((d) => (
                      <div
                        key={d.id}
                        className="km-row"
                        onClick={() => navigate(`/doc/${d.id}`)}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '14px 1fr 60px 90px 26px',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 16px',
                          borderBottom: '1px solid var(--line)',
                          cursor: 'pointer',
                        }}
                      >
                        <Icons.doc size={12} />
                        <span className="km-body" style={{ fontWeight: 500 }}>
                          {d.title}
                        </span>
                        <Mono>rev {d.revision}</Mono>
                        <Mono dim>{formatRelative(d.updatedAt)}</Mono>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            void setDocPinned(d.id, !d.pinned);
                          }}
                          title={d.pinned ? 'unpin from landing' : 'pin to landing'}
                          style={{
                            border: 0,
                            background: 'transparent',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            color: d.pinned
                              ? 'var(--ember-deep)'
                              : 'var(--fg-faint)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icons.pin size={12} />
                        </button>
                      </div>
                    ))
                  )
                )}
                {activeTab === 'references' && (
                  refs.length === 0 ? (
                    <div style={{ padding: '14px 16px' }}>
                      <Mono dim>no references in this thread</Mono>
                    </div>
                  ) : (
                    refs.map((r) => (
                      <div
                        key={r.id}
                        className="km-row"
                        onClick={() => {
                          if (r.url) window.open(r.url, '_blank', 'noopener,noreferrer');
                        }}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '14px 1fr 90px 26px',
                          alignItems: 'center',
                          gap: 12,
                          padding: '8px 16px',
                          borderBottom: '1px solid var(--line)',
                          cursor: r.url ? 'pointer' : 'default',
                        }}
                      >
                        <Icons.ext size={12} />
                        <div style={{ minWidth: 0 }}>
                          <div className="km-body" style={{ fontWeight: 500 }}>
                            {r.label}
                          </div>
                          {r.url && (
                            <Mono dim>{r.url}</Mono>
                          )}
                        </div>
                        <Mono dim>{formatRelative(r.updatedAt)}</Mono>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (!window.confirm(`Delete reference "${r.label}"? Items pointing at it lose the link. This can't be undone.`)) return;
                            try {
                              await deleteReference(r.id);
                            } catch (err) {
                              if (err instanceof ValidationError && err.fields.reference === 'in_use_by_guidebook_entry') {
                                window.alert('This reference is used by one or more guidebook entries. Remove the entries first, then delete.');
                              } else {
                                window.alert((err as Error).message);
                              }
                            }
                          }}
                          title="Delete reference"
                          style={{
                            border: 0,
                            background: 'transparent',
                            padding: '2px 4px',
                            cursor: 'pointer',
                            color: 'var(--ember-deep)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Icons.trash size={12} />
                        </button>
                      </div>
                    ))
                  )
                )}
              </div>
            </section>
          </div>
        </main>
      </div>
      <EditProjectModal
        open={editOpen}
        project={project}
        onClose={() => setEditOpen(false)}
      />
      <RegisterChatModal
        open={registerChatOpen}
        projectSlug={project.slug}
        onClose={() => setRegisterChatOpen(false)}
      />
      <CreateGuidebookModal
        open={createGuidebookOpen}
        projectSlug={project.slug}
        onClose={() => setCreateGuidebookOpen(false)}
      />
    </div>
  );
};

export default ProjectLanding;
