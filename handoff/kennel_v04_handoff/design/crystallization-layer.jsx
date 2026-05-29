// Crystallizations as a salient layer — typed artifacts that drill into source.
// Types: quote · reminder · hint · memory · principle. Each is the distilled
// tip of supporting material (docs/items/chats) and can be drilled down.
// Warm palette (.km-warm). Data model unchanged — these are items of
// kind=crystallization with a `ctype` facet + sources_from lineage.

const CTYPE = {
  principle: { label:'PRINCIPLE', ink:'var(--w-gold-dk)',  chip:'rgba(224,165,46,.20)', icon:(p)=> <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg> },
  quote:     { label:'QUOTE',     ink:'var(--w-terra)',    chip:'rgba(194,65,12,.14)',  icon:(p)=> <svg width={p.size||13} height={p.size||13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M7 7h4v6H7zM13 7h4v6h-4z" /><path d="M7 13c0 2 1 3 3 4M13 13c0 2 1 3 3 4" /></svg> },
  reminder:  { label:'REMINDER',  ink:'var(--w-ember-dk)', chip:'rgba(217,83,31,.14)',  icon:(p)=> Icons.bell({...p, size:p.size||13}) },
  hint:      { label:'HINT',      ink:'var(--w-moss)',     chip:'rgba(79,112,56,.16)',  icon:(p)=> Icons.bulb({...p, size:p.size||13}) },
  memory:    { label:'MEMORY',    ink:'var(--w-clay)',     chip:'rgba(201,130,78,.18)', icon:(p)=> Icons.note({...p, size:p.size||13}) },
};

const CTypeChip = ({ type }) => {
  const c = CTYPE[type];
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:5, padding:'2px 8px', background:c.chip, color:c.ink, borderRadius:3, fontFamily:'var(--ff-display)', fontSize:9.5, letterSpacing:'.14em', fontWeight:600}}>
      <span style={{color:c.ink, display:'inline-flex'}}>{c.icon({size:11, stroke:c.ink})}</span>
      {c.label}
    </span>
  );
};

