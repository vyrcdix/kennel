// Tidewater — Project landing + Sort (triage queue).
const { Ic: W, KindIcon: WKind, Mono: WM } = window;
const { Pill: WPill, Tag: WTag, CType: WC, Medallion: WMed, Depth: WDepth, DEPTH: WDEPTH,
  Wave: WWave, EmptyState: WEmpty, toast: wtoast } = window;

// ════════════════════════════ PROJECT LANDING ══════════════════════════
function TideProject({ go, slug }) {
  const p = window.PROJECT; // demo always resolves to marathon-2027
  const Panel = ({ title, right, children, sub }) => (
    <section className="panel" style={{ padding: 'var(--pad-panel)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: sub ? 4 : 14, gap: 10 }}>
        <h2 className="display" style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h2>
        <span style={{ flex: 1 }} />{right}
      </div>
      {sub && <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ink-faint)' }}><WM dim>{sub}</WM></p>}
      {children}
    </section>
  );

  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '26px 30px 40px' }}>
      {/* header */}
      <div className="panel tedge te-fresh" style={{ padding: '22px 24px', marginBottom: 22, display: 'flex', gap: 18, alignItems: 'flex-start' }}>
        <WMed tint={p.tint} icon={p.icon} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 className="display" style={{ margin: 0, fontSize: 27, fontWeight: 700, letterSpacing: '-.015em' }}>{p.name}</h1>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999,
              background: 'var(--sacred-soft)', color: 'var(--sacred-ink)' }}>
              <span style={{ width: 6, height: 6, borderRadius: 9, background: 'var(--sacred)' }} /><WM style={{ fontSize: 11, color: 'inherit' }}>sunlit</WM></span>
          </div>
          <p style={{ margin: '6px 0 0', fontSize: 15, color: 'var(--ink-muted)' }}>{p.blurb}</p>
          <div style={{ display: 'flex', gap: 18, marginTop: 12 }}>
            {[['in focus', p.stats.focus], ['on the shelf', p.stats.reflect], ['crystals', p.stats.crystals], ['docs', p.stats.docs]].map(([l, n]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="display" style={{ fontSize: 18, fontWeight: 700 }}>{n}</span><WM dim style={{ fontSize: 11.5 }}>{l}</WM></span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 230 }}>
          <button className="btn btn-soft btn-sm" onClick={() => go('fieldnotes')}><W.note size={14} /> Field notes</button>
          <button className="btn btn-soft btn-sm" onClick={() => go('trace')}><W.layers size={14} /> Trace</button>
          <button className="btn btn-soft btn-sm"><W.ask size={14} /> Ask Claude</button>
          <button className="btn btn-primary btn-sm"><W.plus size={14} /> Capture here</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 360px', gap: 22, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Panel title="In focus" right={<WM dim>flowing toward sub-4:00</WM>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {p.focus.map((it, i) => (
                <div key={i} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px' }}>
                  <span className="dot dot-focus" />
                  <span style={{ color: 'var(--ink-faint)', display: 'flex' }}><WKind kind={it.kind} size={15} /></span>
                  <span style={{ flex: 1, fontSize: 14.5 }}>{it.text}</span>
                  {it.when && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-faint)' }}><W.clock size={13} /><WM dim style={{ fontSize: 11.5 }}>{it.when}</WM></span>}
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Crystals" right={<button className="btn btn-ghost btn-sm" onClick={() => go('crystals')}>See all <W.arrowR size={13} /></button>}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {p.crystals.map((c, i) => (
                <div key={i} className="crystal" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => go('crystal')}>
                  <WC t={c.type} />
                  <p style={{ margin: '8px 0 10px', fontSize: 14, lineHeight: 1.4 }}>{c.type === 'quote' ? `“${c.text}”` : c.text}</p>
                  <WM dim style={{ fontSize: 10.5 }}>re-surfaced {c.kept}×</WM>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Docs &amp; guides">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {p.docs.map((d, i) => (
                <div key={i} className="row" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 13px',
                  border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', background: 'var(--card-2)', cursor: 'pointer' }}
                  onClick={() => go(d.kind === 'runbook' ? 'runbook' : d.kind === 'guidebook' ? 'guidebook' : 'doc')}>
                  <span style={{ color: 'var(--fam-guide)', display: 'flex' }}>
                    {d.kind === 'runbook' ? <W.run size={16} /> : d.kind === 'guidebook' ? <W.book size={16} /> : <W.doc size={16} />}</span>
                  <span style={{ flex: 1, fontSize: 14.5, fontWeight: 500 }}>{d.name}</span>
                  <WM dim style={{ fontSize: 11.5 }}>{d.meta}</WM>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <Panel title="Recently sorted" right={<button className="btn btn-ghost btn-sm" style={{ color: 'var(--action-ink)' }}><W.undo size={13} /> Undo</button>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {p.sorted.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 4px' }}>
                  <span style={{ color: 'var(--ink-faint)', display: 'flex' }}><WKind kind={s.kind === 'principle' ? 'idea' : s.kind} size={14} /></span>
                  <span style={{ flex: 1, fontSize: 13.5 }}>{s.text}</span>
                  <WM dim style={{ fontSize: 11 }}>{s.when}</WM>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="On the shelf" right={<button className="btn btn-ghost btn-sm" onClick={() => go('reflecting')}>Walk it <W.arrowR size={13} /></button>}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {window.REFLECTING.filter((r) => r.thread === 'marathon-2027').map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span className="dot dot-reflect" style={{ marginTop: 6 }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{r.text}</p>
                    <WM dim style={{ fontSize: 11 }}>{r.shelved}</WM>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Conversations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {p.chats.map((c, i) => (
                <div key={i} style={{ display: 'flex', gap: 11, alignItems: 'flex-start' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, flex: '0 0 auto', fontFamily: 'var(--ff-mono)', fontSize: 10,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    background: c.who === 'Claude' ? 'var(--action-soft)' : 'var(--sunk)', color: c.who === 'Claude' ? 'var(--action-ink)' : 'var(--ink-muted)' }}>{c.who === 'Claude' ? 'AI' : 'CD'}</span>
                  <div style={{ flex: 1 }}><p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.4 }}>{c.text}</p><WM dim style={{ fontSize: 11 }}>{c.when}</WM></div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </main>
  );
}

// ════════════════════════════ SORT (triage) ════════════════════════════
function TideSort({ go }) {
  const [queue, setQueue] = React.useState(window.BENCH.map((b) => ({ ...b })));
  const [sel, setSel] = React.useState(0);
  const [leaving, setLeaving] = React.useState(null);
  const cur = queue[Math.min(sel, queue.length - 1)];

  const route = (it, kind) => {
    if (leaving) return;
    const snap = queue;
    const cls = kind === 'release' ? 'release' : kind === 'crystal' ? 'crystal' : '';
    const dur = kind === 'release' ? 440 : kind === 'crystal' ? 320 : 380;
    setLeaving({ id: it.id, cls });
    setTimeout(() => {
      setQueue((q) => q.filter((x) => x.id !== it.id));
      setSel((s) => Math.min(s, queue.length - 2 < 0 ? 0 : queue.length - 2));
      setLeaving(null);
      if (kind === 'accept') wtoast({ text: `Routed to ${it.suggest.thread || 'a new thread'} · ${it.suggest.kind}.`, kind: 'focus', undo: true, onUndo: () => setQueue(snap) });
      if (kind === 'aside') wtoast({ text: 'Set aside on the shelf.', undo: true, onUndo: () => setQueue(snap) });
      if (kind === 'crystal') { wtoast({ text: 'Crystallized — a kept thing.', kind: 'crystal' }); setTimeout(() => go('crystal'), 240); }
      if (kind === 'release') wtoast({ text: 'The tide took it.', kind: 'release', undo: true, onUndo: () => setQueue(snap) });
    }, dur);
  };

  React.useEffect(() => {
    const onKey = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      const k = e.key.toLowerCase();
      if (k === 'j') { setSel((s) => Math.min(s + 1, queue.length - 1)); e.preventDefault(); }
      else if (k === 'k') { setSel((s) => Math.max(s - 1, 0)); e.preventDefault(); }
      else if (cur) {
        if (k === 'enter' || k === 'a') route(cur, 'accept');
        else if (k === 's') route(cur, 'aside');
        else if (k === 'c') route(cur, 'crystal');
        else if (k === 'x') route(cur, 'release');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* queue */}
      <div style={{ width: 384, flex: '0 0 384px', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '22px 24px 14px' }}>
          <h1 className="display" style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-.015em' }}>Sort the bench</h1>
          <p style={{ margin: '5px 0 0', fontSize: 13.5, color: 'var(--ink-muted)' }}>{queue.length ? `${queue.length} thoughts washed in. One at a time — no rush.` : 'All clear.'}</p>
          <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
            <button className="chip on">all</button>
            <button className="chip">ideas</button>
            <button className="chip">actions</button>
            <button className="chip">refs</button>
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 12px 16px' }}>
          {queue.length === 0
            ? <WEmpty icon="tide" line="The bench is clear." sub="Nothing waiting. The good kind of empty." />
            : queue.map((it, i) => {
                const isSel = it.id === cur?.id;
                const lv = leaving && leaving.id === it.id ? ' item-leave ' + leaving.cls : '';
                return (
                  <div key={it.id} className={'row' + (isSel ? ' sel' : '') + lv} style={{ display: 'flex', gap: 11, padding: '12px 13px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: 2 }}
                    onClick={() => setSel(i)}>
                    <span style={{ color: 'var(--ink-faint)', display: 'flex', marginTop: 2 }}><WKind kind={it.kind} size={15} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.text}</p>
                      <WM dim style={{ fontSize: 11 }}>{it.meta}</WM>
                    </div>
                  </div>
                );
              })}
        </div>
        <div style={{ padding: '12px 24px', borderTop: '1px solid var(--line)' }}>
          <span className="kbdhint"><span className="kbd">J</span><span className="kbd">K</span> walk · <span className="kbd">↵</span> accept · <span className="kbd">S</span> shelf · <span className="kbd">C</span> keep · <span className="kbd">X</span> let go</span>
        </div>
      </div>

      {/* preview */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '34px 40px', minHeight: 0 }}>
        {!cur ? <div style={{ maxWidth: 520, margin: '40px auto' }}><WEmpty icon="gem" line="Nicely done." sub="The bench is empty and nothing’s overdue." /></div>
        : <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
              <span style={{ color: 'var(--ink-faint)', display: 'flex' }}><WKind kind={cur.kind} size={16} /></span>
              <WM dim style={{ fontSize: 12 }}>{cur.meta}</WM>
            </div>
            <p className="display" style={{ margin: '0 0 18px', fontSize: 23, fontWeight: 600, lineHeight: 1.3, letterSpacing: '-.01em' }}>{cur.text}</p>
            {cur.body && <p style={{ margin: '0 0 22px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{cur.body}</p>}

            {/* Claude's suggested routing */}
            <div className="panel" style={{ padding: '16px 18px', marginBottom: 22, background: 'var(--action-soft)', borderColor: 'color-mix(in oklab, var(--action) 22%, var(--line))' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: 'var(--action)', color: '#F4FBFA', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><W.spark size={12} /></span>
                <WM style={{ fontSize: 12, color: 'var(--action-ink)' }}>Claude suggests</WM>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 15 }}>Route to</span>
                {cur.suggest.thread ? <WPill t={cur.suggest.tint}>{cur.suggest.thread}</WPill> : <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>a new thread</span>}
                <span style={{ fontSize: 15 }}>as a</span>
                <span className="mono" style={{ fontSize: 12, padding: '2px 9px', borderRadius: 999, background: 'var(--card-2)', color: 'var(--ink-muted)' }}>{cur.suggest.kind}</span>
                <button className="btn btn-ghost btn-sm" style={{ marginLeft: 'auto' }}>Change…</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => route(cur, 'accept')}>Accept route <span className="kbd" style={{ marginLeft: 4, background: 'rgba(255,255,255,.18)', color: '#fff', borderColor: 'transparent' }}>↵</span></button>
              <button className="btn btn-soft" onClick={() => route(cur, 'aside')}><W.shelf size={15} /> Set aside <span className="kbd">S</span></button>
              <button className="btn btn-ghost" style={{ color: 'var(--sacred-ink)' }} onClick={() => route(cur, 'crystal')}><W.gem size={15} /> Crystallize <span className="kbd">C</span></button>
              <span style={{ flex: 1 }} />
              <button className="btn btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={() => route(cur, 'release')}><W.release size={15} /> Let go <span className="kbd">X</span></button>
            </div>
          </div>}
      </div>
    </main>
  );
}

Object.assign(window, { TideProject, TideSort });
