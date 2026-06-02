// v0.5 Smart Routing — paste a chunk of text, optionally hint, submit,
// the server's classifier picks where it lands. Closes immediately on
// submit; success / failure surface as toasts so the user doesn't sit
// staring at a spinner for the ~2s classifier latency.

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import { SegBtn } from './SegBtn';
import {
  ClassifierUnavailableError,
  submitPasteRouting,
  ValidationError,
} from '../data/actions';
import { getProjectBySlug, getProjects } from '../data/selectors';
import { showToast, toastError } from '../lib/toast';
import type { Routing, RoutingAction } from '../data/types';

const BODY_MAX_BYTES = 200_000;

type Hint = 'auto' | RoutingAction;

const HINT_OPTIONS: { value: Hint; label: string }[] = [
  { value: 'auto', label: 'Let Claude pick' },
  { value: 'bench', label: 'Bench' },
  { value: 'doc', label: 'Doc' },
  { value: 'guidebook', label: 'Guidebook' },
  { value: 'runbook', label: 'Runbook' },
  { value: 'field-notes', label: 'Field notes' },
];

const ACTION_LABEL: Record<RoutingAction, string> = {
  bench: 'the bench',
  doc: 'a new doc',
  guidebook: 'a guidebook entry',
  runbook: 'the runbook',
  'field-notes': 'field notes',
};

export type PasteRouteModalProps = {
  open: boolean;
  onClose: () => void;
  defaultProjectSlug?: string;
};

/** Pull a doc title out of pasted-file content, if a markdown heading
 *  appears in the first non-blank line. Purely cosmetic — the server's
 *  classifier doesn't see this guess. */
const looksLikeText = (file: File): boolean => {
  const lower = file.name.toLowerCase();
  return (
    lower.endsWith('.md') ||
    lower.endsWith('.markdown') ||
    lower.endsWith('.txt')
  );
};

const routeForArtefact = (
  routing: Routing,
): { path: string; label: string } | null => {
  const { artefact } = routing;
  if (artefact.kind === 'doc') return { path: `/doc/${artefact.id}`, label: 'open doc' };
  if (artefact.kind === 'item') return { path: '/triage', label: 'open sort' };
  // guidebook entries, runbooks, and field_notes don't have direct
  // per-artefact routes the user expects — the project landing is
  // the safe target.
  const project = getProjects().find((p) => p.id === routing.projectId);
  if (!project) return null;
  if (artefact.kind === 'runbook') {
    return { path: `/runbook/${project.slug}`, label: 'open runbook' };
  }
  if (artefact.kind === 'field_notes') {
    return {
      path: `/project/${project.slug}/field-notes`,
      label: 'open field notes',
    };
  }
  return { path: `/project/${project.slug}`, label: 'open thread' };
};

export const PasteRouteModal = ({
  open,
  onClose,
  defaultProjectSlug,
}: PasteRouteModalProps) => {
  const navigate = useNavigate();
  const projects = getProjects().filter((p) => p.status !== 'archived');
  const initialProject =
    projects.find((p) => p.slug === defaultProjectSlug) ?? projects[0];

  const [projectSlug, setProjectSlug] = useState(initialProject?.slug ?? '');
  const [hint, setHint] = useState<Hint>('auto');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Latest-values ref so a keyboard handler doesn't reattach on every keystroke.
  const stateRef = useRef({ projectSlug, hint, body });
  stateRef.current = { projectSlug, hint, body };

  useEffect(() => {
    if (!open) return;
    setProjectSlug(initialProject?.slug ?? '');
    setHint('auto');
    setBody('');
    setSubmitting(false);
    setError(null);
    setFileError(null);
    const t = window.setTimeout(() => textareaRef.current?.focus(), 30);
    return () => window.clearTimeout(t);
  }, [open, initialProject?.slug]);

  const bytes = new TextEncoder().encode(body).length;
  const overSize = bytes > BODY_MAX_BYTES;
  const canSubmit =
    !submitting && projectSlug.length > 0 && body.trim().length > 0 && !overSize;

  const handleFile = async (file: File): Promise<void> => {
    setFileError(null);
    if (!looksLikeText(file)) {
      setFileError(
        'Drag-drop supports .md, .markdown, and .txt only. Paste body content directly otherwise.',
      );
      return;
    }
    try {
      const text = await file.text();
      setBody(text);
    } catch (err) {
      setFileError(`could not read file: ${(err as Error).message}`);
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await handleFile(file);
  };

  const submit = async () => {
    const s = stateRef.current;
    if (!s.projectSlug || !s.body.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    // Snapshot the project label before the modal closes so the toast
    // copy survives the reset.
    const project = getProjectBySlug(s.projectSlug);
    const projectLabel = project?.slug ?? s.projectSlug;
    onClose();
    showToast(`Routing to ${projectLabel}…`);
    try {
      const routing = await submitPasteRouting({
        projectSlug: s.projectSlug,
        body: s.body.trim(),
        hint: s.hint === 'auto' ? undefined : s.hint,
      });
      const target = routeForArtefact(routing);
      const action = routing.classifier.action;
      const detail = routing.classifier.explanation || undefined;
      showToast(`Routed to ${ACTION_LABEL[action]} in ${projectLabel}`, {
        detail,
      });
      if (target) navigate(target.path);
    } catch (err) {
      if (err instanceof ClassifierUnavailableError) {
        showToast('Smart Routing is offline', {
          kind: 'error',
          detail: err.message,
        });
        return;
      }
      if (err instanceof ValidationError) {
        const detail = Object.entries(err.fields)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ');
        showToast('Could not route this paste', { kind: 'error', detail });
        return;
      }
      toastError('Routing', err);
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void submit();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(42,46,51,.30)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 86,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="km-card"
        style={{
          width: 620,
          maxWidth: '94%',
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
          <Icons.bulb size={16} />
          <Label>Paste &amp; route</Label>
          <span style={{ flex: 1 }} />
          <Mono dim>esc to cancel · ⌘↵ to submit</Mono>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="km-body-sm" style={{ width: 60 }}>thread</span>
          <select
            className="km-input km-input-mono"
            value={projectSlug}
            onChange={(e) => setProjectSlug(e.target.value)}
            style={{ width: 'auto', flex: 1 }}
          >
            {projects.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.slug}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="km-body-sm" style={{ width: 60 }}>hint</span>
          <div style={{ display: 'inline-flex', flexWrap: 'wrap' }}>
            {HINT_OPTIONS.map((h) => (
              <SegBtn
                key={h.value}
                label={h.label}
                active={hint === h.value}
                onClick={() => setHint(h.value)}
              />
            ))}
          </div>
        </div>

        <textarea
          ref={textareaRef}
          className="km-input"
          placeholder="Paste content here. Drag-drop a .md or .txt file to load it. Claude picks where it lands; the hint above acts as a strong prior."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onDrop={(e) => void onDrop(e)}
          onDragOver={(e) => e.preventDefault()}
          rows={12}
          style={{
            resize: 'vertical',
            fontFamily: 'var(--ff-mono)',
            fontSize: 12.5,
            minHeight: 220,
          }}
        />

        {fileError && (
          <Mono style={{ color: 'var(--ember-deep)' }}>{fileError}</Mono>
        )}
        {error && (
          <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono dim>
            {(bytes / 1024).toFixed(1)} KB
            {overSize && ' · over 200 KB limit'}
          </Mono>
          <span style={{ flex: 1 }} />
          <button
            className="km-btn km-btn-ghost"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="km-btn km-btn-primary"
            onClick={() => void submit()}
            disabled={!canSubmit}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            Route it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PasteRouteModal;
