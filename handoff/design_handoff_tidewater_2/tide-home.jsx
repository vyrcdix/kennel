// Tidewater — Dashboard + Reflecting (interactive).
const { Ic: H, KindIcon: HKind, Mono: HM } = window;
const { Pill: HPill, Tag: HTag, CType: HC, Medallion: HMed, Depth: HDepth, DEPTH: HDEPTH,
  Wave: HWave, SegBtn: HSeg, EmptyState: HEmpty, toast: htoast } = window;

// ════════════════════════════ DASHBOARD ════════════════════════════════
function TideDashboard({ go }) {
  const [lens, setLens] = React.useState('serves');
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '26px 30px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 20 }}>
        <div>
          <HM dim style={{ fontSize: 12 }}>Tuesday · 7:14</HM>
          <h1 className="display" style={{ margin: '4px 0 0', fontSize: 28, fontWeight: 700, letterSpacing: '-.02em' }}>The tide’s calm.</h1>
          <p style={{ margin: '5px 0 0', fontSize: 14.5, color: 'var(--ink-muted)' }}>Nothing’s gone cold. Eight thoughts washed in — sort them when you’re ready.</p>
          <div style={{ marginTop: 8 }}><HWave w={180} /></div>
        </div>
        <span style={{ flex: 1 }} />
        <button className="btn btn-primary" style={{ fontSize: 14.5, padding: '11px 18px' }} onClick={() => go('bench')}>
          Sort the bench <H.arrowR size={16} /></button>
      </div>

      <Hearth go={go} />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 372px', gap: 22, alignItems: 'start', marginTop: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Focus lens={lens} setLens={setLens} go={go} />
          <ThisWeek go={go} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Threads go={go} />
          <Recent />
        </div>
      </div>
    </main>
  );
}

