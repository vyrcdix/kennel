import { useEffect, useMemo, useRef, useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { SegBtn } from './SegBtn';
import {
  addEntry,
  ValidationError,
  type AddEntryInput,
} from '../data/actions';
import {
  getProjectBySlug,
  getProjectDocs,
  getProjectReferences,
} from '../data/selectors';
import type { Doc, Reference } from '../data/types';

const NAME_MAX = 200;
const DESCRIPTION_MAX = 2000;
const UPLOAD_MAX_BYTES = 10 * 1024 * 1024;

export type AddGuidebookEntryModalProps = {
  open: boolean;
  guidebookId: string;
  projectSlug: string;
  onClose: () => void;
};

type Mode = 'pick' | 'upload' | 'link';

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

/** Read a File into base64 — the wire shape the server's upload variant
 *  decodes via Buffer.from(..., 'base64'). FileReader gives us a data: URL;
 *  strip the `data:…;base64,` prefix. */
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

const sourceKindFromFilename = (filename: string): 'md' | 'docx' | null => {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) return 'md';
  if (lower.endsWith('.docx')) return 'docx';
  return null;
};

const titleFromFilename = (filename: string): string =>
  filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').trim();

export const AddGuidebookEntryModal = ({
  open,
  guidebookId,
  projectSlug,
  onClose,
}: AddGuidebookEntryModalProps) => {
  const [mode, setMode] = useState<Mode>('pick');

  // Pick state
  const [filter, setFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const filterRef = useRef<HTMLInputElement | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Link state
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const linkUrlRef = useRef<HTMLInputElement | null>(null);

  // Shared metadata
  const [nameOverride, setNameOverride] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedTags = useMemo(
    () => tagsInput.split(',').map((t) => t.trim()).filter((t) => t.length > 0),
    [tagsInput],
  );

  // Reset everything when the modal opens.
  useEffect(() => {
    if (!open) return;
    setMode('pick');
    setFilter('');
    setSelectedId(null);
    setFile(null);
    setFileError(null);
    setLinkUrl('');
    setLinkLabel('');
    setNameOverride('');
    setDescription('');
    setTagsInput('');
    setSaving(false);
    setError(null);
    const t = setTimeout(() => filterRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  // Focus the right field when switching tabs.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      if (mode === 'pick') filterRef.current?.focus();
      else if (mode === 'upload') fileInputRef.current?.focus();
      else if (mode === 'link') linkUrlRef.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [mode, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const project = open ? getProjectBySlug(projectSlug) : undefined;

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

  useEffect(() => {
    if (!open || mode !== 'pick') return;
    if (selectedId && filtered.some((p) => pickId(p) === selectedId)) return;
    setSelectedId(filtered[0] ? pickId(filtered[0]) : null);
  }, [open, mode, filtered, selectedId]);

  if (!open || !project) return null;

  const selectedPick = filtered.find((p) => pickId(p) === selectedId) ?? null;
  const fileKind = file ? sourceKindFromFilename(file.name) : null;
  const trimmedUrl = linkUrl.trim();

  const canSubmit =
    !saving &&
    ((mode === 'pick' && selectedPick != null) ||
      (mode === 'upload' && file != null && fileKind != null && !fileError) ||
      (mode === 'link' && trimmedUrl.length > 0));

  const placeholderName =
    mode === 'pick'
      ? selectedPick
        ? pickTitle(selectedPick)
        : 'pick a source first'
      : mode === 'upload'
        ? file
          ? titleFromFilename(file.name)
          : 'choose a file first'
        : linkLabel.trim() || trimmedUrl || 'paste a URL first';

  const onFileChosen = (f: File | null) => {
    setError(null);
    setFileError(null);
    if (!f) {
      setFile(null);
      return;
    }
    const kind = sourceKindFromFilename(f.name);
    if (!kind) {
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
  };

  /** Translate the server's validation error fields into a single
   *  user-facing string. The DOCX-conversion failure gets the
   *  paste-it-instead nudge the FRD calls for. */
  const messageFromValidation = (err: ValidationError): string => {
    if (err.fields.body === 'docx_conversion_failed') {
      return 'Could not convert this .docx — please paste the contents into a doc instead.';
    }
    if (err.fields['link.url'] === 'required') return 'A URL is required.';
    if (err.fields['upload.body'] === 'empty') return 'The uploaded file was empty.';
    if (err.fields['upload.kind'] === 'must_be_md_or_docx') {
      return 'Only .md and .docx files are supported.';
    }
    return Object.entries(err.fields).map(([k, v]) => `${k}: ${v}`).join(', ');
  };

  const buildInput = async (): Promise<AddEntryInput | null> => {
    const name = nameOverride.trim() || undefined;
    const desc = description.trim() || undefined;
    const tags = parsedTags.length > 0 ? parsedTags : undefined;
    if (mode === 'pick') {
      if (!selectedPick) return null;
      if (selectedPick.kind === 'doc') {
        return {
          kind: 'existingDoc',
          docId: selectedPick.doc.id,
          name,
          description: desc,
          tags,
        };
      }
      return {
        kind: 'existingRef',
        referenceId: selectedPick.reference.id,
        name,
        description: desc,
        tags,
      };
    }
    if (mode === 'upload') {
      if (!file || !fileKind) return null;
      const bodyBase64 = await fileToBase64(file);
      return {
        kind: 'upload',
        filename: file.name,
        sourceKind: fileKind,
        bodyBase64,
        name,
        description: desc,
        tags,
      };
    }
    if (!trimmedUrl) return null;
    return {
      kind: 'link',
      url: trimmedUrl,
      label: linkLabel.trim() || trimmedUrl,
      name,
      description: desc,
      tags,
    };
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const input = await buildInput();
      if (!input) {
        setSaving(false);
        return;
      }
      await addEntry(guidebookId, input);
      onClose();
    } catch (err) {
      setSaving(false);
      if (err instanceof ValidationError) {
        setError(messageFromValidation(err));
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
        background: 'color-mix(in srgb, var(--scrim) 42%, transparent)',
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
          <div style={{ display: 'flex' }}>
            <SegBtn
              label="Pick existing"
              active={mode === 'pick'}
              onClick={() => setMode('pick')}
            />
            <SegBtn
              label="Upload"
              active={mode === 'upload'}
              onClick={() => setMode('upload')}
            />
            <SegBtn
              label="Link"
              active={mode === 'link'}
              onClick={() => setMode('link')}
            />
          </div>
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
          {mode === 'pick' && (
            <>
              <input
                ref={filterRef}
                className="km-input"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder={`Filter ${docCount} docs and ${refCount} references in this topic…`}
                style={{ width: '100%', fontSize: 13 }}
              />

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
                            ? 'color-mix(in srgb, var(--action) 10%, transparent)'
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
            </>
          )}

          {mode === 'upload' && (
            <>
              <div className="km-display-sm" style={{ fontSize: 11 }}>
                FILE <Mono dim>.md or .docx · up to {UPLOAD_MAX_BYTES / 1024 / 1024} MB</Mono>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.markdown,.docx"
                onChange={(e) => onFileChosen(e.target.files?.[0] ?? null)}
                style={{ fontSize: 13 }}
              />
              {file && !fileError && (
                <Mono dim>
                  {file.name} · {fileKind} · {(file.size / 1024).toFixed(1)} KB
                </Mono>
              )}
              {fileError && (
                <Mono style={{ color: 'var(--ember-deep)' }}>{fileError}</Mono>
              )}
              <Mono dim>
                Word docs are converted to markdown on the server. If
                conversion fails — usually because of complex styles or
                embedded images — paste the contents into a new doc instead.
              </Mono>
            </>
          )}

          {mode === 'link' && (
            <>
              <div>
                <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
                  URL
                </div>
                <input
                  ref={linkUrlRef}
                  className="km-input"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://…"
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>
              <div>
                <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
                  LABEL <Mono dim>optional · defaults to the URL itself</Mono>
                </div>
                <input
                  className="km-input"
                  value={linkLabel}
                  onChange={(e) => setLinkLabel(e.target.value)}
                  placeholder="What this link is"
                  style={{ width: '100%', fontSize: 13 }}
                />
              </div>
              <Mono dim>
                A new Reference will be created in this topic and added as
                the entry's source.
              </Mono>
            </>
          )}

          {/* Per-membership metadata — common to all three modes */}
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              NAME <Mono dim>optional · defaults to the source's title</Mono>
            </div>
            <input
              className="km-input"
              value={nameOverride}
              maxLength={NAME_MAX}
              onChange={(e) => setNameOverride(e.target.value)}
              placeholder={placeholderName}
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
          <div>
            <div className="km-display-sm" style={{ fontSize: 11, marginBottom: 5 }}>
              TAGS <Mono dim>optional · comma-separated · group + filter</Mono>
            </div>
            <input
              className="km-input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="design, v1, brief"
              style={{ width: '100%', fontSize: 13 }}
            />
            {parsedTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                {parsedTags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 10.5,
                      padding: '1px 6px',
                      borderRadius: 3,
                      background: 'color-mix(in srgb, var(--action) 10%, transparent)',
                      color: 'var(--ember-deep)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
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
