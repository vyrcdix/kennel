import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/tokens.css';
import App from './App';
import { api } from './data/api';
import { startEventStream } from './data/events';
import { hydrate, type BootstrapPayload } from './data/fixtures';

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
        KENNEL
      </span>
    </div>
    <span className="km-mono-sm" style={{ color: 'var(--fg-muted)' }}>
      {error ? `couldn't reach server — ${error}` : 'loading kennel…'}
    </span>
  </div>
);

const Boot = () => {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    api
      .get<BootstrapPayload>('/api/bootstrap')
      .then((payload) => {
        hydrate(payload);
        startEventStream();
        setReady(true);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  if (error) return <BootSplash error={error} />;
  if (!ready) return <BootSplash />;
  return <App />;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Boot />
  </StrictMode>,
);
