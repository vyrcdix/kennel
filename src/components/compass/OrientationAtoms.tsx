// Orientation-page atoms — the sections of a bearing's page: the horizon strip
// (room-remaining, never a countdown), the wake hero (only kept days), the
// "what's built toward this" roll-up, today's small promise, and the
// "still about?" block. Read-only sections read from the P2 selectors; the
// interactive ones take callbacks the page (P4) wires to the bearing actions.
// See docs/compass-build-plan.md P3.
import { Icons } from '../Icon';
import { Mono } from '../Mono';
import { KindIcon } from '../KindIcon';
import { useSkin } from '../../lib/skin';
import { copy } from '../../lib/copy';
import { isCadence, CADENCE_LABEL } from '../../lib/cadence';
import { getHorizon, getWake, getBearingBuilt } from '../../lib/compass';
import { formatRelative } from '../../data/time';
import type { Item } from '../../data/types';

const SACRED_BTN = {
  background: 'var(--sacred)',
  borderColor: 'var(--sacred)',
  color: '#2A1B08',
  fontWeight: 600,
} as const;

/** The horizon — optional finish line, framed as room remaining. */
export const BearingHorizon = ({ bearing }: { bearing: Item }) => {
  useSkin();
  const h = getHorizon(bearing);
  if (!h) return null;
  const pct = (h.day / h.total) * 100;
  return (
    <div style={{ margin: '20px 0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
        <Icons.horizon size={14} style={{ color: 'var(--ink-faint)' }} />
        <span className="km-mono-sm" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
          the horizon
        </span>
      </div>
      <div className="cmp-horizon">
        <div className="cmp-horizon-done" style={{ width: `${pct}%` }} />
        <span className="cmp-horizon-now" style={{ left: `${pct}%` }}>
          <Icons.star4f size={11} style={{ color: 'var(--sacred)' }} />
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
        <span className="km-mono-sm" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
          day {h.day}
        </span>
        <span style={{ flex: 1 }} />
        <span className="km-display-sm" style={{ fontSize: 13.5, fontWeight: 700, textTransform: 'none', letterSpacing: 0 }}>
          {copy('compass.ahead', { n: h.ahead })}
        </span>
      </div>
    </div>
  );
};

/** The wake — the hero: distance covered, only kept days render, gaps absent. */
export const BearingWake = ({ bearing }: { bearing: Item }) => {
  useSkin();
  const wake = getWake(bearing.id);
  const marks = wake.marks.slice(-48); // most recent, for visual density
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 11 }}>
        <span className="km-display-md" style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', flex: '0 0 auto' }}>
          {wake.kept} kept
        </span>
        <Mono dim style={{ fontSize: 11 }}>
          across {wake.days} days · {copy('compass.wake')} behind you
        </Mono>
      </div>
      <div className="cmp-wake">
        {marks.map((d, i) => (
          <span
            key={d.getTime() + '-' + i}
            className="cmp-wakemark"
            style={{
              left: `${(marks.length > 1 ? i / (marks.length - 1) : 0) * 86 + 4}%`,
              opacity: 0.3 + (marks.length > 1 ? i / (marks.length - 1) : 1) * 0.68,
              transform: `translateY(${Math.sin(i * 0.7) * 5}px)`,
            }}
          />
        ))}
        <span className="cmp-wakestar">
          <Icons.star4 size={18} style={{ color: 'var(--sacred)' }} />
        </span>
      </div>
      <div style={{ display: 'flex', marginTop: 8 }}>
        <Mono dim style={{ fontSize: 10.5 }}>where you set out</Mono>
        <span style={{ flex: 1 }} />
        <Mono dim style={{ fontSize: 10.5 }}>here · now → the bearing</Mono>
      </div>
    </div>
  );
};

