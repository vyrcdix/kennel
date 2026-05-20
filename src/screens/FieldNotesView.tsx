import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Rev } from '../components/Rev';
import { TabButton } from '../components/TabButton';
import {
  captureItem,
  createReference,
  fileItem,
  setFieldNotesMode,
  updateFieldNotes,
} from '../data/actions';
import {
  getCrystallizations,
  getFieldNotes,
  getProjectBySlug,
  getProjectQuestions,
  getProjectReferences,
} from '../data/selectors';
import { formatTime } from '../data/time';
import { renderBlocks } from '../lib/markdown';
import { useStoreVersion } from '../data/store';
import type { FieldNotesMode } from '../data/types';

type SectionKey = 'premise' | 'whatIKnow' | 'openQuestions' | 'sources' | 'crystallizations';
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'premise', label: 'Premise' },
  { key: 'whatIKnow', label: 'What I know' },
  { key: 'openQuestions', label: 'Open questions' },
  { key: 'sources', label: 'Sources' },
  { key: 'crystallizations', label: 'Crystallizations' },
];

// Sections that become entity lists in managed mode (no blob editor).
const ENTITY_IN_MANAGED: ReadonlySet<SectionKey> = new Set(['openQuestions', 'sources']);

const FieldNotesNotFound = ({ slug }: { slug: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No thread named "{slug}".</div>
        <Mono dim>field notes live alongside the runbook on a thread's landing page</Mono>
      </main>
    </div>
  </div>
);

/** Copies a ready-made prompt to the clipboard so the user can paste it
 *  into a Claude chat connected to Steep. Closes the "but how" gap. */
const AskClaudeButton = ({ slug, section }: { slug: string; section: string }) => {
  const [copied, setCopied] = useState(false);
  const prompt =
    `Using the Steep MCP tools, read the field notes for project "${slug}" ` +
    `and draft the ${section} section — keep it concise and concrete.`;
  return (
    <button
      className="km-btn km-btn-ghost"
      onClick={() => {
        void navigator.clipboard?.writeText(prompt);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }}
      title="Copy a prompt to paste into a Claude chat connected to Steep"
      style={{ fontSize: 11.5 }}
    >
      <Icons.bulb size={12} /> {copied ? 'Prompt copied' : 'Ask Claude'}
    </button>
  );
};

export const FieldNotesView = () => {
  const navigate = useNavigate();
  useStoreVersion();
  const { slug = 'kennel' } = useParams<{ slug?: string }>();
  const project = getProjectBySlug(slug);
  const [active, setActive] = useState<SectionKey>('premise');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string>('');
  const fn = project ? getFieldNotes(project.id) : undefined;
  const crystallizations = useMemo(
    () => (project ? getCrystallizations(project.id) : []),
    [project],
  );
  if (!project) return <FieldNotesNotFound slug={slug} />;

  const mode: FieldNotesMode = fn?.mode ?? 'scratchpad';
  const sectionValue = (k: SectionKey): string => (fn?.[k] ?? '') as string;
  // Open Questions / Sources are entity lists in managed mode — no blob editor.
  const isEntitySection = mode === 'managed' && ENTITY_IN_MANAGED.has(active);

  const startEdit = () => {
    setDraft(sectionValue(active));
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const save = async () => {
    await updateFieldNotes(project.slug, { [active]: draft } as Record<string, string>);
    setEditing(false);
  };
  const switchMode = (next: FieldNotesMode) => {
    if (next === mode) return;
    setEditing(false);
    void setFieldNotesMode(project.slug, next);
  };

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar projectChip={<ProjectTag slug={project.slug} />} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" activeProjectSlug={project.slug} />
        <main
          className="km-scroll"
          style={{ flex: 1, overflow: 'auto', padding: '22px 32px 32px' }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 24,
              marginBottom: 18,
              paddingBottom: 16,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ color: 'var(--fg-muted)' }}>
                  <Icons.note size={14} />
                </span>
                <ProjectTag slug={project.slug} />
                <Mono dim>field notes · sense-making</Mono>
              </div>
              <div className="km-display-lg" style={{ marginBottom: 4 }}>
                {project.name} — Field notes
              </div>
              <div className="km-body" style={{ color: 'var(--fg-muted)', maxWidth: 760 }}>
                The thinking around this thread — premise, what's been observed, open
                questions, what crystallized. A sibling to the runbook, which stays
                operational. Use <strong>Ask Claude</strong> on any section to copy a
                prompt for a Steep-connected Claude chat.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {fn && <Rev n={fn.revision} />}
              {fn && <Mono dim>updated {formatTime(fn.updatedAt)}</Mono>}
              <button
                className="km-btn"
                onClick={() => navigate(`/runbook/${project.slug}`)}
              >
                <Icons.runbook size={12} /> Runbook
              </button>
            </div>
          </div>

          {/* Mode toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <Mono dim>mode</Mono>
            <div style={{ display: 'inline-flex', border: '1px solid var(--line)', borderRadius: 4, overflow: 'hidden' }}>
              {(['scratchpad', 'managed'] as FieldNotesMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  style={{
                    padding: '4px 12px',
                    border: 0,
                    background: mode === m ? 'rgba(217,98,44,.12)' : 'transparent',
                    color: mode === m ? 'var(--ember-deep)' : 'var(--fg-muted)',
                    fontFamily: 'var(--ff-sans)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <Mono dim>
              {mode === 'managed'
                ? 'open questions + sources are tracked entities'
                : 'every section is a free-text markdown pad'}
            </Mono>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
              borderBottom: '1px solid var(--line)',
              marginBottom: 18,
            }}
          >
            {SECTIONS.map((s) => (
              <TabButton
                key={s.key}
                label={s.label}
                active={s.key === active}
                onClick={() => {
                  if (editing) cancelEdit();
                  setActive(s.key);
                }}
              />
            ))}
            <span style={{ flex: 1 }} />
            <AskClaudeButton
              slug={project.slug}
              section={SECTIONS.find((s) => s.key === active)?.label ?? ''}
            />
            {/* Blob editor only for scratchpad blobs (not entity lists, not crystallizations) */}
            {active !== 'crystallizations' && !isEntitySection && (
              !editing ? (
                <button className="km-btn km-btn-ghost" onClick={startEdit}>
                  <Icons.note size={12} /> Edit
                </button>
              ) : (
                <>
                  <button className="km-btn km-btn-ghost" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button className="km-btn km-btn-primary" onClick={save}>
                    Save
                  </button>
                </>
              )
            )}
          </div>

          {/* Body */}
          {editing && !isEntitySection ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={20}
              autoFocus
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                fontFamily: 'var(--ff-mono)',
                fontSize: 12.5,
                lineHeight: 1.7,
                color: 'var(--fg)',
                resize: 'vertical',
                minHeight: 320,
                outline: 'none',
              }}
              placeholder={`Markdown for "${
                SECTIONS.find((s) => s.key === active)?.label
              }"…`}
            />
          ) : active === 'openQuestions' && mode === 'managed' ? (
            <ManagedQuestionsView projectId={project.id} />
          ) : active === 'sources' && mode === 'managed' ? (
            <ManagedSourcesView projectId={project.id} projectSlug={project.slug} />
          ) : active === 'openQuestions' ? (
            <OpenQuestionsView body={sectionValue(active)} />
          ) : active === 'crystallizations' ? (
            <CrystallizationsView projectId={project.id} body={sectionValue(active)} />
          ) : (
            <div style={{ maxWidth: 760, lineHeight: 1.6 }}>
              {sectionValue(active) ? (
                renderBlocks(sectionValue(active))
              ) : (
                <Mono dim>
                  empty — click Edit, or hit Ask Claude to copy a drafting prompt.
                </Mono>
              )}
            </div>
          )}

          {/* Footnote */}
          <div
            style={{
              marginTop: 28,
              padding: '10px 14px',
              background: 'var(--surface-1)',
              border: '1px solid var(--line)',
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Mono dim>{crystallizations.length} crystallization{crystallizations.length === 1 ? '' : 's'} in this thread</Mono>
            <span style={{ flex: 1 }} />
            <Mono dim>
              file on disk · content/{project.slug}/field-notes.md
            </Mono>
          </div>
        </main>
      </div>
    </div>
  );
};

