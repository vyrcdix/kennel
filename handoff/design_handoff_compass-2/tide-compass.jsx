// Tidewater — Compass: the orientation layer. A new "Mood" you return to.
//   CompassBand   — the quiet dawn band on the Dashboard (rotating bearing)
//   TideCompass   — the lens: the few bearings, what each keeps warm
//   TideOrientation — a bearing's page: a forward-pointed crystal + the wake
// Reads CSS vars + existing data only. Bearings reuse the sacred (amber)
// family with a star/compass cue — no new aesthetic.

const { Ic: CMPI, KindIcon: CmpKind, Mono: CmpMono } = window;
const { Pill: CmpPill, CType: CmpCType, Medallion: CmpMed, toast: cmpToast } = window;
const cmpTv = window.tintVar;

// a calm, fixed scatter of stars + one lodestar (top-right)
const CMP_STARS = [
  { x: 7, y: 42, r: 2, o: .5 }, { x: 16, y: 70, r: 1.5, o: .35 }, { x: 25, y: 30, r: 2.5, o: .55 },
  { x: 36, y: 64, r: 1.5, o: .3 }, { x: 46, y: 24, r: 2, o: .45 }, { x: 57, y: 58, r: 1.5, o: .35 },
  { x: 66, y: 36, r: 2, o: .5 }, { x: 77, y: 64, r: 1.5, o: .3 }, { x: 90, y: 28, r: 5, o: 1, lode: true },
  { x: 94, y: 54, r: 2, o: .4 },
];
const CmpStars = () => (
  <div className="cmp-stars" aria-hidden="true">
    {CMP_STARS.map((s, i) => <span key={i} className={'cmp-star' + (s.lode ? ' lode' : '')}
      style={{ left: s.x + '%', top: s.y + '%', width: s.r, height: s.r, opacity: s.o }} />)}
  </div>
);

// orientation type label — forward-pointed sibling of CType
const CmpOType = ({ children = 'orientation' }) => (
  <span className="mono" style={{ fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase',
    color: 'var(--sacred-ink)', background: 'var(--sacred-soft)', padding: '2px 8px', borderRadius: 999,
    display: 'inline-flex', alignItems: 'center', gap: 5 }}><CMPI.star4 size={11} />{children}</span>
);

