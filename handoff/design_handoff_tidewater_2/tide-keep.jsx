// Tidewater — Crystal detail + Weekly review + Crystals gallery + Settings.
const { Ic: K, KindIcon: KKind2, Mono: KM2 } = window;
const { Pill: KPill, CType: KC2, Medallion: KMed2, Wave: KWave2, toast: ktoast } = window;

// ════════════════════════════ CRYSTAL DETAIL ═══════════════════════════
function TideCrystal({ go }) {
  const c = window.CRYSTAL;
  const types = ['principle', 'quote', 'reminder', 'hint', 'memory'];
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 18 }} onClick={() => go('project', c.thread)}><K.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {c.thread}</button>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: 24, alignItems: 'start' }}>
        {/* the crystal */}
        <div>
          <div className="crystal" style={{ padding: '30px 32px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <K.gem size={18} style={{ color: 'var(--sacred-ink)' }} />
              <KM2 style={{ fontSize: 12, color: 'var(--sacred-ink)' }}>a kept thing</KM2>
              <span style={{ flex: 1 }} /><KPill t={c.tint}>{c.thread}</KPill>
            </div>
            <p className="display" style={{ margin: '0 0 22px', fontSize: 28, fontWeight: 700, lineHeight: 1.3, letterSpacing: '-.015em' }}>{c.text}</p>
            <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.65, color: 'var(--ink-muted)' }}>{c.note}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 16, borderTop: '1px solid color-mix(in oklab, var(--sacred) 22%, var(--line))' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><K.refresh size={14} style={{ color: 'var(--sacred-ink)' }} /><KM2 dim style={{ fontSize: 12 }}>re-surfaced {c.kept}×</KM2></span>
              <KM2 dim style={{ fontSize: 12 }}>{c.born}</KM2>
              <span style={{ flex: 1 }} />
              <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600 }}
                onClick={() => ktoast({ text: 'Confirmed — still true.', kind: 'crystal' })}>Still true</button>
            </div>
          </div>

          {/* type picker */}
          <div style={{ marginTop: 22 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Kind of crystal</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {types.map((t) => (
                <button key={t} className="chip" style={t === c.type ? { background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08' } : {}}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* built-on + serves */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
            <h2 className="display" style={{ margin: '0 0 4px', fontSize: 17, fontWeight: 700 }}>Built on</h2>
            <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ink-faint)' }}><KM2 dim>what settled into this</KM2></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {c.builtOn.map((b, i) => (
                <div key={i} className="row" style={{ display: 'flex', gap: 11, padding: '11px 10px', alignItems: 'flex-start',
                  borderLeft: '2px solid color-mix(in oklab, var(--sacred) 40%, transparent)', borderRadius: '0 var(--r-ctrl) var(--r-ctrl) 0' }}>
                  <span style={{ color: 'var(--ink-faint)', display: 'flex', marginTop: 1 }}><KKind2 kind={b.kind} size={14} /></span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{b.text}</p>
                    <KM2 dim style={{ fontSize: 11 }}>{b.when}</KM2>
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-ghost btn-sm" style={{ marginTop: 10 }}><K.plus size={13} /> Attach more</button>
          </section>

          <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
            <h2 className="display" style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 700 }}>It serves</h2>
            {c.serves.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                <K.gem size={14} style={{ color: 'var(--sacred-ink)' }} />
                <span style={{ fontSize: 14.5, fontWeight: 600 }}>{s.text}</span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </main>
  );
}

// ════════════════════════════ WEEKLY REVIEW ════════════════════════════
function TideReview({ go }) {
  const r = window.REVIEW;
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        <KM2 dim style={{ fontSize: 12 }}>{r.range}</KM2>
        <h1 className="display" style={{ margin: '4px 0 6px', fontSize: 32, fontWeight: 700, letterSpacing: '-.02em' }}>The shape of your week</h1>
        <p style={{ margin: 0, fontSize: 16, color: 'var(--ink-muted)' }}>Not a report card. Just what moved, and what you chose to keep.</p>
        <div style={{ margin: '10px 0 0' }}><KWave2 w={200} /></div>

        {/* summary strip */}
        <div className="panel" style={{ display: 'flex', padding: '4px', marginTop: 22 }}>
          {[['captured', r.summary.captured, 'washed in'], ['kept', r.summary.kept, 'crystallized'], ['let go', r.summary.letGo, 'released'], ['sorted', r.summary.sorted, 'off the bench'], ['waiting', r.summary.stillBench, 'on the bench']].map(([l, n, sub], i) => (
            <div key={l} style={{ flex: 1, padding: '16px 18px', textAlign: 'center', borderLeft: i ? '1px solid var(--line)' : 'none' }}>
              <div className="display" style={{ fontSize: 30, fontWeight: 700, color: l === 'kept' ? 'var(--sacred-ink)' : 'var(--ink)' }}>{n}</div>
              <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>{l}</div>
              <KM2 dim style={{ fontSize: 10.5 }}>{sub}</KM2>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 22, alignItems: 'start', marginTop: 22 }}>
          <section className="panel tedge te-fresh" style={{ padding: 'var(--pad-panel)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
              <K.gem size={16} style={{ color: 'var(--sacred-ink)' }} />
              <h2 className="display" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>What you kept</h2>
            </div>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-muted)' }}>Two truths settled out this week.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {r.crystallized.map((c, i) => (
                <div key={i} className="crystal" style={{ padding: '14px 16px', cursor: 'pointer' }} onClick={() => go('crystal')}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><KC2 t={c.type} /><span style={{ flex: 1 }} /><KPill t={c.tint}>{c.thread}</KPill></div>
                  <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.45 }}>{c.type === 'quote' ? <span>“{c.text}” <span className="mono" style={{ fontSize: 11 }}>— {c.attrib}</span></span> : c.text}</p>
                </div>
              ))}
            </div>
          </section>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
              <h2 className="display" style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 700 }}>What you did</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
                {r.activity.map((a, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'baseline' }}>
                    <span className="display" style={{ fontSize: 18, fontWeight: 700, minWidth: 26, color: 'var(--action-ink)' }}>{a.n}</span>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{a.verb}</span>
                      <p style={{ margin: '1px 0 0', fontSize: 12.5, color: 'var(--ink-muted)' }}>{a.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
              <h2 className="display" style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700 }}>Still deepening</h2>
              <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ink-faint)' }}><KM2 dim>no nudge — just so you know</KM2></p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {r.stillAging.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span className="dot dot-reflect" style={{ marginTop: 6 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{s.text}</p>
                      <KM2 dim style={{ fontSize: 11 }}>{s.aged} on the shelf</KM2>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}

