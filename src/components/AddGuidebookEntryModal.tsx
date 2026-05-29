import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import {
  addEntry,
  ValidationError,
} from '../data/actions';
import {
  getProjectBySlug,
  getProjectDocs,
  getProjectReferences,
} from '../data/selectors';
import type { Doc, Reference } from '../data/types';

const NAME_MAX = 200;
const DESCRIPTION_MAX = 2000;

export type AddGuidebookEntryModalProps = {
  open: boolean;
  guidebookId: string;
  projectSlug: string;
  onClose: () => void;
};

/** Unified source pick — Doc or Reference. */
type Pick =
  | { kind: 'doc'; doc: Doc }
  | { kind: 'reference'; reference: Reference };

const pickId = (p: Pick) =>
  p.kind === 'doc' ? `doc:${p.doc.id}` : `ref:${p.reference.id}`;
const pickTitle = (p: Pick) =>
  p.kind === 'doc' ? p.doc.title : p.reference.label;
const pickSubtitle = (p: Pick): string | undefined =>
  p.kind === 'doc'
    ? p.doc.description || (p.doc.body || '').slice(0, 140)
    : p.reference.url || p.reference.notes;

export const AddGuidebookEntryModal = ({
  open,
  guidebookId,
  projectSlug,
  onClose,
}: AddGuidebookEntryModalProps) => {
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameOverride, setNameOverride] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement | null>(null);

  // Reset when opened. Focus the filter; the selection then defaults to
  // the first matching source on first keystroke.
  useEffect(() => {
    if (!open) return;
    setFilter('');
    setSelectedId(null);
    setNameOverride('');
    setDescription('');
    setSaving(false);
    setError(null);
    const t = setTimeout(() => filterRef.current?.focus(), 30);
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

  const project = open ? getProjectBySlug(projectSlug) : undefined;

  // Build the unified source list once per open. Docs come first (more
  // common as guidebook anchors), then refs. Each filtered by the
  // search term against title + subtitle.
  const allPicks = useMemo<Pick[]>(() => {
    if (!project) return [];
    const docPicks: Pick[] = getProjectDocs(project.id).map((doc) => ({
      kind: 'doc',
      doc,
    }));
    const refPicks: Pick[] = getProjectReferences(project.id).map((reference) => ({
      kind: 'reference',
      reference,
    }));
    return [...docPicks, ...refPicks];
  }, [project, open]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return allPicks;
    return allPicks.filter((p) => {
      const title = pickTitle(p).toLowerCase();
      const sub = (pickSubtitle(p) ?? '').toLowerCase();
      return title.includes(q) || sub.includes(q);
    });
  }, [allPicks, filter]);

  // Auto-select the first match when the filter changes — quality-of-life,
  // matches the search-result style picker in the app.
  useEffect(() => {
    if (!open) return;
    if (selectedId && filtered.some((p) => pickId(p) === selectedId)) return;
    setSelectedId(filtered[0] ? pickId(filtered[0]) : null);
  }, [open, filtered, selectedId]);

  if (!open || !project) return null;

  const selected = filtered.find((p) => pickId(p) === selectedId) ?? null;
  const canSubmit = selected != null && !saving;

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      if (selected.kind === 'doc') {
        await addEntry(guidebookId, {
          kind: 'existingDoc',
          docId: selected.doc.id,
          name: nameOverride.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        await addEntry(guidebookId, {
          kind: 'existingRef',
          referenceId: selected.reference.id,
          name: nameOverride.trim() || undefined,
          description: description.trim() || undefined,
        });
      }
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

  const docCount = allPicks.filter((p) => p.kind === 'doc').length;
  const refCount = allPicks.filter((p) => p.kind === 'reference').length;

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
        paddingTop: 72,
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
          width: 560,
          maxWidth: '92%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 6,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 'calc(100vh - 144px)',
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
          <span className="km-display-sm" style={{ fontSize: 11 }}>
            ADD ENTRY
          </span>
          <span style={{ flex: 1 }} />
          <Mono dim>upload + link arrive in slice 5</Mono>
        </div>

        <div
          style={{
            padding: '12px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            overflow: 'auto',
          }}
        >
          {/* Search */}
          <input
            ref={filterRef}
            className="km-input"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder={`Filter ${docCount} docs and ${refCount} references in this topic…`}
            style={{ width: '100%', fontSize: 13 }}
          />

          {/* Source list */}
          <div
            style={{
              border: '1px solid var(--line)',
              borderRadius: 4,
              maxHeight: 320,
              overflow: 'auto',
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center' }}>
                <Mono dim>
                  {allPicks.length === 0
                    ? 'this topic has no docs or references yet'
                    : 'no matches'}
                </Mono>
              </div>
            ) : (
              filtered.map((p) => {
                const id = pickId(p);
                const isSelected = selectedId === id;
                return (
                  <div
                    key={id}
                    onClick={() => setSelectedId(id)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '20px 1fr 60px',
                      gap: 10,
                      alignItems: 'center',
                      padding: '8px 12px',
                      cursor: 'pointer',
                      background: isSelected
                        ? 'rgba(217,98,44,.10)'
                        : 'transparent',
                      borderBottom: '1px solid var(--line)',
                    }}
                  >
                    <span style={{ color: 'var(--fg-muted)' }}>
                      {p.kind === 'doc' ? (
                        <Icons.doc size={14} />
                      ) : (
                        <Icons.ext size={14} />
                      )}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="km-body"
                        style={{
                          fontWeight: 500,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {pickTitle(p)}
                      </div>
                      {pickSubtitle(p) && (
                        <Mono
                          dim
                          style={{
                            display: 'block',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pickSubtitle(p)}
                        </Mono>
                      )}
                    </div>
                    <Mono dim>{p.kind}</Mono>
                  </div>
                );
              })
            )}
          </div>

          {/* Per-membership metadata */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              NAME <Mono dim>optional · defaults to the source's title</Mono>
            </div>
            <input
              className="km-input"
              value={nameOverride}
              maxLength={NAME_MAX}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder={selected ? pickTitle(selected) : 'pick a source first'}
              style={{ width: '100%', fontSize: 13 }}
            />
          </div>
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              DESCRIPTION <Mono dim>optional · forms the spine entry</Mono>
            </div>
            <textarea
              className="km-input"
              value={description}
              maxLength={DESCRIPTION_MAX}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="One short line summarising this entry for the spine."
              style={{
                width: '100%',
                fontSize: 13,
                fontFamily: 'var(--ff-sans)',
                resize: 'vertical',
                minHeight: 48,
              }}
            />
          </div>

          {error && (
            <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
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
          <Mono dim>⌘↵ to add</Mono>
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
            Add entry
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGuidebookEntryModal;
