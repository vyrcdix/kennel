// Screens 1-4: Dashboard, Project Landing, Triage Queue, Doc Editor

// ─── 1. Dashboard ────────────────────────────────────────────────────────────
const ProjectCard = ({ slug, name, desc, counts, pinned, active }) => (
  <div className="km-card" style={{
    minWidth: 248, maxWidth: 248,
    padding: '12px 14px',
    display:'flex', flexDirection:'column', gap: 8,
    background: active ? 'rgba(217,98,44,.06)' : 'var(--surface-1)',
    borderColor: active ? 'rgba(217,98,44,.30)' : 'var(--line)',
  }}>
    <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8}}>
      <div style={{display:'flex', flexDirection:'column', gap:2, minWidth:0}}>
        <ProjectTag slug={slug} />
        <div className="km-body-lg" style={{fontSize:14, marginTop:4}}>{name}</div>
      </div>
      {pinned && <span className="km-pin"><Icons.pin size={12} /></span>}
    </div>
    <div className="km-body-sm" style={{lineHeight:1.4, minHeight:32, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{desc}</div>
    <div style={{display:'flex', alignItems:'center', gap:10, marginTop:'auto', paddingTop:6, borderTop:'1px solid var(--line)'}}>
      <span style={{display:'flex', alignItems:'center', gap:5}}>
        <span className="km-mono-sm" style={{color:'var(--fg-faint)'}}>in</span>
        <Mono>{counts.inbox}</Mono>
      </span>
      <span style={{display:'flex', alignItems:'center', gap:5}}>
        <span className="km-dot km-dot-ember" />
        <Mono>{counts.active}</Mono>
      </span>
      <span style={{display:'flex', alignItems:'center', gap:5}}>
        <span className="km-dot km-dot-dust" />
        <Mono>{counts.parked}</Mono>
      </span>
      <span style={{flex:1}} />
      <span className="km-mono-sm" style={{color:'var(--ember-deep)', cursor:'pointer', display:'flex', alignItems:'center', gap:3}}>
        <Icons.runbook size={11} /> run
      </span>
    </div>
  </div>
);

const NextUpRow = ({ slug, kind, title, due, drag, ember, hash }) => (
  <div className={`km-row ${ember ? 'km-active-row' : ''}`} style={{
    display:'grid',
    gridTemplateColumns:'18px 14px 110px 1fr 90px 16px',
    alignItems:'center', gap: 12, padding: '8px 14px',
    borderBottom: '1px solid var(--line)',
  }}>
    <span style={{color:'var(--fg-faint)', opacity: drag ? 1 : 0}}><Icons.grip size={12} /></span>
    <KindIcon kind={kind} />
    <ProjectTag slug={slug} />
    <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
      <span className="km-body" style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{title}</span>
      {hash && <span className="km-mono-sm" style={{color:'var(--fg-faint)'}}>{hash}</span>}
    </div>
    <Mono>{due}</Mono>
    <StateDot state={ember ? 'active' : 'active'} />
  </div>
);

const Dashboard = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="dashboard" />
      <main className="km-scroll" style={{flex:1, padding:'22px 32px 0', overflow:'auto'}}>
        {/* Page heading */}
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom: 14}}>
          <div>
            <div className="km-display-lg">Dashboard</div>
            <Mono>monday · 17 may 2026 · 14:32 PDT</Mono>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <button className="km-btn"><Icons.eye size={12} /> Focus mode</button>
            <button className="km-btn"><Icons.filter size={12} /> Weekly review</button>
          </div>
        </div>

        {/* Project rail */}
        <Label style={{marginBottom: 10}}>Pinned projects</Label>
        <div className="km-scroll" style={{display:'flex', gap:10, overflowX:'auto', paddingBottom:16, marginBottom: 18}}>
          <ProjectCard slug="kennel"         name="Kennel"          desc="Personal command center. Currently in scoping and core schema." counts={{inbox:4, active:12, parked:5}} active pinned />
          <ProjectCard slug="picnic-engage"  name="Picnic — Engagement" desc="Q3 outreach refresh for the engagement workstream." counts={{inbox:1, active:4, parked:2}} />
          <ProjectCard slug="pacecraft"      name="Pacecraft"       desc="Brand system and field manual; supplies vocabulary." counts={{inbox:0, active:2, parked:1}} />
          <ProjectCard slug="klein-advisory" name="Klein Advisory"  desc="Quarterly check-ins and review notes." counts={{inbox:0, active:1, parked:0}} />
          <ProjectCard slug="reading-stack"  name="Reading Stack"   desc="Long reads, papers, references to revisit." counts={{inbox:7, active:0, parked:9}} />
        </div>

        {/* Next up */}
        <div style={{display:'grid', gridTemplateColumns:'1.6fr 1fr', gap: 24}}>
          <section className="km-card" style={{padding:0}}>
            <SectionHead title="Next up" right={<Mono>17 active · ranked</Mono>} />
            <div className="km-rule" />
            <NextUpRow slug="kennel"        kind="action" title="Decide on dark-mode third elevation tone" hash="#design" due="today"   ember drag />
            <NextUpRow slug="picnic-engage" kind="doc"    title="Draft Q3 outreach plan"                  hash="rev 7" due="tomorrow" ember />
            <NextUpRow slug="kennel"        kind="action" title="Sketch triage keyboard shortcut sheet"   due="Wed" />
            <NextUpRow slug="kennel"        kind="idea"   title="Move chats panel above pinned docs?"     due="—" />
            <NextUpRow slug="pacecraft"     kind="action" title="Revise voice section for Kennel adaptation" due="Fri" />
            <NextUpRow slug="reading-stack" kind="ref"    title="Reread §3 of Cal Newport on capture friction" due="—" />
            <NextUpRow slug="klein-advisory" kind="note"  title="Prep Q2 retro talking points"            due="May 24" />
          </section>

          <div style={{display:'flex', flexDirection:'column', gap: 18}}>
            {/* Inbox roll-up */}
            <section className="km-card" style={{padding:0}}>
              <SectionHead title="Inbox" right={<><Mono>14 unsorted</Mono><button className="km-btn km-btn-ghost" style={{padding:'4px 6px'}}>Triage all <Icons.arrowR size={12} /></button></>} />
              <div className="km-rule" />
              <div style={{padding:'6px 0'}}>
                {[
                  ['kennel',         7],
                  ['picnic-engage',  3],
                  ['reading-stack',  3],
                  ['klein-advisory', 1],
                ].map(([slug, n]) => (
                  <div key={slug} className="km-row" style={{display:'flex', alignItems:'center', gap:10, padding:'6px 14px'}}>
                    <ProjectTag slug={slug} />
                    <span style={{flex:1}} />
                    <Mono>{n}</Mono>
                    <span className="km-mono-sm" style={{color:'var(--ember-deep)'}}>triage</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Yesterday */}
            <section className="km-card" style={{padding:0}}>
              <SectionHead title="Yesterday" right={<Mono>14 events · collapsed</Mono>} />
              <div className="km-rule" />
              <div style={{padding:'8px 14px', display:'flex', flexDirection:'column', gap:3}}>
                <ActivityEntry time="22:14" who="C"   verb="ARCHIVED" target="3 items in reading-stack" payload="" />
                <ActivityEntry time="19:02" who="Cl"  verb="DRAFTED"  target="outreach-cadence skill"   payload="proposal pending" />
                <ActivityEntry time="16:41" who="C"   verb="PROMOTED" target="kennel idea → action"     payload="dark-mode elevation" />
                <ActivityEntry time="14:55" who="CLI" verb="CAPTURED" target="ref / capture friction"   payload="newport.com/…" />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  </div>
);

// ─── 2. Project landing ─────────────────────────────────────────────────────
const RunbookTab = ({ label, active }) => (
  <button style={{
    border:0, background:'transparent',
    fontFamily:'var(--ff-display)', fontWeight: 500,
    fontSize: 12, letterSpacing: '.18em', textTransform:'uppercase',
    color: active ? 'var(--ember-deep)' : 'var(--fg-muted)',
    padding: '8px 0',
    borderBottom: active ? '2px solid var(--ember)' : '2px solid transparent',
    cursor:'pointer'
  }}>{label}</button>
);

const PinnedDocCard = ({ title, preview, rev }) => (
  <div className="km-card" style={{padding:'10px 12px', minWidth: 220, display:'flex', flexDirection:'column', gap:6}}>
    <div style={{display:'flex', alignItems:'center', gap:6}}>
      <span style={{color:'var(--fg-muted)'}}><Icons.doc size={12} /></span>
      <span className="km-body" style={{fontWeight:500, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{title}</span>
      <span className="km-pin"><Icons.pin size={10} /></span>
    </div>
    <div className="km-body-sm" style={{lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{preview}</div>
    <Mono>rev {rev}</Mono>
  </div>
);

const ProjectLanding = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar projectChip={<ProjectTag slug="kennel" />} />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        {/* Project header */}
        <div style={{padding:'22px 32px 14px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24}}>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                <ProjectTag slug="kennel" />
                <span className="km-pin"><Icons.pin size={12} /></span>
                <Mono>created 2026-03-04</Mono>
              </div>
              <div className="km-display-lg" style={{marginBottom: 4}}>Kennel</div>
              <div className="km-body" style={{maxWidth: 760, color:'var(--fg-muted)'}}>
                Personal command center. Captures ideas, notes, actions, docs and Claude conversations across all active work; surfaces what needs attention without nagging.
              </div>
              <div style={{marginTop:8, display:'flex', alignItems:'center', gap:6}}>
                <Icons.arrowDown size={12} />
                <span className="km-link" style={{fontSize:13, borderBottomStyle:'dashed'}}>show context</span>
                <span className="km-body-sm">— full markdown shipped to Claude with chat sessions</span>
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="km-btn"><Icons.plus size={12} /> New item</button>
              <button className="km-btn"><Icons.runbook size={12} /> Run</button>
              <button className="km-btn km-btn-ghost"><Icons.cog size={13} /></button>
            </div>
          </div>
        </div>

        <div style={{padding:'18px 32px 32px', display:'flex', flexDirection:'column', gap:18}}>
          {/* Next up strip */}
          <section className="km-card" style={{padding:0}}>
            <SectionHead title="Next up" right={<Mono>12 active · 5 parked</Mono>} />
            <div className="km-rule" />
            <NextUpRow slug="kennel" kind="action" title="Decide on dark-mode third elevation tone" hash="#design" due="today"   ember drag />
            <NextUpRow slug="kennel" kind="action" title="Sketch triage keyboard shortcut sheet"   due="Wed" />
            <NextUpRow slug="kennel" kind="doc"    title="Skill proposal review — wireframe notes" hash="rev 3" due="Thu" />
            <NextUpRow slug="kennel" kind="idea"   title="Move chats panel above pinned docs?"    due="—" />
          </section>

          {/* Runbook panel */}
          <section className="km-card" style={{padding:0}}>
            <div style={{display:'flex', alignItems:'center', padding:'10px 16px'}}>
              <span style={{color:'var(--fg-muted)', marginRight:8}}><Icons.runbook size={14} /></span>
              <Label>Runbook</Label>
              <span style={{flex:1}} />
              <Rev n={12} />
              <span style={{margin:'0 10px', color:'var(--fg-faint)'}}>·</span>
              <Mono>updated 14:02</Mono>
              <button className="km-btn km-btn-ghost" style={{marginLeft:8}}>Edit</button>
              <button className="km-btn km-btn-ghost"><Icons.arrowDown size={12} /></button>
            </div>
            <div className="km-rule" />
            <div style={{display:'flex', gap:0, padding:'0 16px', borderBottom:'1px solid var(--line)'}}>
              <RunbookTab label="Prerequisites" />
              <span style={{width:18}} />
              <RunbookTab label="Setup" />
              <span style={{width:18}} />
              <RunbookTab label="Run" active />
              <span style={{width:18}} />
              <RunbookTab label="Deploy" />
              <span style={{width:18}} />
              <RunbookTab label="Troubleshoot" />
              <span style={{width:18}} />
              <RunbookTab label="Notes" />
            </div>
            <div style={{padding:'14px 16px 16px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:18}}>
              <div>
                <div className="km-body" style={{marginBottom:6, fontWeight:500}}>Start dev server</div>
                <div style={{
                  fontFamily:'var(--ff-mono)', fontSize:12, padding:'10px 12px',
                  background:'rgba(201,168,124,.18)', borderLeft:'2px solid var(--ember-deep)',
                  whiteSpace:'pre', lineHeight:1.7
                }}>{`$ uv run kennel serve --reload\n$ open http://localhost:8421`}</div>
              </div>
              <div>
                <div className="km-body" style={{marginBottom:6, fontWeight:500}}>Sync with MCP</div>
                <div style={{
                  fontFamily:'var(--ff-mono)', fontSize:12, padding:'10px 12px',
                  background:'rgba(201,168,124,.18)', borderLeft:'2px solid var(--ember-deep)',
                  whiteSpace:'pre', lineHeight:1.7
                }}>{`$ kennel mcp register \\\n    --token $KENNEL_TOKEN`}</div>
              </div>
            </div>
          </section>

          {/* Pinned docs row */}
          <section>
            <div style={{display:'flex', alignItems:'center', marginBottom: 10}}>
              <Label>Pinned docs</Label>
              <span style={{flex:1}} />
              <Mono>3 of 14</Mono>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:12}}>
              <PinnedDocCard title="Design brief v0.1" preview="Eight core screens, Pacecraft palette inheritance, capture-friction-first design principles." rev={4} />
              <PinnedDocCard title="Data model"        preview="Entities and relationships — items, docs, refs, runbooks, skills, chats, activity." rev={9} />
              <PinnedDocCard title="User flows"        preview="What happens on each screen and why — capture, triage, review, write-back." rev={6} />
            </div>
          </section>

          {/* All items tabs */}
          <section className="km-card" style={{padding:0}}>
            <div style={{display:'flex', alignItems:'center', padding:'0 16px', borderBottom:'1px solid var(--line)'}}>
              <RunbookTab label="Items" active />
              <span style={{width:18}} />
              <RunbookTab label="Docs" />
              <span style={{width:18}} />
              <RunbookTab label="References" />
              <span style={{width:18}} />
              <RunbookTab label="Chats" />
              <span style={{flex:1}} />
              <span className="km-body-sm" style={{marginRight:8}}>state</span>
              <span className="km-tag">active</span>
              <span style={{width:6}} />
              <span className="km-tag">parked</span>
              <span style={{width:12}} />
              <button className="km-btn km-btn-ghost"><Icons.filter size={12} /> Filter</button>
            </div>
            <div>
              <NextUpRow slug="kennel" kind="action" title="Resolve chat-tagline character budget edge case"     due="May 22" />
              <NextUpRow slug="kennel" kind="doc"    title="Triage queue — keyboard interaction notes"          hash="rev 2" due="—" />
              <NextUpRow slug="kennel" kind="ref"    title="Linear's filter-chip pattern · screenshots collected" due="—" />
              <NextUpRow slug="kennel" kind="note"   title="Concerns about FTS5 ranking on short titles"        due="—" />
            </div>
          </section>

          {/* Chats panel */}
          <section className="km-card" style={{padding:0}}>
            <SectionHead title="Chats" right={<><Mono>4 active · 2 stale</Mono><button className="km-btn km-btn-ghost" style={{padding:'4px 6px'}}><Icons.arrowDown size={12} /></button></>} />
            <div className="km-rule" />
            <div style={{padding:'6px 8px', display:'flex', flexDirection:'column', gap:2}}>
              <ChatRow tagline="working through the segmentation logic — three tiers and a churn-risk overlay" since="2h ago" />
              <ChatRow tagline="quick check on whether the runbook should call out the staging URL or read it from .env" since="yesterday" />
              <ChatRow tagline="figuring out whether the proposal queue should batch by skill or interleave" since="4d ago" />
              <div style={{padding:'10px 8px 4px'}}><Mono>Stale · {'>'}60 days</Mono></div>
              <ChatRow tagline="experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet" since="74d ago" stale />
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
);

// ─── 3. Triage queue ────────────────────────────────────────────────────────
const FilterChip = ({ label, active }) => (
  <span className="km-tag" style={{
    background: active ? 'rgba(217,98,44,.16)' : 'rgba(201,168,124,.18)',
    color: active ? 'var(--ember-deep)' : 'var(--fg)',
    padding:'2px 8px', cursor:'pointer'
  }}>{label}</span>
);

const TriageRow = ({ slug, kind, title, captured, selected, proposal, body }) => (
  <div className={`km-row ${selected ? 'km-active-row' : ''} ${proposal ? 'km-proposal' : ''}`} style={{
    padding:'10px 16px', borderBottom:'1px solid var(--line)',
    background: selected ? 'rgba(217,98,44,.05)' : (proposal ? 'rgba(92,122,62,.03)' : 'transparent')
  }}>
    <div style={{display:'flex', alignItems:'center', gap:10, marginBottom: body ? 6 : 0}}>
      {proposal && <span className="km-display-sm" style={{color:'var(--moss)', fontSize:10}}>PROPOSAL</span>}
      {!proposal && <KindIcon kind={kind} />}
      <ProjectTag slug={slug} />
      <span className="km-body" style={{flex:1, fontWeight: selected ? 500 : 400}}>{title}</span>
      <Mono>{captured}</Mono>
    </div>
    {body && <div className="km-body-sm" style={{paddingLeft: 22, lineHeight:1.5, color:'var(--fg-muted)'}}>{body}</div>}
    {selected && (
      <div style={{display:'flex', alignItems:'center', gap:8, marginTop:10, paddingLeft: 22}}>
        <button className="km-btn km-btn-primary">Activate <span className="km-kbd" style={{marginLeft:4, background:'rgba(0,0,0,.18)', borderColor:'transparent', color:'#fff'}}>A</span></button>
        <button className="km-btn">Park <span className="km-kbd" style={{marginLeft:4}}>P</span></button>
        <button className="km-btn">Convert <span className="km-kbd" style={{marginLeft:4}}>C</span></button>
        <button className="km-btn">Done <span className="km-kbd" style={{marginLeft:4}}>D</span></button>
        <button className="km-btn km-btn-ghost">Dismiss <span className="km-kbd" style={{marginLeft:4}}>X</span></button>
      </div>
    )}
  </div>
);

const TriageQueue = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="triage" />
      <main style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'18px 28px 12px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom: 10}}>
            <div className="km-display-lg">Triage queue</div>
            <Mono>14 inbox · 2 proposals · global view</Mono>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
            <span className="km-display-sm">project</span>
            <FilterChip label="all" active />
            <FilterChip label="kennel" />
            <FilterChip label="picnic-engage" />
            <FilterChip label="reading-stack" />
            <span style={{width:18}} />
            <span className="km-display-sm">kind</span>
            <FilterChip label="idea" />
            <FilterChip label="note" />
            <FilterChip label="action" />
            <FilterChip label="ref" />
            <FilterChip label="proposal" active />
            <span style={{flex:1}} />
            <div style={{display:'flex', alignItems:'center', gap:6}}>
              <Mono dim>shortcuts</Mono>
              <span className="km-kbd">J</span><span className="km-kbd">K</span>
              <span className="km-kbd">A</span><span className="km-kbd">P</span>
              <span className="km-kbd">X</span><span className="km-kbd">D</span>
            </div>
          </div>
        </div>

        <div style={{flex:1, display:'grid', gridTemplateColumns:'1.4fr 1fr', overflow:'hidden'}}>
          {/* Item list */}
          <div className="km-scroll" style={{overflow:'auto', borderRight:'1px solid var(--line)'}}>
            <TriageRow slug="kennel"        kind="idea"   title="Move chats panel above pinned docs?" captured="2m ago" body="Idea — chats panel currently lives at the bottom but feels like it should be quieter, not lower. Above pinned docs might be wrong, but the position deserves a second look." selected />
            <TriageRow slug="picnic-engage" kind="ref"    title="Stripe — billing tiers reference"      captured="14m ago" />
            <TriageRow slug="kennel"        proposal      title="outreach-cadence — add fallback for paused contacts" captured="33m ago" body="Triggered by chat working through the segmentation logic. Adds a 'paused' branch with a 14-day re-check." />
            <TriageRow slug="reading-stack" kind="ref"    title="Newport on capture friction · §3"      captured="1h ago" />
            <TriageRow slug="kennel"        kind="note"   title="Concerns about FTS5 ranking on short titles" captured="3h ago" />
            <TriageRow slug="kennel"        proposal      title="triage-workflow — keyboard hint reposition" captured="yesterday" />
            <TriageRow slug="picnic-engage" kind="action" title="Send revised copy to A. Klein before Friday standup" captured="yesterday" />
            <TriageRow slug="klein-advisory" kind="note"   title="Q2 retro — opening framing"            captured="2d ago" />
            <TriageRow slug="reading-stack" kind="ref"    title="Linear changelog · keyboard model"     captured="2d ago" />
            <TriageRow slug="kennel"        kind="idea"   title="Convert idea → action should preserve markdown body" captured="3d ago" />
          </div>

          {/* Preview pane */}
          <aside className="km-scroll" style={{overflow:'auto', padding:'18px 24px', background:'var(--surface-1)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:14}}>
              <KindIcon kind="idea" muted={false} />
              <ProjectTag slug="kennel" />
              <span style={{flex:1}} />
              <Mono>id 0x4f2a · captured via desktop ⌘⇧K</Mono>
            </div>
            <div className="km-display-md" style={{marginBottom:10}}>Move chats panel above pinned docs?</div>
            <div className="km-body" style={{lineHeight:1.6, color:'var(--fg)'}}>
              <p style={{margin:'0 0 10px'}}>Chats panel currently lives at the bottom of the project landing page and feels right that it's quiet, but feels wrong that it's <em>lower</em>. Maybe the answer is to keep it at the bottom but make stale chats render at even lower opacity. Or put a tiny activity-rollup at the top that mentions "3 chats touched today" and have <em>that</em> link down to the panel.</p>
              <p style={{margin:'0 0 10px'}}>Tension: chats should be discoverable but should not feel central. The current bottom placement protects that. Moving them up risks centering them.</p>
              <div style={{display:'flex', flexWrap:'wrap', gap:6, marginTop:14}}>
                <span className="km-tag">#design</span>
                <span className="km-tag">#information-architecture</span>
              </div>
            </div>

            <div style={{marginTop: 24, paddingTop: 18, borderTop:'1px solid var(--line)'}}>
              <Label style={{marginBottom:8}}>Convert to</Label>
              <div style={{display:'flex', flexWrap:'wrap', gap:8}}>
                <button className="km-btn"><Icons.check size={12} /> action</button>
                <button className="km-btn"><Icons.doc size={12} /> doc</button>
                <button className="km-btn"><Icons.note size={12} /> note</button>
                <button className="km-btn"><Icons.link size={12} /> reference</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
);

// ─── 4. Doc editor ───────────────────────────────────────────────────────────
const DocEditor = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {/* Doc header */}
        <div style={{padding:'16px 28px 14px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom: 6}}>
            <ProjectTag slug="kennel" />
            <Mono>docs / triage-keyboard-notes.md</Mono>
            <span className="km-pin"><Icons.pin size={12} /></span>
          </div>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:24}}>
            <div className="km-display-lg">Triage queue — keyboard interaction notes</div>
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <Rev n={7} />
              <Mono>saved 14:32</Mono>
              <button className="km-btn km-btn-ghost"><Icons.side size={13} /> Preview only</button>
              <button className="km-btn"><Icons.archive size={12} /> Archive</button>
            </div>
          </div>
        </div>

        <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 1fr 320px', overflow:'hidden'}}>
          {/* Markdown source */}
          <div className="km-scroll" style={{overflow:'auto', padding:'22px 26px', borderRight:'1px solid var(--line)', fontFamily:'var(--ff-mono)', fontSize:12.5, lineHeight:1.7, background:'var(--surface-0)'}}>
{`# Triage queue — keyboard interaction notes

The triage queue is the only screen where speed matters more
than clarity. Every decision is a single keystroke.

## Bindings

* \`J\` / \`K\`  — next / previous item
* \`A\`        — activate selected
* \`P\`        — park
* \`D\`        — done (skip activate)
* \`X\`        — dismiss
* \`C\`        — convert popover

> When the popover is open, J/K should NOT navigate the queue —
> they pick within the popover instead.

## Affordances

The selected row carries an **ember left border** and a
slightly elevated background. The action row appears inline
under the title rather than in a footer.

## Open questions

1. Should \`Enter\` be a synonym for \`A\`, or reserved for "open
   in detail view"?
2. When a skill proposal is selected, the action set differs —
   \`A\` becomes "Accept", \`X\` "Reject". Same key, different
   verb. Risky.`}
          </div>

          {/* Rendered preview */}
          <div className="km-scroll" style={{overflow:'auto', padding:'22px 28px', borderRight:'1px solid var(--line)', background:'var(--surface-0)'}}>
            <h1 className="km-display-lg" style={{fontSize: 24, margin:'0 0 10px'}}>Triage queue — keyboard interaction notes</h1>
            <p className="km-body" style={{margin:'0 0 14px'}}>The triage queue is the only screen where speed matters more than clarity. Every decision is a single keystroke.</p>
            <div className="km-display-sm" style={{margin:'18px 0 8px'}}>Bindings</div>
            <ul className="km-body" style={{margin:0, paddingLeft: 18, lineHeight:1.7}}>
              <li><span className="km-kbd">J</span> <span className="km-kbd">K</span> next / previous item</li>
              <li><span className="km-kbd">A</span> activate selected</li>
              <li><span className="km-kbd">P</span> park</li>
              <li><span className="km-kbd">D</span> done (skip activate)</li>
              <li><span className="km-kbd">X</span> dismiss</li>
              <li><span className="km-kbd">C</span> convert popover</li>
            </ul>
            <div style={{margin:'14px 0', padding:'8px 14px', borderLeft:'2px solid var(--moss)', background:'rgba(92,122,62,.06)'}}>
              <p className="km-body" style={{margin:0, fontStyle:'italic'}}>When the popover is open, J/K should NOT navigate the queue — they pick within the popover instead.</p>
            </div>
            <div className="km-display-sm" style={{margin:'18px 0 8px'}}>Affordances</div>
            <p className="km-body" style={{margin:'0 0 14px'}}>The selected row carries an <b>ember left border</b> and a slightly elevated background. The action row appears inline under the title rather than in a footer.</p>
            <div className="km-display-sm" style={{margin:'18px 0 8px'}}>Open questions</div>
            <ol className="km-body" style={{margin:0, paddingLeft: 18, lineHeight:1.7}}>
              <li>Should <code style={{fontFamily:'var(--ff-mono)', fontSize:12, background:'var(--surface-2)', padding:'1px 4px', borderRadius:2}}>Enter</code> be a synonym for A, or reserved for "open in detail view"?</li>
              <li>When a skill proposal is selected, the action set differs — A becomes "Accept", X "Reject". Same key, different verb. Risky.</li>
            </ol>
          </div>

          {/* Comments rail */}
          <aside className="km-scroll" style={{overflow:'auto', padding:'18px 18px', background:'var(--surface-1)'}}>
            <div style={{display:'flex', alignItems:'center', marginBottom: 14}}>
              <Label>Comments</Label>
              <span style={{flex:1}} />
              <Mono>3 · whole-doc</Mono>
            </div>

            <div style={{display:'flex', flexDirection:'column', gap:14}}>
              <div>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom: 4}}>
                  <Actor who="C" /> <span className="km-display-sm">CRAIG</span>
                  <span style={{flex:1}} />
                  <Mono>14:18</Mono>
                </div>
                <div className="km-body" style={{lineHeight:1.5}}>Worried about the same-key/different-verb thing. Let's prototype it before deciding — gut says it's fine because the row visually announces 'this is a proposal'.</div>
              </div>

              <div style={{paddingLeft:0, borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.06)', padding:'10px 12px'}}>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom: 4}}>
                  <Actor who="Cl" /> <span className="km-display-sm" style={{color:'var(--ember-deep)'}}>CLAUDE</span>
                  <span style={{flex:1}} />
                  <Mono>14:21</Mono>
                </div>
                <div className="km-body" style={{lineHeight:1.5, fontStyle:'italic'}}>One small idea: when a proposal is selected, animate the kbd hint row to swap labels (A → Accept). Reinforces it's a different mode and costs ~150ms of motion.</div>
              </div>

              <div>
                <div style={{display:'flex', alignItems:'center', gap:6, marginBottom: 4}}>
                  <Actor who="C" /> <span className="km-display-sm">CRAIG</span>
                  <span style={{flex:1}} />
                  <Mono>14:30</Mono>
                </div>
                <div className="km-body" style={{lineHeight:1.5}}>Yes — but no animation. Just swap the labels instantly.</div>
              </div>
            </div>

            <div style={{marginTop: 18, paddingTop: 14, borderTop:'1px solid var(--line)'}}>
              <textarea placeholder="Add a comment…" className="km-input" rows={3} style={{resize:'none', fontSize:13}} />
              <div style={{display:'flex', alignItems:'center', gap:8, marginTop: 8}}>
                <span className="km-body-sm" style={{flex:1}}>Cmd+Enter to post · @claude to ask</span>
                <button className="km-btn km-btn-primary" style={{padding:'4px 10px', fontSize:12}}>Post</button>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
);

Object.assign(window, { Dashboard, ProjectLanding, TriageQueue, DocEditor });
