// Tidewater — document surfaces: Doc editor, Field notes, Runbook, Guidebook.
const { Ic: D, Mono: DM, KindIcon: DKind } = window;
const { Pill: DPill, Tag: DTag, toast: dtoast } = window;

// tiny trusted-markdown → html (content is our own demo data)
function mdToHtml(src) {
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const inl = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
  const lines = src.split('\n'); let html = ''; let inList = false;
  const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };
  lines.forEach((ln) => {
    if (/^### /.test(ln)) { closeList(); html += `<h4>${inl(ln.slice(4))}</h4>`; }
    else if (/^## /.test(ln)) { closeList(); html += `<h3>${inl(ln.slice(3))}</h3>`; }
    else if (/^# /.test(ln)) { closeList(); html += `<h2>${inl(ln.slice(2))}</h2>`; }
    else if (/^> /.test(ln)) { closeList(); html += `<blockquote>${inl(ln.slice(2))}</blockquote>`; }
    else if (/^- /.test(ln)) { if (!inList) { html += '<ul>'; inList = true; } html += `<li>${inl(ln.slice(2))}</li>`; }
    else if (ln.trim() === '') { closeList(); }
    else { closeList(); html += `<p>${inl(ln)}</p>`; }
  });
  closeList();
  return html;
}

function TideDoc({ go }) {
  const d = window.DOC;
  const [saved, setSaved] = React.useState(true);
  return (
    <main style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      {/* source */}
      <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--line)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: '1px solid var(--line)' }}>
          <button className="btn btn-ghost btn-sm" onClick={() => go('project', d.thread)}><D.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {d.thread}</button>
          <span style={{ flex: 1 }} />
          <span className="mono tiny" style={{ color: saved ? 'var(--dot-crystal)' : 'var(--ink-faint)' }}>{saved ? `saved ${d.saved}` : 'editing · ⌘S'}</span>
          <span className="kbd">rev {d.rev}</span>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>Markdown</div>
          <textarea defaultValue={d.md} onChange={() => setSaved(false)} onBlur={() => setSaved(true)} spellCheck={false}
            style={{ width: '100%', minHeight: 380, border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)',
              padding: '14px 16px', fontFamily: 'var(--ff-mono)', fontSize: 13, lineHeight: 1.7, color: 'var(--ink)', resize: 'vertical' }} />
        </div>
      </div>
      {/* preview */}
      <div style={{ flex: '1 1 0', minWidth: 0, overflowY: 'auto', padding: '22px 26px' }}>
        <div className="mono" style={{ fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 10 }}>Preview</div>
        <div className="md-body" dangerouslySetInnerHTML={{ __html: mdToHtml(d.md) }} />
      </div>
      {/* rail */}
      <div style={{ width: 280, flex: '0 0 280px', borderLeft: '1px solid var(--line)', overflowY: 'auto', padding: '22px' }}>
        <RailBlock title="Tags">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {d.tags.map((t) => <DTag key={t}>{t}</DTag>)}
            <button className="btn btn-ghost btn-sm" style={{ padding: '2px 8px' }}><D.plus size={12} /></button>
          </div>
        </RailBlock>
        <RailBlock title="Connections" sub="what this is built on">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {d.connections.map((c, i) => (
              <div key={i} className="row" style={{ display: 'flex', gap: 9, padding: '9px 10px', alignItems: 'flex-start',
                borderLeft: '2px solid color-mix(in oklab, var(--sacred) 40%, transparent)', borderRadius: '0 8px 8px 0', cursor: 'pointer' }}
                onClick={() => c.kind === 'principle' && go('crystal')}>
                <span style={{ color: c.kind === 'principle' ? 'var(--sacred-ink)' : 'var(--ink-faint)', display: 'flex', marginTop: 1 }}><DKind kind={c.kind} size={13} /></span>
                <span style={{ fontSize: 12.5, lineHeight: 1.4 }}>{c.text}</span>
              </div>
            ))}
          </div>
        </RailBlock>
        <RailBlock title="Comments">
          {d.comments.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', marginBottom: 10 }}>
              <span style={{ width: 22, height: 22, borderRadius: 999, flex: '0 0 auto', fontFamily: 'var(--ff-mono)', fontSize: 9.5,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'var(--action-soft)', color: 'var(--action-ink)' }}>AI</span>
              <div><p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.45 }}>{c.text}</p><span className="mono tiny" style={{ color: 'var(--ink-faint)' }}>{c.when}</span></div>
            </div>
          ))}
          <button className="btn btn-soft btn-sm" style={{ width: '100%', justifyContent: 'center' }}><D.ask size={14} /> Ask Claude about this</button>
        </RailBlock>
      </div>
    </main>
  );
}