const CmpGlyph = ({ name, tint, size = 30 }) => {
  const I = CMPI[name] || CMPI.star4;
  return (
    <span style={{ width: size, height: size, borderRadius: 999, flex: '0 0 auto',
      background: `color-mix(in oklab, ${cmpTv(tint)} 16%, transparent)`, color: cmpTv(tint),
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <I size={Math.round(size * 0.54)} /></span>
  );
};

const cmpThreadName = (slug) => (window.THREADS.find((t) => t.slug === slug) || {}).name || slug;
const cmpThreadTint = (slug) => (window.THREADS.find((t) => t.slug === slug) || {}).tint || 'slate';

// ════════════════════════ DASHBOARD DAWN BAND ════════════════════════
// One bearing, surfaced quietly above Next Up. Rotates so it can't calcify.
function CompassBand({ go }) {
  const list = window.ORIENTATIONS;
  const [i, setI] = React.useState(0);
  const o = list[i];
  return (
    <section className="cmp-sky" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-panel)' }}>
      <CmpStars />
      <div style={{ position: 'relative', padding: '15px 20px 14px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <CmpGlyph name={o.glyph} tint={o.tint} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="cmp-eyebrow" style={{ marginBottom: 4 }}><CMPI.star4 size={11} /> What you’re about</div>
          <div className="display" style={{ fontSize: 19, fontWeight: 700, letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{o.label}</div>
        </div>
        {o.horizon && <CmpMono dim style={{ fontSize: 11, whiteSpace: 'nowrap' }}>day {o.horizon.day} · {o.horizon.ahead} ahead</CmpMono>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {list.map((_, k) => <button key={k} aria-label={'bearing ' + (k + 1)} onClick={() => setI(k)}
            className={'cmp-rot' + (k === i ? ' on' : '')} style={{ border: 0, padding: 0, cursor: 'pointer' }} />)}
        </div>
        <button className="cmp-anchor" onClick={() => go('compass')}>Open Compass <CMPI.arrowR size={13} /></button>
      </div>
    </section>
  );
}

// ════════════════════════════ THE LENS ════════════════════════════════
function TideCompass({ go }) {
  const list = window.ORIENTATIONS;
  const [setting, setSetting] = React.useState(false);
  return (
   <React.Fragment>
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 48px' }}>
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        {/* sky header — the one place the layer shows its altitude */}
        <div className="cmp-sky" style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-panel)', marginBottom: 22 }}>
          <CmpStars />
          <div style={{ position: 'relative', padding: '26px 26px 24px' }}>
            <div className="cmp-eyebrow" style={{ marginBottom: 10 }}><CMPI.compass size={13} /> Compass</div>
            <h1 className="display" style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-.02em', whiteSpace: 'normal' }}>What you’re about.</h1>
            <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--ink-muted)', maxWidth: 560 }}>
              The handful of things the rest is for. Five bearings — steered by, not tracked. Rarely changed, and slow to add.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {list.map((o) => {
            const built = window.orientBuilt(o.id);
            const count = built.focus.length + built.cadences.length + (built.crystal ? 1 : 0);
            return (
              <div key={o.id} className="panel cmp-bearingcard" style={{ padding: '17px 18px' }} onClick={() => go('orientation', o.id)}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                  <CmpGlyph name={o.glyph} tint={o.tint} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="display" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}>{o.label}</span>
                      <span style={{ flex: 1 }} />
                      {o.horizon
                        ? <span className="cmp-horizonchip">day {o.horizon.day} / {o.horizon.total}</span>
                        : <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>no clock</span>}
                    </div>
                    {o.note && <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--ink-muted)', fontStyle: 'italic' }}>{o.note}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 11 }}>
                      {built.cadences.slice(0, 2).map((c) => (
                        <span key={c.id} className="cmp-warm"><CMPI.repeat size={12} />{c.text}</span>
                      ))}
                      {built.crystal && <span className="cmp-warm"><CMPI.gem size={12} style={{ color: 'var(--sacred-ink)' }} /> a kept {built.crystal.type}</span>}
                      {o.threads.map((t) => <CmpPill key={t} t={cmpThreadTint(t)}>{cmpThreadName(t)}</CmpPill>)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
                      <CMPI.star4f size={11} style={{ color: o.promise.kept ? 'var(--sacred)' : 'var(--ink-faint)' }} />
                      <CmpMono dim style={{ fontSize: 11.5 }}>
                        today’s promise — <span style={{ color: 'var(--ink)' }}>{o.promise.text}</span>{o.promise.kept ? ' · kept' : ''}</CmpMono>
                      <span style={{ flex: 1 }} />
                      <CmpMono dim style={{ fontSize: 11 }}>{count} things under this · {o.kept} kept</CmpMono>
                      <CMPI.arrowR size={15} style={{ color: 'var(--ink-faint)' }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {/* add a bearing — deliberately high-friction (the inverse of capture) */}
          <button className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
            padding: '14px', border: '1px dashed var(--line-strong)', background: 'transparent', color: 'var(--ink-faint)',
            cursor: 'pointer', fontFamily: 'var(--ff-sans)', fontSize: 13.5, fontWeight: 600 }}
            onClick={() => setSetting(true)}>
            <CMPI.plus size={15} /> Set a new bearing</button>
        </div>

        <p style={{ textAlign: 'center', margin: '22px 0 0' }}>
          <CmpMono dim>Few by design. A bearing is hard to add and rarely changed — that constraint is the point.</CmpMono></p>
      </div>
    </main>
    {setting && <SetBearingSheet count={list.length} go={go} onClose={() => setSetting(false)} />}
   </React.Fragment>
  );
}

// ════════════════════════ THE ORIENTATION PAGE ════════════════════════
function TideOrientation({ go, slug }) {
  const o = window.orientById(slug) || window.ORIENTATIONS[0];
  const built = window.orientBuilt(o.id);
  const wake = window.wakeSeries(o.id);
  const h = o.horizon;
  const [kept, setKept] = React.useState(o.promise.kept);

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 48px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => go('compass')}>
          <CMPI.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> Compass</button>

        <div className="crystal" style={{ padding: '24px 26px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <CmpOType>orientation</CmpOType>
            {o.threads.map((t) => <CmpPill key={t} t={cmpThreadTint(t)}>{cmpThreadName(t)}</CmpPill>)}
            <span style={{ flex: 1 }} />
            <CMPI.compass size={17} style={{ color: 'var(--sacred-ink)', opacity: .8 }} />
          </div>

          <h1 className="display" style={{ margin: '0 0 4px', fontSize: 30, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.08, whiteSpace: 'normal' }}>{o.label}</h1>
          {o.note && <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)', fontStyle: 'italic' }}>{o.note}</p>}

          {/* the horizon — optional, room-remaining forward, never a countdown */}
          {h && (
            <div style={{ margin: '20px 0 4px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
                <CMPI.horizon size={14} style={{ color: 'var(--ink-faint)' }} />
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>the horizon</span>
                <span style={{ flex: 1 }} />
                <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>{h.shore}</span>
              </div>
              <div className="cmp-horizon">
                <div className="cmp-horizon-done" style={{ width: (h.day / h.total * 100) + '%' }} />
                <span className="cmp-horizon-now" style={{ left: (h.day / h.total * 100) + '%' }}><CMPI.star4f size={11} style={{ color: 'var(--sacred)' }} /></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 }}>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>day {h.day}</span>
                <span style={{ flex: 1 }} />
                <span className="display" style={{ fontSize: 13.5, fontWeight: 700 }}>{h.ahead} days of water still ahead</span>
              </div>
            </div>
          )}

          {/* the wake — the hero: distance covered, only kept days render */}
          <div style={{ marginTop: 22 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 9, marginBottom: 11 }}>
              <span className="display" style={{ fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap', flex: '0 0 auto' }}>{o.kept} kept</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>across {o.days} days · the wake behind you</span>
            </div>
            <div className="cmp-wake">
              {wake.map((on, i) => on && (
                <span key={i} className="cmp-wakemark" style={{ left: (i / wake.length * 92 + 2) + '%',
                  opacity: 0.32 + (i / wake.length) * 0.68, transform: `translateY(${Math.sin(i * 0.7) * 5}px)` }} />
              ))}
              <span className="cmp-wakestar"><CMPI.star4 size={18} style={{ color: 'var(--sacred)' }} /></span>
            </div>
            <div style={{ display: 'flex', marginTop: 8 }}>
              <CmpMono dim style={{ fontSize: 10.5 }}>where you set out</CmpMono><span style={{ flex: 1 }} />
              <CmpMono dim style={{ fontSize: 10.5 }}>here · now → the bearing</CmpMono>
            </div>
          </div>

          {/* what's built toward this — the roll-up via the existing attach wiring */}
          <div style={{ marginTop: 24 }}>
            <div className="cmp-eyebrow" style={{ marginBottom: 11, color: 'var(--sacred-ink)' }}><CMPI.star4 size={11} /> What’s built toward this</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {built.focus.map((it, i) => (
                <div key={'f' + i} className="cmp-built">
                  <span style={{ color: 'var(--ink-muted)', display: 'flex' }}><CmpKind kind={it.kind} size={15} /></span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{it.text}</span>
                  <CmpMono dim style={{ fontSize: 10.5 }}>in focus · {it.when}</CmpMono>
                </div>
              ))}
              {built.cadences.map((c) => (
                <div key={c.id} className="cmp-built" style={{ cursor: 'pointer' }} onClick={() => go('dashboard')}>
                  <span style={{ color: 'var(--ink-muted)', display: 'flex' }}><CMPI.repeat size={15} /></span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{c.text}</span>
                  <CmpMono dim style={{ fontSize: 10.5 }}>{window.CADENCE_LABEL[c.cadence]} · kept {c.kept} {c.keptUnit}</CmpMono>
                </div>
              ))}
              {built.crystal && (
                <div className="cmp-built" style={{ cursor: 'pointer' }} onClick={() => go('crystal')}>
                  <span style={{ color: 'var(--sacred-ink)', display: 'flex' }}><CMPI.gem size={15} /></span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{built.crystal.text}</span>
                  <CmpMono dim style={{ fontSize: 10.5 }}>{built.crystal.type}</CmpMono>
                </div>
              )}
            </div>
          </div>

          {/* today's small promise — a tiny Cadence carrying role=promise */}
          <div style={{ marginTop: 18 }}>
            <div className="cmp-eyebrow" style={{ marginBottom: 10, color: 'var(--sacred-ink)' }}><CMPI.star4 size={11} /> Today’s small promise</div>
            <div className={'cmp-promise' + (kept ? ' kept' : '')}>
              <button className={'cmp-keep' + (kept ? ' on' : '')} aria-label="keep the promise"
                onClick={() => { const n = !kept; setKept(n); cmpToast({ text: n ? 'Kept — credibility with yourself. Comes back tomorrow.' : 'Set down. No mark either way.', kind: n ? 'crystal' : 'release' }); }}>
                <CMPI.tick size={17} /></button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 15.5, fontWeight: 600, color: kept ? 'var(--ink-muted)' : 'var(--ink)' }}>{o.promise.text}</p>
                <CmpMono dim style={{ fontSize: 11.5 }}>{kept ? 'kept today · a missed day leaves no trace' : 'so small it’s hard to say no — one click, never required'}</CmpMono>
              </div>
              <CmpMono dim style={{ fontSize: 10.5 }}>a tiny rhythm</CmpMono>
            </div>
          </div>

          {/* the emotional peak — the directional "still true?" */}
          <div className="cmp-still" style={{ marginTop: 22 }}>
            <CMPI.compass size={16} style={{ color: 'var(--sacred-ink)' }} />
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ margin: 0, fontSize: 13.5 }}>You set this bearing <b>{o.set}</b>. Still what you’re about?</p>
            </div>
            <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600 }}
              onClick={() => cmpToast({ text: 'Still true — your bearing holds.', kind: 'crystal' })}>Still true</button>
            <button className="btn btn-ghost btn-sm" onClick={() => cmpToast({ text: 'Reword it when the words stop fitting.', undo: false })}>Reword</button>
            <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-faint)' }}
              onClick={() => cmpToast({ text: 'Let it set — moved out of Compass. Still in search.', kind: 'release', undo: true })}>Let it set</button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ════════════════════ SET A BEARING — the creation flow ════════════════════
// The deliberate, high-friction inverse of capture. Two beats: COMPOSE (a
// reflective statement + an optional finish line + what already flows toward
// it) then a SIT-WITH-IT confirm that names the "few" constraint out loud.
// Real entry points in the build: here, and "crystallize an item as a bearing"
// (a bearing IS a forward-pointed crystal) — both land in this same sheet.
const STARTERS = ['Run', 'See', 'Stay close to', 'Grow at', 'Make', 'Learn'];
function SetBearingSheet({ count, go, onClose }) {
  const [text, setText] = React.useState('');
  const [hasHorizon, setHasHorizon] = React.useState(false);
  const [when, setWhen] = React.useState('');
  const [picked, setPicked] = React.useState([]);
  const [confirming, setConfirming] = React.useState(false);
  const currents = window.THREADS.slice(0, 6);
  const ready = text.trim().length > 3;
  const toggle = (s) => setPicked((p) => p.includes(s) ? p.filter((x) => x !== s) : [...p, s]);
  const days = when ? 1000 : 0;

  return (
    <div className="cmp-overlay" onClick={onClose}>
      <div className="cmp-sheet" onClick={(e) => e.stopPropagation()}>
        {/* header — the sky register, so the mood reads as "above the tide" */}
        <div className="cmp-sky cmp-sheet-head">
          <CmpStars />
          <div style={{ position: 'relative' }}>
            <div className="cmp-eyebrow" style={{ marginBottom: 9 }}><CMPI.compass size={13} /> Set a bearing</div>
            <h2 className="display" style={{ margin: 0, fontSize: 23, fontWeight: 700, letterSpacing: '-.02em' }}>What are you about?</h2>
            <p style={{ margin: '7px 0 0', fontSize: 13.5, color: 'var(--ink-muted)', maxWidth: 460 }}>
              A bearing is one of the few things the rest is for. Slow to add, rarely changed — so take a breath with it.</p>
          </div>
          <button className="cmp-x" onClick={onClose} aria-label="close"><CMPI.x size={16} /></button>
        </div>

        {!confirming ? (
          <div className="cmp-sheet-body">
            {/* the statement — a direction, not a task */}
            <label className="cmp-flabel">The statement</label>
            <textarea className="cmp-input" rows={2} autoFocus value={text} onChange={(e) => setText(e.target.value)}
              placeholder="Something you want to be true — phrased as a direction you’re moving." />
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 9 }}>
              <CmpMono dim style={{ fontSize: 11 }}>start with a verb</CmpMono>
              {STARTERS.map((s) => (
                <button key={s} className="cmp-starter" onClick={() => setText((t) => (t.trim() ? t : s + ' '))}>{s}…</button>
              ))}
            </div>

            {/* optional finish line — most bearings won't have one */}
            <div className="cmp-divider" />
            <button className="cmp-toggle" onClick={() => setHasHorizon((v) => !v)}>
              <span className={'cmp-switch' + (hasHorizon ? ' on' : '')}><span /></span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>Is there a finish line?</span>
                <CmpMono dim style={{ fontSize: 11.5, display: 'block', marginTop: 2 }}>
                  most bearings are open-ended — leave this off for the intangible ones</CmpMono>
              </span>
            </button>
            {hasHorizon && (
              <div className="cmp-horizon-set">
                <CMPI.horizon size={15} style={{ color: 'var(--ink-faint)' }} />
                <input className="cmp-input cmp-input-sm" value={when} onChange={(e) => setWhen(e.target.value)} placeholder="by when? e.g. Oct 2027" />
                {when && <CmpMono dim style={{ fontSize: 11, whiteSpace: 'nowrap' }}>≈ {days} days · framed as room ahead, never a countdown</CmpMono>}
              </div>
            )}

            {/* optional: seed the roll-up from existing currents */}
            <div className="cmp-divider" />
            <label className="cmp-flabel">What already flows toward this? <span style={{ color: 'var(--ink-faint)', fontWeight: 400 }}>· optional</span></label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
              {currents.map((t) => (
                <button key={t.slug} className={'cmp-pick' + (picked.includes(t.slug) ? ' on' : '')} onClick={() => toggle(t.slug)}>
                  {picked.includes(t.slug) && <CMPI.check size={12} />}{t.name}</button>
              ))}
            </div>

            <div className="cmp-sheet-foot">
              <CmpMono dim style={{ fontSize: 11.5 }}>{count} of ~6 bearings · few by design</CmpMono>
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
              <button className="btn btn-sm" disabled={!ready}
                style={{ background: ready ? 'var(--sacred)' : 'var(--sunk)', borderColor: ready ? 'var(--sacred)' : 'var(--line)', color: ready ? '#2A1B08' : 'var(--ink-faint)', fontWeight: 600 }}
                onClick={() => setConfirming(true)}>Sit with it →</button>
            </div>
          </div>
        ) : (
          /* the friction beat — name the weight before committing */
          <div className="cmp-sheet-body">
            <div className="cmp-confirm">
              <CmpGlyph name="star4" tint="sage" size={40} />
              <p className="display" style={{ margin: '14px 0 0', fontSize: 19, fontWeight: 700, letterSpacing: '-.01em', lineHeight: 1.2 }}>“{text.trim()}”</p>
              <p style={{ margin: '12px 0 0', fontSize: 13.5, color: 'var(--ink-muted)', maxWidth: 420 }}>
                Bearings are load-bearing — the rest of Steep will point at this one. You can reword it later, but you’ll rarely change it. Ready to steer by it?</p>
              {hasHorizon && when && <CmpMono dim style={{ fontSize: 11.5, marginTop: 10 }}>finish line · {when} · ≈ {days} days of room ahead</CmpMono>}
            </div>
            <div className="cmp-sheet-foot">
              <button className="btn btn-ghost btn-sm" onClick={() => setConfirming(false)}>
                <CMPI.arrowR size={13} style={{ transform: 'rotate(180deg)' }} /> Keep editing</button>
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost btn-sm" onClick={() => { cmpToast({ text: 'Saved as a draft bearing — sit with it. It’s in search, not yet in Compass.', kind: 'crystal' }); onClose(); }}>Save as draft</button>
              <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600 }}
                onClick={() => { cmpToast({ text: 'A new bearing set. The rest can point at it now.', kind: 'crystal' }); onClose(); }}>
                <CMPI.compass size={14} /> Set this bearing</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { CompassBand, TideCompass, TideOrientation, SetBearingSheet });
