import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import {
  createGuidebook,
  ValidationError,
} from '../data/actions';

const NAME_MAX = 80;
const DESCRIPTION_MAX = 280;

export type CreateGuidebookModalProps = {
  open: boolean;
  /** The topic the guidebook lives in. Required — guidebooks are
   *  always topic-scoped. */
  projectSlug: string;
  onClose: () => void;
};

export const CreateGuidebookModal = ({
  open,
  projectSlug,
  onClose,
}: CreateGuidebookModalProps) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pinned, setPinned] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setName('');
    setDescription('');
    setPinned(false);
    setErrors({});
    setSaving(false);
    const t = setTimeout(() => nameRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const canSubmit = name.trim().length > 0 && !saving;

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setErrors({});
    try {
      const created = await createGuidebook({
        projectSlug,
        name: name.trim(),
        description: description.trim() || undefined,
        pinned,
      });
      onClose();
      navigate(`/project/${projectSlug}/guidebook/${created.id}`);
    } catch (err) {
      setSaving(false);
      if (err instanceof ValidationError) {
        setErrors(err.fields);
      } else {
        setErrors({ _: (err as Error).message });
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--scrim) 42%, transparent)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 96,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            void submit();
          }
        }}
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
          <ProjectTag slug={projectSlug} />
          <span className="km-display-sm" style={{ fontSize: 11 }}>
            NEW GUIDEBOOK
          </span>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              NAME
            </div>
            <input
              ref={nameRef}
              className="km-input"
              value={name}
              maxLength={NAME_MAX}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Product guidebook — idea → architecture → guide"
              style={{ width: '100%', fontSize: 14 }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Mono dim>{errors.name ?? ''}</Mono>
              <Mono dim>
                {name.length} / {NAME_MAX}
              </Mono>
            </div>
          </div>

          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              DESCRIPTION <Mono dim>optional</Mono>
            </div>
            <textarea
              className="km-input"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One short line describing the spine of this collection."
              rows={2}
              style={{
                width: '100%',
                fontSize: 13,
                fontFamily: 'var(--ff-sans)',
                resize: 'vertical',
                minHeight: 48,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Mono dim>{errors.description ?? ''}</Mono>
              <Mono dim>
                {description.length} / {DESCRIPTION_MAX}
              </Mono>
            </div>
          </div>

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            <span className="km-body" style={{ fontSize: 13 }}>
              Pin to this thread's landing page
            </span>
          </label>

          {errors._ && (
            <Mono style={{ color: 'var(--ember-deep)' }}>{errors._}</Mono>
          )}
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
          <Mono dim>⌘↵ to create</Mono>
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
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGuidebookModal;