const OpenQuestionsView = ({ body }: { body: string }) => {
  if (!body.trim()) {
    return <Mono dim>no open questions yet — hit Ask Claude, or switch to managed mode to track them as items.</Mono>;
  }
  const lines = body.split('\n').filter((l) => l.trim());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
      {lines.map((raw, i) => {
        const text = raw.replace(/^[?\-*•]\s*/, '');
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
            <span
              style={{
                color: 'var(--ember-deep)',
                fontFamily: 'var(--ff-mono)',
                fontSize: 14,
                fontWeight: 600,
                minWidth: 10,
              }}
            >
              ?
            </span>
            <span className="km-body" style={{ flex: 1, lineHeight: 1.55 }}>
              {text}
            </span>
          </div>
        );
      })}
    </div>
  );
};

/** Managed mode: Open Questions are real question-kind items. */
const ManagedQuestionsView = ({ projectId }: { projectId: string }) => {
  const questions = getProjectQuestions(projectId);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    void captureItem({ projectId, kind: 'question', title });
    setDraft('');
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {questions.length === 0 && (
        <Mono dim>no questions yet — add one below, or ask Claude to surface what's unresolved.</Mono>
      )}
      {questions.map((q) => {
        const resolved = q.state === 'filed' || q.state === 'dismissed';
        return (
          <div
            key={q.id}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 10,
              padding: '8px 10px',
              background: 'var(--surface-1)',
              border: '1px solid var(--line)',
              borderRadius: 3,
              borderLeft: `2px solid ${resolved ? 'var(--line-strong)' : 'var(--ember-deep)'}`,
              opacity: resolved ? 0.6 : 1,
            }}
          >
            <span
              style={{
                color: resolved ? 'var(--fg-faint)' : 'var(--ember-deep)',
                fontFamily: 'var(--ff-mono)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ?
            </span>
            <span
              className="km-body"
              style={{
                flex: 1,
                lineHeight: 1.5,
                textDecoration: resolved ? 'line-through' : 'none',
              }}
            >
              {q.title}
            </span>
            <Mono dim>{q.state}</Mono>
            {!resolved && (
              <button
                className="km-btn km-btn-ghost"
                onClick={() => void fileItem(q.id)}
                style={{ padding: '2px 8px', fontSize: 11 }}
                title="Mark resolved — files the question"
              >
                Resolve
              </button>
            )}
          </div>
        );
      })}
      {adding ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') {
                setAdding(false);
                setDraft('');
              }
            }}
            placeholder="What's unresolved about this thread?"
            className="km-input"
            style={{ flex: 1, fontSize: 13 }}
          />
          <button className="km-btn km-btn-primary" onClick={add}>
            Add question
          </button>
          <button
            className="km-btn km-btn-ghost"
            onClick={() => {
              setAdding(false);
              setDraft('');
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="km-btn km-btn-ghost"
          onClick={() => setAdding(true)}
          style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12 }}
        >
          <Icons.plus size={12} /> New question
        </button>
      )}
    </div>
  );
};

