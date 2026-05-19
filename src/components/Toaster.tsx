import { dismissToast, useToasts, type Toast } from '../lib/toast';
import { Mono } from './Mono';

const TONES: Record<Toast['kind'], { bg: string; border: string; fg: string }> = {
  info: {
    bg: 'var(--surface-0)',
    border: 'var(--line-strong)',
    fg: 'var(--fg)',
  },
  error: {
    bg: 'var(--surface-0)',
    border: 'var(--ember-deep)',
    fg: 'var(--ember-deep)',
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
            onClick={() => dismissToast(t.id)}
            role="status"
            style={{
              pointerEvents: 'auto',
              minWidth: 280,
              maxWidth: 420,
              padding: '10px 14px',
              background: tone.bg,
              border: `1px solid ${tone.border}`,
              borderLeft: `3px solid ${tone.border}`,
              borderRadius: 4,
              boxShadow: '0 4px 12px rgba(0,0,0,.18)',
              cursor: 'pointer',
              fontFamily: 'var(--ff-sans)',
            }}
          >
            <div
              className="km-body"
              style={{ fontSize: 13, color: tone.fg, fontWeight: 500 }}
            >
              {t.message}
            </div>
            {t.detail && (
              <Mono dim>{t.detail}</Mono>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default Toaster;
