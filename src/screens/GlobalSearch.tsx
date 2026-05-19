import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SearchHit } from '../data/selectors';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { KindIcon, type IconKind } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { Icons } from '../components/Icon';
import { searchWithStats } from '../data/selectors';

const DEFAULT_QUERY = 'paused';

const highlight = (text: string, term: string) => {
  if (!term) return text;
  const lower = text.toLowerCase();
  const t = term.toLowerCase();
  const parts: React.ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < text.length) {
    const idx = lower.indexOf(t, i);
    if (idx < 0) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <span key={k++} className="km-hl">
        {text.slice(idx, idx + term.length)}
      </span>,
    );
    i = idx + term.length;
  }
  return <>{parts}</>;
};

export const GlobalSearch = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const { groups, stats } = useMemo(() => searchWithStats(query), [query]);

  const close = () => navigate(-1);
  const openHit = (hit: SearchHit) => {
    if (hit.external) {
      window.open(hit.target, '_blank', 'noopener,noreferrer');
    } else {
      navigate(hit.target);
    }
  };
  const topHit = groups.flatMap((g) => g.rows)[0];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === 'Enter') {
        const t = e.target as HTMLElement | null;
        if (t?.tagName === 'INPUT' && topHit) {
          e.preventDefault();
          openHit(topHit);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [topHit?.target, topHit?.external]);

  return (
    <div className="km" style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <ChromeBar />
      {/* dimmed background hint */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          filter: 'opacity(.35) blur(.5px)',
        }}
      >
        <NavRail active="search" />
        <main style={{ flex: 1, padding: '22px 32px' }}>
          <div className="km-display-lg">Dashboard</div>
          <div style={{ marginTop: 18 }} className="km-rule" />
        </main>
      </div>

      {/* Modal */}
      <div
        onClick={close}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 64,
          background: 'rgba(42,46,51,.18)',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="km-card"
          style={{
            width: 880,
            maxWidth: '92%',
            background: 'var(--surface-0)',
            border: '1px solid var(--line-strong)',
            borderRadius: 6,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 720,
          }}
        >
          {/* Input */}
          <div
            style={{
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              borderBottom: '1px solid var(--line)',
            }}
          >
            <Icons.search size={16} />
            <input
              className="km-input-mono"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                flex: 1,
                fontSize: 14,
                border: 0,
                background: 'transparent',
                outline: 'none',
                color: 'var(--fg)',
              }}
            />
            <Mono>FTS5</Mono>
            <span className="km-kbd">esc</span>
          </div>
          <div
            style={{
              padding: '6px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderBottom: '1px solid var(--line)',
              background: 'var(--surface-1)',
            }}
          >
            <Mono dim>syntax</Mono>
            <Mono>kind:doc</Mono>
            <Mono>tag:#outreach</Mono>
            <Mono>project:picnic-engage</Mono>
            <Mono>state:active</Mono>
            <Mono>"phrase"</Mono>
            <span style={{ flex: 1 }} />
            <Mono>
              {stats.total} match{stats.total === 1 ? '' : 'es'} · {stats.elapsedMs}ms
            </Mono>
          </div>

          {/* Results */}
          <div className="km-scroll" style={{ overflow: 'auto', padding: '6px 0' }}>
            {groups.length === 0 && (
              <div style={{ padding: 32 }}>
                <div className="km-display-lg">Nothing matched.</div>
                <Mono dim>try broader terms or drop a filter</Mono>
              </div>
            )}
            {groups.map((group) => (
              <div key={group.group}>
                <div
                  style={{
                    padding: '10px 18px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Label>{group.group}</Label>
                  <Mono>{group.count} matches</Mono>
                  <span style={{ flex: 1 }} />
                  {group.count > group.rows.length && (
                    <span
                      className="km-link"
                      style={{
                        fontSize: 12,
                        borderBottomStyle: 'dashed',
                        color: 'var(--ember-deep)',
                      }}
                    >
                      see all
                    </span>
                  )}
                </div>
                {group.rows.map((r, i) => (
                  <div
                    key={i}
                    className="km-row"
                    onClick={() => openHit(r)}
                    style={{
                      padding: '8px 18px',
                      display: 'grid',
                      gridTemplateColumns: '18px 110px 1fr 80px',
                      alignItems: 'baseline',
                      gap: 12,
                      cursor: 'pointer',
                    }}
                  >
                    <KindIcon kind={r.kind as IconKind} />
                    <ProjectTag slug={r.slug} />
                    <div>
                      <div className="km-body" style={{ fontWeight: 500 }}>
                        {highlight(r.title, query)}
                      </div>
                      <div className="km-body-sm" style={{ marginTop: 2, lineHeight: 1.4 }}>
                        {highlight(r.snippet, query)}
                      </div>
                    </div>
                    <Mono>{r.updated}</Mono>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div
            style={{
              borderTop: '1px solid var(--line)',
              padding: '8px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'var(--surface-1)',
            }}
          >
            <span className="km-kbd">↑</span>
            <span className="km-kbd">↓</span> <Mono dim>navigate</Mono>
            <span className="km-kbd">↵</span> <Mono dim>open</Mono>
            <span className="km-kbd">⌘↵</span> <Mono dim>open in new pane</Mono>
            <span style={{ flex: 1 }} />
            <Mono>saved searches · 4</Mono>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalSearch;