// ════════════════════════════ CRYSTALS GALLERY ═════════════════════════
function TideCrystals({ go }) {
  const all = [...window.PROJECT.crystals.map((c) => ({ ...c, thread: 'marathon-2027', tint: 'sage' })),
    ...window.THIS_WEEK.map((c) => ({ ...c, kept: 1 }))];
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ marginBottom: 6 }}><K.gem size={22} style={{ color: 'var(--sacred-ink)' }} /></div>
      <h1 className="display" style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 700, letterSpacing: '-.02em' }}>Crystals</h1>
      <p style={{ margin: '0 0 18px', fontSize: 16, color: 'var(--ink-muted)' }}>Everything you’ve decided is true. Your own wisdom, kept where you can find it.</p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <button className="chip on">all kinds</button>
        <button className="chip">principle</button>
        <button className="chip">quote</button>
        <button className="chip">hint</button>
        <button className="chip">reminder</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {all.map((c, i) => (
          <div key={i} className="crystal" style={{ padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column' }} onClick={() => go('crystal')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}><KC2 t={c.type} /><span style={{ flex: 1 }} /><KPill t={c.tint}>{c.thread}</KPill></div>
            <p style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.45, flex: 1 }}>{c.type === 'quote' ? `“${c.text}”` : c.text}</p>
            <KM2 dim style={{ fontSize: 10.5 }}>re-surfaced {c.kept}×</KM2>
          </div>
        ))}
      </div>
    </main>
  );
}