function Hearth({ go }) {
  return (
    <section className="hearth tedge te-fresh" style={{ padding: '20px 22px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <H.gem size={17} style={{ color: 'var(--sacred-ink)' }} />
        <h2 className="display" style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-.01em' }}>Worth revisiting</h2>
        <span style={{ flex: 1 }} />
        <HM dim>what’s settled, asking to be looked at · 3 of 5</HM>
      </div>
      <p style={{ margin: '0 0 16px 27px', color: 'var(--ink-muted)', fontSize: 13.5 }}>Things you decided were true. Still?</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 13 }}>
        {window.RESURFACING.map((c, i) => (
          <div key={i} className="crystal" style={{ padding: '15px 15px 13px', display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
            onClick={() => go('crystal')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <HC t={c.type} /><span style={{ flex: 1 }} /><HPill t={c.tint}>{c.thread}</HPill>
            </div>
            <p style={{ margin: '0 0 12px', fontSize: 15, lineHeight: 1.45, flex: 1 }}>{c.type === 'quote' ? `“${c.text}”` : c.text}</p>
            <HM dim style={{ fontSize: 10.5, marginBottom: 11 }}>re-surfaced {c.kept}× · kept fresh</HM>
            <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
              <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600, flex: 1, justifyContent: 'center' }}
                onClick={() => htoast({ text: 'Still true — kept fresh.', kind: 'crystal' })}>Still true</button>
              <button className="btn btn-ghost btn-sm" title="Revisit" onClick={() => go('crystal')}><H.pencil size={14} /></button>
              <button className="btn btn-ghost btn-sm" title="Retire" onClick={() => htoast({ text: 'Retired — moved to the archive.', kind: 'release', undo: true })}><H.retire size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Focus({ lens, setLens, go }) {
  const groups = window.groupFocus(lens);
  const hmeta = (id) => window.HORIZONS.find((h) => h.id === id) || {};
  return (
    <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>In focus</h2>
        <span style={{ flex: 1 }} />
        <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
          <HSeg on={lens === 'serves'} onClick={() => setLens('serves')}>What it serves</HSeg>
          <HSeg on={lens === 'horizon'} onClick={() => setLens('horizon')}>By when</HSeg>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {groups.map((g, gi) => {
          const loose = g.key === '__loose';
          const h = lens === 'horizon' ? hmeta(g.key) : null;
          const rail = lens === 'horizon' ? (loose ? 'var(--line-strong)' : h.tone)
            : (loose ? 'var(--line-strong)' : 'linear-gradient(180deg, var(--sacred), var(--action))');
          return (
            <div key={gi} style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 3, borderRadius: 999, alignSelf: 'stretch', flex: '0 0 auto', background: rail, opacity: loose ? .5 : 1 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, opacity: loose ? .6 : 1 }}>
                  {lens === 'serves'
                    ? (loose ? <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>loose in the water — not attached yet</span>
                        : <><H.gem size={13} style={{ color: 'var(--sacred-ink)' }} />
                            <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>flowing toward</span>
                            <span style={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>{g.key}</span></>)
                    : <><span style={{ width: 8, height: 8, borderRadius: 9, background: h.tone, flex: '0 0 auto' }} />
                        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{h.label}</span>
                        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)' }}>· {h.sub}</span></>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {g.items.map((it, ii) => (
                    <div key={ii} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', cursor: 'pointer' }}
                      onClick={() => it.thread && go('project', it.thread)}>
                      <span className="dot dot-focus" />
                      <span style={{ color: 'var(--ink-faint)', display: 'flex' }}><HKind kind={it.kind} size={15} /></span>
                      <span style={{ flex: 1, fontSize: 14.5 }}>{it.text}</span>
                      {lens === 'serves'
                        ? (it.when && it.horizon !== 'no-rush' &&
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: it.blocks ? 'var(--action-ink)' : 'var(--ink-faint)' }}>
                              <H.clock size={13} /><HM dim style={{ fontSize: 11.5, color: 'inherit' }}>{it.when}</HM></span>)
                        : <HPill t={it.tint}>{it.thread}</HPill>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Threads({ go }) {
  return (
    <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
      <h2 className="display" style={{ margin: '0 0 6px', fontSize: 19, fontWeight: 700 }}>Where you were</h2>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ink-faint)' }}>
        <HM dim>the bar shows depth — bright &amp; high is fresh, deep &amp; still is dormant</HM></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        {window.THREADS.map((p) => (
          <div key={p.slug} className="row" style={{ display: 'flex', gap: 13, padding: '13px 14px', border: '1px solid var(--line)',
            borderRadius: 'var(--r-ctrl)', background: 'var(--card-2)', cursor: 'pointer' }} onClick={() => go('project', p.slug)}>
            <HDepth t={p.temp} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                <HMed tint={p.tint} icon={p.icon} />
                <span style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{p.name}</span>
                <HM dim style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em' }}>{(HDEPTH[p.temp] || {}).label}</HM>
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-muted)', marginBottom: 8 }}>{p.last}</div>
              <div style={{ display: 'flex', gap: 14 }}>
                {p.focus > 0 && <HM dim style={{ fontSize: 11.5 }}>{p.focus} in focus</HM>}
                <HM dim style={{ fontSize: 11.5, color: 'var(--dot-reflect)' }}>{p.reflect} on the shelf</HM>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ThisWeek({ go }) {
  return (
    <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 12 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>This week</h2>
        <span style={{ flex: 1 }} />
        <HM dim>31 in · 2 kept · 8 let go</HM>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
        {window.THIS_WEEK.map((c, i) => (
          <div key={i} className="crystal" style={{ padding: '11px 13px', display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }} onClick={() => go('crystal')}>
            <H.gem size={14} style={{ color: 'var(--sacred-ink)', marginTop: 3 }} />
            <div style={{ flex: 1 }}>
              <HC t={c.type} />
              <p style={{ margin: '6px 0 0', fontSize: 14, lineHeight: 1.4 }}>
                {c.type === 'quote' ? <span>“{c.text}” <span className="mono" style={{ fontSize: 11 }}>— {c.attrib}</span></span> : c.text}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="btn btn-soft" style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => go('review')}>
        <span>The shape of your week</span><H.arrowR size={15} /></button>
    </section>
  );
}

function Recent() {
  return (
    <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
      <h2 className="display" style={{ margin: '0 0 14px', fontSize: 19, fontWeight: 700 }}>Lately</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {window.RECENT.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
            <span style={{ width: 24, height: 24, borderRadius: 999, flex: '0 0 auto', fontFamily: 'var(--ff-mono)', fontSize: 10,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              background: r.who === 'Claude' ? 'var(--action-soft)' : 'var(--sunk)',
              color: r.who === 'Claude' ? 'var(--action-ink)' : 'var(--ink-muted)' }}>{r.who === 'Claude' ? 'AI' : 'CD'}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{r.text}</p>
              <HM dim style={{ fontSize: 11 }}>{r.when}</HM>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ════════════════════════════ REFLECTING ═══════════════════════════════
function TideReflecting({ go }) {
  const [items, setItems] = React.useState(window.REFLECTING.map((x, i) => ({ ...x, _id: i })));
  const [sel, setSel] = React.useState(3);
  const [filter, setFilter] = React.useState('all');
  const [leaving, setLeaving] = React.useState(null); // { id, cls }

  const view = items.filter((it) => filter === 'all' || it.thread === filter);
  const selId = view[Math.min(sel, view.length - 1)]?._id;

  const act = (it, kind) => {
    if (leaving) return;
    const snapshot = items;
    const cls = kind === 'release' ? 'release' : kind === 'crystal' ? 'crystal' : '';
    const dur = kind === 'release' ? 440 : kind === 'crystal' ? 320 : 380;
    setLeaving({ id: it._id, cls });
    setTimeout(() => {
      setItems((cur) => cur.filter((x) => x._id !== it._id));
      setLeaving(null);
      if (kind === 'pickup') htoast({ text: 'Back in focus.', kind: 'focus', undo: true, onUndo: () => setItems(snapshot) });
      if (kind === 'crystal') { htoast({ text: 'Crystallized — a kept thing.', kind: 'crystal' }); setTimeout(() => go('crystal'), 240); }
      if (kind === 'file') htoast({ text: 'Filed into the thread.', undo: true, onUndo: () => setItems(snapshot) });
      if (kind === 'release') htoast({ text: 'The tide took it. Still in search if you want it back.', kind: 'release', undo: true, onUndo: () => setItems(snapshot) });
    }, dur);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'j') { setSel((s) => Math.min(s + 1, view.length - 1)); e.preventDefault(); }
      else if (k === 'k') { setSel((s) => Math.max(s - 1, 0)); e.preventDefault(); }
      else {
        const it = view[Math.min(sel, view.length - 1)]; if (!it) return;
        if (k === 'u') act(it, 'pickup');
        else if (k === 'c') act(it, 'crystal');
        else if (k === 'f') act(it, 'file');
        else if (k === 'x') act(it, 'release');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const threadsInView = ['marathon', 'novel', 'japan', 'reading'];
  const slugMap = { marathon: 'marathon-2027', novel: 'novel', japan: 'japan-2027', reading: 'reading' };

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        <div style={{ marginBottom: 8 }}><H.shelf size={22} style={{ color: 'var(--ink-faint)' }} /></div>
        <h1 className="display" style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 700, letterSpacing: '-.02em' }}>Reflecting</h1>
        <p style={{ margin: '0 0 6px', fontSize: 16, color: 'var(--ink-muted)' }}>Not a backlog — the shallows. Things you set aside, drifting where you can still see them.</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <HWave w={90} o={.5} />
          <HM dim style={{ fontSize: 12 }}>longest-shelved first · everything’s recoverable from search</HM>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 6px', flexWrap: 'wrap' }}>
          <button className={'chip' + (filter === 'all' ? ' on' : '')} onClick={() => { setFilter('all'); setSel(0); }}>All threads</button>
          {threadsInView.map((t) => (
            <button key={t} className={'chip' + (filter === slugMap[t] ? ' on' : '')} style={{ '--tint': window.tintVar(t === 'marathon' ? 'sage' : t === 'novel' ? 'plum' : t === 'japan' ? 'dusk' : 'stone') }}
              onClick={() => { setFilter(slugMap[t]); setSel(0); }}>{t}</button>
          ))}
          <span style={{ flex: 1 }} />
          <span className="kbdhint"><span className="kbd">J</span><span className="kbd">K</span> walk · <span className="kbd">U</span> pick up · <span className="kbd">X</span> release</span>
        </div>

        {view.length === 0
          ? <div className="panel"><HEmpty icon="shelf" line="Nothing’s set aside." sub="An empty shelf is allowed. Capture something when it comes." /></div>
          : <div className="panel" style={{ padding: 8 }}>
              {view.map((it) => {
                const isSel = it._id === selId;
                const hasBody = it.kind === 'ref' || it.resolved;
                const lv = leaving && leaving.id === it._id ? ' item-leave ' + leaving.cls : '';
                return (
                  <div key={it._id} className={'row' + (isSel ? ' sel' : '') + lv} style={{ padding: isSel ? '16px' : '15px 16px',
                    display: 'flex', gap: 14, alignItems: 'flex-start', cursor: 'pointer' }}
                    onClick={() => setSel(view.indexOf(it))}>
                    <span className="dot dot-reflect" style={{ marginTop: 7 }} />
                    <span style={{ color: 'var(--ink-faint)', display: 'flex', marginTop: 2 }}><HKind kind={it.kind} size={16} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 15.5, lineHeight: 1.45, color: it.resolved ? 'var(--ink-muted)' : 'var(--ink)' }}>{it.text}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 8, flexWrap: 'wrap' }}>
                        <span onClick={(e) => { e.stopPropagation(); go('project', it.thread); }} style={{ cursor: 'pointer' }}><HPill t={it.tint}>{it.thread}</HPill></span>
                        {it.tag && <HTag>{it.tag}</HTag>}
                        <HM dim style={{ fontSize: 11.5 }}>{it.shelved}</HM>
                        {it.resolved && <span className="mono tiny" style={{ color: 'var(--dot-crystal)', display: 'inline-flex', alignItems: 'center', gap: 4 }}><H.eye size={12} /> answer came in — ready to settle</span>}
                      </div>
                      {isSel && (
                        <div style={{ display: 'flex', gap: 7, marginTop: 14, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                          <button className="btn btn-soft btn-sm" onClick={() => act(it, 'pickup')}><H.pickup size={14} /> Pick back up <span className="kbd" style={{ marginLeft: 2 }}>U</span></button>
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--sacred-ink)' }} onClick={() => act(it, 'crystal')}><H.gem size={14} /> Crystallize <span className="kbd">C</span></button>
                          <button className="btn btn-ghost btn-sm" onClick={() => act(it, 'file')}><H.file size={14} /> File <span className="kbd">F</span></button>
                          {hasBody && <button className="btn btn-ghost btn-sm" onClick={() => go('project', it.thread)}><H.arrowR size={14} /> Open</button>}
                          <span style={{ flex: 1 }} />
                          <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-faint)' }} onClick={() => act(it, 'release')}><H.release size={14} /> Let the tide take it <span className="kbd">X</span></button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>}
        <p style={{ textAlign: 'center', margin: '20px 0 0' }}>
          <HM dim>That’s the shallows. Walk it when the mood’s right — Sunday coffee is the classic.</HM></p>
      </div>
    </main>
  );
}

Object.assign(window, { TideDashboard, TideReflecting });
