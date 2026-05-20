import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import { SegBtn } from './SegBtn';
import { captureItem } from '../data/actions';
import { getProjects } from '../data/selectors';
import type { ItemKind } from '../data/types';

const KINDS: { kind: ItemKind; label: string }[] = [
  { kind: 'idea', label: 'Idea' },
  { kind: 'note', label: 'Note' },
  { kind: 'action', label: 'Action' },
  { kind: 'doc', label: 'Doc' },
  { kind: 'ref', label: 'Ref' },
];

export type CaptureModalProps = {
  open: boolean;
  onClose: () => void;
  defaultProjectSlug?: string;
};

export const CaptureModal = ({ open, onClose, defaultProjectSlug }: CaptureModalProps) => {
  const projects = getProjects().filter((p) => p.status !== 'archived');
  const initialProject =
    projects.find((p) => p.slug === defaultProjectSlug) ?? projects[0];

  const [projectId, setProjectId] = useState(initialProject?.id ?? '');
  const [kind, setKind] = useState<ItemKind>('idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Latest-values ref so the keydown handler doesn't need to be reattached on every keystroke.
  const stateRef = useRef({ projectId, kind, title, body });
  stateRef.current = { projectId, kind, title, body };

  useEffect(() => {
    if (!open) return;
    setProjectId(initialProject?.id ?? '');
    setKind('idea');
    setTitle('');
    setBody('');
  }, [open, initialProject?.id]);

  const submit = () => {
    const s = stateRef.current;
    if (!s.title.trim() || !s.projectId) return;
    captureItem({
      projectId: s.projectId,
      kind: s.kind,
      title: s.title.trim(),
      body: s.body.trim() || undefined,
    });
    onClose();
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') submit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = title.trim().length > 0 && projectId;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,46,51,.28)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 96,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="km-card"
        style={{
          width: 560,
          maxWidth: '92%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.plus size={16} />
          <Label>Capture</Label>
          <span style={{ flex: 1 }} />
          <Mono dim>esc to cancel · ⌘↵ to submit</Mono>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="km-body-sm" style={{ width: 60 }}>thread</span>
          <select
            className="km-input km-input-mono"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            style={{ width: 'auto', flex: 1 }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>{p.slug}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="km-body-sm" style={{ width: 60 }}>kind</span>
          <div style={{ display: 'inline-flex' }}>
            {KINDS.map((k) => (
              <SegBtn
                key={k.kind}
                label={k.label}
                active={kind === k.kind}
                onClick={() => setKind(k.kind)}
              />
            ))}
          </div>
        </div>

        <input
          className="km-input"
          autoFocus
          placeholder="Title — required"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ fontSize: 14 }}
        />

        <textarea
          className="km-input"
          rows={4}
          placeholder="Optional markdown body…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ resize: 'none', fontFamily: 'var(--ff-mono)', fontSize: 12.5 }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ flex: 1 }} />
          <button className="km-btn km-btn-ghost" onClick={onClose}>Cancel</button>
          <button
            className="km-btn km-btn-primary"
            disabled={!canSubmit}
            onClick={submit}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            Capture
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptureModal;
