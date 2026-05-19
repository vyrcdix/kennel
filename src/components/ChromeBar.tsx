import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { openCapture, openCreateProject } from '../lib/modals';

export type ChromeBarProps = {
  projectChip?: ReactNode;
  search?: string;
  /** Slug to pre-fill in the capture modal (project landing pages pass theirs). */
  captureProjectSlug?: string;
};

export const ChromeBar = ({
  projectChip,
  search = 'Search projects, items, docs…',
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
          title="New project · ⌘⇧N"
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
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 3,
            background: 'var(--surface-2)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--ff-mono)',
            fontSize: 11,
            color: 'var(--fg-muted)',
          }}
        >
          CD
        </div>
      </div>
    </>
  );
};

export default ChromeBar;
