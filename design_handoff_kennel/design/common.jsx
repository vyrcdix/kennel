// Kennel — shared atoms, icons, and small pieces used across screens.
// Mono-weight line icons (Lucide-style, hand-traced to keep parity).

const Icon = ({ d, size = 14, stroke = 'currentColor', sw = 1.5, fill = 'none', extra }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flex:'0 0 auto', display:'block'}}>
    {extra}
    {Array.isArray(d) ? d.map((s, i) => <path key={i} d={s} />) : <path d={d} />}
  </svg>
);

const Icons = {
  search:   (p={}) => <Icon {...p} d={["M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z","m20 20-3.5-3.5"]} />,
  plus:     (p={}) => <Icon {...p} d={["M12 5v14","M5 12h14"]} />,
  menu:     (p={}) => <Icon {...p} d={["M4 7h16","M4 12h16","M4 17h16"]} />,
  grip:     (p={}) => <Icon {...p} d={["M9 6h.01","M15 6h.01","M9 12h.01","M15 12h.01","M9 18h.01","M15 18h.01"]} sw={2.5} />,
  pin:      (p={}) => <Icon {...p} d={["M12 17v5","M5 9h14l-2 8H7L5 9z","M9 9V4h6v5"]} />,
  bulb:     (p={}) => <Icon {...p} d={["M9 18h6","M10 22h4","M8 14a4 4 0 1 1 8 0c0 2-2 3-2 4h-4c0-1-2-2-2-4z"]} />,
  note:     (p={}) => <Icon {...p} d={["M4 5h16v14H4z","M8 9h8","M8 13h8","M8 17h5"]} />,
  check:    (p={}) => <Icon {...p} d={["M4 5h16v14H4z","m8 12 3 3 5-6"]} />,
  doc:      (p={}) => <Icon {...p} d={["M6 3h8l4 4v14H6z","M14 3v4h4","M9 13h6","M9 17h6","M9 9h2"]} />,
  link:     (p={}) => <Icon {...p} d={["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1","M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"]} />,
  chat:     (p={}) => <Icon {...p} d={["M4 6h16v10H8l-4 4z"]} />,
  runbook:  (p={}) => <Icon {...p} d={["M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z","M5 18h14","M9 8h6","M9 12h4"]} />,
  arrowR:   (p={}) => <Icon {...p} d={["M5 12h14","m13 6 6 6-6 6"]} />,
  arrowDown:(p={}) => <Icon {...p} d="m6 9 6 6 6-6" />,
  arrowUp:  (p={}) => <Icon {...p} d="m6 15 6-6 6 6" />,
  archive:  (p={}) => <Icon {...p} d={["M3 5h18v4H3z","M5 9v11h14V9","M10 13h4"]} />,
  trash:    (p={}) => <Icon {...p} d={["M4 7h16","M9 7V4h6v3","M6 7v13h12V7","M10 11v6","M14 11v6"]} />,
  park:     (p={}) => <Icon {...p} d={["M6 4h8a4 4 0 0 1 0 8h-4v8H6z","M10 8h4"]} />,
  star:     (p={}) => <Icon {...p} d="M12 4l2.4 5 5.6.6-4 3.8 1.2 5.6L12 16.3 6.8 19l1.2-5.6-4-3.8L9.6 9z" />,
  filter:   (p={}) => <Icon {...p} d={["M4 5h16l-6 8v6l-4-2v-4z"]} />,
  cog:      (p={}) => <Icon {...p} d={["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z","M12 2v3","M12 19v3","m4.2 4.2 2.1 2.1","m17.7 17.7 2.1 2.1","M2 12h3","M19 12h3","m4.2 19.8 2.1-2.1","m17.7 6.3 2.1-2.1"]} />,
  x:        (p={}) => <Icon {...p} d={["M6 6l12 12","M18 6L6 18"]} />,
  copy:     (p={}) => <Icon {...p} d={["M9 4h10v12H9z","M5 8v12h10"]} />,
  ext:      (p={}) => <Icon {...p} d={["M14 5h5v5","M19 5l-8 8","M19 14v5H5V5h5"]} />,
  eye:      (p={}) => <Icon {...p} d={["M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]} />,
  side:     (p={}) => <Icon {...p} d={["M4 5h16v14H4z","M10 5v14"]} />,
  cmd:      (p={}) => <Icon {...p} d="M9 6a3 3 0 1 1-3 3h12a3 3 0 1 1-3-3v12a3 3 0 1 1 3-3H6a3 3 0 1 1 3 3z" />,
  bell:     (p={}) => <Icon {...p} d={["M6 16V11a6 6 0 1 1 12 0v5l2 2H4z","M10 20a2 2 0 0 0 4 0"]} />,
  caret:    (p={}) => <Icon {...p} d="m9 6 6 6-6 6" />,
};

// Kind icon per item kind
const KindIcon = ({ kind, size = 14, muted = true }) => {
  const map = { idea: Icons.bulb, note: Icons.note, action: Icons.check, doc: Icons.doc, ref: Icons.link, chat: Icons.chat };
  const C = map[kind] || Icons.note;
  return <span style={{ color: muted ? 'var(--fg-muted)' : 'var(--fg)' }}><C size={size} /></span>;
};

// Project tag (slug pill)
const ProjectTag = ({ slug }) => <span className="km-proj">{slug}</span>;

// State indicator
const StateDot = ({ state }) => {
  if (state === 'inbox' || state === 'dismissed') return null;
  if (state === 'active')   return <span className="km-dot km-dot-ember" title="active" />;
  if (state === 'parked')   return <span className="km-dot km-dot-dust" title="parked" />;
  if (state === 'done')     return <span className="km-dot km-dot-moss" title="done" />;
  if (state === 'archived') return <span className="km-dot km-dot-slate" title="archived" />;
  return null;
};

// Revision indicator
const Rev = ({ n }) => <span className="km-mono-sm" style={{whiteSpace:'nowrap'}}>rev {n}</span>;

// Display small uppercase label
const Label = ({ children, style }) => <div className="km-display-sm" style={style}>{children}</div>;

// Mono small text
const Mono = ({ children, style, dim }) => (
  <span className="km-mono-sm" style={{ color: dim ? 'var(--fg-faint)' : undefined, ...style }}>{children}</span>
);

// Section header used inside cards / panels
const SectionHead = ({ title, right, dense }) => (
  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding: dense ? '8px 14px' : '12px 16px' }}>
    <Label>{title}</Label>
    <div style={{ display:'flex', alignItems:'center', gap: 8 }}>{right}</div>
  </div>
);

