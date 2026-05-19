import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { Icons } from '../components/Icon';
import { updateRunbookSection, updateRunbookUrl } from '../data/actions';
import type { RunbookSection } from '../data/actions';
import { getProjectBySlug, getRunbook } from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { formatTime } from '../data/time';
import { renderBlocks } from '../lib/markdown';

const SECTIONS: { key: RunbookSection; label: string }[] = [
  { key: 'prerequisites', label: 'Prerequisites' },
  { key: 'setup', label: 'Setup' },
  { key: 'run', label: 'Run' },
  { key: 'deploy', label: 'Deploy' },
  { key: 'troubleshoot', label: 'Troubleshoot' },
  { key: 'notes', label: 'Notes' },
];

const NotFound = ({ slug }: { slug: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No runbook for "{slug}".</div>
        <Mono dim>only kennel and picnic-engage have runbooks in this fixture</Mono>
      </main>
    </div>
  </div>
);

type SectionRowProps = {
  projectId: string;
  section: RunbookSection;
  label: string;
  value: string | undefined;
  editing: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
};

const SectionRow = ({
  projectId,
  section,
  label,
  value,
  editing,
  onStartEdit,
  onCancelEdit,
}: SectionRowProps) => {
  const [draft, setDraft] = useState<string>(value ?? '');
  // Reset the draft each time we enter edit mode for this section.
  // (Mount key in parent ensures this is fresh when `editing` flips.)
  const save = async () => {
    await updateRunbookSection(projectId, section, draft);
    onCancelEdit();
  };
  return (
    <section
      style={{
        display: 'flex',
        gap: 32,
        padding: '18px 0',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <div style={{ width: 180, flex: '0 0 180px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Label>{label}</Label>
          {!editing && (
            <button
              className="km-btn km-btn-ghost"
              onClick={onStartEdit}
              style={{ padding: '2px 6px', fontSize: 11 }}
              title="Edit section"
            >
              edit
            </button>
          )}
        </div>
      </div>
      <div style={{ flex: 1, maxWidth: 760 }}>
        {editing ? (
          <>
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={Math.max(6, (draft.match(/\n/g)?.length ?? 0) + 2)}
              style={{
                width: '100%',
                padding: '12px 14px',
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 4,
                fontFamily: 'var(--ff-mono)',
                fontSize: 12.5,
                lineHeight: 1.7,
                color: 'var(--fg)',
                resize: 'vertical',
                minHeight: 160,
                outline: 'none',
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault();
                  void save();
                }
                if (e.key === 'Escape') {
                  e.preventDefault();
                  onCancelEdit();
                }
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
              <button className="km-btn km-btn-primary" onClick={() => void save()}>
                Save
              </button>
              <button className="km-btn km-btn-ghost" onClick={onCancelEdit}>
                Cancel
              </button>
              <Mono dim>⌘↵ to save · esc to cancel</Mono>
            </div>
          </>
        ) : value ? (
          renderBlocks(value)
        ) : (
          <p className="km-body" style={{ margin: 0, color: 'var(--fg-muted)' }}>
            empty — click edit to add.
          </p>
        )}
      </div>
    </section>
  );
};

export const RunbookView = () => {
  useStoreVersion();
  const { slug = 'kennel' } = useParams<{ slug?: string }>();
  const [editing, setEditing] = useState<RunbookSection | null>(null);
  const project = getProjectBySlug(slug);
  const runbook = project ? getRunbook(project.id) : undefined;
  const [url, setUrl] = useState(runbook?.url ?? '');
  if (!project || !runbook) return <NotFound slug={slug} />;

  const commitUrl = async () => {
    if (url === (runbook.url ?? '')) return;
    await updateRunbookUrl(project.id, url);
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
                  <Icons.runbook size={14} />
                </span>
                <ProjectTag slug={project.slug} />
                <Mono>runbook</Mono>
              </div>
              <div className="km-display-lg" style={{ marginBottom: 4 }}>
                {project.name} — Runbook
              </div>
              <div className="km-body" style={{ color: 'var(--fg-muted)', maxWidth: 760 }}>
                How to bring this project online, run it locally, deploy it, and dig out when something breaks. Read top-to-bottom on a new machine; jump to Run on a known one.
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ textAlign: 'right' }}>
                <Rev n={runbook.revision} />
                <div>
                  <Mono>updated {formatTime(runbook.updatedAt)} by C</Mono>
                </div>
              </div>
              <button
                className="km-btn"
                onClick={() => {
                  const md = SECTIONS.map((s) => {
                    const v = runbook[s.key];
                    return v ? `## ${s.label}\n\n${v}\n` : '';
                  })
                    .filter(Boolean)
                    .join('\n');
                  void navigator.clipboard?.writeText(md);
                }}
                title="Copy runbook as markdown"
              >
                <Icons.copy size={12} /> Copy as md
              </button>
            </div>
          </div>

          {/* Environment URL — user-entered, varies per env */}
          <section
            style={{
              display: 'flex',
              gap: 32,
              padding: '14px 0',
              borderBottom: '1px solid var(--line)',
              alignItems: 'center',
            }}
          >
            <div style={{ width: 180, flex: '0 0 180px' }}>
              <Label>URL</Label>
            </div>
            <div style={{ flex: 1, maxWidth: 760, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                className="km-input km-input-mono"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onBlur={() => void commitUrl()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                }}
                placeholder="https://… or http://localhost:port"
                style={{ flex: 1 }}
              />
              <button
                className="km-btn km-btn-ghost"
                onClick={() => url && navigator.clipboard?.writeText(url)}
                title="Copy URL"
              >
                <Icons.copy size={13} />
              </button>
              {url && (
                <a
                  className="km-btn km-btn-ghost"
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title="Open"
                  style={{ textDecoration: 'none' }}
                >
                  <Icons.ext size={13} />
                </a>
              )}
            </div>
          </section>

          {SECTIONS.map((s) => (
            <SectionRow
              key={`${s.key}-${editing === s.key ? 'edit' : 'view'}-${runbook.revision}`}
              projectId={project.id}
              section={s.key}
              label={s.label}
              value={runbook[s.key]}
              editing={editing === s.key}
              onStartEdit={() => setEditing(s.key)}
              onCancelEdit={() => setEditing(null)}
            />
          ))}
        </main>
      </div>
    </div>
  );
};

export default RunbookView;
