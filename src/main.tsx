import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
// Side-effect imports: each self-applies the persisted choice to the document
// root on module load, so a hard reload starts in the right theme + skin.
import './lib/theme';
import './lib/skin';
import App from './App';
import LoginScreen from './screens/LoginScreen';
import { ApiError, api, setUnauthorizedHandler } from './data/api';
import { startEventStream, stopEventStream } from './data/events';
import { hydrate, type BootstrapPayload } from './data/fixtures';
import { toastError } from './lib/toast';

// `void X(...)` action calls in row handlers don't have a catch; surface
// any unhandled rejection as a toast so a flaky network doesn't fail
// silently. Modals already await + catch their own ValidationErrors so
// won't double-fire.
window.addEventListener('unhandledrejection', (e) => {
  toastError('Action', e.reason);
});

const BootSplash = ({ error }: { error?: string }) => (
  <div
    className="km"
    style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      height: '100%',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span className="km-logo-slot">LOGO</span>
      <span className="km-display-md" style={{ fontSize: 16, letterSpacing: '.08em' }}>
        STEEP
      </span>
    </div>
    <span className="km-mono-sm" style={{ color: 'var(--fg-muted)' }}>
      {error ? `couldn't reach server — ${error}` : 'loading steep…'}
    </span>
  </div>
);

type Phase = 'checking' | 'login' | 'ready';

const Boot = () => {
  const [phase, setPhase] = useState<Phase>('checking');
  const [error, setError] = useState<string | undefined>(undefined);

  const loadApp = useCallback(async () => {
    try {
      const payload = await api.get<BootstrapPayload>('/api/bootstrap');
      hydrate(payload);
      startEventStream();
      setPhase('ready');
    } catch (err) {
      // A 401 here means the session lapsed between status and bootstrap —
      // the unauthorized handler already flips us to login; don't also
      // show the error splash.
      if (err instanceof ApiError && err.status === 401) return;
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      stopEventStream();
      setPhase('login');
    });
    void (async () => {
      try {
        const status = await api.get<{ authRequired: boolean; authenticated: boolean }>(
          '/api/auth/status',
        );
        if (status.authRequired && !status.authenticated) {
          setPhase('login');
        } else {
          await loadApp();
        }
      } catch (err) {
        setError((err as Error).message);
      }
    })();
  }, [loadApp]);

  if (error) return <BootSplash error={error} />;
  if (phase === 'checking') return <BootSplash />;
  if (phase === 'login') {
    return (
      <LoginScreen
        onSuccess={() => {
          setPhase('checking');
          void loadApp();
        }}
      />
    );
  }
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);
