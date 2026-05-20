import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { openCapture, openCreateProject } from '../lib/modals';
import { logout } from '../data/auth';

export type ChromeBarProps = {
  projectChip?: ReactNode;
  search?: string;
  /** Slug to pre-fill in the capture modal (project landing pages pass theirs). */
  captureProjectSlug?: string;
};

export const ChromeBar = ({
  projectChip,
  search = 'Search threads, items, docs…',
  captureProjectSlug,
}: ChromeBarProps) => {
  const navigate = useNavigate();

  return (
    <>
      <div
        style={{
          height: 44,
          borderBottom: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 14px',
          gap: 14,
          background: 'var(--surface-0)',
          flex: '0 0 auto',
        }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          <span className="km-logo-slot">LOGO</span>
          <span className="km-display-md" style={{ fontSize: 16, letterSpacing: '.08em' }}>
            STEEP
          </span>
        </div>
        {projectChip}
        <div style={{ flex: 1 }} />
        <div
          onClick={() => navigate('/search')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--surface-1)',
            border: '1px solid var(--line)',
            borderRadius: 4,
            padding: '5px 10px',
            width: 360,
            color: 'var(--fg-muted)',
            cursor: 'pointer',
          }}
        >
          <Icons.search size={13} />
          <span className="km-mono-sm" style={{ flex: 1 }}>{search}</span>
          <span className="km-kbd">⌘K</span>
        </div>
        <button
          className="km-btn km-btn-ghost"
          onClick={openCreateProject}
          title="New thread · ⌘⇧N"
          style={{ padding: '5px 7px', color: 'var(--fg-muted)' }}
        >
          <Icons.plus size={14} />
        </button>
        <button
          className="km-btn km-btn-primary"
          onClick={() => openCapture(captureProjectSlug)}
        >
          <Icons.plus size={13} /> Capture
        </button>
        <button
          className="km-btn km-btn-ghost"
          title="Sign out"
          onClick={async () => {
            await logout();
            window.location.reload();
          }}
          style={{ padding: '5px 7px', color: 'var(--fg-muted)' }}
        >
          <Icons.side size={14} /> Sign out
        </button>
      </div>
    </>
  );
};

export default ChromeBar;