function RailBlock({ title, sub, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div className="eyebrow" style={{ marginBottom: sub ? 2 : 10 }}>{title}</div>
      {sub && <div className="mono tiny" style={{ color: 'var(--ink-faint)', marginBottom: 10 }}>{sub}</div>}
      {children}
    </div>
  );
}

// ── Field notes ────────────────────────────────────────────────────────
function TideFieldNotes({ go }) {
  const f = window.FIELDNOTES;
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => go('project', f.thread)}><D.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {f.thread}</button>
        <h1 className="display" style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>Field notes</h1>
        <p style={{ margin: '0 0 24px', fontSize: 16, color: 'var(--ink-muted)' }}>The living margin of a thread. Some sections Claude keeps tidy; some are yours to scribble in.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {f.sections.map((s, i) => (
            <section key={i} className="panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <h3 className="display" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
                <span className="mono tiny" style={{ padding: '2px 8px', borderRadius: 999,
                  background: s.managed ? 'var(--action-soft)' : 'var(--sunk)', color: s.managed ? 'var(--action-ink)' : 'var(--ink-faint)' }}>
                  {s.managed ? 'Claude-kept' : 'scratchpad'}</span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm"><D.pencil size={13} /></button>
                {s.managed && <button className="btn btn-ghost btn-sm" style={{ color: 'var(--action-ink)' }}><D.ask size={13} /> Ask</button>}
              </div>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Runbook ────────────────────────────────────────────────────────────
function TideRunbook({ go }) {
  const r = window.RUNBOOK;
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => go('project', r.thread)}><D.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {r.thread}</button>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1 className="display" style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>{r.title}</h1>
          <span className="kbd">rev {r.rev}</span><span className="mono tiny" style={{ color: 'var(--ink-faint)' }}>{r.updated}</span>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: 16, color: 'var(--ink-muted)' }}>Six fixed sections — the same shape every time, so future-you knows exactly where to look.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {r.sections.map((s, i) => (
            <section key={i} className="panel" style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--fam-run)' }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 className="display" style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{s.name}</h3>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm"><D.pencil size={13} /></button>
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{s.body}</p>
              {s.links && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {s.links.map((l, j) => (
                  <a key={j} onClick={(e) => { e.preventDefault(); if (l.url.includes('pacing')) go('doc'); }} href="#" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5,
                    color: 'var(--action-ink)', textDecoration: 'none', padding: '4px 10px', borderRadius: 999, background: 'var(--action-soft)' }}>
                    <D.link size={12} /> {l.label}</a>
                ))}
              </div>}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

// ── Guidebook (ordered entry spine, drag grips, order/tags views) ──────
function TideGuidebook({ go }) {
  const g = window.GUIDEBOOK;
  const [viewMode, setViewMode] = React.useState('order');
  return (
    <main style={{ flex: 1, overflowY: 'auto', padding: '30px 40px 40px' }}>
      <div style={{ maxWidth: 740, margin: '0 auto' }}>
        <button className="btn btn-ghost btn-sm" style={{ marginBottom: 16 }} onClick={() => go('project', g.thread)}><D.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {g.thread}</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 className="display" style={{ margin: '0 0 6px', fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}>{g.title}</h1>
          <span style={{ flex: 1 }} />
          <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
            <window.SegBtn on={viewMode === 'order'} onClick={() => setViewMode('order')}>Order</window.SegBtn>
            <window.SegBtn on={viewMode === 'tags'} onClick={() => setViewMode('tags')}>Tags</window.SegBtn>
          </div>
        </div>
        <p style={{ margin: '0 0 24px', fontSize: 16, color: 'var(--ink-muted)' }}>An ordered spine — drag to resequence. The order <em>is</em> the meaning.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {g.entries.map((e, i) => (
            <div key={i} className="row" style={{ display: 'flex', gap: 13, padding: '14px 14px', alignItems: 'flex-start',
              border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', background: 'var(--card-2)' }}>
              <span style={{ color: 'var(--ink-faint)', cursor: 'grab', display: 'flex', marginTop: 1 }}><D.grip size={16} /></span>
              <span className="display" style={{ fontSize: 17, fontWeight: 700, color: 'var(--fam-guide)', minWidth: 24 }}>{e.n}</span>
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.5 }}>{e.text}</p>
                {viewMode === 'tags' && <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>{e.tags.map((t) => <DTag key={t}>{t}</DTag>)}</div>}
              </div>
            </div>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 12 }}><D.plus size={13} /> Add entry</button>
      </div>
    </main>
  );
}

Object.assign(window, { TideDoc, TideFieldNotes, TideRunbook, TideGuidebook });