// ════════════════════════════ SETTINGS (skin switch) ═══════════════════
function TideSettings({ theme, onTheme }) {
  const Section = ({ title, children }) => (
    <section style={{ marginBottom: 30 }}>
      <h2 className="display" style={{ margin: '0 0 14px', fontSize: 19, fontWeight: 700 }}>{title}</h2>
      <div className="panel" style={{ padding: '6px 8px' }}>{children}</div>
    </section>
  );
  const Field = ({ label, sub, children }) => (
    <div className="row" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '15px 16px' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2 }}>{sub}</div>}
      </div>
      {children}
    </div>
  );
  const SkinCard = ({ name, desc, on, swatch }) => (
    <button style={{ textAlign: 'left', cursor: 'pointer', flex: 1, padding: '16px', borderRadius: 'var(--r-card)',
      border: '1.5px solid ' + (on ? 'var(--action)' : 'var(--line-strong)'), background: on ? 'var(--action-soft)' : 'var(--card-2)' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>{swatch.map((c, i) => <span key={i} style={{ width: 26, height: 26, borderRadius: 8, background: c }} />)}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{name}</span>
        {on && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--action-ink)', fontSize: 11, fontFamily: 'var(--ff-mono)' }}><K.check size={12} /> active</span>}
      </div>
      <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-muted)' }}>{desc}</p>
    </button>
  );
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 className="display" style={{ margin: '0 0 22px', fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>Settings</h1>

        <Section title="Appearance">
          <div style={{ padding: '10px 8px' }}>
            <div className="eyebrow" style={{ margin: '4px 8px 10px' }}>Skin</div>
            <div style={{ display: 'flex', gap: 12, padding: '0 8px 8px' }}>
              <SkinCard name="Life" desc="Tidewater — for running a life. This skin." on swatch={['#14808A', '#DB8A4C', '#EBEEE3', '#4E8A6A']} />
              <SkinCard name="Workshop" desc="The original — blaze & dust, for deep project work." swatch={['#D9622C', '#E8B547', '#EEE2C9', '#7C8A57']} />
            </div>
          </div>
          <Field label="Light or dark" sub="Warm by day, cool by night — or pick one and stay.">
            <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
              {[['day', 'Day', K.sun], ['night', 'Night', K.moon]].map(([id, label, Ico]) => (
                <button key={id} onClick={() => { if ((id === 'night') !== (theme === 'night')) onTheme(); }}
                  style={{ border: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: 'var(--ff-sans)', fontWeight: 600, fontSize: 12.5,
                    padding: '6px 13px', borderRadius: 999, background: (theme === 'night' ? id === 'night' : id === 'day') ? 'var(--card-2)' : 'transparent',
                    color: (theme === 'night' ? id === 'night' : id === 'day') ? 'var(--action-ink)' : 'var(--ink-muted)', boxShadow: (theme === 'night' ? id === 'night' : id === 'day') ? 'var(--shadow-panel)' : 'none' }}>
                  <Ico size={14} /> {label}</button>
              ))}
            </div>
          </Field>
          <Field label="Density" sub="Tidewater runs roomy by default. Tighten if you like more on screen.">
            <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
              <window.SegBtn on>Roomy</window.SegBtn><window.SegBtn>Cozy</window.SegBtn><window.SegBtn>Compact</window.SegBtn>
            </div>
          </Field>
        </Section>

        <Section title="Lifecycle">
          <Field label="Resurface kept things" sub="How often crystals come back to ask “still true?”">
            <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
              <window.SegBtn>Often</window.SegBtn><window.SegBtn on>Gently</window.SegBtn><window.SegBtn>Rarely</window.SegBtn>
            </div>
          </Field>
          <Field label="Call the shelf “deepening,” not “stale”" sub="Aging language stays kind — never overdue, never red.">
            <Toggle on />
          </Field>
        </Section>

        <Section title="Smart Routing">
          <Field label="Let Claude suggest where things go" sub="You always get the final say on the bench.">
            <Toggle on />
          </Field>
          <Field label="Auto-route obvious pastes" sub="Emails and links with a clear home skip the bench.">
            <Toggle />
          </Field>
        </Section>
      </div>
    </main>
  );
}

function Toggle({ on: initial }) {
  const [on, setOn] = React.useState(!!initial);
  return (
    <button onClick={() => setOn(!on)} style={{ width: 46, height: 26, borderRadius: 999, border: 0, cursor: 'pointer', position: 'relative',
      background: on ? 'var(--action)' : 'var(--line-strong)', transition: 'background .16s ease' }}>
      <span style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: 999, background: '#fff',
        transition: 'left .16s ease', boxShadow: '0 1px 3px rgba(0,0,0,.3)' }} /></button>
  );
}

Object.assign(window, { TideCrystal, TideReview, TideCrystals, TideSettings });