// Tiny actor badge for activity log
const Actor = ({ who }) => {
  const map = {
    C: { label: 'C', bg: 'var(--slate)',     fg: '#F2EDE0' },
    Cl:{ label: '⌬', bg: 'var(--ember-deep)',fg: '#F2EDE0' },
    CLI:{label: '⎈', bg: 'var(--moss)',      fg: '#F2EDE0' },
    sys:{label: '•', bg: 'var(--surface-2)', fg: 'var(--fg-muted)'},
  };
  const a = map[who] || map.sys;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width: 16, height: 16, borderRadius: 3,
      background: a.bg, color: a.fg, fontFamily:'var(--ff-mono)', fontSize: 10, lineHeight: 1
    }}>{a.label}</span>
  );
};

// Top header / chrome bar reused across every screen
const ChromeBar = ({ projectChip, search = 'Search projects, items, docs…' }) => (
  <div style={{
    height: 44,
    borderBottom: '1px solid var(--line)',
    display:'flex', alignItems:'center',
    padding:'0 14px', gap: 14,
    background: 'var(--surface-0)',
    flex:'0 0 auto',
  }}>
    <div style={{display:'flex', alignItems:'center', gap:8}}>
      <span className="km-logo-slot">LOGO</span>
      <span className="km-display-md" style={{fontSize:16, letterSpacing:'.08em'}}>KENNEL</span>
    </div>
    {projectChip}
    <div style={{flex:1}} />
    <div style={{
      display:'flex', alignItems:'center', gap:8,
      background:'var(--surface-1)',
      border:'1px solid var(--line)',
      borderRadius:4,
      padding:'5px 10px',
      width: 360, color: 'var(--fg-muted)'
    }}>
      <Icons.search size={13} />
      <span className="km-mono-sm" style={{flex:1}}>{search}</span>
      <span className="km-kbd">⌘K</span>
    </div>
    <button className="km-btn km-btn-primary"><Icons.plus size={13} /> Capture</button>
    <div style={{
      width:26, height:26, borderRadius:3, background:'var(--surface-2)',
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--fg-muted)'
    }}>CD</div>
  </div>
);

