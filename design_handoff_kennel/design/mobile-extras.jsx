// Mobile mocks, empty states, tone-of-voice examples.

// ─── Mobile chrome wrapper (replaces ChromeBar/NavRail for narrow widths) ──
const MobileShell = ({ title, right, children, footerActive = 'home' }) => (
  <div className="km" style={{display:'flex', flexDirection:'column', height:'100%', background:'var(--surface-0)'}}>
    {/* status bar slot */}
    <div style={{height: 42, padding:'0 18px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--fg-muted)', flex:'0 0 42px'}}>
      <span>14:32</span>
      <span style={{display:'flex', gap:6}}>● ● ●</span>
    </div>
    <div style={{padding:'10px 18px 8px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'1px solid var(--line)', flex:'0 0 auto'}}>
      <div style={{display:'flex', alignItems:'center', gap:8}}>
        <span className="km-logo-slot" style={{width:18, height:18, fontSize:8}}>K</span>
        <span className="km-display-md" style={{fontSize:14, letterSpacing:'.08em'}}>{title}</span>
      </div>
      <div style={{display:'flex', alignItems:'center', gap:10, color:'var(--fg-muted)'}}>
        {right}
      </div>
    </div>
    <div className="km-scroll" style={{flex:1, overflow:'auto'}}>{children}</div>
    {/* footer nav */}
    <div style={{flex:'0 0 56px', borderTop:'1px solid var(--line)', display:'grid', gridTemplateColumns:'repeat(4, 1fr)', alignItems:'center'}}>
      {[
        {id:'home', icon: Icons.menu, label:'Home'},
        {id:'capture', icon: Icons.plus, label:'Capture'},
        {id:'search', icon: Icons.search, label:'Search'},
        {id:'me', icon: Icons.cog, label:'Settings'},
      ].map(n => (
        <button key={n.id} style={{
          border:0, background:'transparent',
          display:'flex', flexDirection:'column', alignItems:'center', gap:2,
          color: footerActive === n.id ? 'var(--ember-deep)' : 'var(--fg-muted)',
          fontFamily:'var(--ff-sans)', fontSize: 10, letterSpacing:'.02em', cursor:'pointer'
        }}>
          <n.icon size={16} />
          <span>{n.label}</span>
        </button>
      ))}
    </div>
  </div>
);

// 8.1 Quick capture
const MobileCapture = () => (
  <MobileShell title="CAPTURE" footerActive="capture" right={<Icons.x size={18} />}>
    <div style={{padding:'16px 18px 24px'}}>
      <div className="km-display-sm" style={{marginBottom:10}}>NEW</div>
      <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:18}}>
        <ProjectTag slug="kennel" />
        <Mono dim>default · change</Mono>
      </div>

      <div className="km-body-sm" style={{marginBottom:6}}>Kind</div>
      <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:18}}>
        {[
          ['idea','Idea'],['note','Note'],['action','Action'],['ref','Reference'],
        ].map(([k,l], i) => (
          <span key={k} className="km-tag" style={{
            background: i === 0 ? 'rgba(217,98,44,.16)' : 'rgba(201,168,124,.18)',
            color: i === 0 ? 'var(--ember-deep)' : 'var(--fg)',
            fontFamily:'var(--ff-sans)', fontSize:12, padding:'5px 10px'
          }}>
            <KindIcon kind={k} /> &nbsp;{l}
          </span>
        ))}
      </div>

      <div className="km-body-sm" style={{marginBottom:6}}>Title</div>
      <input className="km-input" defaultValue="Move chats panel above pinned docs?" style={{fontSize:15, padding:'10px 12px', marginBottom:14}} />
      <div className="km-body-sm" style={{marginBottom:6}}>Body <span style={{color:'var(--fg-faint)'}}>· optional</span></div>
      <textarea className="km-input" rows={6} placeholder="Markdown. Stays out of the way." style={{resize:'none', fontSize:14, lineHeight:1.55}} />

      <div style={{display:'flex', gap:8, marginTop:18}}>
        <button className="km-btn km-btn-primary" style={{flex:1, justifyContent:'center', padding:'12px 14px', fontSize:14}}>
          Capture
        </button>
        <button className="km-btn" style={{padding:'12px 14px', fontSize:14}}>
          More…
        </button>
      </div>
      <div className="km-body-sm" style={{marginTop:14, textAlign:'center'}}>
        captured items land in the project inbox · triage on desktop
      </div>
    </div>
  </MobileShell>
);

