import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AddGuidebookEntryModal } from '../components/AddGuidebookEntryModal';
import { AskClaude } from '../components/AskClaude';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { SegBtn } from '../components/SegBtn';
import {
  deleteGuidebook,
  removeEntry,
  reorderEntries,
  setGuidebookPinned,
  updateEntry,
  updateGuidebook,
  ValidationError,
} from '../data/actions';
import {
  getDocById,
  getGuidebookById,
  getGuidebookEntries,
  getProjectById,
  getReferenceById,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import type { GuidebookEntry } from '../data/types';

const GuidebookNotFound = ({ id }: { id: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No guidebook with id "{id}".</div>
        <Mono dim>it may have been deleted</Mono>
      </main>
    </div>
  </div>
);

type SourceInfo = {
  icon: 'doc' | 'ext';
  title: string;
  /** Where the click on the source-open icon goes. */
  href: string | null;
  /** True when href is an external URL. */
  external: boolean;
};

/** Resolve an entry's source pointer to whatever the row needs to
 *  render + open. Returns null when the source has been deleted (a
 *  future concern — there is no Doc-delete UI today). */
const resolveSource = (entry: GuidebookEntry): SourceInfo | null => {
  if (entry.source.kind === 'doc') {
    const doc = getDocById(entry.source.docId);
    if (!doc) return null;
    return {
      icon: 'doc',
      title: doc.title,
      href: `/doc/${doc.id}`,
      external: false,
    };
  }
  const ref = getReferenceById(entry.source.referenceId);
  if (!ref) return null;
  return {
    icon: 'ext',
    title: ref.label,
    href: ref.url ?? null,
    external: !!ref.url,
  };
};

const parseTagsInput = (raw: string): string[] => {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(',')) {
    const t = part.trim();
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
};

const sameTags = (a: string[], b: string[]) =>
  a.length === b.length && a.every((t, i) => t === b[i]);

type TagChipProps = {
  label: string;
  active?: boolean;
  onClick?: (e: React.MouseEvent) => void;
};

const TagChip = ({ label, active, onClick }: TagChipProps) => (
  <span
    onClick={onClick}
    style={{
      fontFamily: 'var(--ff-mono)',
      fontSize: 10.5,
      padding: '1px 6px',
      borderRadius: 3,
      background: active ? 'color-mix(in srgb, var(--action) 20%, transparent)' : 'color-mix(in srgb, var(--action) 10%, transparent)',
      color: 'var(--ember-deep)',
      cursor: onClick ? 'pointer' : 'default',
      border: active ? '1px solid var(--ember)' : '1px solid transparent',
      lineHeight: 1.4,
    }}
  >
    {label}
  </span>
);

type EntryRowProps = {
  entry: GuidebookEntry;
  /** Position label shown on the left. Pass the index in the current
   *  visible list — in Tags view this is the position within the group,
   *  in Order view this is the absolute position in the spine. */
  position: number;
  /** When false, drag handles + onDrag* are inert. Tags view sets this
   *  to false because reorder isn't meaningful inside a group. */
  draggable: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
};

const EntryRow = ({
  entry,
  position,
  draggable,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: EntryRowProps) => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(entry.name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [editingTags, setEditingTags] = useState(false);
  const [tagsDraft, setTagsDraft] = useState('');
  const tagsInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (editing) {
      setDraft(entry.name);
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing, entry.name]);

  useEffect(() => {
    if (editingTags) {
      setTagsDraft(entry.tags.join(', '));
      tagsInputRef.current?.focus();
      tagsInputRef.current?.select();
    }
  }, [editingTags, entry.tags]);

  const save = async () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === entry.name) return;
    await updateEntry(entry.id, { name: next });
  };

  const saveTags = async () => {
    const next = parseTagsInput(tagsDraft);
    setEditingTags(false);
    if (sameTags(next, entry.tags)) return;
    await updateEntry(entry.id, { tags: next });
  };

  const onRemove = async () => {
    if (!window.confirm(`Remove "${entry.name}" from this guidebook? The source itself stays in the topic.`)) {
      return;
    }
    await removeEntry(entry.id);
  };

  const source = resolveSource(entry);
  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  const openSource = () => {
    if (!source?.href) return;
    if (source.external) {
      window.open(source.href, '_blank', 'noopener,noreferrer');
    } else {
      navigate(source.href);
    }
  };

  return (
    <div
      draggable={draggable}
      onDragStart={draggable ? onDragStart : undefined}
      onDragOver={draggable ? onDragOver : undefined}
      onDrop={draggable ? onDrop : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 22px 18px 1fr 26px 26px',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        borderBottom: '1px solid var(--line)',
        background: isDragging ? 'color-mix(in srgb, var(--action) 6%, transparent)' : 'transparent',
        borderTop: isDragOver
          ? '2px solid var(--ember)'
          : '2px solid transparent',
        cursor: draggable ? 'grab' : 'default',
        // Without this, Chrome on Linux treats mousedown-on-text as a
        // text selection and quietly cancels the row-level drag.
        userSelect: draggable ? 'none' : 'auto',
      }}
    >
      {/* Drag handle (inert in tags view) */}
      <span
        title={draggable ? 'drag to reorder' : 'reorder in Order view'}
        style={{
          color: draggable ? 'var(--fg-faint)' : 'transparent',
          cursor: draggable ? 'grab' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icons.grip size={14} />
      </span>

      {/* Position number */}
      <Mono dim>{position + 1}</Mono>

      {/* Source icon */}
      <span style={{ color: 'var(--fg-muted)' }}>
        {source?.icon === 'ext' ? (
          <Icons.ext size={14} />
        ) : (
          <Icons.doc size={14} />
        )}
      </span>

      {/* Name + description preview + source title + tag chips */}
      <div style={{ minWidth: 0 }}>
        {editing ? (
          <input
            ref={inputRef}
            draggable={false}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => void save()}
            onClick={stop}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void save();
              }
              if (e.key === 'Escape') {
                setEditing(false);
              }
            }}
            className="km-body"
            style={{
              width: '100%',
              fontWeight: 500,
              background: 'var(--surface-1)',
              border: '1px solid var(--ember)',
              borderRadius: 3,
              padding: '3px 6px',
            }}
          />
        ) : (
          <div
            className="km-body"
            onClick={(e) => {
              stop(e);
              setEditing(true);
            }}
            title="click to rename"
            style={{
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'text',
            }}
          >
            {entry.name}
          </div>
        )}
        {entry.description && (
          <Mono
            dim
            style={{
              display: 'block',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}
          >
            {entry.description}
          </Mono>
        )}
        {source ? (
          source.title !== entry.name && (
            <Mono
              dim
              style={{
                display: 'block',
                fontSize: 10.5,
                color: 'var(--fg-faint)',
                marginTop: 2,
              }}
            >
              source · {source.title}
            </Mono>
          )
        ) : (
          <Mono style={{ color: 'var(--ember-deep)', fontSize: 10.5, marginTop: 2 }}>
            source unavailable
          </Mono>
        )}

        {/* Tag chips — click to edit (comma-separated) */}
        {editingTags ? (
          <input
            ref={tagsInputRef}
            draggable={false}
            value={tagsDraft}
            onChange={(e) => setTagsDraft(e.target.value)}
            onBlur={() => void saveTags()}
            onClick={stop}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void saveTags();
              }
              if (e.key === 'Escape') {
                setEditingTags(false);
              }
            }}
            placeholder="comma-separated tags"
            style={{
              marginTop: 4,
              width: '100%',
              fontFamily: 'var(--ff-mono)',
              fontSize: 11,
              background: 'var(--surface-1)',
              border: '1px solid var(--ember)',
              borderRadius: 3,
              padding: '2px 6px',
            }}
          />
        ) : entry.tags.length > 0 ? (
          <div
            onClick={(e) => {
              stop(e);
              setEditingTags(true);
            }}
            title="click to edit tags"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              marginTop: 4,
              cursor: 'text',
            }}
          >
            {entry.tags.map((t) => (
              <TagChip key={t} label={t} />
            ))}
          </div>
        ) : (
          <span
            className="km-mono-sm"
            onClick={(e) => {
              stop(e);
              setEditingTags(true);
            }}
            title="add tags"
            style={{
              display: 'inline-block',
              marginTop: 4,
              cursor: 'text',
              fontSize: 10.5,
              color: 'var(--fg-faint)',
            }}
          >
            + tag
          </span>
        )}
      </div>

      {/* Open source */}
      <button
        className="km-btn km-btn-ghost"
        onClick={(e) => {
          stop(e);
          openSource();
        }}
        disabled={!source?.href}
        title={source?.external ? 'open link' : 'open doc'}
        style={{
          padding: 0,
          color: source?.href ? 'var(--fg-muted)' : 'var(--fg-faint)',
          cursor: source?.href ? 'pointer' : 'default',
        }}
      >
        {source?.external ? <Icons.ext size={14} /> : <Icons.eye size={14} />}
      </button>

      {/* Remove */}
      <button
        className="km-btn km-btn-ghost"
        onClick={(e) => {
          stop(e);
          void onRemove();
        }}
        title="remove from guidebook"
        style={{ padding: 0, color: 'var(--ember-deep)' }}
      >
        <Icons.trash size={14} />
      </button>
    </div>
  );
};

