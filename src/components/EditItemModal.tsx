import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icon';
import { KindIcon } from './KindIcon';
import { Label } from './Label';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { deleteItem, updateItem, ValidationError } from '../data/actions';
import { getProjectById } from '../data/selectors';
import type { Item } from '../data/types';

const TITLE_MAX = 500;

export type EditItemModalProps = {
  open: boolean;
  item: Item | null;
  onClose: () => void;
};

/** Lightweight edit-in-place for raw items (idea / note / action /
 *  question / ref-without-doc). Docs have their own editor screen and
 *  shouldn't reach here. */
export const EditItemModal = ({ open, item, onClose }: EditItemModalProps) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open || !item) return;
    setTitle(item.title);
    setBody(item.body ?? '');
    setSaving(false);
    setError(null);
    const t = setTimeout(() => titleRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open, item]);

  // Latest-values ref for the keyboard handler.
  const stateRef = useRef({ title, body, item, saving });
  stateRef.current = { title, body, item, saving };

  const dirty =
    !!item &&
    (title.trim() !== item.title || body.trim() !== (item.body ?? ''));

  const submit = async () => {
    const s = stateRef.current;
    if (!s.item || s.saving) return;
    const trimmedTitle = s.title.trim();
    if (!trimmedTitle) {
      setError('Title is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateItem(s.item.id, {
        title: trimmedTitle,
        body: s.body.trim() || null,
      });
      onClose();
    } catch (err) {
      setSaving(false);
      if (err instanceof ValidationError) {
        setError(Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(', '));
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

  if (!open || !item) return null;
  const project = getProjectById(item.projectId);

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
          <KindIcon kind={item.kind} />
          <Label>Edit item</Label>
          {project && <ProjectTag slug={project.slug} />}
          <Mono dim>{item.kind}</Mono>
          <span style={{ flex: 1 }} />
          <Mono dim>esc to cancel · ⌘↵ to save</Mono>
        </div>

        <input
          ref={titleRef}
          className="km-input"
          value={title}
          maxLength={TITLE_MAX}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title — required"
          style={{ fontSize: 14 }}
        />

        <textarea
          className="km-input"
          rows={6}
          placeholder="Optional markdown body…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          style={{ resize: 'vertical', fontFamily: 'var(--ff-mono)', fontSize: 12.5 }}
        />

        {error && (
          <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mono dim>
            <Icons.note size={11} /> state: {item.state} · kind: {item.kind}
          </Mono>
          <button
            className="km-btn km-btn-ghost"
            onClick={async () => {
              if (!item || saving) return;
              if (!window.confirm(`Delete "${item.title}"? This can't be undone.`)) return;
              setSaving(true);
              try {
                await deleteItem(item.id);
                onClose();
              } catch (err) {
                setSaving(false);
                setError((err as Error).message);
              }
            }}
            disabled={saving}
            style={{ color: 'var(--ember-deep)' }}
            title="delete this item"
          >
            <Icons.trash size={12} /> Delete
          </button>
          <span style={{ flex: 1 }} />
          <button
            className="km-btn km-btn-ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button
            className="km-btn km-btn-primary"
            disabled={!dirty || saving || !title.trim()}
            onClick={() => void submit()}
            style={{ opacity: !dirty || saving || !title.trim() ? 0.5 : 1 }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditItemModal;
