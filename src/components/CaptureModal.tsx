import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import { SegBtn } from './SegBtn';
import {
  captureItem,
  uploadDoc,
  ValidationError,
} from '../data/actions';
import { getProjectById, getProjects } from '../data/selectors';
import type { ItemKind } from '../data/types';

const KINDS: { kind: ItemKind; label: string }[] = [
  { kind: 'idea', label: 'Idea' },
  { kind: 'note', label: 'Note' },
  { kind: 'action', label: 'Action' },
  { kind: 'doc', label: 'Doc' },
  { kind: 'ref', label: 'Ref' },
];

const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

/** Doc-kind capture has two sub-modes: type a body inline, or upload a
 *  .md / .docx and land on the editor. Other kinds (idea / note / etc.)
 *  ignore this — they only get the inline path. */
type DocMode = 'inline' | 'upload';

export type CaptureModalProps = {
  open: boolean;
  onClose: () => void;
  defaultProjectSlug?: string;
};

const sourceKindFromFilename = (filename: string): 'md' | 'docx' | null => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  if (lower.endsWith('.docx')) return 'docx';
  return null;
};

const titleFromFilename = (filename: string): string =>
  filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').trim();

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      if (typeof dataUrl !== 'string') {
        reject(new Error('FileReader returned non-string result'));
        return;
      }
      const comma = dataUrl.indexOf(',');
      resolve(comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl);
    };
    reader.onerror = () => reject(reader.error ?? new Error('FileReader error'));
    reader.readAsDataURL(file);
  });

export const CaptureModal = ({ open, onClose, defaultProjectSlug }: CaptureModalProps) => {
  const navigate = useNavigate();
  const projects = getProjects().filter((p) => p.status !== 'archived');
  const initialProject =
    projects.find((p) => p.slug === defaultProjectSlug) ?? projects[0];

  const [projectId, setProjectId] = useState(initialProject?.id ?? '');
  const [kind, setKind] = useState<ItemKind>('idea');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [docMode, setDocMode] = useState<DocMode>('inline');
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Latest-values ref so the keydown handler doesn't need to be reattached on every keystroke.
  const stateRef = useRef({ projectId, kind, title, body, docMode, file });
  stateRef.current = { projectId, kind, title, body, docMode, file };

  useEffect(() => {
    if (!open) return;
    setProjectId(initialProject?.id ?? '');
    setKind('idea');
    setTitle('');
    setBody('');
    setDocMode('inline');
    setFile(null);
    setFileError(null);
    setSubmitting(false);
    setError(null);
  }, [open, initialProject?.id]);

  // Switching away from doc resets the upload sub-state so the form
  // doesn't carry stale upload bits into an idea/note capture.
  useEffect(() => {
    if (kind !== 'doc') {
      setDocMode('inline');
      setFile(null);
      setFileError(null);
    }
  }, [kind]);

  const fileKind = file ? sourceKindFromFilename(file.name) : null;
  const isUploadMode = kind === 'doc' && docMode === 'upload';

  const canSubmit = isUploadMode
    ? !!file && fileKind != null && !!projectId && !submitting && !fileError
    : title.trim().length > 0 && !!projectId && !submitting;

  const onFileChosen = (f: File | null) => {
    setError(null);
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const k = sourceKindFromFilename(f.name);
    if (!k) {
      setFile(null);
      setFileError('Only .md and .docx files are supported.');
      return;
    }
    if (f.size > UPLOAD_MAX_BYTES) {
      setFile(null);
      setFileError(`File is larger than ${UPLOAD_MAX_BYTES / 1024 / 1024} MB.`);
      return;
    }
    setFile(f);
    if (!title.trim()) setTitle(titleFromFilename(f.name));
  };

  const submit = async () => {
    const s = stateRef.current;
    if (!s.projectId) return;
    setSubmitting(true);
    setError(null);
    try {
      if (s.kind === 'doc' && s.docMode === 'upload') {
        if (!s.file) {
          setSubmitting(false);
          return;
        }
        const project = getProjectById(s.projectId);
        if (!project) {
          setSubmitting(false);
          setError('Thread no longer exists.');
          return;
        }
        const kindGuess = sourceKindFromFilename(s.file.name);
        if (!kindGuess) {
          setSubmitting(false);
          setFileError('Only .md and .docx files are supported.');
          return;
        }
        const bodyBase64 = await fileToBase64(s.file);
        const doc = await uploadDoc({
          projectSlug: project.slug,
          filename: s.file.name,
          kind: kindGuess,
          bodyBase64,
          title: s.title.trim() || undefined,
        });
        onClose();
        navigate(`/doc/${doc.id}`);
        return;
      }
      if (!s.title.trim()) {
        setSubmitting(false);
        return;
      }
      await captureItem({
        projectId: s.projectId,
        kind: s.kind,
        title: s.title.trim(),
        body: s.body.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setSubmitting(false);
      if (err instanceof ValidationError) {
        if (err.fields.body === 'docx_conversion_failed') {
          setError('Could not convert this .docx — switch to "Type body" and paste the contents instead.');
        } else {
          setError(Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(', '));
        }
      } else {
        setError((err as Error).message);
      }
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') void submit();
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

        {/* Doc-kind sub-toggle: inline body vs. uploaded file. Other kinds
            ignore this row entirely. */}
        {kind === 'doc' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="km-body-sm" style={{ width: 60 }}>source</span>
            <div style={{ display: 'inline-flex' }}>
              <SegBtn
                label="Type body"
                active={docMode === 'inline'}
                onClick={() => setDocMode('inline')}
              />
              <SegBtn
                label="Upload file"
                active={docMode === 'upload'}
                onClick={() => setDocMode('upload')}
              />
            </div>
          </div>
        )}

        <input
          className="km-input"
          autoFocus
          placeholder={
            isUploadMode
              ? 'Title — optional · defaults to the filename'
              : 'Title — required'
          }
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{ fontSize: 14 }}
        />

        {isUploadMode ? (
          <>
            <div>
              <div className="km-body-sm" style={{ marginBottom: 5 }}>
                file <Mono dim>.md or .docx · up to {UPLOAD_MAX_BYTES / 1024 / 1024} MB</Mono>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.docx"
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                style={{ fontSize: 13 }}
              />
              {file && !fileError && (
                <div style={{ marginTop: 6 }}>
                  <Mono dim>
                    {file.name} · {fileKind} · {(file.size / 1024).toFixed(1)} KB
                  </Mono>
                </div>
              )}
              {fileError && (
                <div style={{ marginTop: 6 }}>
                  <Mono style={{ color: 'var(--ember-deep)' }}>{fileError}</Mono>
                </div>
              )}
            </div>
            <Mono dim>
              Word docs are converted to markdown on the server. If conversion
              fails — usually complex styles or embedded images — switch to
              "Type body" and paste the contents.
            </Mono>
          </>
        ) : (
          <textarea
            className="km-input"
            rows={4}
            placeholder="Optional markdown body…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            style={{ resize: 'none', fontFamily: 'var(--ff-mono)', fontSize: 12.5 }}
          />
        )}

        {error && (
          <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            disabled={!canSubmit}
            onClick={() => void submit()}
            style={{ opacity: canSubmit ? 1 : 0.5 }}
          >
            {isUploadMode ? 'Upload doc' : 'Capture'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaptureModal;
