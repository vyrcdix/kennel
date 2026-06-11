import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Actor } from '../components/Actor';
import { Icons } from '../components/Icon';
import { getPendingProposals, getProposalView } from '../data/selectors';
import { reviewProposal, type ProposalDecision } from '../data/actions';
import { useStoreVersion } from '../data/store';
import {
  countHunks,
  diffLines,
  summary,
  toSideBySide,
  type SideLine,
} from '../data/diff';
import { formatRelative } from '../data/time';

const LINE_STYLE = {
  eq:  { sign: ' ', bg: 'transparent',           signColor: 'var(--fg-faint)' },
  add: { sign: '+', bg: 'var(--diff-add-bg)', signColor: 'var(--diff-add-ink)' },
  del: { sign: '−', bg: 'var(--diff-del-bg)', signColor: 'var(--diff-del-ink)' },
} as const;

const DIFF_GRID = '38px 18px 1fr';

const DiffSide = ({ lines }: { lines: SideLine[] }) => (
  <div style={{ padding: '10px 0' }}>
    {lines.map((line, i) => {
      if (line.kind === 'pad') {
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: DIFF_GRID,
              padding: '1px 0',
              minHeight: 21,
              background: 'color-mix(in srgb, var(--slate) 3%, transparent)',
            }}
          />
        );
      }
      const { sign, bg, signColor } = LINE_STYLE[line.kind];
      return (
        <div
          key={i}
          style={{
            display: 'grid',
            gridTemplateColumns: DIFF_GRID,
            alignItems: 'baseline',
            background: bg,
            padding: '2px 0',
          }}
        >
          <span
            className="km-mono-sm"
            style={{ textAlign: 'right', paddingRight: 8, color: 'var(--fg-faint)' }}
          >
            {line.n}
          </span>
          <span className="km-mono-sm" style={{ textAlign: 'center', color: signColor }}>
            {sign}
          </span>
          <span
            style={{
              fontFamily: 'var(--ff-mono)',
              fontSize: 12.5,
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
              color: 'var(--fg)',
              paddingRight: 14,
            }}
          >
            {line.text || ' '}
          </span>
        </div>
      );
    })}
  </div>
);

const codeInline: React.CSSProperties = {
  fontFamily: 'var(--ff-mono)',
  fontSize: 12,
};

const NoProposal = () => (
  <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="km-display-lg">No pending proposals.</div>
        <Mono dim>claude will register new ones in the triage queue when it sees something worth proposing</Mono>
      </main>
    </div>
  </div>
);

