// v0.5 §F — Trace. Reverse-chronological timeline of how a thread's
// thinking evolved. Crystals are blaze milestones; discarded forks
// stay visible (struck-through) so the *why* of letting go isn't
// lost; gathered material clusters into "N items gathered here"
// nodes rather than scattering. Derived from items + chats +
// sources_from via getProjectTrace — no Trace storage of its own.

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AskClaude } from '../components/AskClaude';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { SegBtn } from '../components/SegBtn';
import {
  getItemById,
  getProjectBySlug,
  getProjectTrace,
  type TraceEntry,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { formatRelative } from '../data/time';

type Filter = 'all' | 'crystals' | 'discarded' | 'chats';

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'crystals', label: 'Crystals' },
  { value: 'discarded', label: 'Discarded' },
  { value: 'chats', label: 'Chats' },
];

const passesFilter = (entry: TraceEntry, f: Filter): boolean => {
  if (f === 'all') return true;
  if (f === 'crystals') return entry.type === 'crystal';
  if (f === 'discarded') return entry.type === 'discarded';
  return entry.type === 'chat';
};

const ThreadNotFound = ({ slug }: { slug: string }) => (
  <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="vd" style={{ fontFamily: 'var(--ff-display)', fontSize: 28 }}>
          No thread named "{slug}".
        </div>
      </main>
    </div>
  </div>
);

const Spine = ({
  type,
  last,
}: {
  type: TraceEntry['type'];
  last: boolean;
}) => {
  const dotByType: Record<TraceEntry['type'], { bg: string; ring: string }> = {
    spark: { bg: 'var(--v-clay)', ring: 'color-mix(in srgb, var(--v-clay) 22%, transparent)' },
    cluster: { bg: 'var(--v-faint)', ring: 'color-mix(in srgb, var(--v-ink) 10%, transparent)' },
    chat: { bg: 'var(--v-ember-dk)', ring: 'color-mix(in srgb, var(--v-ember-dk) 18%, transparent)' },
    fork: { bg: 'var(--v-soft)', ring: 'color-mix(in srgb, var(--v-ink) 10%, transparent)' },
    crystal: { bg: 'var(--v-blaze)', ring: 'color-mix(in srgb, var(--v-blaze) 30%, transparent)' },
    discarded: { bg: 'var(--v-faint)', ring: 'transparent' },
  };
  const { bg, ring } = dotByType[type];
  const size = type === 'crystal' ? 16 : 11;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: 30,
        flex: '0 0 30px',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: bg,
          boxShadow: ring !== 'transparent' ? `0 0 0 4px ${ring}` : 'none',
          marginTop: 4,
          flex: '0 0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {type === 'crystal' && (
          <Icons.gem size={9} stroke="#3A2807" sw={2.4} />
        )}
      </div>
      {!last && (
        <div
          style={{
            width: 2,
            flex: 1,
            background: 'var(--v-line)',
            marginTop: 4,
            minHeight: 18,
          }}
        />
      )}
    </div>
  );
};

