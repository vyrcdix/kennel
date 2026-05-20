import { useEffect, useRef, useState } from 'react';
import { login } from '../data/auth';

export type LoginScreenProps = {
  /** Called after a successful login — the boot shell re-hydrates. */
  onSuccess: () => void;
};

export const LoginScreen = ({ onSuccess }: LoginScreenProps) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => ref.current?.focus(), 30);
    return () => clearTimeout(t);
  }, []);

  const submit = async () => {
    if (!password || submitting) return;
    setSubmitting(true);
    setError(null);
    const result = await login(password);
    if (result === 'ok') {
      onSuccess();
      return;
    }
    setError(
      result === 'bad-password'
        ? 'Incorrect password.'
        : "Couldn't reach the server.",
    );
    setSubmitting(false);
  };

  return (
    <div
      className="km"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 22,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className="km-logo-slot">LOGO</span>
        <span className="km-display-md" style={{ fontSize: 16, letterSpacing: '.08em' }}>
          STEEP
        </span>
      </div>

      <div
        style={{
          width: 320,
          maxWidth: '90%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div className="km-display-sm" style={{ fontSize: 11 }}>
          SIGN IN
        </div>
        <input
          ref={ref}
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void submit();
          }}
          placeholder="Password"
          className="km-input"
          style={{
            width: '100%',
            fontSize: 14,
            border: error ? '1px solid var(--ember-deep)' : undefined,
          }}
        />
        {error && (
          <span
            className="km-mono-sm"
            style={{ color: 'var(--ember-deep)' }}
          >
            {error}
          </span>
        )}
        <button
          className="km-btn km-btn-primary"
          onClick={() => void submit()}
          disabled={!password || submitting}
          style={{
            justifyContent: 'center',
            padding: '8px 12px',
            opacity: !password || submitting ? 0.5 : 1,
            cursor: !password || submitting ? 'not-allowed' : 'pointer',
          }}
        >
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </div>

      <span className="km-mono-sm" style={{ color: 'var(--fg-faint)' }}>
        steep · single shared password
      </span>
    </div>
  );
};

export default LoginScreen;
