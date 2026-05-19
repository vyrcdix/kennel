import { useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { Icons } from '../components/Icon';
import {
  getProjectBySlug,
  getRunbook,
} from '../data/selectors';
import { formatTime } from '../data/time';
import { renderBlocks } from '../lib/markdown';

const RunSection = ({ label, children }: { label: string; children: ReactNode }) => (
  <section
    style={{
      display: 'flex',
      gap: 32,
      padding: '18px 0',
      borderBottom: '1px solid var(--line)',
    }}
  >
    <div style={{ width: 180, flex: '0 0 180px' }}>
      <Label>{label}</Label>
    </div>
    <div style={{ flex: 1, maxWidth: 760 }}>{children}</div>
  </section>
);

const renderSection = (md: string | undefined) =>
  md
    ? renderBlocks(md)
    : <p className="km-body" style={{ margin: 0, color: 'var(--fg-muted)' }}>empty.</p>;

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

export const RunbookView = () => {
  const { slug = 'kennel' } = useParams<{ slug?: string }>();
  const project = getProjectBySlug(slug);
  const runbook = project ? getRunbook(project.id) : undefined;
  const [url, setUrl] = useState(runbook?.url ?? '');
  if (!project || !runbook) return <NotFound slug={slug} />;

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
              <button className="km-btn">
                <Icons.copy size={12} /> Copy as md
              </button>
              <button className="km-btn km-btn-primary">Edit</button>
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

          <RunSection label="Prerequisites">{renderSection(runbook.prerequisites)}</RunSection>
          <RunSection label="Setup">{renderSection(runbook.setup)}</RunSection>
          <RunSection label="Run">{renderSection(runbook.run)}</RunSection>
          <RunSection label="Deploy">{renderSection(runbook.deploy)}</RunSection>
          <RunSection label="Troubleshoot">{renderSection(runbook.troubleshoot)}</RunSection>
          <RunSection label="Notes">{renderSection(runbook.notes)}</RunSection>
        </main>
      </div>
    </div>
  );
};

export default RunbookView;
