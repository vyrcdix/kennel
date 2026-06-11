import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { SectionHead } from '../components/SectionHead';
import { CrystalCard } from '../components/CrystalCard';
import { Wave } from '../components/Wave';
import {
  getActivitySince,
  getAgingItems,
  getCrystallizedThisWeek,
  getDocById,
  getInboxRollup,
  getItemById,
  getProjectById,
  getSettings,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { daysAgo, formatDate, formatRelative } from '../data/time';
import { openItem } from '../lib/modals';
import { useSkin } from '../lib/skin';
import type { ActivityEntry, Item } from '../data/types';

const DAY = 86_400_000;
const PERIOD_DAYS = 7;

const ItemRow = ({ item }: { item: Item }) => {
  const navigate = useNavigate();
  const project = getProjectById(item.projectId);
  return (
    <div
      className="km-row"
      onClick={() => openItem(item, navigate)}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 110px 1fr 110px',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        borderBottom: '1px solid var(--line)',
        cursor: 'pointer',
      }}
    >
      <KindIcon kind={item.kind} />
      {project && <ProjectTag slug={project.slug} />}
      <span
        className="km-body"
        style={{
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          fontSize: 13,
        }}
      >
        {item.title}
      </span>
      <Mono dim>{formatRelative(item.updatedAt)}</Mono>
    </div>
  );
};

const ActivityRow = ({ entry }: { entry: ActivityEntry }) => {
  const navigate = useNavigate();
  // Open the entity if it still exists (items via the shared openItem
  // policy, docs in the editor); fall back to the activity's thread.
  const item =
    entry.entityType === 'item' && entry.entityId
      ? getItemById(entry.entityId)
      : undefined;
  const doc =
    entry.entityType === 'doc' && entry.entityId
      ? getDocById(entry.entityId)
      : undefined;
  const project = entry.projectId ? getProjectById(entry.projectId) : undefined;
  const onOpen = item
    ? () => openItem(item, navigate)
    : doc
      ? () => navigate(`/doc/${doc.id}`)
      : project
        ? () => navigate(`/project/${project.slug}`)
        : undefined;
  return (
  <div
    className={onOpen ? 'km-row' : undefined}
    onClick={onOpen}
    style={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr 100px',
      alignItems: 'center',
      gap: 10,
      padding: '6px 14px',
      borderBottom: '1px solid var(--line)',
      cursor: onOpen ? 'pointer' : 'default',
    }}
  >
    <Mono>{entry.verb}</Mono>
    <span className="km-body" style={{ fontSize: 13 }}>
      {entry.target}
      {entry.payload ? (
        <Mono dim style={{ marginLeft: 8 }}>
          {entry.payload}
        </Mono>
      ) : null}
    </span>
    <Mono dim>{formatRelative(entry.occurredAt)}</Mono>
  </div>
  );
};