// A single crystallization artifact card. Size varies by type/weight.
const CrystalCard = ({ type, text, attribution, sources, age, drillHint = true, big = false }) => {
  const c = CTYPE[type];
  return (
    <div style={{
      breakInside:'avoid', marginBottom:14,
      borderRadius:8, padding:'2px',
      background: type === 'principle'
        ? 'linear-gradient(150deg, var(--w-gold), rgba(224,165,46,.25))'
        : 'var(--w-line)'
    }}>
      <div style={{background:'var(--w-card)', borderRadius:6, padding: big ? '18px 20px' : '14px 16px', display:'flex', flexDirection:'column', gap:10, cursor:'pointer'}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <CTypeChip type={type} />
          <span style={{flex:1}} />
          <span className="wmono">{age}</span>
        </div>

        {type === 'quote' ? (
          <div style={{borderLeft:`3px solid ${c.ink}`, paddingLeft:12}}>
            <div style={{fontSize: big ? 19 : 16, lineHeight:1.4, fontStyle:'italic', color:'var(--w-ink)', fontFamily:'var(--ff-sans)'}}>“{text}”</div>
            {attribution && <div className="wmono" style={{marginTop:6, color:c.ink}}>{attribution}</div>}
          </div>
        ) : (
          <div style={{
            fontSize: big ? 20 : 15,
            lineHeight:1.35,
            fontWeight: type === 'principle' ? 700 : 600,
            fontFamily: type === 'principle' ? 'var(--ff-display)' : 'var(--ff-sans)',
            color:'var(--w-ink)'
          }}>{text}</div>
        )}

        <div style={{display:'flex', alignItems:'center', gap:8, paddingTop:2}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:5}}>
            {sources.slice(0,3).map((s,i)=>(
              <span key={i} style={{color:'var(--w-ink-faint)'}}><KindIcon kind={s} size={12} /></span>
            ))}
          </span>
          <span className="wmono">{sources.length} sources</span>
          <span style={{flex:1}} />
          {drillHint && (
            <span style={{display:'inline-flex', alignItems:'center', gap:4, color:c.ink, fontFamily:'var(--ff-mono)', fontSize:11}}>
              drill down <Icons.arrowR size={11} stroke={c.ink} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Gallery — the salient layer of a theme ─────────────────────────────────
const CrystalGallery = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:14, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wfont-display" style={{fontSize:16, letterSpacing:'.08em'}}>KENNEL</span>
      <span className="wmono" style={{marginLeft:4}}>/ kennel / crystallizations</span>
      <div style={{flex:1}} />
      <div style={{display:'flex', alignItems:'center', gap:8, background:'var(--w-bg-deep)', borderRadius:5, padding:'6px 11px', width:240}}>
        <Icons.search size={13} stroke="var(--w-ink-soft)" />
        <span className="wmono" style={{flex:1}}>filter the salient layer</span>
      </div>
    </div>

    <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'24px 36px 40px'}}>
      {/* header */}
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:6, gap:24}}>
        <div>
          <div style={{display:'flex', alignItems:'center', gap:9, marginBottom:8}}>
            <span style={{color:'var(--w-gold-dk)'}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>
            </span>
            <span className="wlabel" style={{color:'var(--w-gold-dk)'}}>The salient layer · kennel</span>
          </div>
          <div className="wfont-display" style={{fontSize:34, lineHeight:1.1, maxWidth:680}}>What this theme has crystallized</div>
        </div>
        <div style={{textAlign:'right'}}>
          <div className="wfont-display" style={{fontSize:40, color:'var(--w-gold-dk)', lineHeight:1}}>11</div>
          <span className="wmono">distilled from 73 days · 84 items</span>
        </div>
      </div>
      <div style={{fontSize:14.5, lineHeight:1.55, color:'var(--w-ink-soft)', maxWidth:760, marginBottom:18}}>
        The memories, reminders, quotes, hints and principles distilled from everything in this thread. Each stays fresh on top; tap any to drill into the material it came from.
      </div>

      {/* type filter row */}
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:20, flexWrap:'wrap'}}>
        <span style={{display:'inline-flex', alignItems:'center', gap:5, padding:'5px 11px', background:'var(--w-ink)', color:'var(--w-bg)', borderRadius:20, fontSize:12.5, fontWeight:500, cursor:'pointer'}}>All · 11</span>
        {Object.entries(CTYPE).map(([k,v])=>(
          <span key={k} style={{display:'inline-flex', alignItems:'center', gap:6, padding:'5px 11px', background:'var(--w-card)', border:'1px solid var(--w-line)', color:v.ink, borderRadius:20, fontSize:12.5, cursor:'pointer'}}>
            {v.icon({size:12, stroke:v.ink})} {v.label.charAt(0)+v.label.slice(1).toLowerCase()}
          </span>
        ))}
      </div>

      {/* masonry gallery */}
      <div style={{columnCount:3, columnGap:14}}>
        <CrystalCard big type="principle" text="Capture friction is the design constraint" sources={['note','doc','chat','ref']} age="29d" />
        <CrystalCard type="quote" text="Make capture faster and sort later — speed beats precision at the point of capture, always." attribution="— from the capture-friction playbook" sources={['doc','note']} age="29d" />
        <CrystalCard type="reminder" text="Rotate the MCP token any time a non-Craig surface gets a copy." sources={['doc','ref']} age="6d" />
        <CrystalCard type="hint" text="When the proposal queue feels noisy, batch by skill before interleaving." sources={['chat','note']} age="4d" />
        <CrystalCard big type="principle" text="Three dark-mode elevations, never pure black" sources={['note','doc','chat']} age="2d" />
        <CrystalCard type="memory" text="Decided against moving the chats panel up — staleness should fade, not relocate." sources={['idea','chat']} age="9d" />
        <CrystalCard type="quote" text="Users recognize a wrong slug even if they'll never author the right one." attribution="— slug & naming notes" sources={['doc','note']} age="18d" />
        <CrystalCard type="hint" text="FTS5 trigram index drifts if WAL checkpointing was paused — reindex on empty search." sources={['doc','ref']} age="12d" />
        <CrystalCard type="reminder" text="Field notes ≠ runbook. Notes are thinking; runbook is how to reach the hard artefacts." sources={['note']} age="3d" />
      </div>
    </main>
  </div>
);

