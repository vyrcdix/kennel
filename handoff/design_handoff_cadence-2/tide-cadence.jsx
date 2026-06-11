// Tidewater — Cadence (recurring actions as a habit-forming tool).
// See cadence-handoff.md. No new top-level object: a cadence is an action
// with a rhythm + an attachment. Surfaced as an INVITATION ("do this week"),
// never a due date. Commitment is declared; vitality is observed warmth,
// reusing the water words (sunlit / active / deepening / still).

const { Ic: CIc, Mono: CMo } = window;
const { Pill: CPill, CType: CCType, DEPTH: CDEPTH, toast: ctoast } = window;
const ctv = window.tintVar;

const VITRANK = { fresh: 3, active: 2, aging: 1, dormant: 0 };
const vitColor = (t) => (CDEPTH[t] || CDEPTH.active).col;
const vitLabel = (t) => (CDEPTH[t] || CDEPTH.active).label; // sunlit / active / deepening / still
const isWarm = (t) => VITRANK[t] >= 2;

// ── Commitment meter — three quiet bars + label. DECLARED, not earned. ──
function CommitMeter({ level, showLabel = true }) {
  const c = window.COMMIT[level] || window.COMMIT.committed;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} title={c.blurb}>
      <span style={{ display: 'inline-flex', alignItems: 'flex-end', gap: 2, height: 13 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{ width: 3, height: 5 + i * 4, borderRadius: 2,
            background: i < c.bars ? 'var(--ink-muted)' : 'color-mix(in oklab, var(--ink) 13%, transparent)' }} />
        ))}
      </span>
      {showLabel && <CMo style={{ fontSize: 11, color: 'var(--ink-muted)' }}>{c.label}</CMo>}
    </span>
  );
}

// ── Rhythm trace — the streak as warmth, not a score (§4.2, §11.4) ──────
// Recent windows, newest last. Kept = filled in the vitality hue; skipped =
// a hollow outline. No deficit number is ever shown.
function RhythmTrace({ trace = [], vitality = 'active', kept = 0, unit = 'weeks' }) {
  const col = vitColor(vitality);
  const streak = kept >= 2 ? `kept up ${kept} ${unit} running` : kept === 1 ? 'one kept so far' : 'quiet just now';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }} title={`vitality — ${vitLabel(vitality)}`}>
        {trace.map((k, i) => (
          <span key={i} style={{ width: 6, height: 12, borderRadius: 999, flex: '0 0 auto',
            background: k ? col : 'transparent',
            border: k ? 'none' : '1.5px solid color-mix(in oklab, var(--ink) 18%, transparent)',
            opacity: k ? 0.55 + 0.45 * (i / Math.max(1, trace.length - 1)) : 1 }} />
        ))}
      </span>
      <CMo dim style={{ fontSize: 11.5 }}>{streak}</CMo>
    </span>
  );
}

