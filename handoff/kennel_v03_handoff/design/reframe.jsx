// Reframe — Kennel as information-organization / sense-making tool, not PM.
// 1) A written recommendations page
// 2) A reframed Project landing that demonstrates the new vocabulary in use

// ─── Recommendations page ────────────────────────────────────────────────
const RecRow = ({ from, to, why }) => (
  <div style={{display:'grid', gridTemplateColumns:'180px 1fr 1fr 1.4fr', gap: 18, padding:'14px 0', borderTop:'1px solid var(--line)', alignItems:'flex-start'}}>
    <div className="km-display-sm" style={{fontSize:11}}>{from.label}</div>
    <div className="km-body" style={{textDecoration:'line-through', textDecorationColor:'rgba(58,63,69,.35)', color:'var(--fg-muted)'}}>{from.text}</div>
    <div className="km-body" style={{color:'var(--fg)', fontWeight:500}}>{to}</div>
    <div className="km-body-sm" style={{color:'var(--fg-muted)', lineHeight:1.5}}>{why}</div>
  </div>
);

const RecHeader = ({ children }) => (
  <div style={{display:'grid', gridTemplateColumns:'180px 1fr 1fr 1.4fr', gap: 18, padding:'8px 0 6px'}}>
    <Label>{children[0]}</Label>
    <Label>{children[1]}</Label>
    <Label>{children[2]}</Label>
    <Label>{children[3]}</Label>
  </div>
);