// ── Drill-down — one crystallization opening into its supporting trail ─────
const CrystalDrilldown = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:10, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wmono" style={{display:'inline-flex', alignItems:'center', gap:6}}>
        <Icons.arrowR size={13} stroke="var(--w-ink-soft)" style={{transform:'rotate(180deg)'}} /> kennel
      </span>
      <span className="wmono">/ crystallizations / capture-friction</span>
    </div>

    <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr', overflow:'hidden'}}>
      {/* LEFT — the crystallization, full */}
      <div className="km-scroll" style={{overflow:'auto', padding:'32px 36px', background:'linear-gradient(180deg, rgba(224,165,46,.10), transparent)'}}>
        <CTypeChip type="principle" />
        <div className="wfont-display" style={{fontSize:38, lineHeight:1.1, margin:'16px 0 16px'}}>
          Capture friction is the design constraint
        </div>
        <div style={{fontSize:16, lineHeight:1.65, color:'var(--w-ink)', marginBottom:20}}>
          Every other principle bends to capture friction. Sub-5s end-to-end is non-negotiable; everything else is a refinement on the speed-vs-precision frontier. When in doubt, make capture faster and sort later.
        </div>

        {/* the salient derivatives — quotes/reminders/hints spawned from this */}
        <div className="wlabel" style={{marginBottom:10}}>Distilled into</div>
        <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:24}}>
          <div style={{padding:'10px 12px', background:'var(--w-card)', borderLeft:'3px solid var(--w-terra)', borderRadius:'0 6px 6px 0'}}>
            <CTypeChip type="quote" />
            <div style={{fontStyle:'italic', fontSize:14.5, marginTop:6, lineHeight:1.4}}>“Make capture faster and sort later.”</div>
          </div>
          <div style={{padding:'10px 12px', background:'var(--w-card)', borderLeft:'3px solid var(--w-ember-dk)', borderRadius:'0 6px 6px 0'}}>
            <CTypeChip type="reminder" />
            <div style={{fontSize:14, marginTop:6, lineHeight:1.4}}>If a capture path needs more than one decision, it's wrong.</div>
          </div>
        </div>

        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span className="wmono-em">crystallized 29d ago · re-surfaced 4× · kept fresh</span>
        </div>
      </div>

      {/* RIGHT — supporting material trail */}
      <div className="km-scroll" style={{overflow:'auto', padding:'28px 30px', background:'var(--w-bg-deep)', borderLeft:'1px solid var(--w-line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:6}}>
          <Icons.arrowDown size={14} stroke="var(--w-ink-soft)" />
          <div className="wlabel">Drilled down · supporting material</div>
        </div>
        <div style={{fontSize:13, color:'var(--w-ink-soft)', marginBottom:18}}>11 sources across the thread, newest first. This is what the principle was distilled from.</div>

        {/* grouped trail */}
        {[
          { group:'PLAYBOOKS', items:[
            { kind:'doc', title:'Capture-friction playbook', meta:'rev 7 · 8 sections', strong:true },
          ]},
          { group:'CHATS', items:[
            { kind:'chat', title:'working through the segmentation logic', meta:'2h ago' },
            { kind:'chat', title:'do we sort at capture or after?', meta:'31d ago' },
          ]},
          { group:'NOTES & IDEAS', items:[
            { kind:'note', title:'5-second rule observation from mobile capture', meta:'30d ago' },
            { kind:'idea', title:'desktop ⌘⇧K should never block on project pick', meta:'34d ago' },
            { kind:'note', title:'what makes me NOT capture something', meta:'41d ago' },
          ]},
          { group:'REFERENCES', items:[
            { kind:'ref', title:'Tiago Forte · capture → distillation → expression', meta:'web' },
            { kind:'ref', title:'GTD · the two-minute rule', meta:'web' },
          ]},
        ].map(g => (
          <div key={g.group} style={{marginBottom:18}}>
            <div className="wmono" style={{marginBottom:8, letterSpacing:'.1em'}}>{g.group}</div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {g.items.map((it,i)=>(
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:10, padding:'9px 11px',
                  background:'var(--w-card)',
                  border: it.strong ? '1px solid var(--w-gold)' : '1px solid var(--w-line)',
                  borderRadius:6, cursor:'pointer'
                }}>
                  <KindIcon kind={it.kind} muted={false} />
                  <span style={{flex:1, fontSize:13.5, fontWeight: it.strong?600:400}}>{it.title}</span>
                  <span className="wmono">{it.meta}</span>
                  <Icons.arrowR size={12} stroke="var(--w-ink-faint)" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

Object.assign(window, { CrystalGallery, CrystalDrilldown, CrystalCard, CTypeChip });