export const SkillProposal = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  useStoreVersion();
  const view = getProposalView(id);
  const [note, setNote] = useState('');
  // null = not editing; string = editing, draft body. Collapses two
  // useStates into one source of truth.
  const [draft, setDraft] = useState<string | null>(null);
  const editing = draft !== null;
  const skillBody = view?.skill.body ?? '';
  const proposedBody = view?.proposal.proposedBody ?? '';
  const liveBody = draft ?? proposedBody;
  // diffLines is the expensive part — recompute only when its inputs change.
  const ops = useMemo(
    () => diffLines(skillBody, liveBody),
    [skillBody, liveBody],
  );
  const sbs = useMemo(() => toSideBySide(ops), [ops]);
  const { adds, dels } = useMemo(() => summary(ops), [ops]);
  const hunks = useMemo(() => countHunks(ops), [ops]);
  if (!view) return <NoProposal />;

  const { proposal, skill, project, chat } = view;
  const startEdit = () => setDraft(proposal.proposedBody);
  const cancelEdit = () => setDraft(null);
  const isPending = proposal.status === 'pending';
  const isEdited = draft !== null && draft !== proposal.proposedBody;

  const decide = (decision: ProposalDecision) => {
    reviewProposal(
      proposal.id,
      decision,
      { note, bodyOverride: isEdited ? draft! : undefined },
    );
    const remaining = getPendingProposals().filter((p) => p.id !== proposal.id);
    if (remaining.length > 0) navigate(`/proposal/${remaining[0].id}`);
    else navigate('/proposal');
    setNote('');
    setDraft(null);
  };

  const onViewConversation = () => {
    if (!chat) return;
    if (chat.claudeUrl) {
      window.open(chat.claudeUrl, '_blank', 'noopener,noreferrer');
    } else if (project) {
      navigate(`/project/${project.slug}`);
    }
  };

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" activeProjectSlug={project?.slug} />
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '16px 28px 14px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                SKILL PROPOSAL
              </span>
              {project && <ProjectTag slug={project.slug} />}
              <span style={{ flex: 1 }} />
              <span
                className="km-display-sm"
                style={{
                  color: isPending
                    ? 'var(--ember-deep)'
                    : proposal.status === 'accepted'
                    ? 'var(--moss)'
                    : 'var(--fg-muted)',
                }}
              >
                ● {proposal.status.toUpperCase()}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                gap: 24,
              }}
            >
              <div>
                <div className="km-display-lg" style={{ marginBottom: 4 }}>
                  {skill.name}
                </div>
                <Mono>
                  skills/{skill.slug}.md · rev {skill.revision} → rev {skill.revision + 1} · +{adds} −{dels} across {hunks} hunk{hunks === 1 ? '' : 's'}
                </Mono>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Mono>proposed {formatRelative(proposal.createdAt)}</Mono>
                <Actor who="Cl" />
                <span className="km-body-sm">by Claude</span>
              </div>
            </div>
          </div>

          <div
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) 360px',
              overflow: 'hidden',
            }}
          >
            {/* Diff */}
            <div
              className="km-scroll"
              style={{
                overflow: 'auto',
                padding: '18px 28px 24px',
                borderRight: '1px solid var(--line)',
                minWidth: 0,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <Label>Diff</Label>
                <span className="km-body-sm">
                  {hunks} hunk{hunks === 1 ? '' : 's'}
                </span>
                {isEdited && (
                  <Mono dim style={{ color: 'var(--ember-deep)' }}>
                    edited locally · diff is against your edit
                  </Mono>
                )}
                <span style={{ flex: 1 }} />
              </div>

              {editing && (
                <div style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 6,
                    }}
                  >
                    <Label>Proposed body · editing</Label>
                    <Mono dim>diff updates live · changes apply on Accept</Mono>
                  </div>
                  <textarea
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={Math.max(8, (draft.match(/\n/g)?.length ?? 0) + 2)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'var(--surface-1)',
                      border: '1px solid var(--line)',
                      borderRadius: 4,
                      fontFamily: 'var(--ff-mono)',
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: 'var(--fg)',
                      resize: 'vertical',
                      minHeight: 180,
                      outline: 'none',
                    }}
                  />
                </div>
              )}

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 20,
                  border: '1px solid var(--line)',
                  borderRadius: 4,
                  padding: 14,
                  background: 'var(--surface-1)',
                }}
              >
                <div
                  style={{
                    background: 'var(--surface-0)',
                    border: '1px solid var(--line)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span className="km-display-sm">
                      Current · rev {skill.revision}
                    </span>
                    <Mono dim>
                      local · {skill.sourcePath ?? '(inline)'}
                    </Mono>
                  </div>
                  <DiffSide lines={sbs.left} />
                </div>
                <div
                  style={{
                    background: 'var(--surface-0)',
                    border: '1px solid var(--line)',
                    borderRadius: 3,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      background: 'var(--surface-2)',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                      Proposed · rev {skill.revision + 1}
                    </span>
                    <Mono dim>
                      claude · {chat ? `session ${chat.id}` : 'unattributed'}
                    </Mono>
                  </div>
                  <DiffSide lines={sbs.right} />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 0',
                  marginTop: 10,
                }}
              >
                <Label>Rationale</Label>
                <span style={{ flex: 1 }} />
                {chat && (
                  <>
                    <Mono>triggered by chat · "{chat.tagline.slice(0, 40)}…"</Mono>
                    <span style={{ color: 'var(--fg-muted)' }}>
                      <Icons.ext size={12} />
                    </span>
                  </>
                )}
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderLeft: '3px solid var(--fam-guide)',
                  background: 'color-mix(in srgb, var(--fam-guide) 5%, transparent)',
                }}
              >
                <p
                  className="km-body"
                  style={{ margin: '0 0 6px', fontStyle: 'italic', color: 'var(--fg)' }}
                >
                  {proposal.rationale}
                </p>
                {chat && (
                  <div
                    className="km-body-sm"
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Mono>3 turns · {chat.id}</Mono>
                    <span>·</span>
                    <button
                      onClick={onViewConversation}
                      className="km-link"
                      style={{
                        borderBottomStyle: 'dashed',
                        color: 'var(--ember-deep)',
                        background: 'transparent',
                        border: 0,
                        padding: 0,
                        cursor: 'pointer',
                      }}
                      title={chat.claudeUrl ?? 'open thread to find the chat'}
                    >
                      view conversation {chat.claudeUrl ? '↗' : '→'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Actions sidebar */}
            <aside
              className="km-scroll"
              style={{ overflow: 'auto', padding: '18px 20px', background: 'var(--surface-1)' }}
            >
              <Label style={{ marginBottom: 12 }}>Decision</Label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  className="km-btn km-btn-moss"
                  disabled={!isPending}
                  onClick={() => decide('accept')}
                  style={{
                    justifyContent: 'center',
                    padding: '10px 12px',
                    opacity: isPending ? 1 : 0.5,
                    cursor: isPending ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Icons.check size={13} /> Accept · update kennel only
                </button>
                <button
                  className="km-btn km-btn-primary"
                  disabled={!isPending}
                  onClick={() => decide('accept_write')}
                  style={{
                    justifyContent: 'center',
                    padding: '10px 12px',
                    opacity: isPending ? 1 : 0.5,
                    cursor: isPending ? 'pointer' : 'not-allowed',
                  }}
                >
                  <Icons.ext size={13} /> Accept &amp; write to source
                </button>
                <div
                  className="km-body-sm"
                  style={{ paddingLeft: 2, color: 'var(--fg-muted)', lineHeight: 1.5 }}
                >
                  'Write to source' updates{' '}
                  <code style={codeInline}>{skill.sourcePath ?? '(inline)'}</code>{' '}
                  on disk. The file will reflect rev {skill.revision + 1} immediately.
                </div>
                <div className="km-rule" style={{ margin: '10px 0 4px' }} />
                {!editing ? (
                  <button
                    className="km-btn"
                    disabled={!isPending}
                    onClick={startEdit}
                    style={{
                      justifyContent: 'center',
                      padding: '10px 12px',
                      opacity: isPending ? 1 : 0.5,
                      cursor: isPending ? 'pointer' : 'not-allowed',
                    }}
                    title="Open the proposed body in an editor before accepting"
                  >
                    <Icons.note size={13} /> Edit then accept
                  </button>
                ) : (
                  <button
                    className="km-btn km-btn-ghost"
                    onClick={cancelEdit}
                    style={{ justifyContent: 'center', padding: '10px 12px' }}
                  >
                    Cancel edit
                  </button>
                )}
                <button
                  className="km-btn"
                  disabled={!isPending}
                  onClick={() => decide('reject')}
                  style={{
                    justifyContent: 'center',
                    padding: '10px 12px',
                    borderColor: 'var(--line-strong)',
                    opacity: isPending ? 1 : 0.5,
                    cursor: isPending ? 'pointer' : 'not-allowed',
                  }}
                >
                  Reject
                </button>
              </div>

              <div style={{ marginTop: 18 }}>
                <Label style={{ marginBottom: 6 }}>
                  Decision note{' '}
                  <span
                    style={{
                      color: 'var(--fg-faint)',
                      textTransform: 'none',
                      letterSpacing: 0,
                      fontFamily: 'var(--ff-sans)',
                      fontSize: 11,
                      fontWeight: 400,
                    }}
                  >
                    {' '}· optional
                  </span>
                </Label>
                <textarea
                  className="km-input"
                  rows={4}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  disabled={!isPending}
                  style={{ resize: 'none', opacity: isPending ? 1 : 0.5 }}
                  placeholder="If rejecting, briefly note why — used as context next time Claude proposes a related change."
                />
              </div>

              <div style={{ marginTop: 22 }}>
                <Label style={{ marginBottom: 8 }}>Metadata</Label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Mono dim>scope</Mono>
                    <Mono>
                      {project ? `thread · ${project.slug}` : 'global'}
                    </Mono>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Mono dim>kind</Mono>
                    <Mono>skill body</Mono>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Mono dim>hunks</Mono>
                    <Mono>{hunks} · +{adds} −{dels}</Mono>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Mono dim>backed up</Mono>
                    <Mono>rev {skill.revision} retained</Mono>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SkillProposal;