/** Managed mode: Sources are real reference entities. */
const ManagedSourcesView = ({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) => {
  const refs = getProjectReferences(projectId);
  const [label, setLabel] = useState('');
  const [url, setUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const add = () => {
    const trimmedLabel = label.trim() || url.trim();
    if (!trimmedLabel) return;
    void createReference({
      projectSlug,
      label: trimmedLabel,
      url: url.trim() || undefined,
    });
    setLabel('');
    setUrl('');
    setAdding(false);
  };

  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {refs.length === 0 && (
        <Mono dim>no sources yet — add a link or reference below.</Mono>
      )}
      {refs.map((r) => (
        <div
          key={r.id}
          onClick={() => r.url && window.open(r.url, '_blank', 'noopener,noreferrer')}
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 10,
            padding: '8px 10px',
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 3,
            cursor: r.url ? 'pointer' : 'default',
          }}
        >
          <span style={{ color: 'var(--fg-muted)' }}>
            <Icons.link size={12} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="km-body" style={{ fontWeight: 500 }}>{r.label}</div>
            {r.url && <Mono dim>{r.url}</Mono>}
            {r.notes && (
              <div className="km-body-sm" style={{ color: 'var(--fg-muted)', lineHeight: 1.45 }}>
                {r.notes}
              </div>
            )}
          </div>
          {r.url && (
            <span style={{ color: 'var(--fg-faint)' }}>
              <Icons.ext size={12} />
            </span>
          )}
        </div>
      ))}
      {adding ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Label"
            className="km-input"
            style={{ flex: '2 1 200px', fontSize: 13 }}
            onKeyDown={(e) => e.key === 'Escape' && setAdding(false)}
          />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://… (optional)"
            className="km-input km-input-mono"
            style={{ flex: '3 1 240px', fontSize: 12.5 }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') setAdding(false);
            }}
          />
          <button className="km-btn km-btn-primary" onClick={add}>
            Add
          </button>
          <button className="km-btn km-btn-ghost" onClick={() => setAdding(false)}>
            Cancel
          </button>
        </div>
      ) : (
        <button
          className="km-btn km-btn-ghost"
          onClick={() => setAdding(true)}
          style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 12 }}
        >
          <Icons.plus size={12} /> Add source
        </button>
      )}
    </div>
  );
};

const CrystallizationsView = ({
  projectId,
  body,
}: {
  projectId: string;
  body: string;
}) => {
  const navigate = useNavigate();
  const items = getCrystallizations(projectId);
  return (
    <div style={{ maxWidth: 760, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {body.trim() && <div className="km-body">{renderBlocks(body)}</div>}
      {items.length === 0 ? (
        <Mono dim>no crystallizations yet — promote a doc when an outcome has settled.</Mono>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => item.docId && navigate(`/doc/${item.docId}`)}
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 10,
                padding: '8px 10px',
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 3,
                borderLeft: '2px solid var(--moss)',
                cursor: item.docId ? 'pointer' : 'default',
              }}
            >
              <span className="km-body" style={{ fontWeight: 500, flex: 1 }}>
                {item.title}
              </span>
              <span
                className="km-display-sm"
                style={{ color: 'var(--moss)', fontSize: 9 }}
              >
                DURABLE
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldNotesView;
