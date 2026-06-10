// Tidewater — core chrome, nav, atoms, toasts. Shared by every screen.
// Reads CSS vars only, so it renders correctly in day (.sk-tide) and
// night (.sk-tide.night) without per-component branching.

const { Ic: C, KindIcon: Kind, Mono: M } = window;
const tv = window.tintVar;

// thread pill (left-tinted) + free tag
const Pill = ({ t, children }) => (
  <span className="pill" style={{ '--tint': tv(t) }}>{children}</span>
);
const Tag = ({ children }) => <span className="tag">#{children}</span>;

// crystal-type chip
const CType = ({ t }) => (
  <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
    color: 'var(--sacred-ink)', background: 'var(--sacred-soft)', padding: '2px 8px', borderRadius: 999 }}>{t}</span>
);

// thread icon medallion
const Medallion = ({ tint, icon, size = 26 }) => (
  <span style={{ width: size, height: size, borderRadius: 999, flex: '0 0 auto',
    background: `color-mix(in oklab, ${tv(tint)} 18%, transparent)`, color: tv(tint),
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    {React.createElement(C[icon] || C.layers, { size: Math.round(size * 0.56) })}</span>
);

// temperature as water depth — vertical fill; bright+high fresh, deep+still dormant
const DEPTH = {
  fresh:   { lvl: 0.92, col: 'var(--sacred)', label: 'sunlit' },
  active:  { lvl: 0.6,  col: 'var(--action)', label: 'active' },
  aging:   { lvl: 0.34, col: 'var(--fam-run)', label: 'deepening' },
  dormant: { lvl: 0.18, col: 'var(--ink-faint)', label: 'still' },
};
const Depth = ({ t, w = 5 }) => {
  const d = DEPTH[t] || DEPTH.active;
  return (
    <div title={d.label} style={{ width: w, alignSelf: 'stretch', minHeight: 30, borderRadius: 999,
      background: 'color-mix(in oklab, var(--ink) 8%, transparent)', position: 'relative', overflow: 'hidden', flex: '0 0 auto' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: (d.lvl * 100) + '%',
        background: `linear-gradient(180deg, ${d.col}, color-mix(in oklab, ${d.col} 50%, transparent))`, borderRadius: 999 }} />
    </div>
  );
};

// thin hand-drawn wave divider
const Wave = ({ w = 120, o = .42 }) => (
  <svg width={w} height="8" viewBox={`0 0 ${w} 8`} fill="none" style={{ opacity: o, display: 'block' }}>
    <path d={`M0 4 Q ${w/8} 0 ${w/4} 4 T ${w/2} 4 T ${w*3/4} 4 T ${w} 4`} stroke="var(--action)" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const SegBtn = ({ on, onClick, children }) => (
  <button onClick={onClick} style={{ border: 0, cursor: 'pointer', fontFamily: 'var(--ff-sans)', fontWeight: 600,
    fontSize: 12, padding: '5px 12px', borderRadius: 999, background: on ? 'var(--card-2)' : 'transparent',
    color: on ? 'var(--action-ink)' : 'var(--ink-muted)', boxShadow: on ? 'var(--shadow-panel)' : 'none' }}>{children}</button>
);

const Eyebrow = ({ children }) => <span className="eyebrow">{children}</span>;

const EmptyState = ({ icon = 'tide', line, sub }) => (
  <div style={{ textAlign: 'center', padding: '54px 20px', color: 'var(--ink-faint)' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, color: 'var(--ink-faint)', opacity: .8 }}>
      {React.createElement(C[icon] || C.tide, { size: 30 })}</div>
    <div className="display" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink-muted)', marginBottom: 6 }}>{line}</div>
    <div className="mono" style={{ fontSize: 12.5 }}>{sub}</div>
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: 14 }}><Wave w={120} o={.35} /></div>
  </div>
);

