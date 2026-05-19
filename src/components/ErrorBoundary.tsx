import { Component, type ReactNode } from 'react';
import { Mono } from './Mono';
import { showToast } from '../lib/toast';

type Props = { children: ReactNode };
type State = { err: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { err: null };

  static getDerivedStateFromError(err: Error): State {
    return { err };
  }

  componentDidCatch(err: Error) {
    showToast('Something broke', { kind: 'error', detail: err.message });
    // eslint-disable-next-line no-console
    console.error('[error-boundary]', err);
  }

  render() {
    if (!this.state.err) return this.props.children;
    return (
      <div
        className="km"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div className="km-display-lg" style={{ marginBottom: 6 }}>
            Something broke.
          </div>
          <div className="km-body" style={{ color: 'var(--fg-muted)', marginBottom: 14 }}>
            The screen errored out. Reload to recover. Your data is safe.
          </div>
          <Mono dim>{this.state.err.message}</Mono>
          <div style={{ marginTop: 18 }}>
            <button
              className="km-btn"
              onClick={() => {
                this.setState({ err: null });
                window.location.reload();
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
