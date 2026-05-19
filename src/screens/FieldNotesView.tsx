import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Rev } from '../components/Rev';
import { TabButton } from '../components/TabButton';
import { updateFieldNotes } from '../data/actions';
import {
  getCrystallizations,
  getFieldNotes,
  getProjectBySlug,
} from '../data/selectors';
import { formatTime } from '../data/time';
import { renderBlocks } from '../lib/markdown';
import { useStoreVersion } from '../data/store';

type SectionKey = 'premise' | 'whatIKnow' | 'openQuestions' | 'sources' | 'crystallizations';
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'premise', label: 'Premise' },
  { key: 'whatIKnow', label: 'What I know' },
  { key: 'openQuestions', label: 'Open questions' },
  { key: 'sources', label: 'Sources' },
  { key: 'crystallizations', label: 'Crystallizations' },
];

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

export const FieldNotesView = () => {
  const navigate = useNavigate();
  useStoreVersion();
  const { slug = 'kennel' } = useParams<{ slug?: string }>();
  const project = getProjectBySlug(slug);
  const [active, setActive] = useState<SectionKey>('premise');
  const [editing, setEditing] = useState(false);
  const fn = project ? getFieldNotes(project.id) : undefined;
  const crystallizations = useMemo(
    () => (project ? getCrystallizations(project.id) : []),
    [project],
  );

  const [draft, setDraft] = useState<string>('');
  if (!project) return <FieldNotesNotFound slug={slug} />;

  const sectionValue = (k: SectionKey): string => (fn?.[k] ?? '') as string;

  const startEdit = () => {
    setDraft(sectionValue(active));
    setEditing(true);
  };
  const cancelEdit = () => setEditing(false);
  const save = async () => {
    await updateFieldNotes(project.slug, { [active]: draft } as Record<string, string>);
    setEditing(false);
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
                operational. Asks Claude to flesh these out when you don't feel like typing.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {fn && <Rev n={fn.revision} />}
              {fn && (
                <Mono dim>
                  updated {formatTime(fn.updatedAt)}
                </Mono>
              )}
              <button
                className="km-btn"
                onClick={() => navigate(`/runbook/${project.slug}`)}
              >
                <Icons.runbook size={12} /> Runbook
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              gap: 14,
              flexWrap: 'wrap',
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
            {!editing ? (
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
            )}
          </div>

          {/* Body */}
          {editing ? (
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
                  empty — click Edit, or ask Claude to write this section.
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
    return <Mono dim>no open questions yet — ask Claude what's unresolved.</Mono>;
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
