// Tidewater — modals: Capture, Paste & route. Shared scrim shell.
const { Ic: MI, Mono: MM } = window;
const { Pill: MPill, toast: mtoast } = window;

function Modal({ onClose, width = 520, children }) {
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: 96,
      background: 'color-mix(in oklab, var(--bg) 50%, rgba(0,0,0,.45))' }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: '92%', background: 'var(--card-2)', border: '1px solid var(--line)',
        borderRadius: 'var(--r-card)', boxShadow: 'var(--shadow-lift)', overflow: 'hidden', animation: 'tideModalIn .2s ease both' }}>
        {children}
      </div>
    </div>
  );
}

const ModalHead = ({ icon, title, sub, onClose }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px 0' }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, flex: '0 0 auto', background: 'var(--action-soft)', color: 'var(--action-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <h2 className="display" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{title}</h2>
      {sub && <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>{sub}</p>}
    </div>
    <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 7 }}><MI.x size={16} /></button>
  </div>
);

// ── Capture ────────────────────────────────────────────────────────────
function CaptureModal({ onClose }) {
  const [kind, setKind] = React.useState('idea');
  const [text, setText] = React.useState('');
  const ref = React.useRef(null);
  React.useEffect(() => { ref.current && ref.current.focus(); }, []);
  const kinds = [['idea', 'Idea'], ['note', 'Note'], ['action', 'To-do'], ['question', 'Question']];
  const submit = () => { onClose(); mtoast({ text: 'Caught. It’s on the bench — sort it whenever.', kind: 'focus' }); };
  return (
    <Modal onClose={onClose}>
      <ModalHead icon={<MI.plus size={17} />} title="Capture" sub="Get it out of your head. Sorting comes later." onClose={onClose} />
      <div style={{ padding: '16px 22px 22px' }}>
        <textarea ref={ref} value={text} onChange={(e) => setText(e.target.value)} placeholder="What’s on your mind?"
          style={{ width: '100%', minHeight: 96, border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)',
            padding: '13px 15px', fontFamily: 'var(--ff-sans)', fontSize: 15.5, lineHeight: 1.5, color: 'var(--ink)', resize: 'vertical', outline: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginTop: 14, flexWrap: 'wrap' }}>
          {kinds.map(([id, l]) => (
            <button key={id} className={'chip' + (kind === id ? ' on' : '')} onClick={() => setKind(id)}>{l}</button>
          ))}
          <span style={{ flex: 1 }} />
          <MM dim style={{ fontSize: 11 }}>Claude will suggest where it goes</MM>
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Capture <span className="kbd" style={{ marginLeft: 4, background: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'transparent' }}>⌘↵</span></button>
        </div>
      </div>
    </Modal>
  );
}

// ── Paste & route ──────────────────────────────────────────────────────
function PasteRouteModal({ onClose }) {
  const [mode, setMode] = React.useState('auto');
  const [text, setText] = React.useState('');
  const detected = text.trim().length > 0;
  const submit = () => { onClose(); mtoast({ text: 'Claude routed 3 things into Japan trip.', kind: 'focus', undo: true }); };
  return (
    <Modal onClose={onClose} width={580}>
      <ModalHead icon={<MI.paste size={16} />} title="Paste & route" sub="Drop in an email, a thread, a wall of text — Claude pulls it apart." onClose={onClose} />
      <div style={{ padding: '16px 22px 22px' }}>
        <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999, marginBottom: 12 }}>
          <window.SegBtn on={mode === 'auto'} onClick={() => setMode('auto')}>Auto-detect</window.SegBtn>
          <window.SegBtn on={mode === 'choose'} onClick={() => setMode('choose')}>I’ll choose</window.SegBtn>
        </div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste here, or drop a file…"
          style={{ width: '100%', minHeight: 120, border: '1.5px dashed var(--line-strong)', borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)',
            padding: '13px 15px', fontFamily: 'var(--ff-mono)', fontSize: 13, lineHeight: 1.6, color: 'var(--ink)', resize: 'vertical', outline: 'none' }} />
        {detected && (
          <div className="panel" style={{ padding: '13px 15px', marginTop: 14, background: 'var(--action-soft)', borderColor: 'color-mix(in oklab, var(--action) 22%, var(--line))' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ width: 20, height: 20, borderRadius: 999, background: 'var(--action)', color: '#F4FBFA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><MI.spark size={11} /></span>
              <MM style={{ fontSize: 12, color: 'var(--action-ink)' }}>Claude sees 3 things</MM>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {[['ref', 'Ryokan list', 'dusk', 'japan-2027'], ['action', 'Book the tempura counter 30 days out', 'dusk', 'japan-2027'], ['note', 'Sam loved the middle one', 'dusk', 'japan-2027']].map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                  <span className="mono tiny" style={{ color: 'var(--ink-faint)', minWidth: 44 }}>{r[0]}</span>
                  <span style={{ flex: 1 }}>{r[1]}</span><MPill t={r[2]}>{r[3]}</MPill>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: 9, marginTop: 20, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={!detected} onClick={submit} style={{ opacity: detected ? 1 : .5 }}>Route it</button>
        </div>
      </div>
    </Modal>
  );
}

Object.assign(window, { Modal, CaptureModal, PasteRouteModal });
