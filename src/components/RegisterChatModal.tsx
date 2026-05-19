import { useEffect, useRef, useState } from 'react';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { registerChat, ValidationError } from '../data/actions';
import { getProjects } from '../data/selectors';

const TAGLINE_MAX = 140;

export type RegisterChatModalProps = {
  open: boolean;
  /** Default project; user can still change inside the modal. */
  projectSlug: string | undefined;
  onClose: () => void;
};

export const RegisterChatModal = ({ open, projectSlug, onClose }: RegisterChatModalProps) => {
  const [slug, setSlug] = useState<string>(projectSlug ?? '');
  const [tagline, setTagline] = useState('');
  const [claudeUrl, setClaudeUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const taglineRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setSlug(projectSlug ?? getProjects()[0]?.slug ?? '');
    setTagline('');
    setClaudeUrl('');
    setErrors({});
    setSaving(false);
    const t = setTimeout(() => taglineRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, projectSlug]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const projects = getProjects();
  const canSubmit = tagline.trim().length > 0 && slug.length > 0 && !saving;
  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      await registerChat({
        projectSlug: slug,
        tagline: tagline.trim(),
        claudeUrl: claudeUrl.trim() || undefined,
      });
      onClose();
    } catch (err) {
      if (err instanceof ValidationError) {
        setErrors(err.fields);
      } else {
        throw err;
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,46,51,.42)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 96,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 460,
          maxWidth: '92%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          {slug && <ProjectTag slug={slug} />}
          <span className="km-display-sm" style={{ fontSize: 11 }}>
            REGISTER A CONVERSATION
          </span>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              THREAD
            </div>
            <select
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{
                width: '100%',
                padding: '6px 8px',
                fontFamily: 'var(--ff-sans)',
                fontSize: 14,
                background: 'var(--surface-1)',
                color: 'var(--fg)',
                border: '1px solid var(--line)',
                borderRadius: 3,
              }}
            >
              {projects.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name} · {p.slug}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              TAGLINE
            </div>
            <input
              ref={taglineRef}
              className="km-input"
              value={tagline}
              maxLength={TAGLINE_MAX}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="one short line — what's this chat about?"
              style={{ width: '100%', fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Mono dim>{errors.tagline ?? ''}</Mono>
              <Mono dim>
                {tagline.length} / {TAGLINE_MAX}
              </Mono>
            </div>
          </div>

          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              CLAUDE URL <Mono dim>optional</Mono>
            </div>
            <input
              className="km-input km-input-mono"
              value={claudeUrl}
              onChange={(e) => setClaudeUrl(e.target.value)}
              placeholder="https://claude.ai/chat/…"
              style={{ width: '100%', fontSize: 13 }}
            />
            <Mono dim>
              Paste the chat URL from claude.ai so you can jump back into it later.
            </Mono>
          </div>
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--line)',
            background: 'var(--surface-1)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Mono dim>⌘↵ to register</Mono>
          <span style={{ flex: 1 }} />
          <button className="km-btn km-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="km-btn km-btn-primary"
            onClick={() => void submit()}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            Register
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterChatModal;
