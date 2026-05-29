// Actions in context — to-dos serve thinking; they are never context-free.
// Capture stays frictionless; context attaches at sort/activation and the
// action then travels with the idea/crystal it serves. Warm palette.

const ActionsInContext = () => (
  <div className="km km-warm" style={{padding:'30px 40px', height:'100%', overflow:'auto'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:6}}>
      <div className="wfont-display" style={{fontSize:30}}>Actions serve thinking</div>
      <span className="wmono">not a to-do list · every action is in service of an idea or crystal</span>
    </div>
    <div style={{maxWidth:880, marginBottom:26, fontSize:15, lineHeight:1.6, color:'var(--w-ink-soft)'}}>
      Triage and to-dos are a lens, not the spine. A bare checklist of context-free items is exactly what Kennel is <i>not</i>. Capture stays instant; the action gains its context when you sort it, then travels with the thinking it belongs to.
    </div>

    {/* contrast strip */}
    <div style={{display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:18, marginBottom:30}}>
      {/* NOT this */}
      <div style={{border:'1px solid var(--w-line)', borderRadius:8, padding:'16px 18px', background:'var(--w-card)', opacity:.85}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <Icons.x size={14} stroke="var(--w-ink-faint)" />
          <span className="wlabel" style={{color:'var(--w-ink-faint)'}}>Not this · context-free checklist</span>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:9}}>
          {['Fix the deploy script','Email Klein','Read the FTS5 docs','Update the slug logic','Buy more coffee'].map((t,i)=>(
            <div key={i} style={{display:'flex', alignItems:'center', gap:9}}>
              <span style={{width:14, height:14, border:'1.5px solid var(--w-ink-faint)', borderRadius:3, flex:'0 0 auto'}} />
              <span style={{fontSize:13.5, color:'var(--w-ink-soft)'}}>{t}</span>
            </div>
          ))}
        </div>
        <div style={{marginTop:14, paddingTop:12, borderTop:'1px dashed var(--w-line)'}}>
          <span className="wmono" style={{lineHeight:1.5}}>Flat. No why, no lineage. In a month you won't remember what "update the slug logic" was for. This is every other tool.</span>
        </div>
      </div>

      {/* THIS */}
      <div style={{border:'1px solid var(--w-line)', borderTop:'3px solid var(--w-ember)', borderRadius:8, padding:'16px 18px', background:'var(--w-card)'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <span style={{color:'var(--w-ember-dk)'}}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          <span className="wlabel" style={{color:'var(--w-ember-dk)'}}>This · actions nested in their thinking</span>
        </div>

        {[
          {
            crystal:'Self-hosted deploy is reproducible in one command',
            kind:'crystal',
            actions:[
              { t:'Fix the deploy script preflight check', via:'playbook · step 2', meta:'today' },
            ],
          },
          {
            crystal:'Capture friction is the design constraint',
            kind:'crystal',
            actions:[
              { t:'Read the FTS5 ranking docs', via:'guidebook · our evidence', meta:'Wed' },
              { t:'Update the slug derivation logic', via:'field note · 18d ago', meta:'Fri' },
            ],
          },
          {
            crystal:'Klein advisory — Q2 framing (idea, still reflecting)',
            kind:'idea',
            actions:[
              { t:'Email Klein the revised outline', via:'thread · klein-advisory', meta:'today' },
            ],
          },
        ].map((g,i)=>(
          <div key={i} style={{marginBottom: i<2?14:0}}>
            {/* the thinking it serves */}
            <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:7}}>
              {g.kind==='crystal'
                ? <span style={{color:'var(--w-gold-dk)'}}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 22 8v8L12 22 2 16V8z"/></svg></span>
                : <KindIcon kind="idea" size={12} muted={false} />}
              <span className="wmono" style={{color: g.kind==='crystal'?'var(--w-gold-dk)':'var(--w-clay)', letterSpacing:'.04em'}}>in service of</span>
              <span style={{fontSize:13, fontWeight:600, color:'var(--w-ink)'}}>{g.crystal}</span>
            </div>
            {/* its actions */}
            <div style={{display:'flex', flexDirection:'column', gap:6, paddingLeft:19, borderLeft:'2px solid var(--w-line)', marginLeft:5}}>
              {g.actions.map((a,j)=>(
                <div key={j} style={{display:'flex', alignItems:'center', gap:9, padding:'6px 10px', background:'var(--w-bg-deep)', borderRadius:6}}>
                  <span style={{width:14, height:14, border:'1.5px solid var(--w-ember)', borderRadius:3, flex:'0 0 auto'}} />
                  <span style={{fontSize:13.5, flex:1}}>{a.t}</span>
                  <span style={{display:'inline-flex', alignItems:'center', gap:5, padding:'2px 8px', background:'var(--w-card)', border:'1px solid var(--w-line)', borderRadius:20}}>
                    <Icons.link size={10} stroke="var(--w-ink-soft)" />
                    <span className="wmono">{a.via}</span>
                  </span>
                  <span className="wmono">{a.meta}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* the capture→context flow */}
    <div className="wlabel" style={{marginBottom:12}}>How context attaches without adding capture friction</div>
    <div style={{display:'flex', alignItems:'stretch', gap:0, borderRadius:8, overflow:'hidden', border:'1px solid var(--w-line)', maxWidth:1000}}>
      {[
        { n:'1', t:'Capture', d:'Drop the to-do in under 5s. Zero required fields. Lands in the inbox, context-free — that\'s fine, briefly.', c:'var(--w-clay)' },
        { n:'2', t:'Sort', d:'At triage you attach it to the idea, crystal, or thread it serves. One keystroke. This is where context enters.', c:'var(--w-ember-dk)' },
        { n:'3', t:'In context', d:'From now on the action travels with its thinking — visible under the crystal, in the trace, never as a loose checkbox.', c:'var(--w-moss)' },
      ].map((s,i)=>(
        <div key={i} style={{flex:1, padding:'16px 18px', borderRight:i<2?'1px solid var(--w-line)':0, background:'var(--w-card)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
            <span style={{width:22, height:22, borderRadius:'50%', background:s.c, color:'#FFF3E8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:600}}>{s.n}</span>
            <span style={{fontFamily:'var(--ff-display)', fontSize:14, fontWeight:600, letterSpacing:'.04em', textTransform:'uppercase', color:s.c}}>{s.t}</span>
          </div>
          <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)'}}>{s.d}</div>
        </div>
      ))}
    </div>

    <div style={{marginTop:18, padding:'12px 16px', background:'var(--w-bg-deep)', borderRadius:8, maxWidth:1000}}>
      <span className="wmono" style={{lineHeight:1.6}}>The to-do lens still exists — filter any view to "actionable now" and you get a flat list when you want one. But it's a <b>view</b>, not the home. The home is the thinking.</span>
    </div>
  </div>
);

Object.assign(window, { ActionsInContext });