/** "What's built toward this" — the roll-up over the attach relation. */
export const BearingBuilt = ({ bearing }: { bearing: Item }) => {
  useSkin();
  const built = getBearingBuilt(bearing.id);
  const cadences = built.filter(isCadence);
  const crystal = built.find((it) => it.kind === 'crystallization' || it.state === 'crystallized');
  const focus = built.filter(
    (it) => !isCadence(it) && it.id !== crystal?.id,
  );
  if (built.length === 0) return null;
  return (
    <div style={{ marginTop: 24 }}>
      <div className="cmp-eyebrow" style={{ marginBottom: 11 }}>
        <Icons.star4 size={11} /> What’s built toward this
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {focus.map((it) => (
          <div key={it.id} className="cmp-built">
            <span style={{ color: 'var(--ink-muted)', display: 'flex' }}>
              <KindIcon kind={it.kind} size={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{it.title}</span>
            <Mono dim style={{ fontSize: 10.5 }}>in focus</Mono>
          </div>
        ))}
        {cadences.map((c) => (
          <div key={c.id} className="cmp-built">
            <span style={{ color: 'var(--ink-muted)', display: 'flex' }}>
              <Icons.repeat size={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{c.title}</span>
            <Mono dim style={{ fontSize: 10.5 }}>
              {c.cadence ? CADENCE_LABEL[c.cadence] : 'rhythm'} · kept {c.keptCount ?? 0}
            </Mono>
          </div>
        ))}
        {crystal && (
          <div className="cmp-built">
            <span style={{ color: 'var(--sacred-ink)', display: 'flex' }}>
              <Icons.gem size={15} />
            </span>
            <span style={{ flex: 1, fontSize: 13.5 }}>{crystal.title}</span>
            <Mono dim style={{ fontSize: 10.5 }}>{crystal.ctype ?? 'crystal'}</Mono>
          </div>
        )}
      </div>
    </div>
  );
};

/** Today's small promise — one-click keep; kept feels good, skip leaves no
 *  trace. Presentational: `kept` + `onKeep` are owned by the page. */
export const BearingPromise = ({
  promise,
  kept,
  onKeep,
}: {
  promise?: Item;
  kept: boolean;
  onKeep: () => void;
}) => {
  if (!promise) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div className="cmp-eyebrow" style={{ marginBottom: 10 }}>
        <Icons.star4 size={11} /> Today’s small promise
      </div>
      <div className={'cmp-promise' + (kept ? ' kept' : '')}>
        <button
          className={'cmp-keep' + (kept ? ' on' : '')}
          aria-label="keep the promise"
          onClick={onKeep}
        >
          <Icons.tick size={17} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: kept ? 'var(--ink-muted)' : 'var(--ink)' }}>
            {promise.title}
          </p>
          <Mono dim style={{ fontSize: 11.5 }}>
            {kept
              ? 'kept today · a missed day leaves no trace'
              : 'so small it’s hard to say no — one click, never required'}
          </Mono>
        </div>
        <Mono dim style={{ fontSize: 10.5 }}>a tiny rhythm</Mono>
      </div>
    </div>
  );
};

/** The emotional peak — "still what you're about?" (Still true / Reword / Let
 *  it set). Callbacks wired by the page to resurface / reword / let-go. */
export const BearingStillAbout = ({
  bearing,
  onStillTrue,
  onReword,
  onLetGo,
}: {
  bearing: Item;
  onStillTrue: () => void;
  onReword: () => void;
  onLetGo: () => void;
}) => {
  useSkin();
  const set = formatRelative(bearing.doneAt ?? bearing.createdAt);
  return (
    <div className="cmp-still" style={{ marginTop: 22 }}>
      <Icons.compass size={16} style={{ color: 'var(--sacred-ink)' }} />
      <div style={{ flex: 1, minWidth: 140 }}>
        <p style={{ margin: 0, fontSize: 13.5 }}>
          You set this bearing <b>{set}</b>. {copy('compass.still')}
        </p>
      </div>
      <button className="km-btn" style={SACRED_BTN} onClick={onStillTrue}>
        {copy('compass.still.true')}
      </button>
      <button className="km-btn km-btn-ghost" onClick={onReword}>
        {copy('compass.still.reword')}
      </button>
      <button className="km-btn km-btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={onLetGo}>
        {copy('compass.still.letgo')}
      </button>
    </div>
  );
};
