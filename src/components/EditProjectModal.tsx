import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { updateProject, ValidationError } from '../data/actions';
import type { Project, ProjectColor, ProjectStatus } from '../data/types';

const DESCRIPTION_MAX = 140;
const CONTEXT_HARD = 8000;

/** v0.5 §A thread label palette. Must match CreateProjectModal. */
const COLORS: { name: 'none' | ProjectColor; hex: string }[] = [
  { name: 'none',  hex: 'transparent' },
  { name: 'stone', hex: '#8C8275' },
  { name: 'sage',  hex: '#79876F' },
  { name: 'dusk',  hex: '#6C7A8C' },
  { name: 'plum',  hex: '#87697C' },
  { name: 'slate', hex: '#5A6066' },
  { name: 'teal',  hex: '#5E807A' },
];

export type EditProjectModalProps = {
  open: boolean;
  project: Project | undefined;
  onClose: () => void;
};

const STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

export const EditProjectModal = ({ open, project, onClose }: EditProjectModalProps) => {
  const [description, setDescription] = useState('');
  const [context, setContext] = useState('');
  const [color, setColor] = useState<'none' | ProjectColor>('none');
  const [pinned, setPinned] = useState(false);
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const descRef = useRef<HTMLInputElement | null>(null);

  // Hydrate every time the modal opens or the project changes.
  useEffect(() => {
    if (!open || !project) return;
    setDescription(project.description ?? '');
    setContext(project.context ?? '');
    setColor(project.color ?? 'none');
    setPinned(project.pinned);
    setStatus(project.status);
    setErrors({});
    setSaving(false);
    const t = setTimeout(() => descRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, project?.id]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !project) return null;

  const dirty =
    description !== (project.description ?? '') ||
    context !== (project.context ?? '') ||
    color !== (project.color ?? 'none') ||
    pinned !== project.pinned ||
    status !== project.status;

  const submit = async () => {
    if (!dirty) {
      onClose();
      return;
    }
    setSaving(true);
    try {
      await updateProject(project.id, {
        description,
        context: context.trim() ? context : null,
        color: color === 'none' ? null : color,
        pinned,
        status,
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
        paddingTop: 80,
        zIndex: 60,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 480,
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
          <ProjectTag slug={project.slug} />
          <span className="km-display-sm" style={{ fontSize: 11 }}>EDIT THREAD</span>
          <span style={{ flex: 1 }} />
          <Mono dim>{project.slug}</Mono>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Description */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              DESCRIPTION
            </div>
            <input
              ref={descRef}
              className="km-input"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', fontSize: 14 }}
              placeholder="one short line of context for the dashboard"
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Mono dim>{errors.description ?? ''}</Mono>
              <Mono dim>
                {description.length} / {DESCRIPTION_MAX}
              </Mono>
            </div>
          </div>

          {/* Context */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              CONTEXT FOR CLAUDE
            </div>
            <textarea
              className="km-input"
              value={context}
              maxLength={CONTEXT_HARD}
              rows={6}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Markdown. Shipped to Claude with every chat session in this thread."
              style={{
                width: '100%',
                fontFamily: 'var(--ff-mono)',
                fontSize: 12.5,
                lineHeight: 1.55,
                resize: 'vertical',
                minHeight: 96,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <Mono dim>{errors.context ?? ''}</Mono>
              <Mono dim>
                {context.length} / {CONTEXT_HARD}
              </Mono>
            </div>
          </div>

          {/* Color */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              COLOR
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border:
                      color === c.name
                        ? '2px solid var(--ember-deep)'
                        : c.name === 'none'
                          ? '1px dashed var(--line-strong)'
                          : '1px solid var(--line)',
                    background: c.hex,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pinned toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setPinned((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 10px',
                border: '1px solid var(--line)',
                background: pinned ? 'rgba(232,181,71,.12)' : 'transparent',
                color: pinned ? 'var(--blaze)' : 'var(--fg-muted)',
                borderRadius: 3,
                cursor: 'pointer',
                fontFamily: 'var(--ff-sans)',
                fontSize: 13,
              }}
            >
              <Icons.pin size={12} /> {pinned ? 'Pinned' : 'Not pinned'}
            </button>
            <Mono dim>pinned threads appear on the dashboard rail</Mono>
          </div>

          {/* Status */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              STATUS
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {STATUSES.map((s) => {
                const active = status === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => setStatus(s.value)}
                    style={{
                      padding: '4px 12px',
                      border: active
                        ? '1px solid var(--ember-deep)'
                        : '1px solid var(--line)',
                      background: active ? 'rgba(217,98,44,.10)' : 'transparent',
                      color: active ? 'var(--ember-deep)' : 'var(--fg-muted)',
                      borderRadius: 3,
                      cursor: 'pointer',
                      fontFamily: 'var(--ff-sans)',
                      fontSize: 13,
                    }}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <Mono dim>
              {status === 'archived'
                ? 'archived threads drop off the dashboard — still searchable, reachable by URL'
                : status === 'paused'
                  ? 'paused threads stay listed but read as on-hold'
                  : 'active — shows everywhere'}
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
          <Mono dim>name and slug stay fixed · use CLI to rename</Mono>
          <span style={{ flex: 1 }} />
          <button className="km-btn km-btn-ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="km-btn km-btn-primary"
            onClick={() => void submit()}
            disabled={saving || !dirty}
            style={{ opacity: saving || !dirty ? 0.5 : 1 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectModal;