const EntryBody = ({ entry }: { entry: TraceEntry }) => {
  const navigate = useNavigate();
  if (entry.type === 'crystal') {
    return (
      <div
        onClick={() => navigate(`/crystal/${entry.item.id}`)}
        style={{
          padding: 2,
          borderRadius: 8,
          background:
            'linear-gradient(150deg, var(--v-blaze), color-mix(in srgb, var(--v-blaze) 25%, transparent))',
          display: 'inline-block',
          maxWidth: '100%',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            background: 'var(--v-card)',
            borderRadius: 6,
            padding: '12px 16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: entry.item.body ? 6 : 0,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--ff-display)',
                fontSize: 9.5,
                letterSpacing: '.14em',
                color: 'var(--v-blaze-dk)',
                fontWeight: 600,
              }}
            >
              CRYSTALLIZED · {(entry.item.ctype ?? 'crystal').toUpperCase()}
            </span>
          </div>
          <div
            className="vd"
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: 18,
              lineHeight: 1.2,
              fontWeight: 600,
            }}
          >
            {entry.item.title}
          </div>
          {entry.item.body && (
            <div
              style={{
                fontSize: 13,
                color: 'var(--v-soft)',
                marginTop: 4,
                lineHeight: 1.5,
              }}
            >
              {entry.item.body.split('\n')[0]}
            </div>
          )}
        </div>
      </div>
    );
  }
  if (entry.type === 'discarded') {
    return (
      <div style={{ opacity: 0.6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.x size={11} stroke="var(--v-faint)" />
          <span
            style={{
              fontFamily: 'var(--ff-display)',
              fontSize: 9,
              letterSpacing: '.14em',
              color: 'var(--v-faint)',
              fontWeight: 600,
            }}
          >
            LET GO
          </span>
        </div>
        <div
          style={{
            fontSize: 14,
            textDecoration: 'line-through',
            color: 'var(--v-soft)',
            marginTop: 2,
          }}
        >
          {entry.item.title}
        </div>
      </div>
    );
  }
  if (entry.type === 'fork') {
    const parent = getItemById(entry.parentId);
    return (
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            marginBottom: 8,
          }}
        >
          <Icons.grip size={12} stroke="var(--v-soft)" />
          <span
            className="km-mono-sm"
            style={{ color: 'var(--v-soft)', letterSpacing: '.08em' }}
          >
            FORKED
          </span>
          {parent && (
            <span
              style={{ fontSize: 13, fontWeight: 600 }}
            >
              from "{parent.title}"
            </span>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            paddingLeft: 14,
            borderLeft: '2px solid var(--v-line)',
          }}
        >
          {entry.branches.map((b) => (
            <div
              key={b.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '4px 0',
              }}
            >
              <KindIcon kind={b.kind} size={12} muted />
              <span
                style={{
                  flex: 1,
                  fontSize: 13.5,
                  textDecoration:
                    b.state === 'dismissed' ? 'line-through' : 'none',
                  color:
                    b.state === 'dismissed'
                      ? 'var(--v-faint)'
                      : 'var(--v-ink)',
                }}
              >
                {b.title}
              </span>
              <Mono dim>{b.kind === 'crystallization' ? 'crystal' : b.state}</Mono>
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (entry.type === 'cluster') {
    return (
      <div>
        <Mono dim>
          gathered {entry.items.length} {entry.kind} items here
        </Mono>
        <div
          style={{
            marginTop: 6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 4,
          }}
        >
          {entry.items.slice(0, 12).map((it) => (
            <span
              key={it.id}
              title={it.title}
              style={{
                width: 11,
                height: 11,
                borderRadius: '50%',
                background: 'var(--v-line2)',
                display: 'inline-block',
              }}
            />
          ))}
          {entry.items.length > 12 && (
            <Mono dim>+{entry.items.length - 12}</Mono>
          )}
        </div>
      </div>
    );
  }
  if (entry.type === 'chat') {
    return (
      <div>
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}
        >
          <Icons.chat size={12} stroke="var(--v-ember-dk)" />
          <span
            className="km-mono-sm"
            style={{ color: 'var(--v-ember-dk)', letterSpacing: '.08em' }}
          >
            CONVERSATION
          </span>
        </div>
        <div style={{ fontSize: 13.5, fontStyle: 'italic' }}>
          {entry.chat.tagline}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <KindIcon kind={entry.item.kind} size={12} muted />
        <Mono dim style={{ letterSpacing: '.08em' }}>
          {entry.item.kind.toUpperCase()}
        </Mono>
      </div>
      <div style={{ fontSize: 14, marginTop: 2 }}>{entry.item.title}</div>
    </div>
  );
};

export const TraceView = () => {
  useStoreVersion();
  const navigate = useNavigate();
  const { slug = '' } = useParams<{ slug?: string }>();
  const project = getProjectBySlug(slug);
  const [filter, setFilter] = useState<Filter>('all');

  if (!project) return <ThreadNotFound slug={slug} />;
  const trace = getProjectTrace(project.id);
  const visible = trace.filter((e) => passesFilter(e, filter));
  const counts = {
    crystal: trace.filter((e) => e.type === 'crystal').length,
    discarded: trace.filter((e) => e.type === 'discarded').length,
    chat: trace.filter((e) => e.type === 'chat').length,
  };

  return (
    <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar projectChip={<ProjectTag slug={project.slug} />} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail activeProjectSlug={project.slug} />
        <main
          className="km-scroll"
          style={{ flex: 1, overflow: 'auto', padding: '22px 32px 40px' }}
        >
          {/* Back link */}
          <button
            onClick={() => navigate(`/project/${project.slug}`)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 6px',
              border: 0,
              background: 'transparent',
              color: 'var(--v-soft)',
              cursor: 'pointer',
              fontFamily: 'var(--ff-mono)',
              fontSize: 11,
              marginBottom: 12,
            }}
          >
            <Icons.arrowR
              size={11}
              stroke="var(--v-soft)"
              style={{ transform: 'rotate(180deg)' }}
            />
            {project.name}
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 24,
              marginBottom: 16,
            }}
          >
            <div>
              <div
                className="vd"
                style={{
                  fontFamily: 'var(--ff-display)',
                  fontSize: 30,
                  fontWeight: 600,
                  lineHeight: 1.1,
                }}
              >
                Go back through your thinking
              </div>
              <Mono dim style={{ marginTop: 4 }}>
                How this thread evolved — newest first. Crystals are
                milestones; let-go forks stay visible so the why isn't lost.
              </Mono>
            </div>
            <div style={{ textAlign: 'right' }}>
              <Mono dim>{trace.length} entries</Mono>
              <div
                style={{
                  display: 'flex',
                  gap: 12,
                  marginTop: 6,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: 'var(--v-blaze)',
                    }}
                  />
                  <Mono dim>{counts.crystal} crystals</Mono>
                </span>
                <span
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  <span
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: '50%',
                      background: 'var(--v-faint)',
                    }}
                  />
                  <Mono dim>{counts.discarded} let-go</Mono>
                </span>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 22,
              padding: '10px 0',
              borderBottom: '1px solid var(--v-line)',
            }}
          >
            {FILTERS.map((f) => (
              <SegBtn
                key={f.value}
                label={f.label}
                active={filter === f.value}
                onClick={() => setFilter(f.value)}
              />
            ))}
            <span style={{ flex: 1 }} />
            <AskClaude
              prompt={`Using the Steep MCP tools, review the thinking trace for project "${project.slug}" and summarize how it evolved — crystals as milestones, and why things were let go.`}
            />
          </div>

          {visible.length === 0 ? (
            <Mono dim>nothing to show for this filter</Mono>
          ) : (
            <div style={{ maxWidth: 840 }}>
              {visible.map((entry, i, arr) => (
                <div
                  key={`${entry.type}:${i}:${entry.occurredAt.getTime()}`}
                  style={{ display: 'flex', gap: 14 }}
                >
                  <div
                    style={{
                      width: 80,
                      flex: '0 0 80px',
                      textAlign: 'right',
                      paddingTop: 2,
                    }}
                  >
                    <Mono dim>{formatRelative(entry.occurredAt)}</Mono>
                  </div>
                  <Spine type={entry.type} last={i === arr.length - 1} />
                  <div style={{ flex: 1, paddingBottom: 20 }}>
                    <EntryBody entry={entry} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default TraceView;