// 8.1 Mobile dashboard (read-only)
const MobileDashboard = () => (
  <MobileShell title="KENNEL" right={<><Icons.search size={16} /><Icons.bell size={16} /></>}>
    <div style={{padding:'16px 18px 8px'}}>
      <div className="km-display-lg" style={{fontSize: 22, marginBottom:2}}>Next up</div>
      <Mono dim>monday · 17 may</Mono>
    </div>
    <div style={{padding:'4px 12px 12px', display:'flex', flexDirection:'column', gap:6}}>
      {[
        { slug:'kennel',        kind:'action', title:'Decide on dark-mode third elevation tone', due:'today' },
        { slug:'picnic-engage', kind:'doc',    title:'Draft Q3 outreach plan',                   due:'tomorrow' },
        { slug:'kennel',        kind:'action', title:'Sketch triage keyboard shortcut sheet',    due:'Wed' },
        { slug:'pacecraft',     kind:'action', title:'Revise voice section for Kennel adaptation', due:'Fri' },
      ].map((r, i) => (
        <div key={i} className={`km-card ${i < 2 ? 'km-active-row' : ''}`} style={{padding:'12px 12px', display:'flex', flexDirection:'column', gap:4}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <KindIcon kind={r.kind} />
            <ProjectTag slug={r.slug} />
            <span style={{flex:1}} />
            <Mono>{r.due}</Mono>
          </div>
          <div className="km-body" style={{fontWeight:500}}>{r.title}</div>
        </div>
      ))}
    </div>

    <div style={{padding:'14px 18px 6px', display:'flex', alignItems:'center'}}>
      <Label>Inbox</Label>
      <span style={{flex:1}} />
      <Mono>14 unsorted</Mono>
    </div>
    <div style={{padding:'4px 18px 16px', display:'flex', flexDirection:'column', gap:2}}>
      {[['kennel',7],['picnic-engage',3],['reading-stack',3],['klein-advisory',1]].map(([s,n]) => (
        <div key={s} className="km-row" style={{display:'flex', alignItems:'center', gap:8, padding:'7px 0', borderBottom:'1px solid var(--line)'}}>
          <ProjectTag slug={s} />
          <span style={{flex:1}} />
          <Mono>{n}</Mono>
        </div>
      ))}
    </div>

    <div style={{padding:'8px 18px 6px', display:'flex', alignItems:'center'}}>
      <Label>Yesterday</Label>
      <span style={{flex:1}} />
      <Mono dim>tap to expand</Mono>
    </div>
    <div style={{padding:'4px 18px 16px'}}>
      <ActivityEntry time="22:14" who="C"  verb="ARCH" target="3 reading-stack items" payload="" />
      <ActivityEntry time="19:02" who="Cl" verb="DRAFT" target="outreach-cadence" payload="proposal" />
      <ActivityEntry time="16:41" who="C" verb="PROM" target="idea → action" payload="" />
    </div>
  </MobileShell>
);

// 8.1 Mobile project read
const MobileProject = () => (
  <MobileShell title="KENNEL" right={<><Icons.search size={16} /><Icons.runbook size={16} /></>}>
    <div style={{padding:'16px 18px 6px'}}>
      <ProjectTag slug="kennel" />
      <div className="km-display-lg" style={{fontSize: 22, marginTop:6}}>Kennel</div>
      <div className="km-body-sm" style={{lineHeight:1.45, marginTop: 4}}>
        Personal command center. Captures and surfaces what needs attention without nagging.
      </div>
    </div>

    <div style={{padding:'14px 18px 4px', display:'flex', alignItems:'center'}}>
      <Label>Next up</Label>
      <span style={{flex:1}} />
      <Mono>12 active</Mono>
    </div>
    <div style={{padding:'4px 12px 4px', display:'flex', flexDirection:'column', gap:6}}>
      {[
        { kind:'action', title:'Decide on dark-mode third elevation tone', due:'today' },
        { kind:'action', title:'Sketch triage keyboard shortcut sheet',    due:'Wed' },
        { kind:'doc',    title:'Skill proposal review — wireframe notes',  due:'Thu' },
      ].map((r, i) => (
        <div key={i} className={`km-card ${i === 0 ? 'km-active-row' : ''}`} style={{padding:'10px 12px', display:'flex', alignItems:'center', gap:8}}>
          <KindIcon kind={r.kind} />
          <span className="km-body" style={{flex:1, fontWeight:500}}>{r.title}</span>
          <Mono>{r.due}</Mono>
        </div>
      ))}
    </div>

    <div style={{padding:'14px 18px 4px'}}>
      <Label>Pinned docs</Label>
    </div>
    <div style={{padding:'4px 18px 4px', display:'flex', flexDirection:'column', gap:6}}>
      <div className="km-row" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--line)'}}>
        <Icons.doc size={13} />
        <span className="km-body" style={{flex:1}}>Design brief v0.1</span>
        <span className="km-pin"><Icons.pin size={11} /></span>
        <Rev n={4} />
      </div>
      <div className="km-row" style={{display:'flex', alignItems:'center', gap:8, padding:'8px 0', borderBottom:'1px solid var(--line)'}}>
        <Icons.doc size={13} />
        <span className="km-body" style={{flex:1}}>Data model</span>
        <span className="km-pin"><Icons.pin size={11} /></span>
        <Rev n={9} />
      </div>
    </div>

    <div style={{padding:'14px 18px 4px', display:'flex', alignItems:'center'}}>
      <Label>Chats</Label>
      <span style={{flex:1}} />
      <Mono dim>4 active · 2 stale</Mono>
    </div>
    <div style={{padding:'2px 12px 24px', display:'flex', flexDirection:'column', gap:2}}>
      <ChatRow tagline="working through the segmentation logic — three tiers and a churn-risk overlay" since="2h ago" />
      <ChatRow tagline="quick check on whether the runbook should call out the staging URL or read it from .env" since="yesterday" />
    </div>
  </MobileShell>
);

