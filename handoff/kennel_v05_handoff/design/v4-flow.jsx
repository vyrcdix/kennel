// v0.4 — canonical "blaze + dust" palette applied across the core flow.
// Tone leads: BLAZE (#E8B547) = crystallization glow (the light) ·
// DUST (#C9A87C) = everyday surface (the room) · EMBER sparing action ·
// MOSS structure · warm ink. Data model unchanged.

if (typeof document !== 'undefined' && !document.getElementById('km-v4-tokens')) {
  const s = document.createElement('style');
  s.id = 'km-v4-tokens';
  s.textContent = `
    .km-v4 {
      --v-bg:      #EEE2C9;   /* dust ground */
      --v-sunk:    #E5D4B4;   /* deeper dust */
      --v-card:    #F8F1E0;   /* lighter card = lift, no shadow */
      --v-ink:     #2B2014;   /* warm dark ink */
      --v-soft:    rgba(43,32,20,.62);
      --v-faint:   rgba(43,32,20,.40);
      --v-line:    rgba(43,32,20,.13);
      --v-line2:   rgba(43,32,20,.26);
      --v-blaze:   #E8B547;   /* crystal glow — the light */
      --v-blaze-dk:#B07E12;
      --v-dust:    #C9A87C;
      --v-ember:   #D9622C;   /* sparing action */
      --v-ember-dk:#A84919;
      --v-moss:    #5C7A3E;
      --v-clay:    #BC7A4E;
      background: var(--v-bg);
      color: var(--v-ink);
      font-family: var(--ff-sans);
    }
    .km-v4 .vd  { font-family: var(--ff-display); font-weight:600; letter-spacing:.01em; color:var(--v-ink); }
    .km-v4 .vlab{ font-family: var(--ff-display); font-weight:500; font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--v-soft); }
    .km-v4 .vm  { font-family: var(--ff-mono); font-size:11px; color:var(--v-faint); }
    .km-v4 .vm-bz{ font-family: var(--ff-mono); font-size:11px; color:var(--v-blaze-dk); }
  `;
  document.head.appendChild(s);
}