type ViewMode = 'order' | 'tags';

export const GuidebookView = () => {
  const navigate = useNavigate();
  const storeVersion = useStoreVersion();
  const { id = '' } = useParams<{ slug?: string; id?: string }>();
  const guidebook = getGuidebookById(id);
  const project = guidebook ? getProjectById(guidebook.projectId) : undefined;

  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [editingDescription, setEditingDescription] = useState(false);
  const [descriptionDraft, setDescriptionDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('order');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  // Drag state lives in the parent so visual cues persist across rows. The
  // ref mirrors dragIndex for synchronous read inside dragover/drop: React
  // batches the setState from dragstart, so the closure that handles the
  // first dragover would otherwise still see the pre-drag null value and
  // skip preventDefault — which silently breaks the drop.
  const dragIndexRef = useRef<number | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus();
  }, [editingName]);
  useEffect(() => {
    if (editingDescription) descriptionInputRef.current?.focus();
  }, [editingDescription]);

  // Depend on storeVersion too: reordering entries mutates the entries
  // array, not the guidebook object, so keying on `guidebook` alone left
  // this memo stale after a drag — the list snapped back to the old order.
  const entries = useMemo(
    () => (guidebook ? getGuidebookEntries(guidebook.id) : []),
    [guidebook, storeVersion],
  );

  // Unique tags in user-defined entry order — the first time a tag
  // appears determines its position in the chip row + group order.
  const uniqueTags = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const e of entries) {
      for (const t of e.tags) {
        if (seen.has(t)) continue;
        seen.add(t);
        out.push(t);
      }
    }
    return out;
  }, [entries]);

  // Drop the filter chip if the underlying tag disappears (last entry
  // bearing it was removed).
  useEffect(() => {
    if (activeTag && !uniqueTags.includes(activeTag)) setActiveTag(null);
  }, [activeTag, uniqueTags]);

  const orderedEntries = useMemo(() => {
    if (viewMode !== 'order' || !activeTag) return entries;
    return entries.filter((e) => e.tags.includes(activeTag));
  }, [entries, viewMode, activeTag]);

  const groupedEntries = useMemo(() => {
    if (viewMode !== 'tags') return [];
    const groups: { tag: string; entries: GuidebookEntry[] }[] = uniqueTags.map(
      (tag) => ({
        tag,
        entries: entries.filter((e) => e.tags.includes(tag)),
      }),
    );
    const untagged = entries.filter((e) => e.tags.length === 0);
    if (untagged.length > 0) {
      groups.push({ tag: '__untagged__', entries: untagged });
    }
    return groups;
  }, [entries, uniqueTags, viewMode]);

  if (!guidebook || !project) return <GuidebookNotFound id={id} />;

  const saveName = async () => {
    const next = nameDraft.trim();
    setEditingName(false);
    if (!next || next === guidebook.name) return;
    try {
      await updateGuidebook(guidebook.id, { name: next });
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? Object.values(err.fields).join(', ')
          : (err as Error).message,
      );
    }
  };
  const saveDescription = async () => {
    const next = descriptionDraft.trim();
    setEditingDescription(false);
    if (next === (guidebook.description ?? '')) return;
    try {
      await updateGuidebook(guidebook.id, {
        description: next || null,
      });
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? Object.values(err.fields).join(', ')
          : (err as Error).message,
      );
    }
  };

  const onDelete = async () => {
    if (!window.confirm(`Delete "${guidebook.name}"? Source docs and references stay in the topic.`)) return;
    await deleteGuidebook(guidebook.id);
    navigate(`/project/${project.slug}`);
  };

  // ─── Drag-to-reorder (Order view only, no active tag filter) ────
  // When a tag filter is active the visible list is a subset of the
  // spine, so dropping at index `i` of the visible list doesn't map to
  // a clean absolute rank. We disable reorder under filter and tell
  // the user via the spine header copy.
  const dragEnabled = viewMode === 'order' && activeTag === null;
  const handleDragStart = (index: number) => (e: React.DragEvent) => {
    dragIndexRef.current = index;
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    try {
      e.dataTransfer.setData('text/plain', entries[index].id);
    } catch {
      /* setData rejected in some browsers — fine, we use the ref */
    }
  };
  const handleDragOver = (index: number) => (e: React.DragEvent) => {
    if (dragIndexRef.current === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (index !== dragOverIndex) setDragOverIndex(index);
  };
  const handleDrop = (index: number) => async (e: React.DragEvent) => {
    e.preventDefault();
    const from = dragIndexRef.current;
    dragIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
    if (from === null || from === index) return;
    const next = entries.map((x) => x.id);
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    await reorderEntries(guidebook.id, next);
  };
  const handleDragEnd = () => {
    dragIndexRef.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const reorderHint =
    viewMode === 'tags'
      ? 'drag disabled in Tags view'
      : activeTag
        ? 'clear the filter to reorder'
        : 'drag rows to reorder';

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar projectChip={<ProjectTag slug={project.slug} />} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" activeProjectSlug={project.slug} />
        <main
          className="km-scroll"
          style={{ flex: 1, overflow: 'auto', padding: '22px 32px 32px' }}
        >
          {/* Back link */}
          <button
            className="km-btn km-btn-ghost"
            onClick={() => navigate(`/project/${project.slug}`)}
            style={{ marginBottom: 12, padding: '2px 6px', color: 'var(--fg-muted)' }}
          >
            <Icons.arrowR
              size={12}
              style={{ transform: 'rotate(180deg)' }}
            />{' '}
            {project.name}
          </button>

          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 24,
              marginBottom: 18,
              paddingBottom: 16,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <span style={{ color: 'var(--fg-muted)' }}>
                  <Icons.doc size={14} />
                </span>
                <ProjectTag slug={project.slug} />
                <Mono dim>guidebook · ordered references</Mono>
              </div>

              {/* Name — click to edit inline */}
              {editingName ? (
                <input
                  ref={nameInputRef}
                  className="km-display-lg"
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => void saveName()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void saveName();
                    }
                    if (e.key === 'Escape') {
                      setEditingName(false);
                      setError(null);
                    }
                  }}
                  style={{
                    width: '100%',
                    background: 'var(--surface-1)',
                    border: '1px solid var(--ember)',
                    borderRadius: 4,
                    padding: '4px 8px',
                    marginBottom: 4,
                  }}
                />
              ) : (
                <div
                  className="km-display-lg"
                  onClick={() => {
                    setNameDraft(guidebook.name);
                    setEditingName(true);
                  }}
                  title="click to rename"
                  style={{ marginBottom: 4, cursor: 'text' }}
                >
                  {guidebook.name}
                </div>
              )}

              {/* Description — click to edit inline */}
              {editingDescription ? (
                <textarea
                  ref={descriptionInputRef}
                  className="km-body"
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  onBlur={() => void saveDescription()}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setEditingDescription(false);
                      setError(null);
                    }
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      void saveDescription();
                    }
                  }}
                  rows={2}
                  style={{
                    width: '100%',
                    maxWidth: 760,
                    background: 'var(--surface-1)',
                    border: '1px solid var(--ember)',
                    borderRadius: 4,
                    padding: '6px 8px',
                    fontFamily: 'var(--ff-sans)',
                    fontSize: 13,
                  }}
                />
              ) : (
                <div
                  className="km-body"
                  onClick={() => {
                    setDescriptionDraft(guidebook.description ?? '');
                    setEditingDescription(true);
                  }}
                  title="click to edit"
                  style={{
                    color: guidebook.description ? 'var(--fg-muted)' : 'var(--fg-faint)',
                    maxWidth: 760,
                    cursor: 'text',
                    fontStyle: guidebook.description ? undefined : 'italic',
                  }}
                >
                  {guidebook.description ?? 'add a one-line description'}
                </div>
              )}

              {error && (
                <div style={{ marginTop: 6 }}>
                  <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <button
                className="km-btn"
                onClick={() => void setGuidebookPinned(guidebook.id, !guidebook.pinned)}
                title={guidebook.pinned ? 'unpin from landing' : 'pin to landing'}
                style={{
                  color: guidebook.pinned ? 'var(--ember-deep)' : 'var(--fg-muted)',
                }}
              >
                {guidebook.pinned ? '★ Pinned' : '☆ Pin'}
              </button>
              <button
                className="km-btn km-btn-ghost"
                onClick={() => void onDelete()}
                style={{ color: 'var(--ember-deep)' }}
              >
                Delete
              </button>
            </div>
          </div>

          {/* Entries */}
          <section className="km-card" style={{ padding: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderBottom: '1px solid var(--line)',
                gap: 12,
                flexWrap: 'wrap',
              }}
            >
              <span className="km-display-sm" style={{ fontSize: 11 }}>
                {entries.length === 0 ? 'SPINE' : `SPINE · ${entries.length} ENTRIES`}
              </span>
              <div style={{ display: 'flex' }}>
                <SegBtn
                  label="Order"
                  active={viewMode === 'order'}
                  onClick={() => setViewMode('order')}
                />
                <SegBtn
                  label="Tags"
                  active={viewMode === 'tags'}
                  onClick={() => setViewMode('tags')}
                />
              </div>
              <Mono dim>{reorderHint}</Mono>
              <span style={{ flex: 1 }} />
              <AskClaude
                prompt={`Using the Steep MCP tools, read the guidebook "${guidebook.name}" in project "${project.slug}" and help me work on it.`}
              />
              <button
                className="km-btn km-btn-primary"
                onClick={() => setAddOpen(true)}
                style={{ fontSize: 12 }}
              >
                <Icons.plus size={12} /> Add entry
              </button>
            </div>

            {/* Order-view tag filter row */}
            {viewMode === 'order' && uniqueTags.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  flexWrap: 'wrap',
                  padding: '8px 14px',
                  borderBottom: '1px solid var(--line)',
                  background: 'var(--surface-1)',
                }}
              >
                <Mono dim>filter</Mono>
                <TagChip
                  label="all"
                  active={activeTag === null}
                  onClick={() => setActiveTag(null)}
                />
                {uniqueTags.map((t) => (
                  <TagChip
                    key={t}
                    label={t}
                    active={activeTag === t}
                    onClick={() => setActiveTag(activeTag === t ? null : t)}
                  />
                ))}
              </div>
            )}

            {entries.length === 0 ? (
              <div
                style={{
                  padding: '32px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--fg-muted)',
                }}
              >
                <Mono dim>no entries yet</Mono>
                <Mono dim>
                  attach existing docs or references from this topic to start building the spine
                </Mono>
              </div>
            ) : viewMode === 'order' ? (
              orderedEntries.length === 0 ? (
                <div
                  style={{
                    padding: '20px 24px',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <Mono dim>no entries tagged "{activeTag}"</Mono>
                </div>
              ) : (
                orderedEntries.map((e) => {
                  // Position number = absolute index in the spine, so
                  // it stays meaningful even when filtered.
                  const absIndex = entries.findIndex((x) => x.id === e.id);
                  return (
                    <EntryRow
                      key={e.id}
                      entry={e}
                      position={absIndex}
                      draggable={dragEnabled}
                      isDragging={dragIndex === absIndex}
                      isDragOver={
                        dragOverIndex === absIndex && dragIndex !== absIndex
                      }
                      onDragStart={handleDragStart(absIndex)}
                      onDragOver={handleDragOver(absIndex)}
                      onDrop={handleDrop(absIndex)}
                      onDragEnd={handleDragEnd}
                    />
                  );
                })
              )
            ) : (
              groupedEntries.map((group) => (
                <div key={group.tag}>
                  <div
                    style={{
                      padding: '8px 14px',
                      background: 'var(--surface-1)',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {group.tag === '__untagged__' ? (
                      <Mono dim>untagged</Mono>
                    ) : (
                      <TagChip label={group.tag} />
                    )}
                    <Mono dim>· {group.entries.length}</Mono>
                  </div>
                  {group.entries.map((e, i) => (
                    <EntryRow
                      key={`${group.tag}:${e.id}`}
                      entry={e}
                      position={i}
                      draggable={false}
                      isDragging={false}
                      isDragOver={false}
                      onDragStart={() => {}}
                      onDragOver={() => {}}
                      onDrop={() => {}}
                      onDragEnd={() => {}}
                    />
                  ))}
                </div>
              ))
            )}
          </section>
        </main>
      </div>

      <AddGuidebookEntryModal
        open={addOpen}
        guidebookId={guidebook.id}
        projectSlug={project.slug}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
};

export default GuidebookView;
