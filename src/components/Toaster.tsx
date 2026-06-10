import type { ReactNode } from 'react';
import { dismissToast, useToasts, type Toast } from '../lib/toast';
import { Mono } from './Mono';
import { Icons } from './Icon';

// Per-kind dress: a left accent + a small glyph. The permanence kinds
// (crystal/release/focus) ride the sacred/action hues so they read the same
// way in both skins; under Tidewater the tokens carry the tide palette.
const TONES: Record<
  Toast['kind'],
  { accent: string; fg: string; icon: ReactNode | null }
> = {
  info: { accent: 'var(--line-strong)', fg: 'var(--fg)', icon: null },
  error: { accent: 'var(--ember-deep)', fg: 'var(--ember-deep)', icon: null },
  crystal: {
    accent: 'var(--sacred-ink)',
    fg: 'var(--fg)',
    icon: <Icons.gem size={14} stroke="var(--sacred-ink)" />,
  },
  release: {
    accent: 'var(--ember-deep)',
    fg: 'var(--fg)',
    icon: <Icons.archive size={14} stroke="var(--ember-deep)" />,
  },
  focus: {
    accent: 'var(--ember-deep)',
    fg: 'var(--fg)',
    icon: <Icons.arrowUp size={14} stroke="var(--ember-deep)" />,
  },
};

export const Toaster = () => {
  const items = useToasts();
  if (items.length === 0) return null;
  return (
    <div
      style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => {
        const tone = TONES[t.kind];
        return (
          <div
            key={t.id}
            className="km-toast"
            onClick={() => dismissToast(t.id)}
            role="status"
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              minWidth: 280,
              maxWidth: 420,
              padding: '10px 14px',
              background: 'var(--surface-0)',
              border: '1px solid var(--line-strong)',
              borderLeft: `3px solid ${tone.accent}`,
              borderRadius: 'var(--r-ctrl)',
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
              cursor: 'pointer',
              fontFamily: 'var(--ff-sans)',
            }}
          >
            {tone.icon && (
              <span style={{ flex: '0 0 auto', marginTop: 1 }}>{tone.icon}</span>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="km-body"
                style={{ fontSize: 13, color: tone.fg, fontWeight: 500 }}
              >
                {t.message}
              </div>
              {t.detail && <Mono dim>{t.detail}</Mono>}
            </div>
            {t.onUndo && (
              <button
                className="km-btn km-btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  t.onUndo?.();
                  dismissToast(t.id);
                }}
                style={{
                  flex: '0 0 auto',
                  padding: '2px 8px',
                  fontSize: 12,
                  color: 'var(--ember-deep)',
                }}
              >
                Undo
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