// Left navigation rail used across most screens (projects + system links)
const NavRail = ({ active = 'dashboard' }) => {
  const projects = [
    { slug: 'picnic-engage',   name: 'Picnic — Engagement',   count: 4 },
    { slug: 'kennel',          name: 'Kennel',                 count: 12, active: true },
    { slug: 'pacecraft',       name: 'Pacecraft',              count: 2 },
    { slug: 'klein-advisory',  name: 'Klein Advisory',         count: 1 },
    { slug: 'training-block',  name: 'Training Block',         count: 0 },
    { slug: 'reading-stack',   name: 'Reading Stack',          count: 7 },
  ];
  const sys = [
    { id: 'dashboard', icon: Icons.menu,    label: 'Dashboard' },
    { id: 'triage',    icon: Icons.filter,  label: 'Triage queue', n: 14 },
    { id: 'search',    icon: Icons.search,  label: 'Search' },
    { id: 'skills',    icon: Icons.star,    label: 'Skills' },
    { id: 'settings',  icon: Icons.cog,     label: 'Settings' },
  ];
  return (
    <aside style={{
      width: 224, flex:'0 0 224px',
      borderRight: '1px solid var(--line)',
      padding: '14px 0',
      display:'flex', flexDirection:'column', gap: 6,
      background: 'var(--surface-0)',
      overflow:'hidden'
    }}>
      <div style={{padding:'2px 16px 6px'}}>
        <Label>Workspace</Label>
      </div>
      {sys.map(s => (
        <button key={s.id} className="km-row" style={{
          display:'flex', alignItems:'center', gap:9, width:'100%',
          padding:'5px 16px', border:0, background: active === s.id ? 'rgba(217,98,44,.10)' : 'transparent',
          boxShadow: active === s.id ? 'inset 2px 0 0 var(--ember)' : 'none',
          color: active === s.id ? 'var(--ember-deep)' : 'var(--fg)',
          fontSize: 13, fontFamily:'var(--ff-sans)', cursor:'pointer',
          textAlign:'left'
        }}>
          <s.icon size={14} />
          <span style={{flex:1}}>{s.label}</span>
          {s.n != null && <Mono>{s.n}</Mono>}
        </button>
      ))}
      <div style={{padding:'14px 16px 6px'}}>
        <Label>Pinned projects</Label>
      </div>
      {projects.map(p => (
        <button key={p.slug} className="km-row" style={{
          display:'flex', alignItems:'center', gap: 9, width:'100%',
          padding:'5px 16px', border: 0,
          background: p.active ? 'rgba(92,122,62,.10)' : 'transparent',
          boxShadow: p.active ? 'inset 2px 0 0 var(--moss)' : 'none',
          color: 'var(--fg)', cursor:'pointer', textAlign:'left'
        }}>
          <span className="km-mono-sm" style={{ color: p.active ? 'var(--moss)' : 'var(--fg-faint)', flex:'0 0 auto', width:6, textAlign:'center'}}>
            {p.active ? '●' : '○'}
          </span>
          <span style={{flex:1, fontSize:13, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.name}</span>
          {p.count > 0 && <Mono>{p.count}</Mono>}
        </button>
      ))}
      <div style={{flex:1}} />
      <div style={{padding:'10px 16px', borderTop:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8}}>
        <Mono>v0.1.4</Mono>
        <span style={{flex:1}} />
        <Mono dim>↻ synced 14:32</Mono>
      </div>
    </aside>
  );
};

Object.assign(window, { Icon, Icons, KindIcon, ProjectTag, StateDot, Rev, Label, Mono, SectionHead, Actor, ChromeBar, NavRail });
