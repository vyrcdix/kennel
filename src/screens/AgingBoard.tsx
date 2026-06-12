import { useMemo, useState } from 'react';
import { AgingRow } from '../components/AgingRow';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { ThermalPanel } from '../components/ThermalPanel';
import { Wave } from '../components/Wave';
import { CooledCadences } from '../components/CooledCadences';
import {
  crystallizeItem,
  fileItem,
  touchItem,
  transitionItem,
} from '../data/actions';
import {
  getAgingItems,
  getProjectById,
  getSettings,
} from '../data/selectors';
import { temperatureForDate } from '../lib/temperature';
import { useStoreVersion } from '../data/store';
import { copy } from '../lib/copy';
import { removeItem, type RemovalAction } from '../lib/permanence';
import { useSkin } from '../lib/skin';
import { useKeyedListNav } from '../lib/useKeyedListNav';
import type { Item, Project } from '../data/types';

const DAY = 86400_000;

export const AgingBoard = () => {
  const v = useStoreVersion();
  const [skin] = useSkin();
  const settings = getSettings();
  const [threshold, setThreshold] = useState(settings.agingThresholdDays);
  const aging = useMemo(() => getAgingItems(threshold), [threshold, v]);

  return skin === 'life' ? (
    <AgingLife aging={aging} threshold={threshold} setThreshold={setThreshold} />
  ) : (
    <AgingWorkshop aging={aging} threshold={threshold} setThreshold={setThreshold} />
  );
};

// ─────────────────────────── Workshop ──────────────────────────────────
const AgingWorkshop = ({
  aging,
  threshold,
  setThreshold,
}: {
  aging: Item[];
  threshold: number;
  setThreshold: (n: number) => void;
}) => {
  const [selectedId] = useKeyedListNav(aging, {
    u: (id) => void touchItem(id),
    c: (id) => void crystallizeItem(id, { promoteKind: true }),
    f: (id) => void fileItem(id),
  });

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '22px 32px 32px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginBottom: 6 }}>
            <div className="km-display-lg">Aging</div>
            <Mono dim>
              across all threads · untouched ≥ {threshold}d · {aging.length} items · pick up / crystallize / file
            </Mono>
            <span style={{ flex: 1 }} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mono dim>threshold</Mono>
              <input
                type="number"
                min={7}
                max={180}
                value={threshold}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 7 && n <= 180) setThreshold(n);
                }}
                style={{
                  width: 60,
                  padding: '3px 6px',
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 12.5,
                  background: 'var(--surface-1)',
                  color: 'var(--fg)',
                  border: '1px solid var(--line)',
                  borderRadius: 3,
                }}
              />
              <Mono dim>days</Mono>
            </label>
          </div>
          <div
            className="km-body"
            style={{ color: 'var(--fg-muted)', maxWidth: 720, marginBottom: 22, lineHeight: 1.55 }}
          >
            Items that haven't been touched in a while. Most should be let go; some are worth picking back up.
            Each decision is one keystroke.
          </div>

          {/* Cooled cadences — above the shelf (both skins) */}
          <CooledCadences />

          {aging.length === 0 ? (
            <div
              style={{
                padding: 32,
                background: 'var(--surface-1)',
                border: '1px solid var(--line)',
                borderRadius: 3,
              }}
            >
              <div className="km-display-md" style={{ marginBottom: 4 }}>Nothing's gone cold.</div>
              <Mono dim>everything's been touched within the last {threshold} days</Mono>
            </div>
          ) : (
            <ThermalPanel temp="aging">
              {aging.map((item) => (
                <AgingRow
                  key={item.id}
                  item={item}
                  project={getProjectById(item.projectId)}
                  selected={item.id === selectedId}
                  onPickUp={() => touchItem(item.id)}
                  onCrystallize={() => crystallizeItem(item.id, { promoteKind: true })}
                  onFile={() => fileItem(item.id)}
                />
              ))}
            </ThermalPanel>
          )}

          <div
            style={{
              marginTop: 18,
              padding: '10px 14px',
              background: 'var(--surface-1)',
              borderRadius: 3,
              border: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <Mono dim>shortcuts</Mono>
            <span className="km-kbd">J</span>
            <span className="km-kbd">K</span>
            <span className="km-body-sm">navigate</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">U</span>
            <span className="km-body-sm">pick up</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">C</span>
            <span className="km-body-sm">crystallize</span>
            <span style={{ margin: '0 6px', color: 'var(--fg-faint)' }}>·</span>
            <span className="km-kbd">F</span>
            <span className="km-body-sm">file</span>
            <span style={{ flex: 1 }} />
            <Icons.filter size={11} />
          </div>
        </main>
      </div>
    </div>
  );
};

// ──────────────────────────── Life (B2) ────────────────────────────────
const rowEl = (id: string) =>
  typeof document !== 'undefined'
    ? document.querySelector<HTMLElement>(`[data-row-id="${id}"]`)
    : null;

