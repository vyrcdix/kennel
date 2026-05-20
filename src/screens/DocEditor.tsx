import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Rev } from '../components/Rev';
import { Actor } from '../components/Actor';
import { Icons } from '../components/Icon';
import {
  getDefaultDoc,
  getDocById,
  getDocComments,
  getProjectById,
} from '../data/selectors';
import {
  addComment,
  crystallizeItem,
  saveDoc,
  setDocPinned,
} from '../data/actions';
import { items } from '../data/fixtures';
import { useStoreVersion } from '../data/store';
import { renderBlocks } from '../lib/markdown';
import { formatTime } from '../data/time';

const DocNotFound = ({ id }: { id: string }) => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No doc with id "{id}".</div>
        <Mono dim>try the dashboard or thread landing for the list of docs</Mono>
      </main>
    </div>
  </div>
);

const DocEditorBody = ({ doc }: { doc: NonNullable<ReturnType<typeof getDocById>> }) => {
  useStoreVersion();
  const [draft, setDraft] = useState(doc.body);
  const [previewOnly, setPreviewOnly] = useState(false);
  const dirty = draft !== doc.body;

  const saveTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!dirty) return;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => saveDoc(doc.id, draft), 2000);
    return () => window.clearTimeout(saveTimer.current);
  }, [draft, dirty, doc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (dirty) saveDoc(doc.id, draft);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [draft, dirty, doc]);

  const [commentDraft, setCommentDraft] = useState('');
  const postComment = () => {
    const trimmed = commentDraft.trim();
    if (!trimmed) return;
    addComment('doc', doc.id, trimmed, 'craig');
    setCommentDraft('');
  };

  const project = getProjectById(doc.projectId);
  const comments = getDocComments(doc.id);
  const linkedItem = items.find((i) => i.docId === doc.id);
  const promoted =
    !!linkedItem &&
    (linkedItem.kind === 'crystallization' || linkedItem.state === 'crystallized');
  const onPromote = () => {
    if (!linkedItem) return;
    void crystallizeItem(linkedItem.id, { promoteKind: true });
  };

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" activeProjectSlug={project?.slug} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Doc header */}
          <div style={{ padding: '16px 28px 14px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              {project && <ProjectTag slug={project.slug} />}
              <Mono>{doc.filePath}</Mono>
              <button
                onClick={() => void setDocPinned(doc.id, !doc.pinned)}
                title={doc.pinned ? 'Unpin from thread landing' : 'Pin to thread landing'}
                style={{
                  border: 0,
                  background: 'transparent',
                  padding: '2px 4px',
                  cursor: 'pointer',
                  color: doc.pinned ? 'var(--blaze)' : 'var(--fg-faint)',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <Icons.pin size={12} />
              </button>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="km-display-lg">{doc.title}</span>
                {promoted && (
                  <span
                    className="km-display-sm"
                    style={{ color: 'var(--moss)', fontSize: 10 }}
                  >
                    DURABLE
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Rev n={doc.revision} />
                <Mono>
                  {dirty ? `editing · ⌘S to save` : `saved ${formatTime(doc.updatedAt)}`}
                </Mono>
                {!promoted && (
                  <button
                    className="km-btn km-btn-ghost"
                    onClick={onPromote}
                    title="Promote to a crystallization"
                  >
                    <Icons.star size={13} /> Promote to crystallization
                  </button>
                )}
                <button
                  className={`km-btn km-btn-ghost${previewOnly ? ' km-btn-active' : ''}`}
                  onClick={() => setPreviewOnly((v) => !v)}
                  title={previewOnly ? 'Show source pane' : 'Hide source — preview only'}
                  style={previewOnly ? { color: 'var(--ember-deep)' } : undefined}
                >
                  <Icons.side size={13} /> {previewOnly ? 'Show source' : 'Preview only'}
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: previewOnly ? '1fr 320px' : '1fr 1fr 320px',
              overflow: 'hidden',
            }}
          >
            {/* Markdown source — editable */}
            {!previewOnly && (
              <textarea
                className="km-scroll"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                spellCheck={false}
                style={{
                  resize: 'none',
                  overflow: 'auto',
                  padding: '22px 26px',
                  borderRight: '1px solid var(--line)',
                  border: 0,
                  borderRadius: 0,
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 12.5,
                  lineHeight: 1.7,
                  background: 'var(--surface-0)',
                  color: 'var(--fg)',
                  outline: 'none',
                }}
              />
            )}

            <div
              className="km-scroll"
              style={{
                overflow: 'auto',
                padding: '22px 28px',
                borderRight: '1px solid var(--line)',
                background: 'var(--surface-0)',
              }}
            >
              {renderBlocks(draft)}
            </div>

            {/* Comments rail */}
            <aside
              className="km-scroll"
              style={{ overflow: 'auto', padding: '18px 18px', background: 'var(--surface-1)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                <Label>Comments</Label>
                <span style={{ flex: 1 }} />
                <Mono>{comments.length} · whole-doc</Mono>
              </div>

              {comments.length === 0 ? (
                <Mono dim>no comments</Mono>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {comments.map((c) =>
                    c.author === 'craig' ? (
                      <div key={c.id}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <Actor who="C" />{' '}
                          <span className="km-display-sm">CRAIG</span>
                          <span style={{ flex: 1 }} />
                          <Mono>{formatTime(c.createdAt)}</Mono>
                        </div>
                        <div className="km-body" style={{ lineHeight: 1.5 }}>
                          {c.body}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={c.id}
                        style={{
                          paddingLeft: 0,
                          borderLeft: '2px solid var(--ember-deep)',
                          background: 'rgba(138,58,20,.06)',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            marginBottom: 4,
                          }}
                        >
                          <Actor who="Cl" />{' '}
                          <span
                            className="km-display-sm"
                            style={{ color: 'var(--ember-deep)' }}
                          >
                            CLAUDE
                          </span>
                          <span style={{ flex: 1 }} />
                          <Mono>{formatTime(c.createdAt)}</Mono>
                        </div>
                        <div
                          className="km-body"
                          style={{ lineHeight: 1.5, fontStyle: 'italic' }}
                        >
                          {c.body}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 14,
                  borderTop: '1px solid var(--line)',
                }}
              >
                <textarea
                  placeholder="Add a comment…"
                  className="km-input"
                  rows={3}
                  value={commentDraft}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                      e.preventDefault();
                      postComment();
                    }
                  }}
                  style={{ resize: 'none', fontSize: 13 }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <span className="km-body-sm" style={{ flex: 1 }}>
                    Cmd+Enter to post · @claude to ask
                  </span>
                  <button
                    className="km-btn km-btn-primary"
                    onClick={postComment}
                    disabled={!commentDraft.trim()}
                    style={{
                      padding: '4px 10px',
                      fontSize: 12,
                      opacity: commentDraft.trim() ? 1 : 0.5,
                    }}
                  >
                    Post
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export const DocEditor = () => {
  const { id } = useParams<{ id?: string }>();
  const doc = id ? getDocById(id) : getDefaultDoc();
  if (!doc) return <DocNotFound id={id ?? ''} />;
  return <DocEditorBody key={doc.id} doc={doc} />;
};

export default DocEditor;