const Recommendations = () => (
  <div className="km" style={{padding:'32px 40px', height:'100%', overflow:'auto'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom: 4}}>
      <div className="km-display-lg">Reframe</div>
      <Mono>kennel · v0.3 · think → research → consolidate → reflect → repeat</Mono>
    </div>
    <div className="km-body" style={{maxWidth: 920, color:'var(--fg-muted)', marginBottom: 22, lineHeight:1.55}}>
      The brief still describes Kennel using task-flavoured words inherited from PM tools ("next up", "active", "done"). The actual workflow is information-first: capture across sources, reflect, talk it through with Claude, occasionally crystallize a learning, let the rest age out. Below: the vocabulary, lifecycle, and screen changes that make the design match the workflow.
    </div>

    {/* 1. Principles delta */}
    <Label style={{marginBottom: 8}}>Principles · what to change</Label>
    <div className="km-body" style={{marginBottom: 14, color:'var(--fg)', lineHeight:1.6, maxWidth: 920}}>
      The five existing principles (capture friction is the enemy, corral over manage, Claude is integral, recall beats organization, quiet by default) all survive. Add two and replace one:
    </div>
    <ul className="km-body" style={{margin:0, paddingLeft: 18, lineHeight: 1.8, maxWidth: 920, marginBottom: 24}}>
      <li><b>Information ages</b> · what's hot vs. what's aging matters more than what's "due". Surface staleness, not deadlines.</li>
      <li><b>Crystallization is the goal</b> · the value of a thread isn't its activity; it's the durable learning it eventually produces. Make that artifact first-class.</li>
      <li><i>Replaces "next up" framing</i> · the dashboard's primary cut should be "what I've been thinking about", not "what's due next".</li>
    </ul>

    {/* 2. Vocabulary table */}
    <Label style={{marginBottom: 8}}>Vocabulary · rename without breaking URLs</Label>
    <div className="km-body-sm" style={{marginBottom: 6, color:'var(--fg-muted)', maxWidth: 920}}>
      Keep <Mono>project</Mono> as the canonical noun in URLs / MCP / CLI / schema. Reframe in copy and headers.
    </div>
    <RecHeader>{['CATEGORY','FROM','TO','WHY']}</RecHeader>
    <div style={{borderBottom:'1px solid var(--line)'}}>
      <RecRow from={{label:'CONTAINER', text:'"Project"'}}             to='"Thread" (in copy)' why='Implies an ongoing line of thinking, not a deliverable. Schema stays projects. Headers, empty states, and onboarding copy use "thread".' />
      <RecRow from={{label:'PRIMARY CUT', text:'"Next up"'}}            to='"In focus"'          why='What the user is actively working through. Sorted by last-touched + rank instead of due_at.' />
      <RecRow from={{label:'STATES', text:'active / parked / done'}}    to='active / reflecting / crystallized / filed' why='"Parked" implies a deferred task. "Reflecting" describes most of an item\'s real life — captured but not yet sense-made. "Filed" replaces archived: soft, searchable, out of the way.' />
      <RecRow from={{label:'OUTCOME', text:'(none)'}}                    to='Crystallization (kind)' why='A consolidated takeaway. The thing the thread was actually for. Lives alongside docs but renders differently.' />
      <RecRow from={{label:'KIND', text:'(none)'}}                       to='Question (kind)'      why='Open inquiries — what you\'re trying to figure out. Distinct from idea (a spark) or note (an observation). Action stays as a kind.' />
      <RecRow from={{label:'FIELD NOTES', text:'(none)'}}                to='Field notes (new sibling to runbook)' why='Sense-making notes for a thread — Premise / What I know / Open questions / Sources / Crystallizations. Lives next to the runbook, not in place of it.' />
      <RecRow from={{label:'RUNBOOK', text:'Runbook (technical setup)'}} to='Runbook (unchanged)'  why='Stays as-is. Operational reference for hard artefacts: how to access a demo or prototype, deploy/test steps, keys, links to running apps. Distinct purpose from Field notes.' />
      <RecRow from={{label:'ARCHIVE', text:'"Archived"'}}                to='"Filed"'              why='Soft retirement. Stays searchable, drops from default surfaces. "Composted" considered and rejected as too twee.' />
      <RecRow from={{label:'TRIAGE', text:'"Triage queue"'}}             to='"Sort"'               why='Triage carries medical urgency. Sort is closer to what\'s actually happening — putting captures in the right thread.' />
      <RecRow from={{label:'ACTION LABELS', text:'Activate / Park / Dismiss'}} to='Pick up / Set aside / Let go' why='Aligned with the lifecycle metaphor. Same shortcuts (A / P / X). Friendlier on the verb without going twee.' />
    </div>

    {/* 3. Lifecycle viz */}
    <Label style={{margin:'28px 0 8px'}}>Lifecycle · how an item moves</Label>
    <div style={{
      display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap: 0,
      border:'1px solid var(--line)', borderRadius:3,
      maxWidth: 920, overflow:'hidden'
    }}>
      {[
        { name:'CAPTURED',     dot:'slate', desc:'lands in inbox · zero friction' },
        { name:'REFLECTING',   dot:'dust',  desc:'in a thread · being touched' },
        { name:'IN FOCUS',     dot:'ember', desc:'currently active · ranked' },
        { name:'CRYSTALLIZED', dot:'moss',  desc:'durable outcome · keep' },
        { name:'FILED',        dot:'slate', desc:'aged out · searchable, hidden' },
      ].map((s, i, arr) => (
        <div key={s.name} style={{
          padding:'14px 14px', borderRight: i < arr.length-1 ? '1px solid var(--line)' : 0,
          display:'flex', flexDirection:'column', gap: 6,
          background: i % 2 ? 'var(--surface-1)' : 'transparent'
        }}>
          <div style={{display:'flex', alignItems:'center', gap:7}}>
            <span className={`km-dot km-dot-${s.dot}`} />
            <span className="km-display-sm" style={{fontSize:10}}>{s.name}</span>
          </div>
          <div className="km-body-sm" style={{lineHeight:1.4, color:'var(--fg-muted)'}}>{s.desc}</div>
          <Mono dim>{['t=0','t+hrs','t+days','t+weeks','t≫'][i]}</Mono>
        </div>
      ))}
    </div>
    <div className="km-body-sm" style={{maxWidth: 920, marginTop: 8, color:'var(--fg-muted)', lineHeight:1.5}}>
      Most items aim for compost; a small fraction crystallize. The dashboard's tertiary
      surface should be "Aging" (untouched &gt; X days, prompting a let-go decision),
      not "Yesterday".
    </div>

    {/* 4. Screen impact */}
    <Label style={{margin:'28px 0 8px'}}>Screen impact</Label>
    <div style={{borderTop:'1px solid var(--line)'}}>
      {[
        { screen:'Dashboard', delta:'medium', notes:'Replace "Next up" with "In focus" (last-touched ordering). Replace "Yesterday" tertiary with "Aging — let go?" listing items untouched > 21d. Add a "Crystallized this week" strip.' },
        { screen:'Project landing', delta:'high', notes:'Add a Crystallizations panel above pinned docs. Add Field notes as a new sibling section to Runbook. Runbook stays unchanged in purpose and structure. Conversations promoted higher (primary input surface, not background).' },
        { screen:'Sort (was Triage)', delta:'rename', notes:'Same screen, same shortcuts (J/K/A/P/X). Header label changes; action labels become Pick up / Set aside / Let go.' },
        { screen:'Doc editor', delta:'low', notes:'Add a "Promote to crystallization" affordance in the header. Crystallizations render with a moss-bordered header and a small DURABLE stamp.' },
        { screen:'Runbook view', delta:'unchanged', notes:'Stays as designed. Operational reference: how to access a demo or prototype, deploy/test steps, keys, links to running apps. Six sections, code blocks intact.' },
        { screen:'Field notes (new)', delta:'new view', notes:'New view, sits next to Runbook in the project header actions. Five sections: Premise / What I know / Open questions / Sources / Crystallizations. Sense-making register; rendered markdown like docs, not commands like runbook.' },
        { screen:'Global search', delta:'low', notes:'Add filter chips for state (reflecting / crystallized / filed). Hide filed by default; "include filed" toggle.' },
        { screen:'Settings', delta:'low', notes:'Add an "Aging threshold" setting (default 21 days). Add "Filing" preferences: never auto, suggest at 90d, suggest at 180d.' },
      ].map((r, i, arr) => (
        <div key={r.screen} style={{display:'grid', gridTemplateColumns:'200px 120px 1fr', gap:18, padding:'12px 0', borderBottom:'1px solid var(--line)', alignItems:'flex-start'}}>
          <div className="km-body" style={{fontWeight:500}}>{r.screen}</div>
          <Mono>{r.delta}</Mono>
          <div className="km-body-sm" style={{lineHeight:1.55}}>{r.notes}</div>
        </div>
      ))}
    </div>

    {/* 5. New surface */}
    <Label style={{margin:'28px 0 8px'}}>One genuinely new surface</Label>
    <div className="km-body" style={{maxWidth: 920, lineHeight:1.55, marginBottom: 12}}>
      A <b>Cycle review</b>: a once-a-week (or on-demand) sweep that takes you through every active thread and asks three questions per item: <i>Pick up · Let go · Crystallize?</i> It's the place where information actually gets shaped into outcomes. Closer to the brief's weekly-review hint than to a PM standup. Mock to come if you want it.
    </div>

    {/* 6. Open questions */}
    <Label style={{margin:'24px 0 8px'}}>Open questions for Craig</Label>
    <div style={{padding:'12px 14px', background:'rgba(92,122,62,.10)', border:'1px solid rgba(92,122,62,.30)', borderRadius:3, maxWidth: 920}}>
      <div className="km-display-sm" style={{color:'var(--moss)', marginBottom:8}}>LOCKED · v0.3</div>
      <ul className="km-body" style={{margin:0, paddingLeft: 18, lineHeight:1.8}}>
        <li>Container: <b>Thread</b> (in copy; URLs stay <Mono>project</Mono>)</li>
        <li>Primary cut: <b>In focus</b></li>
        <li>Durable outcome: <b>Crystallization</b></li>
        <li>New kind: <b>Question</b>. <b>Action</b> stays as a kind.</li>
        <li>Field notes are a <b>new sibling</b> to Runbook. Runbook unchanged — operational reference for hard artefacts (demo access, deploy, keys, app links).</li>
        <li>Soft archive: <b>Filed</b></li>
        <li>Inbox-processing screen: <b>Sort</b></li>
      </ul>
    </div>
  </div>
);

