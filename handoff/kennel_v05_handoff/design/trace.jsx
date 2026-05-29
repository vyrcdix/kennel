// Trace — "go back through my thinking." A chronological trail of a theme:
// ideas fork, some firm into crystals, some are discarded; the messy
// supporting material clusters along the spine instead of scattering.
// Warm palette. Data model: derived from activity log + item lineage.

// Trail entry types
const TRACE = {
  spark:     { dot:'var(--w-clay)',     ring:'rgba(201,130,78,.25)' },
  gather:    { dot:'var(--w-ink-faint)',ring:'rgba(42,28,18,.10)' },
  chat:      { dot:'var(--w-terra)',    ring:'rgba(194,65,12,.16)' },
  fork:      { dot:'var(--w-ink-soft)', ring:'rgba(42,28,18,.12)' },
  crystal:   { dot:'var(--w-gold)',     ring:'rgba(224,165,46,.30)' },
  discard:   { dot:'var(--w-ink-faint)',ring:'transparent' },
};

const Spine = ({ type, last }) => {
  const t = TRACE[type];
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', width:30, flex:'0 0 30px'}}>
      <div style={{
        width: type==='crystal'?16:11, height: type==='crystal'?16:11, borderRadius:'50%',
        background: t.dot, boxShadow: t.ring!=='transparent'?`0 0 0 4px ${t.ring}`:'none',
        marginTop:4, flex:'0 0 auto',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        {type==='crystal' && <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#3A2807" strokeWidth="2.4"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>}
      </div>
      {!last && <div style={{width:2, flex:1, background:'var(--w-line)', marginTop:4, minHeight:18}} />}
    </div>
  );
};

const TraceView = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:12, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wmono" style={{display:'inline-flex', alignItems:'center', gap:6}}>
        <Icons.arrowR size={13} stroke="var(--w-ink-soft)" style={{transform:'rotate(180deg)'}} /> kennel
      </span>
      <span className="wfont-display" style={{fontSize:15, letterSpacing:'.06em'}}>TRACE</span>
      <div style={{flex:1}} />
      {/* filters */}
      <div style={{display:'flex', alignItems:'center', gap:6}}>
        {['all','crystals','discarded','chats'].map((f,i)=>(
          <span key={f} style={{padding:'4px 10px', borderRadius:20, fontSize:12, cursor:'pointer',
            background: i===0?'var(--w-ink)':'var(--w-card)', color: i===0?'var(--w-bg)':'var(--w-ink-soft)',
            border: i===0?'0':'1px solid var(--w-line)'}}>{f}</span>
        ))}
      </div>
    </div>

    <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'24px 36px 40px'}}>
      <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:6}}>
        <div>
          <div className="wfont-display" style={{fontSize:30, lineHeight:1.1}}>Go back through your thinking</div>
          <div style={{fontSize:14, color:'var(--w-ink-soft)', marginTop:4}}>How the <b>kennel</b> theme evolved — newest first. Crystals are milestones; discarded forks stay visible so you remember why.</div>
        </div>
        <div style={{textAlign:'right'}}>
          <span className="wmono">73 days · 84 items</span>
          <div style={{display:'flex', gap:12, marginTop:6, justifyContent:'flex-end'}}>
            <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:9, height:9, borderRadius:'50%', background:'var(--w-gold)'}} /><span className="wmono">4 crystals</span></span>
            <span style={{display:'inline-flex', alignItems:'center', gap:5}}><span style={{width:9, height:9, borderRadius:'50%', background:'var(--w-ink-faint)'}} /><span className="wmono">6 discarded</span></span>
          </div>
        </div>
      </div>

      {/* timeline */}
      <div style={{marginTop:22, maxWidth:840}}>
        {[
          { date:'12m ago', type:'chat', title:'Talking through guidebook vs playbook split', body:'Landed the distinction: guidebooks hold references, playbooks hold reproducible steps + artefact access.', kind:'chat' },
          { date:'today', type:'crystal', title:'A crystal has two doorways: read or reproduce', body:'Guidebook to understand, playbook to act. Both hang off the crystal.', crystal:true },
          { date:'2d ago', type:'gather', title:'Gathered 5 references on PKM structures', body:null, cluster:['ref','ref','doc','ref','note'] },
          { date:'2d ago', type:'crystal', title:'Three dark-mode elevations, no pure black', crystal:true },
          { date:'5d ago', type:'fork', title:'Forked: should chats panel move up?', body:'Explored two directions in parallel.', branches:[
            { outcome:'discard', label:'Move panel to top', why:'reads as PM-style activity feed' },
            { outcome:'crystal', label:'Fade stale chats in place', why:'became a crystal 9d later' },
          ]},
          { date:'9d ago', type:'spark', title:'Idea: spaced resurfacing for crystals', body:'Captured on mobile, still reflecting — not firm yet.', kind:'idea' },
          { date:'14d ago', type:'discard', title:'Tag-graph view for big projects', body:'Let go — too much machinery for a single-user tool.', kind:'idea' },
          { date:'21d ago', type:'gather', title:'Collected the capture-friction evidence', body:null, cluster:['note','note','chat','ref','doc','note','ref','chat'] },
          { date:'29d ago', type:'crystal', title:'Capture friction is the design constraint', crystal:true },
        ].map((e,i,arr)=>(
          <div key={i} style={{display:'flex', gap:14}}>
            <div style={{width:64, flex:'0 0 64px', textAlign:'right', paddingTop:2}}>
              <span className="wmono">{e.date}</span>
            </div>
            <Spine type={e.type} last={i===arr.length-1} />
            <div style={{flex:1, paddingBottom:20}}>
              {e.crystal ? (
                <div style={{padding:'2px', borderRadius:8, background:'linear-gradient(150deg, var(--w-gold), rgba(224,165,46,.25))', display:'inline-block', maxWidth:'100%'}}>
                  <div style={{background:'var(--w-card)', borderRadius:6, padding:'12px 16px'}}>
                    <div style={{display:'flex', alignItems:'center', gap:8, marginBottom: e.body?6:0}}>
                      <span style={{fontFamily:'var(--ff-display)', fontSize:9.5, letterSpacing:'.14em', color:'var(--w-gold-dk)', fontWeight:600}}>CRYSTALLIZED</span>
                    </div>
                    <div className="wfont-display" style={{fontSize:18, lineHeight:1.2}}>{e.title}</div>
                    {e.body && <div style={{fontSize:13, color:'var(--w-ink-soft)', marginTop:4, lineHeight:1.5}}>{e.body}</div>}
                  </div>
                </div>
              ) : e.type==='discard' ? (
                <div style={{opacity:.6}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <KindIcon kind={e.kind} size={13} />
                    <span style={{fontSize:14.5, fontWeight:500, textDecoration:'line-through', textDecorationColor:'var(--w-ink-faint)'}}>{e.title}</span>
                    <span style={{fontFamily:'var(--ff-display)', fontSize:9, letterSpacing:'.12em', color:'var(--w-ink-faint)'}}>DISCARDED</span>
                  </div>
                  {e.body && <div style={{fontSize:13, color:'var(--w-ink-soft)', marginTop:3, lineHeight:1.5}}>{e.body}</div>}
                </div>
              ) : e.type==='fork' ? (
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <span style={{fontFamily:'var(--ff-display)', fontSize:9.5, letterSpacing:'.12em', color:'var(--w-ink-soft)'}}>FORK</span>
                    <span style={{fontSize:14.5, fontWeight:600}}>{e.title}</span>
                  </div>
                  <div style={{display:'flex', gap:10}}>
                    {e.branches.map((b,j)=>(
                      <div key={j} style={{flex:1, padding:'10px 12px', background:'var(--w-card)', border:'1px solid var(--w-line)',
                        borderLeft:`3px solid ${b.outcome==='crystal'?'var(--w-gold)':'var(--w-ink-faint)'}`, borderRadius:'0 6px 6px 0',
                        opacity: b.outcome==='discard'?.7:1}}>
                        <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
                          {b.outcome==='crystal'
                            ? <span style={{color:'var(--w-gold-dk)'}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg></span>
                            : <Icons.x size={11} stroke="var(--w-ink-faint)" />}
                          <span style={{fontSize:13, fontWeight:600}}>{b.label}</span>
                        </div>
                        <span className="wmono">{b.why}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    {e.kind && <KindIcon kind={e.kind} size={13} />}
                    <span style={{fontSize:14.5, fontWeight:600}}>{e.title}</span>
                  </div>
                  {e.body && <div style={{fontSize:13, color:'var(--w-ink-soft)', marginTop:3, lineHeight:1.5}}>{e.body}</div>}
                  {e.cluster && (
                    <div style={{marginTop:8, display:'inline-flex', alignItems:'center', gap:8, padding:'7px 11px', background:'var(--w-bg-deep)', border:'1px dashed var(--w-line-bold)', borderRadius:6}}>
                      <span style={{display:'inline-flex', gap:3}}>
                        {e.cluster.slice(0,6).map((k,j)=><span key={j} style={{color:'var(--w-ink-faint)'}}><KindIcon kind={k} size={12} /></span>)}
                      </span>
                      <span className="wmono">{e.cluster.length} items gathered here</span>
                      <span style={{display:'inline-flex', alignItems:'center', gap:3, color:'var(--w-ink-soft)', fontFamily:'var(--ff-mono)', fontSize:11}}>open <Icons.arrowR size={10} stroke="var(--w-ink-soft)" /></span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

// ── Behind an idea — the sprawl, and tools to organize it ──────────────────
const BehindAnIdea = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:10, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wmono" style={{display:'inline-flex', alignItems:'center', gap:6}}>
        <Icons.arrowR size={13} stroke="var(--w-ink-soft)" style={{transform:'rotate(180deg)'}} /> kennel / trace
      </span>
    </div>
    <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'24px 36px 36px'}}>
      {/* the idea */}
      <div style={{display:'flex', alignItems:'center', gap:9, marginBottom:8}}>
        <KindIcon kind="idea" muted={false} size={16} />
        <span className="wlabel" style={{color:'var(--w-clay)'}}>Idea · still reflecting · not yet firm</span>
      </div>
      <div className="wfont-display" style={{fontSize:30, lineHeight:1.12, marginBottom:8, maxWidth:760}}>
        Spaced resurfacing — crystals you haven't seen float back up
      </div>
      <div style={{fontSize:14, color:'var(--w-ink-soft)', maxWidth:720, lineHeight:1.55, marginBottom:8}}>
        This idea has accumulated a lot behind it — chats, half-steps, collected references. It hasn't firmed into a crystal. The sprawl is the hard part to organize, so Kennel does it for you.
      </div>
      {/* sprawl summary bar */}
      <div style={{display:'flex', alignItems:'center', gap:0, borderRadius:8, overflow:'hidden', border:'1px solid var(--w-line)', maxWidth:720, marginBottom:24}}>
        {[['23','items behind this','var(--w-clay)'],['4','chats','var(--w-terra)'],['2','dead ends','var(--w-ink-faint)'],['9','days reflecting','var(--w-ink-soft)']].map(([n,l,c],i)=>(
          <div key={i} style={{flex:1, padding:'10px 14px', borderRight:i<3?'1px solid var(--w-line)':0, background:'var(--w-card)'}}>
            <div className="wfont-display" style={{fontSize:22, color:c}}>{n}</div>
            <span className="wmono">{l}</span>
          </div>
        ))}
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 300px', gap:28}}>
        {/* auto-organized clusters */}
        <div>
          <div className="wlabel" style={{marginBottom:12}}>Kennel organized the sprawl into</div>
          <div style={{display:'flex', flexDirection:'column', gap:12}}>
            {[
              { icon:Icons.doc, accent:'var(--w-moss)', label:'GUIDEBOOK MATERIAL', title:'References on memory & spaced repetition', n:'8 refs · 3 notes', hint:'ready to shape into a guidebook' },
              { icon:Icons.runbook, accent:'var(--w-ember-dk)', label:'PLAYBOOK MATERIAL', title:'How resurfacing would be implemented', n:'5 steps · 2 chats', hint:'rough — needs sequencing' },
              { icon:Icons.chat, accent:'var(--w-terra)', label:'OPEN THREADS', title:'Unresolved conversations', n:'4 chats · 1 stale', hint:'2 contradict each other' },
              { icon:Icons.x, accent:'var(--w-ink-faint)', label:'DEAD ENDS', title:'Approaches you set aside', n:'2 items', hint:'kept so you don\'t re-explore them' },
            ].map((c,i)=>(
              <div key={i} style={{display:'flex', gap:12, padding:'14px 16px', background:'var(--w-card)', border:'1px solid var(--w-line)', borderLeft:`3px solid ${c.accent}`, borderRadius:'0 7px 7px 0'}}>
                <span style={{color:c.accent, marginTop:1}}><c.icon size={16} stroke={c.accent} /></span>
                <div style={{flex:1}}>
                  <div className="wmono" style={{letterSpacing:'.1em', color:c.accent, marginBottom:3}}>{c.label}</div>
                  <div style={{fontSize:14.5, fontWeight:600}}>{c.title}</div>
                  <div style={{fontSize:12.5, color:'var(--w-ink-soft)', marginTop:2, fontStyle:'italic'}}>{c.hint}</div>
                </div>
                <span className="wmono" style={{whiteSpace:'nowrap'}}>{c.n}</span>
              </div>
            ))}
          </div>
        </div>

        {/* what to do with it */}
        <div>
          <div className="wlabel" style={{marginBottom:12}}>Move it forward</div>
          <div style={{display:'flex', flexDirection:'column', gap:9}}>
            <button style={{display:'flex', alignItems:'center', gap:9, padding:'12px 14px', background:'var(--w-gold)', color:'#3A2807', border:0, borderRadius:7, fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'var(--ff-sans)', textAlign:'left'}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>
              Crystallize this idea
            </button>
            <button style={{display:'flex', alignItems:'center', gap:9, padding:'11px 14px', background:'var(--w-card)', color:'var(--w-moss)', border:'1px solid var(--w-line)', borderRadius:7, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff-sans)', textAlign:'left'}}>
              <Icons.doc size={14} stroke="var(--w-moss)" /> Shape into a guidebook
            </button>
            <button style={{display:'flex', alignItems:'center', gap:9, padding:'11px 14px', background:'var(--w-card)', color:'var(--w-ember-dk)', border:'1px solid var(--w-line)', borderRadius:7, fontSize:13.5, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff-sans)', textAlign:'left'}}>
              <Icons.runbook size={14} stroke="var(--w-ember-dk)" /> Draft a playbook
            </button>
            <button style={{display:'flex', alignItems:'center', gap:9, padding:'11px 14px', background:'transparent', color:'var(--w-ink-soft)', border:'1px solid var(--w-line)', borderRadius:7, fontSize:13.5, cursor:'pointer', fontFamily:'var(--ff-sans)', textAlign:'left'}}>
              <Icons.x size={14} stroke="var(--w-ink-soft)" /> Let the whole idea go
            </button>
          </div>
          <div style={{marginTop:14, padding:'11px 13px', background:'var(--w-bg-deep)', borderRadius:7}}>
            <span className="wmono" style={{lineHeight:1.6}}>Letting go keeps the trail. The idea moves to discarded in your trace — visible, searchable, out of the way.</span>
          </div>
        </div>
      </div>
    </main>
  </div>
);

Object.assign(window, { TraceView, BehindAnIdea });