export const WeeklyReview = () => {
  useStoreVersion();
  const navigate = useNavigate();
  const [skin] = useSkin();
  // Stabilise `since` across renders so the activity memo actually caches.
  const since = useMemo(() => daysAgo(PERIOD_DAYS), []);
  const now = useMemo(() => new Date(), []);
  const activity = useMemo(() => getActivitySince(since), [since]);
  const settings = getSettings();
  const aging = getAgingItems(settings.agingThresholdDays);

  // Free-string verbs from server, with v0.1 aliases folded in.
  const buckets = useMemo(() => {
    const b = {
      captured: [] as ActivityEntry[],
      pickedUp: [] as ActivityEntry[],
      setAside: [] as ActivityEntry[],
      letGo: [] as ActivityEntry[],
      converted: [] as ActivityEntry[],
      skillChanges: [] as ActivityEntry[],
    };
    for (const e of activity) {
      switch (e.verb) {
        case 'CAPTURED': b.captured.push(e); break;
        case 'PICKED UP':
        case 'ACTIVATED': b.pickedUp.push(e); break;
        case 'SET ASIDE':
        case 'PARKED': b.setAside.push(e); break;
        case 'LET GO':
        case 'FILED':
        case 'ARCHIVED': b.letGo.push(e); break;
        case 'CONVERTED': b.converted.push(e); break;
        case 'PROPOSED':
        case 'ACCEPTED':
        case 'REJECTED': b.skillChanges.push(e); break;
      }
    }
    return b;
  }, [activity]);
  const crystallizedItems = useMemo(() => getCrystallizedThisWeek(), []);

  const summary = [
    { label: 'captured', n: buckets.captured.length },
    { label: 'picked up', n: buckets.pickedUp.length },
    { label: 'crystallized', n: crystallizedItems.length },
    { label: 'set aside', n: buckets.setAside.length },
    { label: 'let go / filed', n: buckets.letGo.length },
    { label: 'converted', n: buckets.converted.length },
    { label: 'skill changes', n: buckets.skillChanges.length },
  ];

  if (skin === 'life') {
    const waiting = getInboxRollup().reduce((n, r) => n + r.count, 0);
    return (
      <WeeklyReviewLife
        since={since}
        now={now}
        captured={buckets.captured.length}
        kept={crystallizedItems.length}
        letGo={buckets.letGo.length}
        sorted={buckets.pickedUp.length + buckets.setAside.length + buckets.converted.length}
        waiting={waiting}
        crystallized={crystallizedItems}
        buckets={buckets}
        aging={aging}
      />
    );
  }

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" />
        <main
          className="km-scroll"
          style={{ flex: 1, overflow: 'auto', padding: '22px 32px 32px' }}
        >
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
            <div className="km-display-lg">Weekly review</div>
            <Mono dim>
              {formatDate(since)} → {formatDate(now)} · 7 days
            </Mono>
            <span style={{ flex: 1 }} />
            <button
              className="km-btn km-btn-ghost"
              onClick={() => navigate('/')}
              title="Back to dashboard"
            >
              <Icons.arrowR size={12} style={{ transform: 'rotate(180deg)' }} /> Back
            </button>
          </div>
          <div
            className="km-body"
            style={{ color: 'var(--fg-muted)', maxWidth: 720, marginBottom: 22, lineHeight: 1.55 }}
          >
            What moved over the last week, and what's still cooling. Read top-to-bottom on
            a Friday afternoon; the goal is to recognise the shape of the week, not to act
            on every line.
          </div>

          {/* Summary strip */}
          <div
            className="km-card"
            style={{
              padding: '12px 16px',
              display: 'flex',
              gap: 24,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {summary.map((s) => (
              <div
                key={s.label}
                style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 88 }}
              >
                <span className="km-display-lg" style={{ fontSize: 28, lineHeight: 1 }}>
                  {s.n}
                </span>
                <Mono dim>{s.label}</Mono>
              </div>
            ))}
          </div>

          {/* Crystallized */}
          <section
            className="km-card"
            style={{ padding: 0, marginBottom: 18, borderColor: 'color-mix(in srgb, var(--fam-guide) 35%, transparent)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px' }}>
              <span style={{ color: 'var(--moss)', marginRight: 8 }}>
                <Icons.star size={13} />
              </span>
              <span className="km-display-sm" style={{ color: 'var(--moss)' }}>
                CRYSTALLIZED
              </span>
              <span style={{ flex: 1 }} />
              <Mono dim>
                {crystallizedItems.length} durable outcome
                {crystallizedItems.length === 1 ? '' : 's'}
              </Mono>
            </div>
            <div className="km-rule" />
            {crystallizedItems.length === 0 ? (
              <div style={{ padding: '14px 16px' }}>
                <Mono dim>nothing crystallized this week</Mono>
              </div>
            ) : (
              crystallizedItems.map((item) => <ItemRow key={item.id} item={item} />)
            )}
          </section>

          {/* Activity by verb */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <ActivityGroup title="Picked up" entries={buckets.pickedUp} />
            <ActivityGroup title="Let go / filed" entries={buckets.letGo} />
            <ActivityGroup title="Set aside" entries={buckets.setAside} />
            <ActivityGroup title="Captured" entries={buckets.captured} />
            {buckets.skillChanges.length > 0 && (
              <ActivityGroup title="Skill changes" entries={buckets.skillChanges} />
            )}
            {buckets.converted.length > 0 && (
              <ActivityGroup title="Converted" entries={buckets.converted} />
            )}
          </div>

          {/* Still aging */}
          <section className="km-card" style={{ padding: 0, marginTop: 18 }}>
            <SectionHead
              title="Still aging"
              right={
                <>
                  <Mono>
                    {aging.length} item{aging.length === 1 ? '' : 's'} untouched ≥{' '}
                    {settings.agingThresholdDays}d
                  </Mono>
                  <button
                    className="km-btn km-btn-ghost"
                    onClick={() => navigate('/aging')}
                    style={{ padding: '4px 6px' }}
                  >
                    Open aging board <Icons.arrowR size={12} />
                  </button>
                </>
              }
            />
            <div className="km-rule" />
            {aging.length === 0 ? (
              <div style={{ padding: '14px 16px' }}>
                <Mono dim>nothing's gone cold</Mono>
              </div>
            ) : (
              aging.slice(0, 5).map((item) => {
                const last = item.lastTouchedAt ?? item.updatedAt;
                const days = Math.floor((Date.now() - last.getTime()) / DAY);
                const project = getProjectById(item.projectId);
                return (
                  <div
                    key={item.id}
                    className="km-row"
                    onClick={() => openItem(item, navigate)}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '14px 110px 1fr 90px',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 14px',
                      borderBottom: '1px solid var(--line)',
                      opacity: 0.82,
                      cursor: 'pointer',
                    }}
                  >
                    <KindIcon kind={item.kind} />
                    {project && <ProjectTag slug={project.slug} />}
                    <span
                      className="km-body"
                      style={{
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontSize: 13,
                      }}
                    >
                      {item.title}
                    </span>
                    <Mono>{days}d cold</Mono>
                  </div>
                );
              })
            )}
          </section>
        </main>
      </div>
    </div>
  );
};