// ─── Reframed Project landing — demonstrating the new vocabulary ───────────
const ProjectLandingReframed = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar projectChip={<ProjectTag slug="kennel" />} />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        {/* Header — note 'thread' framing */}
        <div style={{padding:'22px 32px 14px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24}}>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                <ProjectTag slug="kennel" />
                <Mono dim>thread · 73 days in · last touched 12m ago</Mono>
              </div>
              <div className="km-display-lg" style={{marginBottom: 4}}>Kennel</div>
              <div className="km-body" style={{maxWidth: 760, color:'var(--fg-muted)'}}>
                Designing and building a personal information-organization tool around the cycle of think → research → consolidate → reflect.
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="km-btn"><Icons.plus size={12} /> Capture</button>
              <button className="km-btn"><Icons.note size={12} /> Field notes</button>
              <button className="km-btn"><Icons.runbook size={12} /> Runbook</button>
              <button className="km-btn km-btn-ghost"><Icons.cog size={13} /></button>
            </div>
          </div>
        </div>

        <div style={{padding:'18px 32px 32px', display:'flex', flexDirection:'column', gap:18}}>
          {/* In focus — replaces Next up */}
          <section className="km-card" style={{padding:0}}>
            <SectionHead title="In focus" right={<><Mono>by last touched</Mono><Mono dim>·</Mono><Mono>17 active</Mono></>} />
            <div className="km-rule" />
            {[
              { kind:'question', title:'Is "Composted" too twee a name for soft-archive?',           touched:'12m ago', tag:'#voice',     ember:true },
              { kind:'idea',     title:'Move chats panel higher — it\'s a primary input, not bg',    touched:'1h ago',  tag:'#ia',        ember:true },
              { kind:'action',   title:'Decide on dark-mode third elevation tone',                    touched:'3h ago',  tag:'#design' },
              { kind:'doc',      title:'Skill proposal review — wireframe notes',                    touched:'yesterday', tag:'rev 3' },
              { kind:'ref',      title:'Tiago Forte on capture → distillation → expression',         touched:'2d ago',  tag:'#research' },
            ].map((r, i, arr) => (
              <div key={i} className={`km-row ${r.ember ? 'km-active-row' : ''}`} style={{
                display:'grid', gridTemplateColumns:'18px 14px 1fr 110px',
                alignItems:'center', gap:12, padding:'9px 14px',
                borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 0
              }}>
                <span style={{color:'var(--fg-faint)'}}><Icons.grip size={12} /></span>
                {r.kind === 'question'
                  ? <span style={{color:'var(--ember-deep)', fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:600}}>?</span>
                  : <KindIcon kind={r.kind} />}
                <div style={{display:'flex', alignItems:'center', gap:8, minWidth:0}}>
                  <span className="km-body">{r.title}</span>
                  <Mono dim>{r.tag}</Mono>
                </div>
                <Mono>{r.touched}</Mono>
              </div>
            ))}
          </section>

          {/* Crystallizations — durable outcomes (new) */}
          <section className="km-card" style={{padding:0, borderColor: 'rgba(92,122,62,.35)'}}>
            <div style={{display:'flex', alignItems:'center', padding:'10px 16px'}}>
              <span style={{color:'var(--moss)', marginRight:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2 22 8v8L12 22 2 16V8z" />
                </svg>
              </span>
              <span className="km-display-sm" style={{color:'var(--moss)'}}>CRYSTALLIZATIONS</span>
              <span style={{flex:1}} />
              <Mono dim>durable outcomes from this thread · 4</Mono>
            </div>
            <div className="km-rule" />
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:0}}>
              {[
                { title:'Capture friction is the design constraint',  age:'29d ago', sources: 'from 11 items, 3 chats',  body:'Every other principle bends to capture friction. Sub-5s end-to-end is non-negotiable; everything else is a refinement on the speed-vs-precision frontier.' },
                { title:'Slug is the most consequential field at creation', age:'18d ago', sources:'from 4 items, 1 chat', body:'Auto-derive, keep editable, show in mono. Users won\'t pick a slug deliberately, but they will recognize a wrong one when they see it.' },
                { title:'Stale chats deserve opacity, not lower placement', age:'9d ago', sources:'from 6 items',           body:'Moving the chats panel up signals importance and reads as PM-style activity. The right move is keep it bottom and let stale chats fade.' },
                { title:'Three dark-mode elevations, no pure black',      age:'2d ago',  sources:'from 5 items, 2 chats',  body:'Slate-dark floor, mid surface for cards, slate for highest controls. Any deeper reads as consumer-app, not workshop.' },
              ].map((c, i, arr) => (
                <div key={i} style={{
                  padding:'12px 14px',
                  borderRight: i % 2 === 0 ? '1px solid var(--line)' : 0,
                  borderBottom: i < 2 ? '1px solid var(--line)' : 0,
                  display:'flex', flexDirection:'column', gap: 6
                }}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span className="km-body" style={{fontWeight:500, flex:1, lineHeight:1.4}}>{c.title}</span>
                    <span className="km-display-sm" style={{color:'var(--moss)', fontSize:9}}>DURABLE</span>
                  </div>
                  <div className="km-body-sm" style={{lineHeight:1.55, color:'var(--fg-muted)'}}>{c.body}</div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <Mono dim>{c.sources}</Mono>
                    <Mono dim>·</Mono>
                    <Mono>crystallized {c.age}</Mono>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Field notes (new) + Runbook (unchanged) — two siblings, side by side */}
          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 14}}>
            {/* Field notes — sense-making */}
            <section className="km-card" style={{padding:0}}>
              <div style={{display:'flex', alignItems:'center', padding:'10px 14px'}}>
                <span style={{color:'var(--fg-muted)', marginRight:8}}><Icons.note size={13} /></span>
                <Label>Field notes</Label>
                <Mono dim style={{marginLeft:8}}>sense-making</Mono>
                <span style={{flex:1}} />
                <Rev n={9} />
                <button className="km-btn km-btn-ghost" style={{marginLeft:8}}>Edit</button>
              </div>
              <div className="km-rule" />
              <div style={{display:'flex', gap:0, padding:'0 14px', borderBottom:'1px solid var(--line)', flexWrap:'wrap'}}>
                {['Premise','What I know','Open questions','Sources','Crystallizations'].map((s, i) => (
                  <React.Fragment key={s}>
                    <button style={{
                      border:0, background:'transparent',
                      fontFamily:'var(--ff-display)', fontWeight:500, fontSize:11,
                      letterSpacing:'.16em', textTransform:'uppercase',
                      color: i === 2 ? 'var(--ember-deep)' : 'var(--fg-muted)',
                      padding:'7px 0',
                      borderBottom: i === 2 ? '2px solid var(--ember)' : '2px solid transparent',
                      cursor:'pointer'
                    }}>{s}</button>
                    {i < 4 && <span style={{width:14}} />}
                  </React.Fragment>
                ))}
              </div>
              <div style={{padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:8}}>
                {[
                  'Is information aging better surfaced by opacity, or by a dedicated Aging surface?',
                  'When the user crystallizes an item, do its sources auto-file, or stay linked but demoted?',
                  'Does a thread carry an explicit "current focus", or does last-touched ordering make that implicit?',
                ].map((q, i) => (
                  <div key={i} style={{display:'flex', alignItems:'baseline', gap:10}}>
                    <span style={{color:'var(--ember-deep)', fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:600, minWidth: 10}}>?</span>
                    <span className="km-body" style={{flex:1, lineHeight:1.5, fontSize:13}}>{q}</span>
                    <Mono dim>{['28d','11d','4d'][i]}</Mono>
                  </div>
                ))}
              </div>
            </section>

            {/* Runbook — operational, unchanged in purpose */}
            <section className="km-card" style={{padding:0}}>
              <div style={{display:'flex', alignItems:'center', padding:'10px 14px'}}>
                <span style={{color:'var(--fg-muted)', marginRight:8}}><Icons.runbook size={13} /></span>
                <Label>Runbook</Label>
                <Mono dim style={{marginLeft:8}}>operational</Mono>
                <span style={{flex:1}} />
                <Rev n={12} />
                <button className="km-btn km-btn-ghost" style={{marginLeft:8}}>Edit</button>
              </div>
              <div className="km-rule" />
              <div style={{padding:'12px 14px 14px'}}>
                <div className="km-display-sm" style={{fontSize:10, marginBottom:6}}>RUN · access the prototype</div>
                <div style={{
                  fontFamily:'var(--ff-mono)', fontSize:12, padding:'8px 10px',
                  background:'rgba(201,168,124,.18)', borderLeft:'2px solid var(--ember-deep)',
                  whiteSpace:'pre', lineHeight:1.6
                }}>{`$ uv run kennel serve --reload\n$ open http://localhost:8421`}</div>
                <div className="km-display-sm" style={{fontSize:10, margin:'12px 0 6px'}}>KEYS · in 1Password vault</div>
                <div style={{display:'flex', flexDirection:'column', gap:3}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}><Mono>KENNEL_TOKEN</Mono><Mono dim>kennel-dev / vps</Mono></div>
                  <div style={{display:'flex', alignItems:'center', gap:8}}><Mono>MCP_URL</Mono><Mono dim>https://kennel.local/mcp</Mono></div>
                </div>
                <div className="km-display-sm" style={{fontSize:10, margin:'12px 0 6px'}}>LIVE</div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <Icons.ext size={11} />
                  <span className="km-link" style={{borderBottomStyle:'dashed', fontSize:13}}>kennel.dixon.run</span>
                  <Mono dim>up · last deploy 14:02</Mono>
                </div>
              </div>
            </section>
          </div>

          {/* Aging — let-go surface (new) */}

          <section className="km-card" style={{padding:0, background:'rgba(201,168,124,.08)'}}>
            <div style={{display:'flex', alignItems:'center', padding:'10px 16px'}}>
              <Label>Aging</Label>
              <Mono dim style={{marginLeft:8}}>untouched ≥ 21d · let go or pick back up</Mono>
              <span style={{flex:1}} />
              <button className="km-btn km-btn-ghost" style={{padding:'4px 6px'}}>Review all 7 <Icons.arrowR size={11} /></button>
            </div>
            <div className="km-rule" />
            {[
              { kind:'idea', title:'Try a tag-graph view for projects with > 50 items',        age:'34d' },
              { kind:'note', title:'Pacecraft Lily eye-pupil ratio · for parity reference',    age:'28d' },
              { kind:'ref',  title:'Notion shipped a new sidebar pattern — worth a look?',     age:'25d' },
            ].map((r, i, arr) => (
              <div key={i} className="km-row" style={{
                display:'grid', gridTemplateColumns:'14px 1fr 90px auto',
                alignItems:'center', gap:12, padding:'8px 14px',
                opacity: 0.78,
                borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 0
              }}>
                <KindIcon kind={r.kind} />
                <span className="km-body">{r.title}</span>
                <Mono>{r.age} cold</Mono>
                <div style={{display:'flex', gap:6}}>
                  <button className="km-btn km-btn-ghost" style={{padding:'3px 8px', fontSize:11}}>Pick up</button>
                  <button className="km-btn km-btn-ghost" style={{padding:'3px 8px', fontSize:11, color:'var(--ember-deep)'}}>Let go</button>
                </div>
              </div>
            ))}
          </section>

          {/* Chats — promoted to a primary surface, no longer hidden at bottom */}
          <section className="km-card" style={{padding:0}}>
            <SectionHead
              title="Conversations"
              right={<>
                <Mono>4 active · 2 stale</Mono>
                <button className="km-btn km-btn-ghost" style={{padding:'3px 8px', fontSize:12}}>Start new</button>
              </>}
            />
            <div className="km-rule" />
            <div style={{padding:'4px 8px', display:'flex', flexDirection:'column', gap:2}}>
              <ChatRow tagline="working through the segmentation logic — three tiers and a churn-risk overlay, plus the paused branch we landed on" since="12m ago" />
              <ChatRow tagline="figuring out whether the proposal queue should batch by skill or interleave them with regular items" since="4d ago" />
              <ChatRow tagline="experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet" since="74d ago" stale />
            </div>
          </section>
        </div>
      </main>
    </div>
  </div>
);

// Aging-only board — the new dashboard surface
const AgingBoard = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'22px 32px 32px'}}>
        <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom: 6}}>
          <div className="km-display-lg">Aging</div>
          <Mono dim>across all threads · untouched ≥ 21d · 23 items · pick up / let go / file</Mono>
          <span style={{flex:1}} />
          <button className="km-btn"><Icons.filter size={12} /> Threshold · 21d</button>
        </div>
        <div className="km-body" style={{color:'var(--fg-muted)', maxWidth: 720, marginBottom: 22, lineHeight:1.55}}>
          Items that haven't been touched in a while. Most should be let go; some are worth picking back up. Each decision is one keystroke.
        </div>

        <div className="km-card" style={{padding:0}}>
          {[
            { slug:'kennel',         kind:'idea', title:'Try a tag-graph view for projects with > 50 items',    age:'34d cold', last:'15 apr' },
            { slug:'pacecraft',      kind:'note', title:'Lily eye-pupil ratio reference',                       age:'28d cold', last:'21 apr' },
            { slug:'reading-stack',  kind:'ref',  title:'Notion shipped a new sidebar pattern — worth a look?',  age:'25d cold', last:'24 apr', selected:true },
            { slug:'klein-advisory', kind:'note', title:'Q1 retro · framing that didn\'t land',                 age:'45d cold', last:'4 apr' },
            { slug:'reading-stack',  kind:'ref',  title:'Cal Newport on capture friction · §3',                 age:'37d cold', last:'10 apr' },
            { slug:'kennel',         kind:'idea', title:'Two-pane diff with collapsed unchanged regions',       age:'22d cold', last:'27 apr' },
            { slug:'training-block', kind:'note', title:'Last build — pacing felt off in the last 40k',         age:'58d cold', last:'22 mar' },
          ].map((r, i, arr) => (
            <div key={i} className={`km-row ${r.selected ? 'km-active-row' : ''}`} style={{
              display:'grid', gridTemplateColumns:'14px 110px 1fr 110px 80px auto',
              alignItems:'center', gap:12, padding:'10px 14px',
              background: r.selected ? 'rgba(217,98,44,.05)' : 'transparent',
              opacity: r.selected ? 1 : 0.82,
              borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 0
            }}>
              <KindIcon kind={r.kind} />
              <ProjectTag slug={r.slug} />
              <span className="km-body">{r.title}</span>
              <Mono>{r.age}</Mono>
              <Mono dim>{r.last}</Mono>
              <div style={{display:'flex', gap:6}}>
                <button className="km-btn km-btn-ghost" style={{padding:'4px 9px', fontSize:11.5}}>Pick up</button>
                <button className="km-btn km-btn-ghost" style={{padding:'4px 9px', fontSize:11.5}}>Crystallize</button>
                <button className="km-btn km-btn-ghost" style={{padding:'4px 9px', fontSize:11.5, color:'var(--ember-deep)'}}>File</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{marginTop: 18, padding:'10px 14px', background:'var(--surface-1)', borderRadius:3, border:'1px solid var(--line)', display:'flex', alignItems:'center', gap:10}}>
          <Mono dim>shortcuts</Mono>
          <span className="km-kbd">J</span><span className="km-kbd">K</span><span className="km-body-sm">navigate</span>
          <span style={{margin:'0 6px', color:'var(--fg-faint)'}}>·</span>
          <span className="km-kbd">U</span><span className="km-body-sm">pick up</span>
          <span style={{margin:'0 6px', color:'var(--fg-faint)'}}>·</span>
          <span className="km-kbd">C</span><span className="km-body-sm">crystallize</span>
          <span style={{margin:'0 6px', color:'var(--fg-faint)'}}>·</span>
          <span className="km-kbd">F</span><span className="km-body-sm">file</span>
          <span style={{flex:1}} />
          <Mono>sweep 1 of 23</Mono>
        </div>
      </main>
    </div>
  </div>
);

Object.assign(window, { Recommendations, ProjectLandingReframed, AgingBoard });