// crystal glyph
const Gem = ({ s = 13, c = 'currentColor', w = 1.6 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>
);

// v4 chrome bar
const V4Chrome = ({ crumb }) => (
  <div style={{height:48, borderBottom:'1px solid var(--v-line)', display:'flex', alignItems:'center', padding:'0 18px', gap:14, background:'var(--v-card)', flex:'0 0 auto'}}>
    <div style={{display:'flex', alignItems:'center', gap:9}}>
      <span style={{width:22, height:22, borderRadius:5, border:'1px dashed var(--v-line2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--ff-mono)', fontSize:9, color:'var(--v-faint)'}}>K</span>
      <span className="vd" style={{fontSize:16, letterSpacing:'.09em'}}>KENNEL</span>
    </div>
    {crumb && <span className="vm" style={{marginLeft:2}}>{crumb}</span>}
    <div style={{flex:1}} />
    <div style={{display:'flex', alignItems:'center', gap:8, background:'var(--v-sunk)', borderRadius:6, padding:'6px 11px', width:280}}>
      <Icons.search size={13} stroke="var(--v-soft)" />
      <span className="vm" style={{flex:1}}>search everything</span>
      <span style={{fontFamily:'var(--ff-mono)', fontSize:10, color:'var(--v-faint)'}}>⌘K</span>
    </div>
    <button style={{display:'inline-flex', alignItems:'center', gap:6, background:'var(--v-ember)', color:'#FFF3E8', border:0, borderRadius:6, padding:'7px 13px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'var(--ff-sans)'}}>
      <Icons.plus size={13} stroke="#FFF3E8" /> Capture
    </button>
  </div>
);

// left rail — themes, blaze count = crystals
const V4Rail = ({ active }) => {
  const themes = [
    { slug:'kennel', name:'Kennel', crystals:11, hot:true, active:true },
    { slug:'picnic-engage', name:'Picnic — Engagement', crystals:3 },
    { slug:'klein-advisory', name:'Klein Advisory', crystals:2 },
    { slug:'reading-stack', name:'Reading Stack', crystals:6 },
    { slug:'pacecraft', name:'Pacecraft', crystals:4 },
  ];
  return (
    <aside style={{width:222, flex:'0 0 222px', borderRight:'1px solid var(--v-line)', background:'var(--v-card)', padding:'14px 0', display:'flex', flexDirection:'column', gap:2, overflow:'hidden'}}>
      <div style={{padding:'2px 16px 8px'}}><span className="vlab">Workspace</span></div>
      {[
        {id:'home', icon:Icons.menu, label:'Dashboard'},
        {id:'crystals', icon:Gem, label:'All crystals', n:26, blaze:true},
        {id:'sort', icon:Icons.filter, label:'The bench', n:14},
        {id:'search', icon:Icons.search, label:'Search'},
      ].map(s=>(
        <button key={s.id} style={{display:'flex', alignItems:'center', gap:9, width:'100%', padding:'6px 16px', border:0, cursor:'pointer', textAlign:'left',
          background: active===s.id?'rgba(232,181,71,.16)':'transparent',
          boxShadow: active===s.id?'inset 2px 0 0 var(--v-blaze)':'none',
          color: active===s.id?'var(--v-blaze-dk)':'var(--v-ink)', fontFamily:'var(--ff-sans)', fontSize:13}}>
          {s.id==='crystals' ? <Gem s={14} c={s.blaze?'var(--v-blaze-dk)':'currentColor'} /> : <s.icon size={14} />}
          <span style={{flex:1}}>{s.label}</span>
          {s.n!=null && <span className="vm">{s.n}</span>}
        </button>
      ))}
      <div style={{padding:'14px 16px 6px'}}><span className="vlab">Themes</span></div>
      {themes.map(t=>(
        <button key={t.slug} style={{display:'flex', alignItems:'center', gap:9, width:'100%', padding:'6px 16px', border:0, cursor:'pointer', textAlign:'left',
          background: t.active?'rgba(201,168,124,.22)':'transparent',
          boxShadow: t.active?'inset 2px 0 0 var(--v-dust)':'none', color:'var(--v-ink)', fontFamily:'var(--ff-sans)', fontSize:13}}>
          <span style={{flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{t.name}</span>
          <span style={{display:'inline-flex', alignItems:'center', gap:3, color:'var(--v-blaze-dk)'}}>
            <Gem s={10} c="var(--v-blaze-dk)" />
            <span style={{fontFamily:'var(--ff-mono)', fontSize:11}}>{t.crystals}</span>
          </span>
        </button>
      ))}
    </aside>
  );
};

// reusable crystal card (blaze glow)
const V4Crystal = ({ ctype = 'PRINCIPLE', title, body, srcs, age, big }) => (
  <div style={{breakInside:'avoid', marginBottom:12, padding:'2px', borderRadius:9, background:'linear-gradient(150deg, var(--v-blaze), rgba(232,181,71,.28))'}}>
    <div style={{background:'var(--v-card)', borderRadius:7, padding: big?'16px 18px':'13px 15px', cursor:'pointer'}}>
      <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:7}}>
        <Gem s={12} c="var(--v-blaze-dk)" />
        <span style={{fontFamily:'var(--ff-display)', fontSize:9, letterSpacing:'.14em', fontWeight:600, color:'var(--v-blaze-dk)'}}>{ctype}</span>
        <span style={{flex:1}} />
        {age && <span className="vm">{age}</span>}
      </div>
      <div className="vd" style={{fontSize: big?19:15, lineHeight:1.25, fontWeight: ctype==='QUOTE'?500:700, fontStyle: ctype==='QUOTE'?'italic':'normal'}}>
        {ctype==='QUOTE' ? `“${title}”` : title}
      </div>
      {body && <div style={{fontSize:12.5, lineHeight:1.5, color:'var(--v-soft)', marginTop:5}}>{body}</div>}
      {srcs && (
        <div style={{display:'flex', alignItems:'center', gap:8, marginTop:8}}>
          <span style={{display:'inline-flex', gap:4}}>{srcs.map((k,i)=><span key={i} style={{color:'var(--v-faint)'}}><KindIcon kind={k} size={12} /></span>)}</span>
          <span className="vm">{srcs.length} sources</span>
          <span style={{flex:1}} />
          <span style={{display:'inline-flex', alignItems:'center', gap:3, color:'var(--v-blaze-dk)', fontFamily:'var(--ff-mono)', fontSize:10.5}}>drill <Icons.arrowR size={10} stroke="var(--v-blaze-dk)" /></span>
        </div>
      )}
    </div>
  </div>
);

// ── SCREEN 1 · Dashboard (cross-theme home) ────────────────────────────────
const V4Dashboard = () => (
  <div className="km km-v4" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <V4Chrome />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <V4Rail active="home" />
      <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'22px 32px 36px'}}>
        <div style={{marginBottom:18}}>
          <div className="vd" style={{fontSize:28}}>Dashboard</div>
          <span className="vm">friday · 29 may 2026 · what you're thinking about</span>
        </div>

        {/* Recently crystallized — the light, across themes */}
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <Gem s={15} c="var(--v-blaze-dk)" />
          <span className="vlab" style={{color:'var(--v-blaze-dk)'}}>Crystallized this week</span>
          <span style={{flex:1}} />
          <span className="vm-bz">3 new · 26 total</span>
        </div>
        <div style={{columnCount:3, columnGap:12, marginBottom:24}}>
          <V4Crystal ctype="PRINCIPLE" title="A crystal sits on three kinds of material" body="Field notes (mine), guidebook (others'), runbook (how-to)." srcs={['note','doc','chat']} age="today" />
          <V4Crystal ctype="HINT" title="Actions serve thinking — never a context-free list" srcs={['idea','note']} age="2d ago" />
          <V4Crystal ctype="QUOTE" title="Dust is the room, blaze is the light." srcs={['note']} age="3d ago" />
        </div>

        {/* In focus — actions IN CONTEXT, not a flat list */}
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <span style={{color:'var(--v-ember-dk)'}}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>
          <span className="vlab" style={{color:'var(--v-ember-dk)'}}>In focus</span>
          <span style={{flex:1}} />
          <span className="vm">by last touched · actions shown with their thinking</span>
        </div>
        <div style={{display:'flex', flexDirection:'column', gap:14, marginBottom:24}}>
          {[
            { theme:'kennel', serves:'A crystal sits on three kinds of material', kind:'crystal', actions:[
              { t:'Re-render the core flow in blaze + dust', meta:'today', live:true },
              { t:'Fold doctype facet into the data model handoff', meta:'today' },
            ]},
            { theme:'picnic-engage', serves:'Paused-contact branch (idea, reflecting)', kind:'idea', actions:[
              { t:'Email Klein the revised cadence outline', meta:'Wed' },
            ]},
          ].map((g,i)=>(
            <div key={i} style={{background:'var(--v-card)', border:'1px solid var(--v-line)', borderRadius:8, padding:'12px 15px'}}>
              <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:9}}>
                {g.kind==='crystal'?<Gem s={12} c="var(--v-blaze-dk)" />:<KindIcon kind="idea" size={12} muted={false} />}
                <span className="vm" style={{color: g.kind==='crystal'?'var(--v-blaze-dk)':'var(--v-clay)', letterSpacing:'.04em'}}>in service of</span>
                <span style={{fontSize:13, fontWeight:600}}>{g.serves}</span>
                <span style={{flex:1}} />
                <span className="km-proj" style={{background:'rgba(201,168,124,.30)', color:'var(--v-clay)'}}>{g.theme}</span>
              </div>
              <div style={{display:'flex', flexDirection:'column', gap:6, paddingLeft:18, borderLeft:'2px solid var(--v-line)', marginLeft:5}}>
                {g.actions.map((a,j)=>(
                  <div key={j} style={{display:'flex', alignItems:'center', gap:9, padding:'7px 10px', background: a.live?'rgba(217,98,44,.07)':'var(--v-sunk)', borderRadius:6, boxShadow: a.live?'inset 2px 0 0 var(--v-ember)':'none'}}>
                    <span style={{width:14, height:14, border:'1.5px solid var(--v-ember)', borderRadius:3, flex:'0 0 auto'}} />
                    <span style={{fontSize:13.5, flex:1}}>{a.t}</span>
                    <span className="vm">{a.meta}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Theme rail */}
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:12}}>
          <span className="vlab">Themes</span>
          <span style={{flex:1}} />
          <span className="vm">blaze count = crystals</span>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:12}}>
          {[
            { slug:'kennel', name:'Kennel', crystals:11, gather:23, touched:'12m ago', hot:true },
            { slug:'picnic-engage', name:'Picnic — Engagement', crystals:3, gather:8, touched:'2d ago' },
            { slug:'reading-stack', name:'Reading Stack', crystals:6, gather:14, touched:'5d ago' },
            { slug:'pacecraft', name:'Pacecraft', crystals:4, gather:6, touched:'1w ago' },
          ].map(t=>(
            <div key={t.slug} style={{background:'var(--v-card)', border:'1px solid var(--v-line)', borderTop: t.hot?'2px solid var(--v-blaze)':'2px solid transparent', borderRadius:8, padding:'13px 14px', display:'flex', flexDirection:'column', gap:10}}>
              <span className="km-proj" style={{background:'rgba(201,168,124,.30)', color:'var(--v-clay)', alignSelf:'flex-start'}}>{t.slug}</span>
              <div style={{fontSize:14.5, fontWeight:600, lineHeight:1.25}}>{t.name}</div>
              <div style={{display:'flex', alignItems:'center', gap:12, marginTop:'auto', paddingTop:8, borderTop:'1px solid var(--v-line)'}}>
                <span style={{display:'inline-flex', alignItems:'center', gap:4, color:'var(--v-blaze-dk)'}}>
                  <Gem s={12} c="var(--v-blaze-dk)" /><span style={{fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:500}}>{t.crystals}</span>
                </span>
                <span className="vm">{t.gather} gathered</span>
                <span style={{flex:1}} />
                <span className="vm">{t.touched}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  </div>
);

// ── SCREEN 2 · Theme landing (the funnel) ──────────────────────────────────
const V4ThemeLanding = () => (
  <div className="km km-v4" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <V4Chrome crumb="/ kennel" />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <V4Rail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        {/* dust header band */}
        <div style={{padding:'24px 34px 22px', background:'var(--v-sunk)', borderBottom:'1px solid var(--v-line)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:9}}>
            <span className="km-proj" style={{background:'rgba(201,168,124,.40)', color:'#7a5a32'}}>kennel</span>
            <span className="vm">thread · 73 days · last touched 12m ago</span>
          </div>
          <div className="vd" style={{fontSize:36, lineHeight:1.1, maxWidth:780, marginBottom:8}}>
            Turn scattered thinking into crystallized knowledge
          </div>
          <div style={{fontSize:14.5, color:'var(--v-soft)', maxWidth:680, lineHeight:1.5}}>
            Capture across sources, shape it, and keep the durable outcomes fresh and findable.
          </div>
        </div>

        <div style={{padding:'22px 34px 36px', display:'flex', flexDirection:'column', gap:24}}>
          {/* SALIENT LAYER — the front page, blaze */}
          <section>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:14}}>
              <Gem s={16} c="var(--v-blaze-dk)" />
              <span className="vlab" style={{color:'var(--v-blaze-dk)'}}>The salient layer · what this theme has crystallized</span>
              <span style={{flex:1}} />
              <span className="vm-bz">11 crystals · kept fresh</span>
            </div>
            <div style={{columnCount:3, columnGap:12}}>
              <V4Crystal big ctype="PRINCIPLE" title="Capture friction is the design constraint" body="Every other principle bends to sub-5s capture." srcs={['note','doc','chat','ref']} age="29d" />
              <V4Crystal ctype="QUOTE" title="Make capture faster and sort later." srcs={['doc','note']} age="29d" />
              <V4Crystal ctype="HINT" title="Reindex FTS5 on an empty search — the trigram index drifts." srcs={['doc','ref']} age="12d" />
              <V4Crystal ctype="PRINCIPLE" title="Three dark-mode elevations, never pure black" srcs={['note','doc','chat']} age="2d" />
              <V4Crystal ctype="MEMORY" title="Chose to fade stale chats in place, not move them." srcs={['idea','chat']} age="9d" />
              <V4Crystal ctype="REMINDER" title="Field notes ≠ runbook. Notes are thinking; runbook is how-to." srcs={['note']} age="3d" />
            </div>
          </section>

          {/* PIPELINE — dust track, blaze endpoint */}
          <section>
            <div className="vlab" style={{marginBottom:12}}>The pipeline · raw → durable</div>
            <div style={{display:'flex', borderRadius:8, overflow:'hidden', border:'1px solid var(--v-line)'}}>
              {[
                {n:'01', l:'THEME', c:'var(--v-clay)', v:1, d:'the big idea'},
                {n:'02', l:'GATHER', c:'var(--v-soft)', v:23, d:'docs & refs'},
                {n:'03', l:'SHAPE', c:'var(--v-ember-dk)', v:3, d:'runbooks & guidebooks', active:true},
                {n:'04', l:'CRYSTALLIZE', c:'var(--v-blaze-dk)', v:11, d:'durable outcomes', gold:true},
              ].map((s,i,arr)=>(
                <div key={i} style={{flex: s.gold?1.1:1, padding:'14px 16px', borderRight:i<arr.length-1?'1px solid var(--v-line)':0,
                  background: s.gold?'linear-gradient(180deg, rgba(232,181,71,.24), rgba(232,181,71,.08))':(s.active?'rgba(217,98,44,.08)':'var(--v-card)'),
                  borderTop: s.active?'3px solid var(--v-ember)':(s.gold?'3px solid var(--v-blaze)':'3px solid transparent')}}>
                  <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:6}}>
                    <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color:s.c, fontWeight:500}}>{s.n}</span>
                    <span className="vlab" style={{fontSize:11, color:s.c}}>{s.l}</span>
                    {s.gold && <span style={{marginLeft:'auto', color:'var(--v-blaze-dk)'}}><Gem s={13} c="var(--v-blaze-dk)" /></span>}
                  </div>
                  <div style={{display:'flex', alignItems:'baseline', gap:8}}>
                    <span className="vd" style={{fontSize:28, color: s.gold?'var(--v-blaze-dk)':'var(--v-ink)'}}>{s.v}</span>
                    <span style={{fontSize:12, color:'var(--v-soft)'}}>{s.d}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* THREE DOORWAYS */}
          <section>
            <div className="vlab" style={{marginBottom:12}}>Supporting material · three doorways under the crystals</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
              {[
                { icon:Icons.note, accent:'var(--v-clay)', label:'FIELD NOTES', sub:'mine', desc:'Observations & notes as I think.', n:'31 notes' },
                { icon:Icons.doc, accent:'var(--v-moss)', label:'GUIDEBOOKS', sub:"others'", desc:'Curated topical references behind a crystal.', n:'4 guidebooks' },
                { icon:Icons.runbook, accent:'var(--v-ember-dk)', label:'RUNBOOKS', sub:'how-to', desc:'Reproducible steps + where artefacts live.', n:'2 runbooks' },
              ].map((d,i)=>(
                <div key={i} style={{background:'var(--v-card)', border:'1px solid var(--v-line)', borderTop:`3px solid ${d.accent}`, borderRadius:8, padding:'15px 16px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
                    <span style={{color:d.accent}}><d.icon size={15} stroke={d.accent} /></span>
                    <span className="vlab" style={{color:d.accent}}>{d.label}</span>
                    <span style={{flex:1}} />
                    <span className="vm" style={{color:d.accent}}>{d.sub}</span>
                  </div>
                  <div style={{fontSize:13, color:'var(--v-soft)', lineHeight:1.5, marginBottom:10}}>{d.desc}</div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span className="vm">{d.n}</span>
                    <span style={{flex:1}} />
                    <span style={{display:'inline-flex', alignItems:'center', gap:3, color:d.accent, fontFamily:'var(--ff-mono)', fontSize:11}}>open <Icons.arrowR size={10} stroke={d.accent} /></span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* TRACE teaser */}
          <section>
            <div style={{display:'flex', alignItems:'center', gap:10, padding:'14px 18px', background:'var(--v-sunk)', border:'1px solid var(--v-line)', borderRadius:8, cursor:'pointer'}}>
              <span style={{color:'var(--v-soft)'}}><Icons.runbook size={16} /></span>
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:600}}>Go back through your thinking</div>
                <span className="vm">73-day trace · 11 crystals · 6 discarded forks · clustered material</span>
              </div>
              <span style={{display:'inline-flex', alignItems:'center', gap:5, color:'var(--v-ink-soft)', fontFamily:'var(--ff-mono)', fontSize:12}}>open trace <Icons.arrowR size={12} stroke="var(--v-soft)" /></span>
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
);

// ── SCREEN 3 · Crystal detail (the hub + three doorways + lineage) ─────────
const V4CrystalDetail = () => (
  <div className="km km-v4" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <V4Chrome crumb="/ kennel / crystals" />
    <div style={{flex:1, display:'grid', gridTemplateColumns:'1.3fr 1fr', overflow:'hidden'}}>
      {/* the crystal */}
      <div className="km-scroll" style={{overflow:'auto', padding:'30px 34px', background:'linear-gradient(180deg, rgba(232,181,71,.16), transparent)'}}>
        <div style={{display:'inline-flex', alignItems:'center', gap:7, padding:'3px 10px', background:'rgba(232,181,71,.22)', borderRadius:4, marginBottom:16}}>
          <Gem s={12} c="var(--v-blaze-dk)" />
          <span style={{fontFamily:'var(--ff-display)', fontSize:9.5, letterSpacing:'.14em', fontWeight:600, color:'var(--v-blaze-dk)'}}>PRINCIPLE</span>
        </div>
        <div className="vd" style={{fontSize:34, lineHeight:1.12, marginBottom:14}}>Capture friction is the design constraint</div>
        <div style={{fontSize:15.5, lineHeight:1.65, marginBottom:22}}>
          Every other principle bends to capture friction. Sub-5s end-to-end is non-negotiable; everything else is a refinement on the speed-vs-precision frontier. When in doubt, make capture faster and sort later.
        </div>
        <div className="vlab" style={{marginBottom:10}}>Distilled into</div>
        <div style={{display:'flex', flexDirection:'column', gap:8, marginBottom:22}}>
          <div style={{padding:'10px 13px', background:'var(--v-card)', borderLeft:'3px solid var(--v-clay)', borderRadius:'0 6px 6px 0'}}>
            <span style={{fontFamily:'var(--ff-display)', fontSize:9, letterSpacing:'.14em', color:'var(--v-clay)', fontWeight:600}}>QUOTE</span>
            <div style={{fontStyle:'italic', fontSize:14.5, marginTop:5}}>“Make capture faster and sort later.”</div>
          </div>
          <div style={{padding:'10px 13px', background:'var(--v-card)', borderLeft:'3px solid var(--v-ember-dk)', borderRadius:'0 6px 6px 0'}}>
            <span style={{fontFamily:'var(--ff-display)', fontSize:9, letterSpacing:'.14em', color:'var(--v-ember-dk)', fontWeight:600}}>REMINDER</span>
            <div style={{fontSize:14, marginTop:5}}>If a capture path needs more than one decision, it's wrong.</div>
          </div>
        </div>
        <span className="vm-bz">crystallized 29d ago · re-surfaced 4× · kept fresh</span>
      </div>

      {/* three doorways of supporting material */}
      <div className="km-scroll" style={{overflow:'auto', padding:'26px 28px', background:'var(--v-sunk)', borderLeft:'1px solid var(--v-line)'}}>
        <div className="vlab" style={{marginBottom:14}}>Built on</div>
        {[
          { icon:Icons.note, accent:'var(--v-clay)', label:'FIELD NOTES · mine', items:[
            {kind:'note', t:'What makes me NOT capture something', m:'41d'},
            {kind:'note', t:'5-second rule observation', m:'30d'},
          ]},
          { icon:Icons.doc, accent:'var(--v-moss)', label:'GUIDEBOOK · others’', items:[
            {kind:'ref', t:'Tiago Forte · capture → distillation', m:'web'},
            {kind:'ref', t:'GTD · two-minute rule', m:'web'},
          ]},
          { icon:Icons.runbook, accent:'var(--v-ember-dk)', label:'RUNBOOK · how-to', items:[
            {kind:'doc', t:'Capture-friction runbook', m:'rev 7', strong:true},
          ]},
        ].map((g,i)=>(
          <div key={i} style={{marginBottom:18}}>
            <div style={{display:'flex', alignItems:'center', gap:7, marginBottom:8}}>
              <span style={{color:g.accent}}><g.icon size={13} stroke={g.accent} /></span>
              <span className="vm" style={{color:g.accent, letterSpacing:'.1em'}}>{g.label}</span>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:6}}>
              {g.items.map((it,j)=>(
                <div key={j} style={{display:'flex', alignItems:'center', gap:10, padding:'9px 11px', background:'var(--v-card)', border: it.strong?`1px solid ${g.accent}`:'1px solid var(--v-line)', borderRadius:6, cursor:'pointer'}}>
                  <KindIcon kind={it.kind} size={13} muted={!it.strong} />
                  <span style={{flex:1, fontSize:13.5, fontWeight: it.strong?600:400}}>{it.t}</span>
                  <span className="vm">{it.m}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

Object.assign(window, { V4Dashboard, V4ThemeLanding, V4CrystalDetail, ProjectLabelPalette });

// ── Project label palette (resolves §2.4) ──────────────────────────────────
// Replaces the user-pickable thread colors. Low-chroma "label" hues that carry
// NO semantic meaning, so blaze/ember/moss/clay stay unique to the family
// language. Applied as a quiet left-tint on the slug pill, never a fill.
const PROJECT_LABELS = [
  { name:'stone', hex:'#8C8275' },
  { name:'sage',  hex:'#79876F' },
  { name:'dusk',  hex:'#6C7A8C' },
  { name:'plum',  hex:'#87697C' },
  { name:'slate', hex:'#5A6066' },
  { name:'teal',  hex:'#5E807A' },
];

function ProjectLabelPalette() {
  return (
    <div className="km km-v4" style={{padding:'32px 40px', height:'100%', overflow:'auto'}}>
      <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom:6}}>
        <div className="vd" style={{fontSize:28}}>Thread label colors</div>
        <span className="vm">resolves §2.4 · no collision with the family language</span>
      </div>
      <div style={{maxWidth:820, marginBottom:26, fontSize:14.5, lineHeight:1.6, color:'var(--v-soft)'}}>
        Replaces the old picker (which let a thread steal <b>blaze</b>/<b>ember</b>/<b>moss</b>). These six are low-chroma <i>labels</i> — they differentiate threads without competing with a glowing crystal. The color is a quiet left-tint on the slug pill, never a surface fill.
      </div>

      {/* the reserved language, for contrast */}
      <div className="vlab" style={{marginBottom:10}}>Reserved · never selectable as a thread color</div>
      <div style={{display:'flex', gap:10, marginBottom:26, flexWrap:'wrap'}}>
        {[['blaze','#E8B547','crystals'],['ember','#D9622C','action'],['moss','#5C7A3E','guidebook'],['clay','#BC7A4E','field notes']].map(([n,h,role])=>(
          <div key={n} style={{display:'flex', alignItems:'center', gap:8, padding:'7px 12px', background:'var(--v-card)', border:'1px solid var(--v-line)', borderRadius:6}}>
            <span style={{width:16, height:16, borderRadius:4, background:h}} />
            <span style={{fontSize:13, fontWeight:600}}>{n}</span>
            <span className="vm">{role}</span>
          </div>
        ))}
      </div>

      {/* the new selectable label palette */}
      <div className="vlab" style={{marginBottom:10}}>Selectable thread labels · 6</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12, maxWidth:760, marginBottom:28}}>
        {PROJECT_LABELS.map(p=>(
          <div key={p.name} style={{background:'var(--v-card)', border:'1px solid var(--v-line)', borderRadius:8, padding:'14px 16px', display:'flex', flexDirection:'column', gap:10}}>
            <div style={{display:'flex', alignItems:'center', gap:10}}>
              <span style={{width:28, height:28, borderRadius:6, background:p.hex}} />
              <div style={{flex:1}}>
                <div style={{fontSize:14, fontWeight:600, textTransform:'capitalize'}}>{p.name}</div>
                <span className="vm">{p.hex}</span>
              </div>
            </div>
            {/* slug pill as it renders, with the left-tint */}
            <span style={{display:'inline-flex', alignItems:'center', alignSelf:'flex-start', padding:'2px 8px 2px 7px', borderRadius:3, background:'rgba(43,32,20,.05)', borderLeft:`3px solid ${p.hex}`, fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--v-soft)'}}>
              {p.name}-thread
            </span>
          </div>
        ))}
      </div>

      <div style={{padding:'14px 16px', background:'var(--v-sunk)', borderRadius:8, maxWidth:760}}>
        <span className="vm" style={{lineHeight:1.7}}>Migration: <b>moss→sage</b>, <b>ember→stone</b>, <b>blaze→stone</b>, <b>dust→stone</b>, <b>slate→slate</b>. One-time, reversible from Edit thread.</span>
      </div>
    </div>
  );
}