const cadenceWord = (c) => window.CADENCE_LABEL[c] || 'on a rhythm';
const windowWord = (w) => window.WINDOW_LABEL[w] || 'do this week';
const threadName = (slug) => (window.THREADS.find((t) => t.slug === slug) || {}).name || slug;
const fmtClock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// ── Memo composer — capture what came of the contact, route it to the thread ──
// Optional, always secondary. A quick text memo OR a voice memo. Claude
// suggests the section of the thread it belongs in (parallels Paste & route).
function MemoComposer({ c, initial, onSave, onCancel }) {
  const [text, setText] = React.useState((initial && initial.text) || '');
  const [section, setSection] = React.useState((initial && initial.section) || (c.noteTo && c.noteTo.section) || 'Notes');
  const [voice, setVoice] = React.useState((initial && initial.voice) || null);
  const [rec, setRec] = React.useState(false);
  const [secs, setSecs] = React.useState(0);
  const ta = React.useRef(null);
  React.useEffect(() => { ta.current && ta.current.focus(); }, []);
  React.useEffect(() => {
    if (!rec) return;
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [rec]);
  const sections = window.threadSections(c.thread);
  const canSave = text.trim() || voice;

  return (
    <div style={{ padding: '13px 14px', borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <CIc.spark size={12} style={{ color: 'var(--action-ink)' }} />
        <CMo style={{ fontSize: 11, color: 'var(--action-ink)' }}>jot what came of it</CMo>
        <CMo dim style={{ fontSize: 11 }}>— optional, lands in the thread’s field notes</CMo>
      </div>
      <textarea ref={ta} value={text} onChange={(e) => setText(e.target.value)} placeholder="A line on what you read, thought, or want to do next…"
        style={{ width: '100%', minHeight: 64, border: '1px solid var(--line)', borderRadius: 'var(--r-ctrl)', background: 'var(--card-2)',
          padding: '10px 12px', fontFamily: 'var(--ff-sans)', fontSize: 13.5, lineHeight: 1.5, color: 'var(--ink)', resize: 'vertical', outline: 'none' }} />

      {/* voice memo — mocked recording affordance */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10, minHeight: 30 }}>
        {!rec && !voice && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSecs(0); setRec(true); }}><CIc.mic size={14} /> Record a memo</button>)}
        {rec && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--action-ink)' }}>
              <span className="cad-rec-dot" style={{ width: 9, height: 9, borderRadius: 999, background: '#C2453A' }} />
              <CMo style={{ fontSize: 12, color: 'inherit' }}>recording · {fmtClock(secs)}</CMo>
            </span>
            <button className="btn btn-soft btn-sm" onClick={() => { setRec(false); setVoice({ len: fmtClock(Math.max(1, secs)) }); }}>Stop</button>
          </span>)}
        {voice && !rec && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 10px 5px 9px', borderRadius: 999, background: 'var(--action-soft)', color: 'var(--action-ink)' }}>
            <CIc.mic size={13} /><CMo style={{ fontSize: 12, color: 'inherit' }}>voice memo · {voice.len}</CMo>
            <button onClick={() => setVoice(null)} style={{ border: 0, background: 'transparent', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}><CIc.x size={13} /></button>
          </span>)}
      </div>

      {/* destination — the served thread's FIELD NOTES; Claude suggests the section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <CMo dim style={{ fontSize: 11 }}>files into</CMo>
        <CPill t={c.tint}>{threadName(c.thread)}</CPill>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-muted)' }}>
          <CIc.note size={12} /><CMo style={{ fontSize: 11, color: 'inherit' }}>field notes</CMo></span>
        <CIc.arrowR2 size={13} style={{ color: 'var(--ink-faint)' }} />
        {sections.map((s) => (
          <button key={s} className={'chip' + (section === s ? ' on' : '')} style={{ fontSize: 11.5, padding: '4px 10px' }} onClick={() => setSection(s)}>{s}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary btn-sm" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.5 }}
          onClick={() => canSave && onSave({ text: text.trim(), voice, section })}>Save to field notes</button>
      </div>
    </div>
  );
}

// the saved-memo chip shown on a card / resolved row
function MemoChip({ c, memo, onEdit }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 11px', borderRadius: 'var(--r-ctrl)', background: 'var(--card-2)', border: '1px solid var(--line)' }}>
      {memo.voice ? <CIc.mic size={13} style={{ color: 'var(--action-ink)', flex: '0 0 auto' }} /> : <CIc.note size={13} style={{ color: 'var(--action-ink)', flex: '0 0 auto' }} />}
      <span style={{ flex: 1, minWidth: 0, fontSize: 12.5, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {memo.text || `voice memo · ${memo.voice.len}`}</span>
      <CMo dim style={{ fontSize: 10.5, flex: '0 0 auto' }}>→ {threadName(c.thread)} field notes · {memo.section}</CMo>
      {onEdit && <button className="btn btn-ghost btn-sm" style={{ padding: 5 }} onClick={(e) => { e.stopPropagation(); onEdit(); }}><CIc.pencil size={13} /></button>}
    </div>
  );
}

// ════════════════════════════ DO-THIS-WEEK CARD ════════════════════════
function CadenceCard({ c, go, onAct, memo, onMemo }) {
  const warm = isWarm(c.vitality);
  const col = vitColor(c.vitality);
  const soft = !!c.daily; // daily surfaces more softly than weekly/monthly (§11.5)
  const res = c.resource;
  const [memoOpen, setMemoOpen] = React.useState(false);

  const flash = (e) => { const card = e.currentTarget.closest('.cad-card'); if (card) { card.classList.remove('cad-kept'); void card.offsetWidth; card.classList.add('cad-kept'); } };

  return (
    <div className="cad-card panel" style={{ position: 'relative', overflow: 'hidden',
      padding: soft ? '14px 16px' : '16px 18px',
      borderColor: warm ? 'color-mix(in oklab, var(--sacred) 26%, var(--line))' : 'var(--line)',
      background: warm
        ? 'radial-gradient(120% 130% at 100% 0%, color-mix(in oklab, var(--sacred) 9%, transparent), transparent 60%), var(--card)'
        : 'var(--card)',
      opacity: soft && !c.diverged ? 0.96 : 1 }}>
      {/* vitality edge — warmth runs down the left as a thin tide line */}
      <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${col}, color-mix(in oklab, ${col} 30%, transparent))`, opacity: warm ? 0.9 : 0.4 }} />

      {/* top line: rhythm + window, commitment on the right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)' }}>
          <CIc.repeat size={13} />
          <CMo style={{ fontSize: 11, color: 'inherit' }}>{cadenceWord(c.cadence)}</CMo>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 9px', borderRadius: 999,
          background: 'var(--action-soft)', color: 'var(--action-ink)' }}>
          <CMo style={{ fontSize: 10.5, color: 'inherit', letterSpacing: '.02em' }}>{windowWord(c.window)}</CMo>
        </span>
        {soft && <CMo dim style={{ fontSize: 10.5 }}>· softly</CMo>}
        <span style={{ flex: 1 }} />
        <CommitMeter level={c.commitment} />
      </div>

      {/* the action */}
      <p className="display" style={{ margin: '0 0 10px', fontSize: soft ? 16 : 17.5, fontWeight: 600,
        lineHeight: 1.32, letterSpacing: '-.01em' }}>{c.text}</p>

      {/* what it serves + thread */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: res ? 11 : 13, flexWrap: 'wrap' }}>
        {c.serves
          ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <CIc.gem size={12} style={{ color: 'var(--sacred-ink)' }} />
              <CMo dim style={{ fontSize: 11.5 }}>keeps warm</CMo>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{c.serves}</span>
            </span>
          : <CMo dim style={{ fontSize: 11.5 }}>a practice of its own</CMo>}
        <span onClick={(e) => { e.stopPropagation(); go && go('project', c.thread); }} style={{ cursor: 'pointer' }}>
          <CPill t={c.tint}>{c.thread}</CPill></span>
      </div>

      {/* the resource — ON the card, one click to act (§7, hard requirement) */}
      {res && (
        <button onClick={(e) => { e.stopPropagation(); ctoast({ text: `Opening ${res.label.split(' — ')[0]}…`, kind: 'focus' }); }}
          style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', textAlign: 'left', cursor: 'pointer',
            padding: '9px 12px', marginBottom: 13, borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line)',
            background: 'var(--card-2)', color: 'var(--ink)', fontFamily: 'var(--ff-sans)' }}>
          <CIc.link size={14} style={{ color: 'var(--action-ink)', flex: '0 0 auto' }} />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{res.label}</span>
          <CIc.arrowR2 size={14} style={{ color: 'var(--ink-faint)', flex: '0 0 auto' }} />
        </button>
      )}

      {/* vitality + streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: c.diverged ? 12 : 14 }}>
        <RhythmTrace trace={c.trace} vitality={c.vitality} kept={c.kept} unit={c.keptUnit} />
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: col }} />
          <CMo dim style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em' }}>{vitLabel(c.vitality)}</CMo>
        </span>
      </div>

      {/* divergence — declared core, gone cold. A question, never a scold (§4.3) */}
      {c.diverged && (
        <div style={{ display: 'flex', gap: 11, padding: '12px 14px', marginBottom: 14, borderRadius: 'var(--r-ctrl)',
          background: 'var(--sunk)', border: '1px solid var(--line)' }}>
          <CIc.tide size={15} style={{ color: 'var(--ink-faint)', flex: '0 0 auto', marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-muted)' }}>
              You call this a <strong style={{ color: 'var(--ink)' }}>core practice</strong>, but it’s gone quiet. No harm done — is it still true?</p>
            <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600 }}
                onClick={(e) => { e.stopPropagation(); onAct(c, 'recommit'); }}>Re-commit</button>
              <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onAct(c, 'ease'); }}>Ease off to “trying it”</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--sacred-ink)' }} onClick={(e) => { e.stopPropagation(); go && go('crystal'); }}><CIc.gem size={13} /> Crystallize the lesson</button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-faint)' }} onClick={(e) => { e.stopPropagation(); onAct(c, 'release'); }}>Let it go</button>
            </div>
          </div>
        </div>
      )}

      {/* optional memo — what came of the contact, routed to the thread it serves */}
      {memo && !memoOpen && <div style={{ marginBottom: 12 }}><MemoChip c={c} memo={memo} onEdit={() => setMemoOpen(true)} /></div>}
      {memoOpen && <div style={{ marginBottom: 12 }}>
        <MemoComposer c={c} initial={memo} onCancel={() => setMemoOpen(false)}
          onSave={(m) => { onMemo && onMemo(c, m); setMemoOpen(false); }} /></div>}

      {/* the loop — Did it / Skip / Snooze. Never "done" (done would delete it). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" style={{ background: 'var(--sacred)', borderColor: 'var(--sacred)', color: '#2A1B08', fontWeight: 600 }}
          onClick={(e) => { flash(e); onAct(c, 'did'); }}><CIc.check size={14} /> Did it</button>
        <button className="btn btn-soft btn-sm" onClick={(e) => { e.stopPropagation(); onAct(c, 'skip'); }}>Skip this {c.cadence === 'daily' ? 'day' : c.cadence === 'monthly' ? 'month' : 'week'}</button>
        <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); onAct(c, 'snooze'); }}><CIc.clock size={13} /> Snooze</button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-ghost btn-sm" style={memoOpen ? { color: 'var(--action-ink)' } : undefined} onClick={(e) => { e.stopPropagation(); setMemoOpen((o) => !o); }}>
          <CIc.mic size={13} /> {memo ? 'Edit note' : 'Note'}</button>
      </div>
    </div>
  );
}

// resolved one-line state after an action (kept / skipped) — collapsed, calm
function CadenceResolved({ c, kind, onUndo, memo, onMemo }) {
  const kept = kind === 'did';
  const [memoOpen, setMemoOpen] = React.useState(false);
  return (
    <div className="panel" style={{ padding: '12px 16px', opacity: 0.96 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <span style={{ width: 22, height: 22, borderRadius: 999, flex: '0 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          background: kept ? 'var(--sacred-soft)' : 'var(--sunk)', color: kept ? 'var(--sacred-ink)' : 'var(--ink-faint)' }}>
          {kept ? <CIc.check size={13} /> : <CIc.repeat size={12} />}</span>
        <span style={{ flex: 1, fontSize: 13.5, color: 'var(--ink-muted)' }}>
          <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{c.text}</span>
          {' — '}{kept ? 'kept up.' : 'rolled on.'} {' '}
          <CMo dim style={{ fontSize: 11.5 }}>comes back {c.cadence === 'daily' ? 'tomorrow' : c.cadence === 'monthly' ? 'next month' : 'next week'}</CMo></span>
        {kept && !memo && !memoOpen && <button className="btn btn-ghost btn-sm" onClick={() => setMemoOpen(true)}><CIc.mic size={13} /> jot a note</button>}
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--action-ink)' }} onClick={onUndo}><CIc.undo size={13} /> Undo</button>
      </div>
      {memo && !memoOpen && <div style={{ marginTop: 10 }}><MemoChip c={c} memo={memo} onEdit={() => setMemoOpen(true)} /></div>}
      {memoOpen && <div style={{ marginTop: 10 }}>
        <MemoComposer c={c} initial={memo} onCancel={() => setMemoOpen(false)}
          onSave={(m) => { onMemo && onMemo(c, m); setMemoOpen(false); }} /></div>}
    </div>
  );
}

// ════════════════════════════ DASHBOARD SLOT ═══════════════════════════
function DoThisWeek({ go }) {
  const sorted = [...window.CADENCES].sort((a, b) =>
    (window.COMMIT[b.commitment].bars - window.COMMIT[a.commitment].bars) || (VITRANK[b.vitality] - VITRANK[a.vitality]));
  const [items, setItems] = React.useState(sorted.map((c) => ({ ...c, status: 'open' })));

  const act = (c, kind) => {
    setItems((cur) => cur.map((x) => {
      if (x.id !== c.id) return x;
      if (kind === 'did') return { ...x, status: 'did' };
      if (kind === 'skip') return { ...x, status: 'skip' };
      if (kind === 'recommit') return { ...x, diverged: false, vitality: 'active', commitment: 'core' };
      if (kind === 'ease') return { ...x, diverged: false, commitment: 'trying' };
      if (kind === 'release') return { ...x, status: 'gone' };
      return x;
    }));
    if (kind === 'did') ctoast({ text: 'Kept up — it’ll wash back in next window.', kind: 'crystal' });
    if (kind === 'skip') ctoast({ text: 'Skipped, no harm. Rolls to the next window.', undo: true, onUndo: () => act(c, 'reopen') });
    if (kind === 'snooze') ctoast({ text: 'Snoozed a few days — still inside this window.', kind: 'focus' });
    if (kind === 'recommit') ctoast({ text: 'Re-committed. Kept as a core practice.', kind: 'crystal' });
    if (kind === 'ease') ctoast({ text: 'Eased off to “trying it” — lighter from here.', kind: 'focus' });
    if (kind === 'release') ctoast({ text: 'The tide took it. Honest amnesty — no streak to mourn.', kind: 'release', undo: true, onUndo: () => act(c, 'reopen') });
    if (kind === 'reopen') setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, status: 'open' } : x));
  };
  const reopen = (c) => setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, status: 'open' } : x));
  const saveMemo = (c, memo) => {
    setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, memo } : x));
    ctoast({ text: `Noted — filed into ${threadName(c.thread)} field notes · ${memo.section}.`, kind: 'focus' });
  };

  const open = items.filter((x) => x.status === 'open');
  const resolved = items.filter((x) => x.status === 'did' || x.status === 'skip');

  return (
    <section className="panel" style={{ padding: '20px 22px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <CIc.repeat size={16} style={{ color: 'var(--action-ink)' }} />
        <h2 className="display" style={{ margin: 0, fontSize: 21, fontWeight: 700, letterSpacing: '-.01em' }}>Do this week</h2>
        <span style={{ flex: 1 }} />
        <CMo dim>invitations, never due · {open.length} open</CMo>
      </div>
      <p style={{ margin: '0 0 16px 26px', color: 'var(--ink-muted)', fontSize: 13.5 }}>
        Practices you’re keeping warm. Feed one when the mood’s right — there’s no clock counting down.</p>

      {open.length === 0 && resolved.length > 0
        ? <p style={{ margin: '0 0 4px', textAlign: 'center', color: 'var(--ink-faint)' }}><CMo dim>That’s the rhythm tended. They’ll come back around.</CMo></p>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 13 }}>
            {open.map((c) => <CadenceCard key={c.id} c={c} go={go} onAct={act} memo={c.memo} onMemo={saveMemo} />)}
          </div>}

      {resolved.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: open.length ? 14 : 0 }}>
          {resolved.map((c) => <CadenceResolved key={c.id} c={c} kind={c.status} onUndo={() => reopen(c)} memo={c.memo} onMemo={saveMemo} />)}
        </div>
      )}
    </section>
  );
}

// ════════════════════════════ RECUR MODAL (the R verb) ═════════════════
function RecurModal({ onClose, seedText, seedThread }) {
  const [cadence, setCadence] = React.useState('weekly');
  const [commitment, setCommitment] = React.useState('trying'); // lowest-pressure default (§11.3)
  const [resource, setResource] = React.useState('');
  const [attach, setAttach] = React.useState(seedThread || null);
  const attachOptions = [
    { id: 'pacific', label: 'Tourism in the South Pacific', sub: 'idea', tint: 'teal' },
    { id: 'marathon-2027', label: 'Run Chicago 2027 under 4:00', sub: 'principle', tint: 'sage' },
    { id: 'household', label: 'Household', sub: 'thread', tint: 'slate' },
    { id: 'reading', label: 'Reading', sub: 'thread', tint: 'stone' },
  ];
  const submit = () => {
    onClose();
    ctoast({ text: `On your ${cadence} rhythm — it’ll wash in when the window opens. Never due.`, kind: 'focus' });
  };
  const Seg = window.SegBtn;
  const Field = ({ label, hint, children }) => (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span className="eyebrow">{label}</span>{hint && <CMo dim style={{ fontSize: 11 }}>{hint}</CMo>}
      </div>
      {children}
    </div>
  );
  return (
    <window.Modal onClose={onClose} width={540}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '20px 22px 0' }}>
        <span style={{ width: 30, height: 30, borderRadius: 9, flex: '0 0 auto', background: 'var(--action-soft)', color: 'var(--action-ink)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CIc.repeat size={16} /></span>
        <div style={{ flex: 1 }}>
          <h2 className="display" style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>Make it recur</h2>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--ink-muted)' }}>A repeating nudge, attached to what it serves. An invitation — never a deadline.</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: 7 }}><CIc.x size={16} /></button>
      </div>
      <div style={{ padding: '18px 22px 22px' }}>
        {seedText && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', marginBottom: 18, borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)' }}>
            <CIc.repeat size={14} style={{ color: 'var(--ink-faint)' }} />
            <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{seedText}</span>
          </div>
        )}

        <Field label="Rhythm" hint="how often it comes back around">
          <div style={{ display: 'inline-flex', padding: 3, gap: 2, background: 'var(--sunk)', borderRadius: 999 }}>
            <Seg on={cadence === 'daily'} onClick={() => setCadence('daily')}>Daily</Seg>
            <Seg on={cadence === 'weekly'} onClick={() => setCadence('weekly')}>Weekly</Seg>
            <Seg on={cadence === 'monthly'} onClick={() => setCadence('monthly')}>Monthly</Seg>
          </div>
        </Field>

        <Field label="Commitment" hint="what you’re declaring — sets how present it is, and how patient">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {['trying', 'committed', 'core'].map((lv) => {
              const c = window.COMMIT[lv]; const on = commitment === lv;
              return (
                <button key={lv} onClick={() => setCommitment(lv)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer',
                  padding: '11px 13px', borderRadius: 'var(--r-ctrl)', border: '1.5px solid ' + (on ? 'var(--action)' : 'var(--line-strong)'),
                  background: on ? 'var(--action-soft)' : 'var(--card-2)', fontFamily: 'var(--ff-sans)' }}>
                  <CommitMeter level={lv} showLabel={false} />
                  <span style={{ fontSize: 14, fontWeight: 600, minWidth: 96 }}>{c.label}</span>
                  <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{c.blurb}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Resource" hint="optional — rides on the card so you act in one click">
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '0 13px', borderRadius: 'var(--r-ctrl)', border: '1px solid var(--line-strong)', background: 'var(--sunk)' }}>
            <CIc.link size={15} style={{ color: 'var(--ink-faint)' }} />
            <input value={resource} onChange={(e) => setResource(e.target.value)} placeholder="Paste a link, or name what to do the contact with…"
              style={{ flex: 1, border: 0, background: 'transparent', padding: '11px 0', fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink)', outline: 'none' }} />
          </div>
        </Field>

        <Field label="Attach to" hint="what does this keep warm?">
          <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
            {attachOptions.map((o) => (
              <button key={o.id} onClick={() => setAttach(o.id)} className={'chip' + (attach === o.id ? ' on' : '')} style={{ '--tint': ctv(o.tint) }}>
                {o.label} <CMo dim style={{ fontSize: 10, marginLeft: 3 }}>{o.sub}</CMo></button>
            ))}
          </div>
        </Field>

        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 22 }}>
          <CMo dim style={{ fontSize: 11.5, flex: 1 }}>It can only be done, or roll. It can’t be late.</CMo>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}><CIc.repeat size={14} /> Start the rhythm</button>
        </div>
      </div>
    </window.Modal>
  );
}

// ════════════════════════════ AGING BOARD SECTION ══════════════════════
// Cooled cadences land here and ask, honestly, to be released (§8).
function CooledCadences({ go }) {
  const [items, setItems] = React.useState(window.CADENCES_COOLED.map((c) => ({ ...c, gone: false })));
  const live = items.filter((x) => !x.gone);
  if (live.length === 0) return null;
  const sweep = (c, kind) => {
    setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, gone: true } : x));
    const msg = { keep: 'Kept going — back on its rhythm.', crystal: 'Crystallized the lesson — a kept thing.', file: 'Filed into the thread.', release: 'The tide took it. No streak to mourn.' }[kind];
    ctoast({ text: msg, kind: kind === 'crystal' ? 'crystal' : kind === 'release' ? 'release' : 'focus', undo: kind !== 'crystal', onUndo: () => setItems((cur) => cur.map((x) => x.id === c.id ? { ...x, gone: false } : x)) });
    if (kind === 'crystal') setTimeout(() => go && go('crystal'), 240);
  };
  return (
    <div className="panel" style={{ padding: '18px 20px', marginBottom: 18, borderColor: 'var(--line)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4 }}>
        <CIc.repeat size={15} style={{ color: 'var(--ink-faint)' }} />
        <h2 className="display" style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Cooled cadences</h2>
        <span style={{ flex: 1 }} />
        <CMo dim style={{ fontSize: 11.5 }}>sweeping the workshop — not confronting failures</CMo>
      </div>
      <p style={{ margin: '0 0 14px', fontSize: 12.5, color: 'var(--ink-faint)' }}>
        <CMo dim>rhythms you stopped feeding. most should be filed or released, shamelessly.</CMo></p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {live.map((c) => (
          <div key={c.id} className="row" style={{ display: 'flex', gap: 12, padding: '13px 12px', alignItems: 'flex-start' }}>
            <span style={{ color: 'var(--ink-faint)', display: 'flex', marginTop: 2 }}><CIc.repeat size={15} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.4, color: 'var(--ink-muted)' }}>{c.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 7, flexWrap: 'wrap' }}>
                <CPill t={c.tint}>{c.thread}</CPill>
                <CommitMeter level={c.commitment} />
                <CMo dim style={{ fontSize: 11.5 }}>{c.cooled}</CMo>
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn btn-soft btn-sm" onClick={() => sweep(c, 'keep')}><CIc.repeat size={13} /> Keep it going <span className="kbd">U</span></button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--sacred-ink)' }} onClick={() => sweep(c, 'crystal')}><CIc.gem size={13} /> Crystallize the lesson <span className="kbd">C</span></button>
                <button className="btn btn-ghost btn-sm" onClick={() => sweep(c, 'file')}><CIc.file size={13} /> File <span className="kbd">F</span></button>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--ink-faint)' }} onClick={() => sweep(c, 'release')}><CIc.release size={13} /> Let it go <span className="kbd">X</span></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { CadenceCard, CommitMeter, RhythmTrace, MemoComposer, MemoChip, DoThisWeek, RecurModal, CooledCadences, vitColor, vitLabel, isWarm, VITRANK });
