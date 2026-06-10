// Tidewater — Trace timeline + Global search overlay.
const { Ic: T2, Mono: T2M, KindIcon: T2Kind } = window;
const { Pill: T2Pill, CType: T2C } = window;

// ── Trace (timeline) ───────────────────────────────────────────────────
function TideTrace({ go }) {
  const [filter, setFilter] = React.useState('all');
  const dot = { crystal: 'var(--sacred)', chat: 'var(--action)', capture: 'var(--dot-reflect)', sorted: 'var(--fam-guide)', discard: 'var(--ink-faint)' };
  const show = (t) => filter === 'all' || filter === t;
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => go('project', 'marathon-2027')}><T2.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> marathon-2027</button>
        <h1 className="display" style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>Trace</h1>
        <p style={{ margin: '0 0 18px', fontSize: 16, color: 'var(--ink-muted)' }}>How this thread actually moved — what settled, what you let go, what you talked through.</p>
        <div style={{ display: 'flex', gap: 7, marginBottom: 24, flexWrap: 'wrap' }}>
          {[['all', 'Everything'], ['crystal', 'Crystals'], ['capture', 'Captures'], ['discard', 'Let go'], ['chat', 'Chats']].map(([id, l]) => (
            <button key={id} className={'chip' + (filter === id ? ' on' : '')} onClick={() => setFilter(id)}>{l}</button>
          ))}
        </div>

        <div style={{ position: 'relative', paddingLeft: 26 }}>
          <div style={{ position: 'absolute', left: 6, top: 6, bottom: 6, width: 2, background: 'var(--line)' }} />
          {window.TRACE.map((cluster, ci) => (
            <div key={ci} style={{ marginBottom: 26 }}>
              <div className="mono" style={{ fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 12, marginLeft: -26 }}>
                <span style={{ display: 'inline-block', width: 26 }}></span>{cluster.day}</div>
              {cluster.entries.filter((e) => show(e.type)).map((e, i) => (
                <div key={i} style={{ position: 'relative', marginBottom: 14, opacity: e.type === 'discard' ? .6 : 1 }}>
                  <span style={{ position: 'absolute', left: -26, top: 3, width: 14, height: 14, borderRadius: 999,
                    background: e.type === 'crystal' ? 'var(--sacred)' : 'var(--bg)', border: `2px solid ${dot[e.type]}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }} />
                  {e.type === 'crystal'
                    ? <div className="crystal" style={{ padding: '12px 14px', cursor: 'pointer' }} onClick={() => go('crystal')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}><T2C t={e.tag} /><span className="mono tiny" style={{ color: 'var(--sacred-ink)' }}>crystallized</span></div>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>{e.text}</p></div>
                    : e.type === 'chat'
                    ? <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                        <span style={{ width: 22, height: 22, borderRadius: 999, flex: '0 0 auto', fontFamily: 'var(--ff-mono)', fontSize: 9.5,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: e.who === 'Claude' ? 'var(--action-soft)' : 'var(--sunk)', color: e.who === 'Claude' ? 'var(--action-ink)' : 'var(--ink-muted)' }}>{e.who === 'Claude' ? 'AI' : 'CD'}</span>
                        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, paddingTop: 2 }}>{e.text}</p></div>
                    : <div style={{ display: 'flex', gap: 9, alignItems: 'baseline' }}>
                        <span className="mono tiny" style={{ color: dot[e.type], textTransform: 'uppercase', letterSpacing: '.06em', minWidth: 54 }}>{e.type}</span>
                        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.45, textDecoration: e.type === 'discard' ? 'line-through' : 'none' }}>{e.text}</p></div>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Global search (⌘K overlay) ─────────────────────────────────────────
function GlobalSearch({ onClose, go }) {
  const s = window.SEARCH;
  const [q, setQ] = React.useState(s.q);
  const inputRef = React.useRef(null);
  React.useEffect(() => { inputRef.current && inputRef.current.focus(); inputRef.current && inputRef.current.select(); }, []);
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const mark = (text) => {
    const i = text.toLowerCase().indexOf(q.toLowerCase());
    if (q && i >= 0) return <>{text.slice(0, i)}<span className="hl">{text.slice(i, i + q.length)}</span>{text.slice(i + q.length)}</>;
    return text;
  };
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', paddingTop: 90,
      background: 'color-mix(in oklab, var(--bg) 55%, rgba(0,0,0,.45))' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 620, maxWidth: '90%', alignSelf: 'flex-start', background: 'var(--card-2)',
        border: '1px solid var(--line)', borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-lift)', overflow: 'hidden', animation: 'tideModalIn .2s ease both' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--line)' }}>
          <T2.search size={18} style={{ color: 'var(--ink-faint)' }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search everything"
            style={{ flex: 1, border: 0, outline: 'none', background: 'transparent', fontFamily: 'var(--ff-sans)', fontSize: 17, color: 'var(--ink)' }} />
          <span className="kbd">esc</span>
        </div>
        <div style={{ padding: '8px 10px 6px', display: 'flex', gap: 7, flexWrap: 'wrap', borderBottom: '1px solid var(--line)' }}>
          {['thread:marathon', 'kind:crystal', 'tag:where-to-eat', 'is:reflecting'].map((h) => (
            <span key={h} className="mono tiny" style={{ padding: '3px 9px', borderRadius: 999, background: 'var(--sunk)', color: 'var(--ink-muted)' }}>{h}</span>
          ))}
        </div>
        <div style={{ maxHeight: 380, overflowY: 'auto', padding: '8px 8px 12px' }}>
          {s.groups.map((grp, gi) => (
            <div key={gi} style={{ marginBottom: 8 }}>
              <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', padding: '8px 10px 4px' }}>{grp.label} · {grp.n}</div>
              {grp.rows.map((r, ri) => (
                <div key={ri} className="row" style={{ display: 'flex', gap: 11, padding: '10px 11px', alignItems: 'flex-start', cursor: 'pointer' }}
                  onClick={() => { onClose(); grp.label === 'Crystals' ? go('crystal') : grp.label === 'In docs' ? go('doc') : go('reflecting'); }}>
                  <span style={{ color: grp.label === 'Crystals' ? 'var(--sacred-ink)' : 'var(--ink-faint)', display: 'flex', marginTop: 1 }}><T2Kind kind={r.kind} size={15} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4 }}>{mark(r.text)}</p>
                    <div style={{ marginTop: 5 }}><T2Pill t={r.tint}>{r.thread}</T2Pill></div>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TideTrace, GlobalSearch });
