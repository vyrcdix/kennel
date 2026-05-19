import { useEffect, useMemo, useState } from 'react';
import { AgingRow } from '../components/AgingRow';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import {
  crystallizeItem,
  fileItem,
  touchItem,
} from '../data/actions';
import {
  getAgingItems,
  getProjectById,
  getSettings,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';

export const AgingBoard = () => {
  useStoreVersion();
  const settings = getSettings();
  const [threshold, setThreshold] = useState(settings.agingThresholdDays);
  const aging = useMemo(() => getAgingItems(threshold), [threshold]);
  const [selectedId, setSelectedId] = useState<string>(() => aging[0]?.id ?? '');

  useEffect(() => {
    if (!aging.some((i) => i.id === selectedId)) {
      setSelectedId(aging[0]?.id ?? '');
    }
  }, [aging, selectedId]);

  // Keyboard: J/K nav, U pick up, C crystallize, F file.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
      const idx = aging.findIndex((i) => i.id === selectedId);
      switch (e.key.toLowerCase()) {
        case 'j': {
          const next = aging[Math.min(idx + 1, aging.length - 1)];
          if (next) setSelectedId(next.id);
          break;
        }
        case 'k': {
          const prev = aging[Math.max(idx - 1, 0)];
          if (prev) setSelectedId(prev.id);
          break;
        }
        case 'u':
          if (selectedId) touchItem(selectedId);
          break;
        case 'c':
          if (selectedId) crystallizeItem(selectedId, { promoteKind: true });
          break;
        case 'f':
          if (selectedId) fileItem(selectedId);
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [aging, selectedId]);

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
            <div className="km-card" style={{ padding: 0 }}>
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
            </div>
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

export default AgingBoard;
