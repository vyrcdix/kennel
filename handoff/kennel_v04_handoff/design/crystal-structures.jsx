// Crystal-scoped supporting structures: Guidebook vs Playbook.
// CRYSTAL = salient distilled tip.
//   ├─ GUIDEBOOK  = curated topical references behind it (what/why to read)
//   └─ PLAYBOOK   = reproducible steps + where artefacts live (how to do/access)
// Warm palette. Data model: both are docs with a `doctype` facet, linked to a crystal.

// ── 1. Relationship model ──────────────────────────────────────────────────
const CrystalStructureModel = () => (
  <div className="km km-warm" style={{padding:'32px 44px', height:'100%', overflow:'auto'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:6}}>
      <div className="wfont-display" style={{fontSize:30}}>A crystal sits on three kinds of material</div>
      <span className="wmono">field notes · mine &nbsp;·&nbsp; guidebook · others' &nbsp;·&nbsp; playbook · how-to</span>
    </div>
    <div style={{maxWidth:880, marginBottom:30, fontSize:15, lineHeight:1.6, color:'var(--w-ink-soft)'}}>
      The crystal is the salient tip — the memory, principle, or hint kept fresh on top. Beneath it sit three different kinds of supporting structure: what <b>I</b> observed, what <b>others</b> wrote, and <b>how</b> to reproduce it.
    </div>

    {/* The diagram */}
    <div style={{maxWidth:1000, margin:'0 auto'}}>
      {/* Crystal on top */}
      <div style={{display:'flex', justifyContent:'center', marginBottom:6}}>
        <div style={{
          width:520, padding:'4px', borderRadius:10,
          background:'linear-gradient(150deg, var(--w-gold), rgba(224,165,46,.25))'
        }}>
          <div style={{background:'var(--w-card)', borderRadius:7, padding:'16px 20px', textAlign:'center'}}>
            <div style={{display:'inline-flex', alignItems:'center', gap:7, color:'var(--w-gold-dk)', marginBottom:6}}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>
              <span className="wlabel" style={{color:'var(--w-gold-dk)'}}>Crystal</span>
            </div>
            <div className="wfont-display" style={{fontSize:21, lineHeight:1.2}}>Self-hosted deploy is reproducible in one command</div>
            <div className="wmono" style={{marginTop:6}}>the salient outcome · kept fresh</div>
          </div>
        </div>
      </div>

      {/* connectors */}
      <div style={{display:'flex', justifyContent:'center', gap:150, height:26}}>
        <div style={{width:1, background:'var(--w-line-bold)'}} />
        <div style={{width:1, background:'var(--w-line-bold)'}} />
        <div style={{width:1, background:'var(--w-line-bold)'}} />
      </div>

      {/* Three doorways */}
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16}}>
        {/* Field notes */}
        <div style={{background:'var(--w-card)', border:'1px solid var(--w-line)', borderTop:'3px solid var(--w-clay)', borderRadius:8, padding:'16px 18px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
            <span style={{color:'var(--w-clay)'}}><Icons.note size={16} /></span>
            <span className="wlabel" style={{color:'var(--w-clay)'}}>Field notes</span>
          </div>
          <div className="wmono" style={{marginBottom:6, color:'var(--w-clay)'}}>mine</div>
          <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>My own observations &amp; notes.</div>
          <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)', marginBottom:12}}>
            First-person thinking as it happens — what I noticed, hunches, running commentary. The raw material I generate myself.
          </div>
          <div className="wmono" style={{marginBottom:6, letterSpacing:'.1em'}}>HOLDS</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {['observations','hunches','daily notes','reactions'].map(t=>(
              <span key={t} style={{padding:'3px 9px', background:'rgba(201,130,78,.16)', color:'var(--w-clay)', borderRadius:20, fontSize:12}}>{t}</span>
            ))}
          </div>
        </div>

        {/* Guidebook */}
        <div style={{background:'var(--w-card)', border:'1px solid var(--w-line)', borderTop:'3px solid var(--w-moss)', borderRadius:8, padding:'16px 18px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
            <span style={{color:'var(--w-moss)'}}><Icons.doc size={16} /></span>
            <span className="wlabel" style={{color:'var(--w-moss)'}}>Guidebook</span>
          </div>
          <div className="wmono" style={{marginBottom:6, color:'var(--w-moss)'}}>others'</div>
          <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Curated topical references.</div>
          <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)', marginBottom:12}}>
            The linked information <i>behind</i> the crystal — articles, source docs, prior chats, annotated with why each matters. What I read to understand it.
          </div>
          <div className="wmono" style={{marginBottom:6, letterSpacing:'.1em'}}>HOLDS</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {['references','annotated links','source docs','context'].map(t=>(
              <span key={t} style={{padding:'3px 9px', background:'rgba(79,112,56,.12)', color:'var(--w-moss)', borderRadius:20, fontSize:12}}>{t}</span>
            ))}
          </div>
        </div>

        {/* Playbook */}
        <div style={{background:'var(--w-card)', border:'1px solid var(--w-line)', borderTop:'3px solid var(--w-ember)', borderRadius:8, padding:'16px 18px'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10}}>
            <span style={{color:'var(--w-ember-dk)'}}><Icons.runbook size={16} /></span>
            <span className="wlabel" style={{color:'var(--w-ember-dk)'}}>Playbook</span>
          </div>
          <div className="wmono" style={{marginBottom:6, color:'var(--w-ember-dk)'}}>how-to</div>
          <div style={{fontSize:14, fontWeight:600, marginBottom:6}}>Reproducible steps + artefacts.</div>
          <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)', marginBottom:12}}>
            A recipe. Deployment steps, commands, keys, and links to running artefacts. What I follow to do it again.
          </div>
          <div className="wmono" style={{marginBottom:6, letterSpacing:'.1em'}}>HOLDS</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
            {['steps','commands','keys & access','artefact links'].map(t=>(
              <span key={t} style={{padding:'3px 9px', background:'rgba(217,83,31,.12)', color:'var(--w-ember-dk)', borderRadius:20, fontSize:12}}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      {/* raw material base */}
      <div style={{display:'flex', justifyContent:'center', gap:150, height:26}}>
        <div style={{width:1, background:'var(--w-line-bold)'}} />
        <div style={{width:1, background:'var(--w-line-bold)'}} />
        <div style={{width:1, background:'var(--w-line-bold)'}} />
      </div>
      <div style={{padding:'12px 18px', background:'var(--w-bg-deep)', border:'1px solid var(--w-line)', borderRadius:8, display:'flex', alignItems:'center', gap:12, justifyContent:'center'}}>
        <span className="wmono" style={{letterSpacing:'.1em'}}>RAW MATERIAL</span>
        <span style={{color:'var(--w-ink-faint)'}}>·</span>
        <span style={{display:'inline-flex', alignItems:'center', gap:10}}>
          {['idea','note','action','doc','ref','chat'].map(k=>(
            <span key={k} style={{display:'inline-flex', alignItems:'center', gap:4, color:'var(--w-ink-soft)', fontSize:12.5}}>
              <KindIcon kind={k} size={13} /> {k}
            </span>
          ))}
        </span>
      </div>
    </div>

    <div style={{maxWidth:1000, margin:'24px auto 0', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18}}>
      <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)'}}>
        <b style={{color:'var(--w-clay)'}}>Field notes when</b> you're capturing your own thinking — what you saw, what you suspect, what just happened.
      </div>
      <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)'}}>
        <b style={{color:'var(--w-moss)'}}>Guidebook when</b> you want the sources behind a crystal — to revisit why it's true, or to share the reading.
      </div>
      <div style={{fontSize:13, lineHeight:1.55, color:'var(--w-ink-soft)'}}>
        <b style={{color:'var(--w-ember-dk)'}}>Playbook when</b> you've recalled the crystal and need to act — "where's the demo, how do I deploy, what were the steps?"
      </div>
    </div>
  </div>
);

// ── 2. Playbook view ───────────────────────────────────────────────────────
const PlaybookView = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:10, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wmono" style={{display:'inline-flex', alignItems:'center', gap:6}}>
        <Icons.arrowR size={13} stroke="var(--w-ink-soft)" style={{transform:'rotate(180deg)'}} /> kennel / playbooks
      </span>
    </div>
    <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
      {/* header */}
      <div style={{padding:'24px 36px 20px', background:'linear-gradient(180deg, rgba(217,83,31,.10), transparent)', borderBottom:'1px solid var(--w-line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', background:'var(--w-ember)', color:'#FFF3E8', borderRadius:4, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:500}}>
            <Icons.runbook size={11} stroke="#FFF3E8" /> PLAYBOOK
          </span>
          <span className="wmono">reproducible · rev 4 · last run 2d ago</span>
        </div>
        <div className="wfont-display" style={{fontSize:32, lineHeight:1.1, marginBottom:10}}>Deploy &amp; demo Kennel</div>
        {/* linked crystal */}
        <div style={{display:'inline-flex', alignItems:'center', gap:8, padding:'7px 12px', background:'var(--w-card)', border:'1px solid var(--w-gold)', borderRadius:6}}>
          <span style={{color:'var(--w-gold-dk)'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg></span>
          <span className="wmono" style={{color:'var(--w-gold-dk)'}}>reproduces crystal</span>
          <span style={{fontSize:13.5, fontWeight:600}}>Self-hosted deploy is reproducible in one command</span>
        </div>
      </div>

      <div style={{padding:'22px 36px 36px', display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:28}}>
        {/* Steps */}
        <div>
          <div className="wlabel" style={{marginBottom:14}}>The steps</div>
          <div style={{display:'flex', flexDirection:'column', gap:0}}>
            {[
              { t:'Sync and build', cmd:'$ cd ~/work/kennel && uv sync\n$ make build', note:'~30s on a warm cache' },
              { t:'Run preflight checks', cmd:'$ kennel doctor --deploy', note:'refuses if migrations pending or tree dirty' },
              { t:'Deploy to the VPS', cmd:'$ make deploy   # rsync + systemd restart', note:'idempotent; safe to re-run' },
              { t:'Verify the live demo', cmd:'$ open https://kennel.dixon.run/health', note:'expect 200 + build sha' },
            ].map((s,i,arr)=>(
              <div key={i} style={{display:'flex', gap:14, paddingBottom: i<arr.length-1?18:0}}>
                {/* number + rail */}
                <div style={{display:'flex', flexDirection:'column', alignItems:'center'}}>
                  <div style={{width:28, height:28, borderRadius:'50%', background:'var(--w-ember)', color:'#FFF3E8', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:600, flex:'0 0 auto'}}>{i+1}</div>
                  {i<arr.length-1 && <div style={{width:2, flex:1, background:'var(--w-line)', marginTop:4}} />}
                </div>
                <div style={{flex:1, paddingBottom:4}}>
                  <div style={{fontSize:15, fontWeight:600, marginBottom:7}}>{s.t}</div>
                  <pre style={{margin:0, fontFamily:'var(--ff-mono)', fontSize:12.5, lineHeight:1.6, padding:'10px 13px', background:'var(--w-ink)', color:'#F3E4CE', borderRadius:6, whiteSpace:'pre', overflow:'auto'}}>{s.cmd}</pre>
                  <div className="wmono" style={{marginTop:6}}>{s.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Artefacts — where things live */}
        <div>
          <div className="wlabel" style={{marginBottom:14}}>The artefacts · where they live</div>
          <div style={{display:'flex', flexDirection:'column', gap:10}}>
            {[
              { icon:Icons.ext,  label:'Live demo',    val:'kennel.dixon.run', sub:'up · build 4a2f', accent:'var(--w-moss)' },
              { icon:Icons.link, label:'Repo',         val:'github.com/craig/kennel', sub:'main · 2d ago', accent:'var(--w-clay)' },
              { icon:Icons.runbook, label:'Prototype', val:'localhost:5173', sub:'vite dev server', accent:'var(--w-clay)' },
            ].map((a,i)=>(
              <div key={i} style={{display:'flex', alignItems:'center', gap:11, padding:'12px 14px', background:'var(--w-card)', border:'1px solid var(--w-line)', borderLeft:`3px solid ${a.accent}`, borderRadius:'0 6px 6px 0'}}>
                <span style={{color:a.accent}}><a.icon size={15} stroke={a.accent} /></span>
                <div style={{flex:1, minWidth:0}}>
                  <div className="wmono" style={{letterSpacing:'.08em'}}>{a.label.toUpperCase()}</div>
                  <div style={{fontFamily:'var(--ff-mono)', fontSize:13, color:'var(--w-ink)'}}>{a.val}</div>
                </div>
                <span className="wmono">{a.sub}</span>
              </div>
            ))}
            {/* keys */}
            <div style={{padding:'12px 14px', background:'var(--w-bg-deep)', border:'1px solid var(--w-line)', borderRadius:6}}>
              <div className="wmono" style={{letterSpacing:'.08em', marginBottom:8}}>KEYS &amp; ACCESS · 1Password</div>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                {[['KENNEL_TOKEN','vault · kennel-prod'],['VPS_SSH','vault · infra'],['MCP_URL','kennel.dixon.run/mcp']].map(([k,v])=>(
                  <div key={k} style={{display:'flex', alignItems:'center', gap:8}}>
                    <span style={{fontFamily:'var(--ff-mono)', fontSize:12.5, color:'var(--w-ember-dk)'}}>{k}</span>
                    <span style={{flex:1, borderBottom:'1px dotted var(--w-line)'}} />
                    <span className="wmono">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
);

// ── 3. Guidebook view ──────────────────────────────────────────────────────
const GuidebookView = () => (
  <div className="km km-warm" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <div style={{height:46, borderBottom:'1px solid var(--w-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:10, background:'var(--w-card)', flex:'0 0 auto'}}>
      <span className="wmono" style={{display:'inline-flex', alignItems:'center', gap:6}}>
        <Icons.arrowR size={13} stroke="var(--w-ink-soft)" style={{transform:'rotate(180deg)'}} /> kennel / guidebooks
      </span>
    </div>
    <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
      <div style={{padding:'24px 36px 20px', background:'linear-gradient(180deg, rgba(79,112,56,.10), transparent)', borderBottom:'1px solid var(--w-line)'}}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
          <span style={{display:'inline-flex', alignItems:'center', gap:6, padding:'3px 9px', background:'var(--w-moss)', color:'#F1F4E8', borderRadius:4, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:500}}>
            <Icons.doc size={11} stroke="#F1F4E8" /> GUIDEBOOK
          </span>
          <span className="wmono">curated · 14 references · updated 5d ago</span>
        </div>
        <div className="wfont-display" style={{fontSize:32, lineHeight:1.1, marginBottom:10}}>Capture-friction research</div>
        <div style={{display:'inline-flex', alignItems:'center', gap:8, padding:'7px 12px', background:'var(--w-card)', border:'1px solid var(--w-gold)', borderRadius:6}}>
          <span style={{color:'var(--w-gold-dk)'}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg></span>
          <span className="wmono" style={{color:'var(--w-gold-dk)'}}>supports crystal</span>
          <span style={{fontSize:13.5, fontWeight:600}}>Capture friction is the design constraint</span>
        </div>
      </div>

      <div style={{padding:'22px 36px 36px'}}>
        <div style={{fontSize:14.5, lineHeight:1.6, color:'var(--w-ink-soft)', maxWidth:720, marginBottom:24}}>
          Everything that informs the capture-friction principle, grouped by topic and annotated with why it matters. This is the reading list behind the crystal.
        </div>

        {[
          { topic:'FOUNDATIONS', refs:[
            { kind:'ref', title:'Tiago Forte — capture → distillation → expression', why:'The CODE model; our pipeline is a variant of it.', meta:'web · annotated' },
            { kind:'ref', title:'GTD — the two-minute rule', why:'Origin of the sub-5s instinct; we tightened the threshold.', meta:'web' },
          ]},
          { topic:'OUR EVIDENCE', refs:[
            { kind:'note', title:'What makes me NOT capture something', why:'The friction inventory — every hesitation we observed.', meta:'41d ago · 8 obs' },
            { kind:'chat', title:'do we sort at capture or after?', why:'Where we landed on "capture now, sort later".', meta:'31d ago' },
            { kind:'doc',  title:'Mobile share-sheet timing study', why:'Measured real capture latency across devices.', meta:'rev 3' },
          ]},
          { topic:'COUNTERPOINTS', refs:[
            { kind:'ref', title:'The case for structured capture forms', why:'Kept for tension — argues the opposite; we disagree but it sharpened us.', meta:'web' },
          ]},
        ].map(group=>(
          <div key={group.topic} style={{marginBottom:22}}>
            <div className="wmono" style={{letterSpacing:'.12em', marginBottom:10, color:'var(--w-moss)'}}>{group.topic}</div>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              {group.refs.map((r,i)=>(
                <div key={i} style={{display:'flex', gap:13, padding:'13px 15px', background:'var(--w-card)', border:'1px solid var(--w-line)', borderRadius:7}}>
                  <span style={{color:'var(--w-ink-faint)', marginTop:2}}><KindIcon kind={r.kind} size={15} muted={false} /></span>
                  <div style={{flex:1}}>
                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                      <span style={{fontSize:14.5, fontWeight:600, flex:1}}>{r.title}</span>
                      <span className="wmono">{r.meta}</span>
                    </div>
                    <div style={{fontSize:13, lineHeight:1.5, color:'var(--w-ink-soft)', marginTop:4, fontStyle:'italic'}}>{r.why}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  </div>
);

Object.assign(window, { CrystalStructureModel, PlaybookView, GuidebookView });