// 8.1 Mobile search
const MobileSearch = () => (
  <MobileShell title="SEARCH" footerActive="search" right={<Icons.x size={18} />}>
    <div style={{padding:'12px 18px 8px'}}>
      <div style={{display:'flex', alignItems:'center', gap:8, padding:'10px 12px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:4}}>
        <Icons.search size={14} />
        <span className="km-mono-sm" style={{flex:1, color:'var(--fg)'}}>kind:doc "paused"</span>
        <span className="km-mono-sm">FTS5</span>
      </div>
      <div className="km-body-sm" style={{marginTop:6, color:'var(--fg-muted)', display:'flex', alignItems:'center', gap:8}}>
        <Mono>34 matches · 18ms</Mono>
        <span style={{flex:1}} />
        <span className="km-link" style={{borderBottomStyle:'dashed', fontSize:11, color:'var(--ember-deep)'}}>filters</span>
      </div>
    </div>

    {[
      { group: 'Docs', count: 3, rows: [
        { kind:'doc', slug:'picnic-engage', title:'Q3 outreach plan', snippet:'…30% of contacts enter the paused state in a cycle…', updated:'rev 7' },
        { kind:'doc', slug:'picnic-engage', title:'Cadence rules · field manual', snippet:'…opted-out is terminal; paused is a re-check loop…', updated:'rev 2' },
      ]},
      { group: 'Skills', count: 2, rows: [
        { kind:'doc', slug:'picnic-engage', title:'outreach-cadence', snippet:'…paused (e.g. OOO auto-reply, or manual hold)…', updated:'rev 5 pending' },
      ]},
      { group: 'Chats', count: 5, rows: [
        { kind:'chat', slug:'picnic-engage', title:'working through the segmentation logic', snippet:'…OOO auto-replies were treated as opted-out…', updated:'2h ago' },
      ]},
    ].map(g => (
      <div key={g.group}>
        <div style={{padding:'12px 18px 4px', display:'flex', alignItems:'center', gap:8}}>
          <Label>{g.group}</Label>
          <Mono>{g.count}</Mono>
        </div>
        {g.rows.map((r, i) => (
          <div key={i} className="km-row" style={{padding:'10px 18px', borderTop:'1px solid var(--line)'}}>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom: 3}}>
              <KindIcon kind={r.kind} />
              <ProjectTag slug={r.slug} />
              <span style={{flex:1}} />
              <Mono>{r.updated}</Mono>
            </div>
            <div className="km-body" style={{fontWeight:500}}>{r.title}</div>
            <div className="km-body-sm" style={{lineHeight:1.45, marginTop:2}}>
              {r.snippet.split('paused').map((p, idx, arr) => (
                <React.Fragment key={idx}>{p}{idx < arr.length - 1 && <span className="km-hl">paused</span>}</React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    ))}
  </MobileShell>
);

// ─── Empty states ───────────────────────────────────────────────────────────
const InboxEmptyBoard = ({ dark = false }) => (
  <div className={`km ${dark ? 'km-dark' : ''}`} style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex'}}>
      <NavRail active="triage" />
      <main style={{flex:1, padding:'22px 28px', display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 16}}>
          <div>
            <div className="km-display-lg">Triage queue</div>
            <Mono>kennel · 0 inbox</Mono>
          </div>
        </div>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:14, paddingBottom: 80}}>
          <div className="km-display-md" style={{fontSize:18, color:'var(--fg-muted)'}}>INBOX</div>
          <div className="km-display-lg" style={{textAlign:'center'}}>Inbox is clear.</div>
          <Mono>last triaged 13:48 · 4 items processed</Mono>
          <button className="km-btn km-btn-primary" style={{marginTop:4, padding:'8px 14px'}}><Icons.plus size={12} /> Capture something</button>
        </div>
      </main>
    </div>
  </div>
);

const NoProjectsBoard = ({ dark = false }) => (
  <div className={`km ${dark ? 'km-dark' : ''}`} style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex'}}>
      <aside style={{
        width: 224, flex:'0 0 224px',
        borderRight: '1px solid var(--line)', padding:'14px 16px',
        background: 'var(--surface-0)',
        display:'flex', flexDirection:'column', gap:12
      }}>
        <Label>Workspace</Label>
        <div className="km-body-sm" style={{color:'var(--fg-muted)', lineHeight:1.5}}>
          No projects yet. Create one to populate the rail.
        </div>
      </aside>
      <main style={{flex:1, padding:'22px 28px', display:'flex', flexDirection:'column'}}>
        <div className="km-display-lg" style={{marginBottom:6}}>Dashboard</div>
        <Mono dim>fresh install · 2026-05-17</Mono>
        <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:16, paddingBottom: 60, maxWidth: 520, margin:'0 auto'}}>
          <div className="km-display-md" style={{fontSize:18, color:'var(--fg-muted)'}}>NO PROJECTS</div>
          <div className="km-display-lg" style={{textAlign:'center'}}>No projects. Create one to start.</div>
          <div className="km-body" style={{color:'var(--fg-muted)', textAlign:'center', lineHeight:1.55, maxWidth: 420}}>
            A project is the unit that holds items, docs, references, and chats. Most users start with one for active work and one for reading.
          </div>
          <div style={{display:'flex', gap:8, marginTop: 4}}>
            <button className="km-btn km-btn-primary"><Icons.plus size={12} /> New project</button>
            <button className="km-btn">Import from filesystem</button>
          </div>
        </div>
      </main>
    </div>
  </div>
);

// ─── Tone of voice page ─────────────────────────────────────────────────────
const ToneRow = ({ context, good, bad }) => (
  <div style={{display:'grid', gridTemplateColumns:'200px 1fr 1fr', alignItems:'flex-start', gap: 18, padding:'18px 0', borderTop:'1px solid var(--line)'}}>
    <div>
      <Label>{context}</Label>
    </div>
    <div style={{padding:'12px 14px', background:'rgba(92,122,62,.08)', border:'1px solid rgba(92,122,62,.25)', borderRadius:3}}>
      <div className="km-display-sm" style={{color:'var(--moss)', marginBottom:6}}>✓ KENNEL</div>
      <div className="km-body" style={{lineHeight:1.55, color:'var(--fg)'}}>{good}</div>
    </div>
    <div style={{padding:'12px 14px', background:'rgba(138,58,20,.05)', border:'1px solid rgba(138,58,20,.25)', borderRadius:3}}>
      <div className="km-display-sm" style={{color:'var(--ember-deep)', marginBottom:6}}>✗ NOT KENNEL</div>
      <div className="km-body" style={{lineHeight:1.55, color:'var(--fg)'}}>{bad}</div>
    </div>
  </div>
);

const ToneBoard = () => (
  <div className="km" style={{padding:'30px 36px', height:'100%', overflow:'hidden'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:16, marginBottom: 4}}>
      <div className="km-display-lg">Voice</div>
      <Mono>capable but not precious · honest about difficulty</Mono>
    </div>
    <div className="km-body-sm" style={{maxWidth: 760, marginBottom: 16}}>
      Direct, specific, slightly dry. A little self-aware. Never motivational kicker copy. Below, three UI moments contrasted — what Kennel says vs. what every other tool says.
    </div>

    <div style={{borderBottom:'1px solid var(--line)'}}>
      <ToneRow
        context="Empty inbox"
        good={<>“Inbox is clear.” <span className="km-body-sm" style={{display:'block', marginTop:4}}>Last triaged 13:48 · 4 items processed.</span></>}
        bad={<>“You’re all caught up! 🎉 Time to focus — what will you build today?”</>}
      />
      <ToneRow
        context="Confirm archive"
        good="Archived."
        bad="✅ Successfully archived! Your item has been safely moved to the archive."
      />
      <ToneRow
        context="Server unreachable"
        good={<>“Couldn’t reach the server. Check connection — retry in <Mono>kennel doctor</Mono>.”</>}
        bad="Oh no! Something went wrong. Please try again later or contact support."
      />
      <ToneRow
        context="Capture confirmation"
        good={<><Mono>captured · picnic-engage · idea</Mono></>}
        bad="🎉 Great catch! Your idea has been added to your inbox."
      />
      <ToneRow
        context="Proposal accepted"
        good="Accepted. Written to ~/work/skills/outreach-cadence.md (rev 5)."
        bad="✨ Skill updated! Claude will now incorporate this change going forward."
      />
    </div>

    <div style={{marginTop: 18, padding:'12px 14px', background:'var(--surface-1)', border:'1px solid var(--line)', borderRadius:3, maxWidth: 760}}>
      <Label style={{marginBottom: 6}}>Rules of thumb</Label>
      <ul className="km-body-sm" style={{margin:0, paddingLeft: 16, lineHeight:1.7, color:'var(--fg)'}}>
        <li>Action labels in imperative. 'Archive', 'Park', 'Promote to action'.</li>
        <li>Confirmations factual. 'Archived.' not 'Successfully archived!'.</li>
        <li>Errors blunt and useful. Tell them what to try.</li>
        <li>Pluralize correctly. '1 item', not '1 item(s)'.</li>
        <li>Time references in mono. Never both absolute and relative.</li>
      </ul>
    </div>
  </div>
);

Object.assign(window, { MobileCapture, MobileDashboard, MobileProject, MobileSearch, InboxEmptyBoard, NoProjectsBoard, ToneBoard });