// ── Chrome bar ─────────────────────────────────────────────────────────
function Chrome({ theme, onTheme, crumb, onCapture, onPaste, onSearch }) {
  return (
    <div style={{ height: 60, flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: 16,
      padding: '0 22px', borderBottom: '1px solid var(--line)', background: 'transparent', position: 'relative', zIndex: 3 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 28, height: 28, borderRadius: 999, background: 'linear-gradient(160deg, var(--action), var(--fam-guide))',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#F4FBFA' }}><C.tide size={16} /></span>
        <span className="display" style={{ fontWeight: 700, fontSize: 21, letterSpacing: '-.02em' }}>Steep</span>
        {crumb && <span style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4, color: 'var(--ink-faint)' }}>
          <C.arrowR size={14} /><span className="mono" style={{ fontSize: 12 }}>{crumb}</span></span>}
      </div>
      <div style={{ flex: 1 }} />
      <button onClick={onSearch} style={{ display: 'flex', alignItems: 'center', gap: 9, width: 290, padding: '8px 13px', cursor: 'pointer',
        background: 'var(--card)', border: '1px solid var(--line)', borderRadius: 999, color: 'var(--ink-faint)', fontFamily: 'var(--ff-sans)' }}>
        <C.search size={15} /><span className="mono" style={{ flex: 1, textAlign: 'left' }}>Search everything</span><span className="kbd">⌘K</span>
      </button>
      <button className="btn btn-ghost btn-sm" onClick={onPaste}><C.paste size={15} /> Paste &amp; route</button>
      <button className="btn btn-primary" onClick={onCapture}><C.plus size={15} /> Capture</button>
      {/* day / night — warm day, cool night */}
      <button onClick={onTheme} title={theme === 'night' ? 'Switch to day' : 'Switch to night'}
        className="btn btn-ghost btn-sm" style={{ padding: 9, borderRadius: 999 }}>
        {theme === 'night' ? <C.sun size={17} /> : <C.moon size={17} />}</button>
      <span style={{ width: 30, height: 30, borderRadius: 999, background: 'var(--sunk)', display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-mono)', fontSize: 12, color: 'var(--ink-muted)' }}>CD</span>
    </div>
  );
}

// ── Nav rail ───────────────────────────────────────────────────────────
function NavRail({ route, go }) {
  const sys = [
    ['dashboard', C.grid,  'Dashboard', null],
    ['bench',     C.tide,  'The bench', 8],
    ['reflecting',C.shelf, 'Reflecting', 24],
    ['aging',     C.clock, 'Aging', 6],
    ['review',    C.review,'Weekly review', null],
    ['crystals',  C.gem,   'Crystals', null],
    ['settings',  C.cog,   'Settings', null],
  ];
  const Row = ({ on, onClick, children, gold }) => (
    <button onClick={onClick} className="row" style={{ display: 'flex', alignItems: 'center', gap: 11,
      width: 'calc(100% - 12px)', margin: '0 6px', padding: '9px 12px', border: 0, cursor: 'pointer', textAlign: 'left',
      background: on ? (gold ? 'var(--sacred-soft)' : 'var(--action-soft)') : 'transparent',
      boxShadow: on ? `inset 3px 0 0 ${gold ? 'var(--sacred)' : 'var(--action)'}` : 'none',
      color: on ? (gold ? 'var(--sacred-ink)' : 'var(--action-ink)') : 'var(--ink)',
      fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: on ? 600 : 500 }}>{children}</button>
  );
  return (
    <aside style={{ width: 236, flex: '0 0 236px', borderRight: '1px solid var(--line)', padding: '18px 0',
      display: 'flex', flexDirection: 'column', gap: 3, background: 'transparent', overflow: 'hidden' }}>
      <div style={{ padding: '0 18px 8px' }}><Eyebrow>Moods</Eyebrow></div>
      {sys.map(([id, I, label, n]) => (
        <Row key={id} on={route === id} gold={id === 'crystals'} onClick={() => go(id)}>
          <I size={16} /><span style={{ flex: 1 }}>{label}</span>
          {n != null && <M dim style={{ fontSize: 12 }}>{n}</M>}
        </Row>
      ))}
      <div style={{ padding: '20px 18px 8px' }}><Eyebrow>Pinned threads</Eyebrow></div>
      {window.THREADS.map((p) => (
        <button key={p.slug} onClick={() => go('project', p.slug)} className="row"
          style={{ display: 'flex', alignItems: 'center', gap: 10, width: 'calc(100% - 12px)', margin: '0 6px',
            padding: '8px 12px', border: 0, cursor: 'pointer', textAlign: 'left',
            background: route === 'project' && window.__proj === p.slug ? 'var(--action-soft)' : 'transparent', color: 'var(--ink)' }}>
          <span style={{ width: 7, height: 7, borderRadius: 9, background: tv(p.tint), flex: '0 0 auto' }} />
          <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</span>
          {p.focus > 0 && <M dim style={{ fontSize: 11.5 }}>{p.focus}</M>}
        </button>
      ))}
      <button className="row" style={{ display: 'flex', alignItems: 'center', gap: 9, width: 'calc(100% - 12px)',
        margin: '4px 6px 0', padding: '8px 12px', border: 0, cursor: 'pointer', textAlign: 'left',
        background: 'transparent', color: 'var(--ink-faint)', fontFamily: 'var(--ff-sans)', fontSize: 13 }}>
        <C.plus size={14} /> New thread</button>
      <div style={{ flex: 1 }} />
      <div style={{ padding: '12px 18px 0', margin: '0 6px', borderTop: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 8 }}>
        <M dim style={{ fontSize: 11 }}>v0.6 · life</M><span style={{ flex: 1 }} /><M dim style={{ fontSize: 11 }}>↻ 7:14</M>
      </div>
    </aside>
  );
}

// ── Toast host ─────────────────────────────────────────────────────────
// Screens fire: window.dispatchEvent(new CustomEvent('tide-toast',{detail:{text, undo, kind}}))
function ToastHost() {
  const [toasts, setToasts] = React.useState([]);
  React.useEffect(() => {
    let id = 0;
    const onToast = (e) => {
      const t = { id: ++id, ...e.detail };
      setToasts((cur) => [...cur, t]);
      setTimeout(() => setToasts((cur) => cur.filter((x) => x.id !== t.id)), t.ms || 4200);
    };
    window.addEventListener('tide-toast', onToast);
    return () => window.removeEventListener('tide-toast', onToast);
  }, []);
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: 8, pointerEvents: 'none', zIndex: 40 }}>
      {toasts.map((t) => (
        <div key={t.id} className="tide-toast" style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 14,
          padding: '11px 14px 11px 16px', borderRadius: 999, background: 'var(--card-2)',
          border: '1px solid var(--line)', boxShadow: 'var(--shadow-lift)' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: 'var(--ink)' }}>
            {t.kind === 'crystal' && <C.gem size={15} style={{ color: 'var(--sacred-ink)' }} />}
            {t.kind === 'release' && <C.tide size={15} style={{ color: 'var(--ink-faint)' }} />}
            {t.kind === 'focus' && <C.pickup size={15} style={{ color: 'var(--action-ink)' }} />}
            {t.text}</span>
          {t.undo && <button onClick={() => { t.onUndo && t.onUndo(); setToasts((cur) => cur.filter((x) => x.id !== t.id)); }}
            style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'var(--action-ink)',
              fontFamily: 'var(--ff-sans)', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <C.undo size={14} /> Undo</button>}
        </div>
      ))}
    </div>
  );
}
const toast = (detail) => window.dispatchEvent(new CustomEvent('tide-toast', { detail }));

Object.assign(window, { Pill, Tag, CType, Medallion, Depth, DEPTH, Wave, SegBtn, Eyebrow, EmptyState, Chrome, NavRail, ToastHost, toast });