const ActivityGroup = ({
  title,
  entries,
}: {
  title: string;
  entries: ActivityEntry[];
}) => (
  <section className="km-card" style={{ padding: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px 14px' }}>
      <Label>{title}</Label>
      <span style={{ flex: 1 }} />
      <Mono dim>{entries.length}</Mono>
    </div>
    <div className="km-rule" />
    {entries.length === 0 ? (
      <div style={{ padding: '14px 16px' }}>
        <Mono dim>nothing</Mono>
      </div>
    ) : (
      entries.slice(0, 6).map((e) => <ActivityRow key={e.id} entry={e} />)
    )}
  </section>
);

// ──────────────────────────── Life ─────────────────────────────────────
type LifeBuckets = {
  captured: ActivityEntry[];
  pickedUp: ActivityEntry[];
  setAside: ActivityEntry[];
  letGo: ActivityEntry[];
  converted: ActivityEntry[];
  skillChanges: ActivityEntry[];
};

const WeeklyReviewLife = ({
  since,
  now,
  captured,
  kept,
  letGo,
  sorted,
  waiting,
  crystallized,
  buckets,
  aging,
}: {
  since: Date;
  now: Date;
  captured: number;
  kept: number;
  letGo: number;
  sorted: number;
  waiting: number;
  crystallized: Item[];
  buckets: LifeBuckets;
  aging: Item[];
}) => {
  const navigate = useNavigate();
  const summary: { label: string; n: number; sub: string; amber?: boolean }[] = [
    { label: 'captured', n: captured, sub: 'washed in' },
    { label: 'kept', n: kept, sub: 'crystallized', amber: true },
    { label: 'let go', n: letGo, sub: 'released' },
    { label: 'sorted', n: sorted, sub: 'off the bench' },
    { label: 'waiting', n: waiting, sub: 'on the bench' },
  ];
  const did: { verb: string; n: number; detail: string }[] = [
    { verb: 'Picked up', n: buckets.pickedUp.length, detail: 'brought into focus' },
    { verb: 'Set aside', n: buckets.setAside.length, detail: 'onto the shelf' },
    { verb: 'Let go', n: buckets.letGo.length, detail: 'let the tide take them' },
    { verb: 'Captured', n: buckets.captured.length, detail: 'washed onto the bench' },
    { verb: 'Converted', n: buckets.converted.length, detail: 'changed kind' },
  ].filter((d) => d.n > 0);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 40px' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <Mono dim>{formatDate(since)} → {formatDate(now)}</Mono>
            <div className="km-display-lg" style={{ fontSize: 32, margin: '4px 0 6px' }}>
              The shape of your week
            </div>
            <div className="km-body" style={{ fontSize: 16, color: 'var(--fg-muted)' }}>
              Not a report card. Just what moved, and what you chose to keep.
            </div>
            <div style={{ margin: '10px 0 0' }}>
              <Wave width={200} opacity={0.5} />
            </div>

            {/* Summary strip */}
            <div className="km-card" style={{ display: 'flex', padding: 4, marginTop: 22 }}>
              {summary.map((s, i) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: '16px 18px',
                    textAlign: 'center',
                    borderLeft: i ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div
                    className="km-display-lg"
                    style={{ fontSize: 30, lineHeight: 1, color: s.amber ? 'var(--sacred-ink)' : 'var(--fg)' }}
                  >
                    {s.n}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 4 }}>{s.label}</div>
                  <Mono dim>{s.sub}</Mono>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 22, alignItems: 'start', marginTop: 22 }}>
              {/* What you kept */}
              <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
                  <Icons.gem size={16} stroke="var(--sacred-ink)" />
                  <div className="km-display-md" style={{ fontSize: 18 }}>What you kept</div>
                </div>
                <div className="km-body-sm" style={{ color: 'var(--fg-muted)', marginBottom: 16 }}>
                  {kept === 0
                    ? 'Nothing settled out this week — that’s allowed.'
                    : `${kept} truth${kept === 1 ? '' : 's'} settled out this week.`}
                </div>
                {crystallized.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {crystallized.map((c) => (
                      <CrystalCard key={c.id} item={c} />
                    ))}
                  </div>
                )}
              </section>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* What you did */}
                <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                  <div className="km-display-md" style={{ fontSize: 18, marginBottom: 14 }}>What you did</div>
                  {did.length === 0 ? (
                    <Mono dim>a quiet week on the bench</Mono>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                      {did.map((d) => (
                        <div key={d.verb} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                          <span
                            className="km-display-md"
                            style={{ fontSize: 18, minWidth: 26, color: 'var(--action-ink)' }}
                          >
                            {d.n}
                          </span>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 14, fontWeight: 600 }}>{d.verb}</span>
                            <div className="km-body-sm" style={{ color: 'var(--fg-muted)', marginTop: 1 }}>{d.detail}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* Still deepening */}
                <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)' }}>
                  <div className="km-display-md" style={{ fontSize: 18, marginBottom: 4 }}>Still deepening</div>
                  <Mono dim>no nudge — just so you know</Mono>
                  {aging.length === 0 ? (
                    <div style={{ marginTop: 12 }}>
                      <Mono dim>Nothing's gone cold.</Mono>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
                      {aging.slice(0, 5).map((item) => {
                        const last = item.lastTouchedAt ?? item.updatedAt;
                        const days = Math.floor((Date.now() - last.getTime()) / DAY);
                        return (
                          <div
                            key={item.id}
                            className="km-row"
                            onClick={() => openItem(item, navigate)}
                            style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', borderRadius: 'var(--r-ctrl)', padding: '4px 6px' }}
                          >
                            <span className="km-dot km-dot-dust" style={{ marginTop: 6 }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div className="km-body-sm" style={{ lineHeight: 1.4 }}>{item.title}</div>
                              <Mono dim>{days}d on the shelf</Mono>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default WeeklyReview;
