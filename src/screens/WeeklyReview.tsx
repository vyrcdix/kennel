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
import {
  getActivitySince,
  getAgingItems,
  getCrystallizedThisWeek,
  getProjectById,
  getSettings,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import { daysAgo, formatRelative } from '../data/time';
import type { ActivityEntry, Item } from '../data/types';

const DAY = 86_400_000;
const PERIOD_DAYS = 7;

const ItemRow = ({ item }: { item: Item }) => {
  const navigate = useNavigate();
  const project = getProjectById(item.projectId);
  return (
    <div
      onClick={() => item.docId && navigate(`/doc/${item.docId}`)}
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 110px 1fr 110px',
        alignItems: 'center',
        gap: 10,
        padding: '7px 14px',
        borderBottom: '1px solid var(--line)',
        cursor: item.docId ? 'pointer' : 'default',
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

const ActivityRow = ({ entry }: { entry: ActivityEntry }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '90px 1fr 100px',
      alignItems: 'center',
      gap: 10,
      padding: '6px 14px',
      borderBottom: '1px solid var(--line)',
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

const formatDate = (d: Date) => {
  const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  return `${month} ${d.getDate()}`;
};

export const WeeklyReview = () => {
  useStoreVersion();
  const navigate = useNavigate();
  const since = daysAgo(PERIOD_DAYS);
  const now = new Date();
  const activity = useMemo(() => getActivitySince(since), [since]);
  const settings = getSettings();
  const aging = getAgingItems(settings.agingThresholdDays);

  // Filter by verb buckets. Free-string verbs, so include the v0.1 ARCHIVED
  // alias under "let go / filed" too.
  const verbIs = (e: ActivityEntry, ...verbs: string[]) =>
    verbs.includes(e.verb);

  const captured = activity.filter((e) => verbIs(e, 'CAPTURED'));
  const pickedUp = activity.filter((e) => verbIs(e, 'PICKED UP', 'ACTIVATED'));
  const setAside = activity.filter((e) => verbIs(e, 'SET ASIDE', 'PARKED'));
  const letGo = activity.filter((e) => verbIs(e, 'LET GO', 'FILED', 'ARCHIVED'));
  const converted = activity.filter((e) => verbIs(e, 'CONVERTED'));
  const crystallizedItems = useMemo(() => getCrystallizedThisWeek(), []);

  const summary = [
    { label: 'captured', n: captured.length },
    { label: 'picked up', n: pickedUp.length },
    { label: 'crystallized', n: crystallizedItems.length },
    { label: 'set aside', n: setAside.length },
    { label: 'let go / filed', n: letGo.length },
    { label: 'converted', n: converted.length },
  ];

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
            style={{ padding: 0, marginBottom: 18, borderColor: 'rgba(92,122,62,.35)' }}
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
            <ActivityGroup title="Picked up" entries={pickedUp} />
            <ActivityGroup title="Let go / filed" entries={letGo} />
            <ActivityGroup title="Set aside" entries={setAside} />
            <ActivityGroup title="Captured" entries={captured} />
            {converted.length > 0 && (
              <ActivityGroup title="Converted" entries={converted} />
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
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '14px 110px 1fr 90px',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 14px',
                      borderBottom: '1px solid var(--line)',
                      opacity: 0.82,
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

export default WeeklyReview;