const AgingLife = ({
  aging,
  threshold,
  setThreshold,
}: {
  aging: Item[];
  threshold: number;
  setThreshold: (n: number) => void;
}) => {
  const settings = getSettings();

  // Aging items are active items gone quiet — restore to 'active' on Undo.
  const act = (id: string, action: RemovalAction) => {
    const el = rowEl(id);
    if (action === 'pickBackUp') {
      // "Bring back up" = touch (resets the timer); no clean inverse → no Undo.
      void removeItem({ action, el, mutate: () => touchItem(id) });
    } else if (action === 'crystallize') {
      void removeItem({
        action,
        el,
        mutate: () => crystallizeItem(id, { promoteKind: true }),
        undo: () => transitionItem(id, 'active'),
      });
    } else {
      void removeItem({
        action: 'file',
        el,
        mutate: () => fileItem(id),
        undo: () => transitionItem(id, 'active'),
      });
    }
  };

  const [selectedId, setSelectedId] = useKeyedListNav(aging, {
    u: (id) => act(id, 'pickBackUp'),
    c: (id) => act(id, 'crystallize'),
    f: (id) => act(id, 'file'),
  });

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 40px' }}>
          <div style={{ maxWidth: 780, margin: '0 auto' }}>
            <div style={{ marginBottom: 8, color: 'var(--fg-faint)' }}>
              <Icons.archive size={22} />
            </div>
            <div className="km-display-lg" style={{ fontSize: 32, marginBottom: 6 }}>
              {copy('aging.title')}
            </div>
            <div className="km-body" style={{ fontSize: 16, color: 'var(--fg-muted)', marginBottom: 6 }}>
              {copy('aging.subtitle')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Wave width={90} opacity={0.5} />
              <Mono dim>{copy('aging.lead')}</Mono>
            </div>

            {/* Threshold control — "show threads quiet for [ 21 ] days" */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 10px' }}>
              <Mono dim>{copy('aging.threshold')}</Mono>
              <input
                type="number"
                min={7}
                max={180}
                value={threshold}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (n >= 7 && n <= 180) setThreshold(n);
                }}
                style={{
                  width: 58,
                  padding: '4px 8px',
                  textAlign: 'center',
                  fontFamily: 'var(--ff-mono)',
                  fontSize: 13,
                  background: 'var(--sunk, var(--surface-2))',
                  color: 'var(--fg)',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--r-ctrl)',
                }}
              />
              <Mono dim>days</Mono>
              <span style={{ flex: 1 }} />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--fg-faint)', fontSize: 12 }}>
                <span className="km-kbd">J</span>
                <span className="km-kbd">K</span> walk · <span className="km-kbd">U</span> bring back up
              </span>
            </div>

            {/* Cooled cadences — above the shelf (both skins) */}
            <CooledCadences />

            {aging.length === 0 ? (
              <div className="km-card" style={{ padding: 32 }}>
                <div className="km-display-md" style={{ marginBottom: 4 }}>{copy('aging.empty.line')}</div>
                <Mono dim>{copy('aging.empty.sub')}</Mono>
              </div>
            ) : (
              <div className="km-card" style={{ padding: 8 }}>
                {aging.map((item) => (
                  <AgingLifeRow
                    key={item.id}
                    item={item}
                    project={getProjectById(item.projectId)}
                    selected={item.id === selectedId}
                    temp={temperatureForDate(item.lastTouchedAt ?? item.updatedAt, settings)}
                    onSelect={() => setSelectedId(item.id)}
                    onAct={(a) => act(item.id, a)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

const AgingLifeRow = ({
  item,
  project,
  selected,
  temp,
  onSelect,
  onAct,
}: {
  item: Item;
  project?: Project;
  selected: boolean;
  temp: ReturnType<typeof temperatureForDate>;
  onSelect: () => void;
  onAct: (action: RemovalAction) => void;
}) => {
  const last = item.lastTouchedAt ?? item.updatedAt;
  const days = Math.floor((Date.now() - last.getTime()) / DAY);
  // aging → "deepening"; dormant → "still" (B2 row language).
  const ageWord = temp === 'dormant' ? 'still' : 'deepening';
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <div
      data-row-id={item.id}
      className={`km-row ${selected ? 'sel' : ''}`}
      onClick={onSelect}
      style={{
        display: 'flex',
        gap: 14,
        alignItems: 'flex-start',
        padding: selected ? 16 : '15px 16px',
        cursor: 'pointer',
        background: selected ? 'var(--card-2)' : 'transparent',
        boxShadow: selected ? 'inset 3px 0 0 var(--action)' : 'none',
        borderRadius: 'var(--r-ctrl)',
        opacity: selected ? 1 : 0.9,
      }}
    >
      <span className="km-dot km-dot-dust" style={{ marginTop: 7 }} />
      <span style={{ color: 'var(--fg-faint)', display: 'flex', marginTop: 2 }}>
        <KindIcon kind={item.kind} size={16} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="km-body" style={{ fontSize: 15.5, lineHeight: 1.45 }}>{item.title}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, flexWrap: 'wrap' }}>
          {project && (
            <span onClick={stop}>
              <ProjectTag slug={project.slug} />
            </span>
          )}
          <Mono dim>
            {ageWord} · quiet {days}d
          </Mono>
        </div>
        {selected && (
          <div onClick={stop} style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="km-btn km-btn-ghost km-btn-soft" onClick={() => onAct('pickBackUp')} style={ACTBTN}>
              <Icons.arrowUp size={14} /> {copy('aging.verb.pickup')} <span className="km-kbd" style={{ marginLeft: 2 }}>U</span>
            </button>
            <button className="km-btn km-btn-ghost" onClick={() => onAct('crystallize')} style={{ ...ACTBTN, color: 'var(--sacred-ink)' }}>
              <Icons.gem size={14} /> {copy('aging.verb.crystallize')} <span className="km-kbd" style={{ marginLeft: 2 }}>C</span>
            </button>
            <button className="km-btn km-btn-ghost" onClick={() => onAct('file')} style={ACTBTN}>
              <Icons.archive size={14} /> {copy('aging.verb.file')} <span className="km-kbd" style={{ marginLeft: 2 }}>F</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const ACTBTN = { padding: '6px 11px', fontSize: 12.5 } as const;

export default AgingBoard;
