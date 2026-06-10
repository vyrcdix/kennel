// Tidewater — app shell: theme, routing, chrome + nav + screen + toasts.
const { Chrome: AppChrome, NavRail: AppNav, ToastHost: AppToasts } = window;

const CRUMB = {
  dashboard: null, bench: 'Sort', reflecting: 'Reflecting', aging: 'Aging',
  review: 'Weekly review', crystals: 'Crystals', settings: 'Settings',
  project: 'Marathon 2027', crystal: 'Marathon 2027 · crystal',
  doc: 'Marathon 2027 · Pacing notes', trace: 'Marathon 2027 · Trace',
  fieldnotes: 'Marathon 2027 · Field notes', runbook: 'Race-week runbook', guidebook: 'Base-building plan',
};

function TideApp() {
  const [theme, setTheme] = React.useState(() => localStorage.getItem('tide.theme') || 'day');
  const [route, setRoute] = React.useState(() => localStorage.getItem('tide.route') || 'dashboard');
  const [proj, setProj] = React.useState(() => localStorage.getItem('tide.proj') || 'marathon-2027');
  const [overlay, setOverlay] = React.useState(null); // 'search' | 'capture' | 'paste'
  const scroller = React.useRef(null);

  const go = (name, arg) => {
    if (arg) { setProj(arg); window.__proj = arg; localStorage.setItem('tide.proj', arg); }
    setRoute(name); localStorage.setItem('tide.route', name);
    if (scroller.current) scroller.current.scrollTop = 0;
  };
  const onTheme = () => { const t = theme === 'night' ? 'day' : 'night'; setTheme(t); localStorage.setItem('tide.theme', t); };

  React.useEffect(() => { window.__proj = proj; }, [proj]);
  React.useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOverlay((o) => o === 'search' ? null : 'search'); }
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, []);

  let Screen;
  switch (route) {
    case 'bench':      Screen = <window.TideSort go={go} />; break;
    case 'reflecting': Screen = <window.TideReflecting go={go} />; break;
    case 'aging':      Screen = <window.TideReflecting go={go} />; break;
    case 'project':    Screen = <window.TideProject go={go} slug={proj} />; break;
    case 'crystal':    Screen = <window.TideCrystal go={go} />; break;
    case 'review':     Screen = <window.TideReview go={go} />; break;
    case 'crystals':   Screen = <window.TideCrystals go={go} />; break;
    case 'settings':   Screen = <window.TideSettings theme={theme} onTheme={onTheme} />; break;
    case 'doc':        Screen = <window.TideDoc go={go} />; break;
    case 'trace':      Screen = <window.TideTrace go={go} />; break;
    case 'fieldnotes': Screen = <window.TideFieldNotes go={go} />; break;
    case 'runbook':    Screen = <window.TideRunbook go={go} />; break;
    case 'guidebook':  Screen = <window.TideGuidebook go={go} />; break;
    default:           Screen = <window.TideDashboard go={go} />;
  }

  return (
    <div className={'skin sk-tide' + (theme === 'night' ? ' night' : '')}
      style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 1040, position: 'relative' }}>
      <AppChrome theme={theme} onTheme={onTheme} crumb={CRUMB[route]}
        onSearch={() => setOverlay('search')} onCapture={() => setOverlay('capture')} onPaste={() => setOverlay('paste')} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <AppNav route={route} go={go} />
        <div ref={scroller} style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>
          <div key={route} className="screen-enter" style={{ flex: 1, display: 'flex', minHeight: 0, minWidth: 0 }}>{Screen}</div>
        </div>
      </div>
      {overlay === 'search' && <window.GlobalSearch onClose={() => setOverlay(null)} go={go} />}
      {overlay === 'capture' && <window.CaptureModal onClose={() => setOverlay(null)} />}
      {overlay === 'paste' && <window.PasteRouteModal onClose={() => setOverlay(null)} />}
      <AppToasts />
    </div>
  );
}

window.TideApp = TideApp;
