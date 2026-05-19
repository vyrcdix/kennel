// Screens 5-8: Runbook view, Skill proposal review, Global search, Settings

// ─── 5. Runbook view ────────────────────────────────────────────────────────
const RunSection = ({ label, children }) => (
  <section style={{display:'flex', gap: 32, padding:'18px 0', borderBottom:'1px solid var(--line)'}}>
    <div style={{width: 180, flex:'0 0 180px'}}>
      <Label>{label}</Label>
    </div>
    <div style={{flex:1, maxWidth: 760}}>{children}</div>
  </section>
);

const Code = ({ children }) => (
  <pre style={{
    fontFamily:'var(--ff-mono)', fontSize:12.5, padding:'10px 14px',
    background:'rgba(201,168,124,.18)', borderLeft:'2px solid var(--ember-deep)',
    margin:'10px 0', whiteSpace:'pre', lineHeight:1.7, overflow:'auto'
  }}>{children}</pre>
);

const RunbookView = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar projectChip={<ProjectTag slug="kennel" />} />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto', padding:'22px 32px 32px'}}>
        {/* Header */}
        <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap: 24, marginBottom: 18, paddingBottom: 16, borderBottom:'1px solid var(--line)'}}>
          <div>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
              <span style={{color:'var(--fg-muted)'}}><Icons.runbook size={14} /></span>
              <ProjectTag slug="kennel" />
              <Mono>runbook</Mono>
            </div>
            <div className="km-display-lg" style={{marginBottom:4}}>Kennel — Runbook</div>
            <div className="km-body" style={{color:'var(--fg-muted)', maxWidth: 760}}>
              How to bring this project online, run it locally, deploy it, and dig out when something breaks. Read top-to-bottom on a new machine; jump to Run on a known one.
            </div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <div style={{textAlign:'right'}}>
              <Rev n={12} />
              <div><Mono>updated 14:02 by C</Mono></div>
            </div>
            <button className="km-btn"><Icons.copy size={12} /> Copy as md</button>
            <button className="km-btn km-btn-primary">Edit</button>
          </div>
        </div>

        {/* Sections (Run expanded most) */}
        <RunSection label="Prerequisites">
          <ul className="km-body" style={{margin:0, paddingLeft: 18, lineHeight:1.8}}>
            <li>macOS 14+ with Xcode CLT installed.</li>
            <li><code style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>uv</code> 0.4.x or newer.</li>
            <li>Claude desktop with MCP enabled (Settings → Developer).</li>
            <li>A VPS reachable over SSH for the persistence layer (optional in dev).</li>
          </ul>
        </RunSection>

        <RunSection label="Setup">
          <p className="km-body" style={{margin:'0 0 4px'}}>One-time clone and dependency bootstrap.</p>
          <Code>{`$ git clone git@github.com:craig/kennel.git ~/work/kennel
$ cd ~/work/kennel
$ uv sync                            # python deps + sqlite-vec extension
$ cp .env.sample .env
$ vim .env                           # KENNEL_TOKEN, MCP_URL, BACKUP_DIR`}</Code>
          <p className="km-body" style={{margin:'8px 0 0'}}>
            FTS5 is enabled in the default sqlite build; nothing else to install.
          </p>
        </RunSection>

        <RunSection label="Run">
          <p className="km-body" style={{margin:'0 0 4px'}}>Day-to-day.</p>
          <Code>{`$ uv run kennel serve --reload --port 8421
$ open http://localhost:8421
$ kennel mcp register --token $KENNEL_TOKEN  # one-shot per machine`}</Code>
          <div className="km-body" style={{margin:'10px 0 0', display:'flex', alignItems:'center', gap:8, color:'var(--fg-muted)'}}>
            <Icons.bulb size={14} />
            <span>Reload watches the python sources and the static frontend; markdown edits in <code style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>~/work/skills</code> are hot-reloaded on next request.</span>
          </div>
        </RunSection>

        <RunSection label="Deploy">
          <Code>{`$ make deploy   # builds wheels, rsyncs to vps:/srv/kennel, restarts systemd unit`}</Code>
          <p className="km-body" style={{margin:'8px 0 0'}}>The deploy script refuses to run if there are uncommitted changes or pending migrations.</p>
        </RunSection>

        <RunSection label="Troubleshoot">
          <div style={{display:'flex', flexDirection:'column', gap: 10}}>
            <div>
              <div className="km-body" style={{fontWeight:500}}>MCP says "could not reach kennel".</div>
              <div className="km-body-sm">Token mismatch is by far the most common cause. Reset it: <code style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>kennel mcp rotate-token</code> then re-register the client.</div>
            </div>
            <div>
              <div className="km-body" style={{fontWeight:500}}>FTS5 search returns nothing.</div>
              <div className="km-body-sm">The trigram index can drift if rows were inserted with WAL checkpointing paused. Rebuild: <code style={{fontFamily:'var(--ff-mono)', fontSize:12.5}}>kennel db reindex --fts</code>.</div>
            </div>
          </div>
        </RunSection>

        <RunSection label="Notes">
          <p className="km-body" style={{margin:0, color:'var(--fg-muted)'}}>Backups run at 03:00 PDT via launchd. The MCP token has no expiry; rotate it any time anyone but Craig touches a Claude client.</p>
        </RunSection>
      </main>
    </div>
  </div>
);

// ─── 6. Skill proposal review ───────────────────────────────────────────────
const DiffLine = ({ n, sign, text, kind }) => (
  <div style={{
    display:'grid', gridTemplateColumns:'34px 16px 1fr',
    alignItems:'baseline',
    background: kind === 'add' ? 'rgba(92,122,62,.10)' : (kind === 'del' ? 'rgba(138,58,20,.08)' : 'transparent'),
    padding:'1px 0'
  }}>
    <span className="km-mono-sm" style={{textAlign:'right', paddingRight:6, color:'var(--fg-faint)'}}>{n}</span>
    <span className="km-mono-sm" style={{textAlign:'center', color: kind === 'add' ? 'var(--moss)' : (kind === 'del' ? 'var(--ember-deep)' : 'var(--fg-faint)')}}>{sign || ' '}</span>
    <span style={{fontFamily:'var(--ff-mono)', fontSize:12.5, whiteSpace:'pre-wrap', lineHeight:1.6, color:'var(--fg)'}}>{text}</span>
  </div>
);

const SkillProposal = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
        {/* Header */}
        <div style={{padding:'16px 28px 14px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom: 8}}>
            <span className="km-display-sm" style={{color:'var(--moss)'}}>SKILL PROPOSAL</span>
            <ProjectTag slug="picnic-engage" />
            <span style={{flex:1}} />
            <span className="km-display-sm" style={{color:'var(--ember-deep)'}}>● PENDING REVIEW</span>
          </div>
          <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:24}}>
            <div>
              <div className="km-display-lg" style={{marginBottom:4}}>outreach-cadence</div>
              <Mono>skills/outreach-cadence.md · rev 4 → rev 5 · +18 −6 across 2 hunks</Mono>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:14}}>
              <Mono>proposed 33m ago</Mono>
              <Actor who="Cl" /><span className="km-body-sm">by Claude</span>
            </div>
          </div>
        </div>

        <div style={{flex:1, display:'grid', gridTemplateColumns:'1fr 360px', overflow:'hidden'}}>
          {/* Diff */}
          <div className="km-scroll" style={{overflow:'auto', padding:'18px 24px 24px', borderRight:'1px solid var(--line)'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom: 12}}>
              <Label>Diff</Label>
              <span className="km-body-sm">hunk 1 of 2 · §branching</span>
              <span style={{flex:1}} />
              <button className="km-btn km-btn-ghost" style={{padding:'4px 8px'}}>collapse unchanged</button>
            </div>

            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 0, border:'1px solid var(--line)', borderRadius:3, overflow:'hidden'}}>
              <div style={{borderRight:'1px solid var(--line)'}}>
                <div style={{padding:'8px 12px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8}}>
                  <span className="km-display-sm">Current · rev 4</span>
                  <Mono dim>local · ~/work/skills/outreach-cadence.md</Mono>
                </div>
                <div style={{padding:'10px 0'}}>
                  <DiffLine n={42} text="## Branching" />
                  <DiffLine n={43} text="" />
                  <DiffLine n={44} text="When a contact is in an active sequence, the cadence" />
                  <DiffLine n={45} text="proceeds as defined. When a contact is **opted out**," />
                  <DiffLine n={46} sign="−" kind="del" text="the cadence halts and the contact is marked complete." />
                  <DiffLine n={47} sign="−" kind="del" text="No re-check is performed." />
                  <DiffLine n={48} text="" />
                  <DiffLine n={49} text="## Notes" />
                </div>
              </div>
              <div>
                <div style={{padding:'8px 12px', background:'var(--surface-2)', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'center', gap:8}}>
                  <span className="km-display-sm" style={{color:'var(--moss)'}}>Proposed · rev 5</span>
                  <Mono dim>claude · session 0x9c1f</Mono>
                </div>
                <div style={{padding:'10px 0'}}>
                  <DiffLine n={42} text="## Branching" />
                  <DiffLine n={43} text="" />
                  <DiffLine n={44} text="When a contact is in an active sequence, the cadence" />
                  <DiffLine n={45} text="proceeds as defined. When a contact is **opted out**," />
                  <DiffLine n={46} sign="+" kind="add" text="the cadence halts and the contact is marked complete." />
                  <DiffLine n={47} sign="+" kind="add" text="" />
                  <DiffLine n={48} sign="+" kind="add" text="When a contact is **paused** (e.g. OOO auto-reply, or" />
                  <DiffLine n={49} sign="+" kind="add" text="manual hold), the cadence enters a 14-day re-check loop:" />
                  <DiffLine n={50} sign="+" kind="add" text="every 14 days, attempt one low-touch nudge. After three" />
                  <DiffLine n={51} sign="+" kind="add" text="failed re-checks (~6 weeks), demote to opted-out." />
                  <DiffLine n={52} text="" />
                  <DiffLine n={53} text="## Notes" />
                </div>
              </div>
            </div>

            <div style={{display:'flex', alignItems:'center', gap:8, padding:'10px 0', marginTop:10}}>
              <Label>Rationale</Label>
              <span style={{flex:1}} />
              <Mono>triggered by chat · "segmentation logic"</Mono>
              <span style={{color:'var(--fg-muted)'}}><Icons.ext size={12} /></span>
            </div>
            <div style={{padding:'12px 14px', borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.05)'}}>
              <p className="km-body" style={{margin:'0 0 6px', fontStyle:'italic', color:'var(--fg)'}}>
                In your chat working through tier segmentation, you noted that OOO replies and manual holds were getting bucketed as opted-out, which dropped contacts that should re-enter the cadence. This proposal adds a 'paused' branch with a bounded re-check loop so paused contacts aren't permanently lost — and so opted-out remains a deliberate terminal state, not a default.
              </p>
              <div className="km-body-sm" style={{display:'flex', alignItems:'center', gap:8}}>
                <Mono>3 turns · 0x9c1f</Mono>
                <span>·</span>
                <span className="km-link" style={{borderBottomStyle:'dashed', color:'var(--ember-deep)'}}>view conversation</span>
              </div>
            </div>
          </div>

          {/* Actions sidebar */}
          <aside className="km-scroll" style={{overflow:'auto', padding:'18px 20px', background:'var(--surface-1)'}}>
            <Label style={{marginBottom: 12}}>Decision</Label>
            <div style={{display:'flex', flexDirection:'column', gap:8}}>
              <button className="km-btn km-btn-moss" style={{justifyContent:'center', padding:'10px 12px'}}>
                <Icons.check size={13} /> Accept · update kennel only
              </button>
              <button className="km-btn km-btn-primary" style={{justifyContent:'center', padding:'10px 12px'}}>
                <Icons.ext size={13} /> Accept &amp; write to source
              </button>
              <div className="km-body-sm" style={{paddingLeft:2, color:'var(--fg-muted)', lineHeight:1.5}}>
                'Write to source' updates <code style={{fontFamily:'var(--ff-mono)', fontSize:12}}>~/work/skills/outreach-cadence.md</code> on disk. The file will reflect rev 5 immediately.
              </div>
              <div className="km-rule" style={{margin:'10px 0 4px'}} />
              <button className="km-btn" style={{justifyContent:'center', padding:'10px 12px'}}>
                Edit then accept
              </button>
              <button className="km-btn" style={{justifyContent:'center', padding:'10px 12px', borderColor:'var(--line-strong)'}}>
                Reject
              </button>
            </div>

            <div style={{marginTop: 18}}>
              <Label style={{marginBottom: 6}}>Decision note <span style={{color:'var(--fg-faint)', textTransform:'none', letterSpacing:0, fontFamily:'var(--ff-sans)', fontSize:11, fontWeight:400}}> · optional</span></Label>
              <textarea className="km-input" rows={4} style={{resize:'none'}} placeholder="If rejecting, briefly note why — used as context next time Claude proposes a related change." />
            </div>

            <div style={{marginTop: 22}}>
              <Label style={{marginBottom: 8}}>Metadata</Label>
              <div style={{display:'flex', flexDirection:'column', gap:6}}>
                <div style={{display:'flex', gap:8}}><Mono dim>scope</Mono><Mono>project · picnic-engage</Mono></div>
                <div style={{display:'flex', gap:8}}><Mono dim>kind</Mono><Mono>cadence rule</Mono></div>
                <div style={{display:'flex', gap:8}}><Mono dim>hunks</Mono><Mono>2 · +18 −6</Mono></div>
                <div style={{display:'flex', gap:8}}><Mono dim>backed up</Mono><Mono>rev 4 retained</Mono></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  </div>
);

// ─── 7. Global search ───────────────────────────────────────────────────────
const GlobalSearch = () => (
  <div className="km" style={{display:'flex', flexDirection:'column', position:'relative'}}>
    <ChromeBar />
    {/* dimmed background hint */}
    <div style={{flex:1, display:'flex', overflow:'hidden', filter:'opacity(.35) blur(.5px)'}}>
      <NavRail active="search" />
      <main style={{flex:1, padding:'22px 32px'}}>
        <div className="km-display-lg">Dashboard</div>
        <div style={{marginTop:18}} className="km-rule" />
      </main>
    </div>

    {/* Modal */}
    <div style={{
      position:'absolute', inset: 0, display:'flex', alignItems:'flex-start', justifyContent:'center',
      paddingTop: 64, background: 'rgba(42,46,51,.18)',
    }}>
      <div className="km-card" style={{
        width: 880, maxWidth:'92%',
        background: 'var(--surface-0)',
        border:'1px solid var(--line-strong)',
        borderRadius:6, overflow:'hidden',
        display:'flex', flexDirection:'column',
        maxHeight: 720
      }}>
        {/* Input */}
        <div style={{padding:'16px 18px', display:'flex', alignItems:'center', gap:12, borderBottom:'1px solid var(--line)'}}>
          <Icons.search size={16} />
          <input
            className="km-input-mono"
            defaultValue='kind:doc tag:#outreach "paused"'
            style={{flex:1, fontSize:14, border:0, background:'transparent', outline:'none', color:'var(--fg)'}}
          />
          <Mono>FTS5</Mono>
          <span className="km-kbd">esc</span>
        </div>
        <div style={{padding:'6px 18px', display:'flex', alignItems:'center', gap:10, borderBottom:'1px solid var(--line)', background:'var(--surface-1)'}}>
          <Mono dim>syntax</Mono>
          <Mono>kind:doc</Mono><Mono>tag:#outreach</Mono><Mono>project:picnic-engage</Mono><Mono>state:active</Mono><Mono>"phrase"</Mono>
          <span style={{flex:1}} />
          <Mono>34 matches · 18ms</Mono>
        </div>

        {/* Results */}
        <div className="km-scroll" style={{overflow:'auto', padding:'6px 0'}}>
          {[
            { group:'Items', count: 8, rows: [
              { kind:'action', slug:'picnic-engage', title:'Send revised copy to A. Klein before Friday standup', snippet:'…align on the paused-contact branch before the cadence ships…', updated:'2h ago' },
              { kind:'idea',   slug:'picnic-engage', title:'Paused branch should expire after 6 weeks, not 8',     snippet:'…three failed re-checks (~6 weeks), demote to opted-out…', updated:'yesterday' },
            ]},
            { group:'Docs', count: 3, rows: [
              { kind:'doc',    slug:'picnic-engage', title:'Q3 outreach plan',                                     snippet:'…we expect 30% of contacts to enter the paused state at least once in a cycle…', updated:'rev 7' },
              { kind:'doc',    slug:'picnic-engage', title:'Cadence rules · field manual',                          snippet:'…opted-out is terminal; paused is a re-check loop…', updated:'rev 2' },
            ]},
            { group:'Skills', count: 2, rows: [
              { kind:'doc',    slug:'picnic-engage', title:'outreach-cadence',                                      snippet:'…When a contact is paused (e.g. OOO auto-reply, or manual hold)…', updated:'rev 5 pending' },
            ]},
            { group:'Chats', count: 5, rows: [
              { kind:'chat',   slug:'picnic-engage', title:'working through the segmentation logic',                snippet:'…the OOO auto-replies were getting treated as opted-out which dropped them from re-engagement…', updated:'2h ago' },
            ]},
          ].map(group => (
            <div key={group.group}>
              <div style={{padding:'10px 18px 6px', display:'flex', alignItems:'center', gap:8}}>
                <Label>{group.group}</Label>
                <Mono>{group.count} matches</Mono>
                <span style={{flex:1}} />
                {group.count > group.rows.length && <span className="km-link" style={{fontSize:12, borderBottomStyle:'dashed', color:'var(--ember-deep)'}}>see all</span>}
              </div>
              {group.rows.map((r, i) => (
                <div key={i} className="km-row" style={{padding:'8px 18px', display:'grid', gridTemplateColumns:'18px 110px 1fr 80px', alignItems:'baseline', gap:12}}>
                  <KindIcon kind={r.kind} />
                  <ProjectTag slug={r.slug} />
                  <div>
                    <div className="km-body" style={{fontWeight:500}}>{r.title}</div>
                    <div className="km-body-sm" style={{marginTop:2, lineHeight:1.4}}>
                      {r.snippet.split('paused').map((part, idx, arr) => (
                        <React.Fragment key={idx}>
                          {part}
                          {idx < arr.length - 1 && <span className="km-hl">paused</span>}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                  <Mono>{r.updated}</Mono>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div style={{borderTop:'1px solid var(--line)', padding:'8px 18px', display:'flex', alignItems:'center', gap:12, background:'var(--surface-1)'}}>
          <span className="km-kbd">↑</span><span className="km-kbd">↓</span> <Mono dim>navigate</Mono>
          <span className="km-kbd">↵</span> <Mono dim>open</Mono>
          <span className="km-kbd">⌘↵</span> <Mono dim>open in new pane</Mono>
          <span style={{flex:1}} />
          <Mono>saved searches · 4</Mono>
        </div>
      </div>
    </div>
  </div>
);

// ─── 8. Settings ────────────────────────────────────────────────────────────
const SettingsRow = ({ label, hint, control }) => (
  <div style={{display:'grid', gridTemplateColumns:'220px 1fr', padding:'14px 0', borderTop:'1px solid var(--line)', alignItems:'flex-start', gap:24}}>
    <div>
      <div className="km-body" style={{fontWeight:500}}>{label}</div>
      {hint && <div className="km-body-sm" style={{marginTop:2, lineHeight:1.45}}>{hint}</div>}
    </div>
    <div>{control}</div>
  </div>
);

const Toggle = ({ on }) => (
  <span style={{
    display:'inline-block', width:32, height:18, borderRadius:9,
    background: on ? 'var(--moss)' : 'var(--surface-2)',
    position:'relative', cursor:'pointer'
  }}>
    <span style={{
      position:'absolute', top:2, left: on ? 16 : 2,
      width:14, height:14, borderRadius:'50%', background:'var(--surface-0)',
      transition:'left .15s ease'
    }} />
  </span>
);

const SegBtn = ({ label, active }) => (
  <button style={{
    padding:'4px 11px', fontFamily:'var(--ff-sans)', fontSize:12,
    border:'1px solid var(--line-strong)',
    background: active ? 'rgba(217,98,44,.12)' : 'transparent',
    color: active ? 'var(--ember-deep)' : 'var(--fg)',
    cursor:'pointer',
    marginLeft: -1,
    lineHeight: 1.4
  }}>{label}</button>
);

const SettingsScreen = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="settings" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        <div style={{display:'flex'}}>
          {/* Settings nav */}
          <aside style={{width:200, flex:'0 0 200px', borderRight:'1px solid var(--line)', padding:'22px 0', minHeight: '100%'}}>
            <div style={{padding:'0 18px 8px'}}><Label>Settings</Label></div>
            {['Profile','Appearance','Capture','Chat tracking','Reference types','Backups','MCP connection','About'].map((s, i) => (
              <button key={s} className="km-row" style={{
                display:'block', width:'100%', textAlign:'left', border:0,
                padding:'7px 18px', background: i === 1 ? 'rgba(217,98,44,.08)' : 'transparent',
                boxShadow: i === 1 ? 'inset 2px 0 0 var(--ember)' : 'none',
                color: i === 1 ? 'var(--ember-deep)' : 'var(--fg)',
                fontSize: 13, fontFamily:'var(--ff-sans)', cursor:'pointer'
              }}>{s}</button>
            ))}
          </aside>

          <div style={{flex:1, padding:'22px 36px 32px', maxWidth: 880}}>
            <div className="km-display-lg" style={{marginBottom:4}}>Appearance</div>
            <div className="km-body" style={{color:'var(--fg-muted)', marginBottom: 20}}>
              Mode and a few small typographic preferences. Density is not a setting — there is one density.
            </div>

            <div style={{borderBottom:'1px solid var(--line)'}}>
              <SettingsRow
                label="Mode"
                hint="Light is default. Dark is a peer."
                control={
                  <div style={{display:'inline-flex'}}>
                    <SegBtn label="Light" />
                    <SegBtn label="Dark" active />
                    <SegBtn label="System" />
                  </div>
                }
              />
              <SettingsRow
                label="Accent emphasis"
                hint="Kennel leans on moss for structure and ember for action. Dialing this up biases ember toward more surfaces; down biases moss."
                control={
                  <div style={{display:'flex', alignItems:'center', gap:10, maxWidth: 360}}>
                    <Mono dim>quiet</Mono>
                    <div style={{flex:1, height:4, background:'var(--surface-2)', borderRadius:2, position:'relative'}}>
                      <div style={{position:'absolute', top:0, left:0, width:'40%', height:'100%', background:'var(--ember)', borderRadius:2}} />
                      <div style={{position:'absolute', top:-4, left:'40%', width:12, height:12, borderRadius:'50%', background:'var(--ember)', transform:'translateX(-50%)'}} />
                    </div>
                    <Mono dim>warm</Mono>
                  </div>
                }
              />
              <SettingsRow
                label="Monospace family"
                hint="Used for slugs, timestamps, revisions, runbook commands."
                control={
                  <div style={{display:'inline-flex'}}>
                    <SegBtn label="JetBrains Mono" active />
                    <SegBtn label="IBM Plex Mono" />
                    <SegBtn label="Berkeley Mono" />
                  </div>
                }
              />
              <SettingsRow
                label="Relative timestamps"
                hint="Within 24h, show '2h ago'. Beyond, show absolute. Recommend leaving on."
                control={<Toggle on />}
              />
              <SettingsRow
                label="Focus mode shortcut"
                hint="Hides everything except Next Up and a single project."
                control={
                  <div style={{display:'flex', alignItems:'center', gap:6}}>
                    <span className="km-kbd">⌘</span><span className="km-kbd">⇧</span><span className="km-kbd">F</span>
                    <Mono dim>change</Mono>
                  </div>
                }
              />
              <SettingsRow
                label="Reduce motion"
                hint="Disables the 200–300ms ease on state changes."
                control={<Toggle on={false} />}
              />
            </div>

            {/* Quick peek at another section */}
            <div className="km-display-lg" style={{marginTop:28, marginBottom:4, fontSize:22}}>MCP connection</div>
            <div className="km-body" style={{color:'var(--fg-muted)', marginBottom: 14}}>
              How Claude clients reach this Kennel. Rotate the token any time a non-Craig surface gets a copy.
            </div>
            <div className="km-card" style={{padding:'12px 14px'}}>
              <div style={{display:'grid', gridTemplateColumns:'120px 1fr 80px', alignItems:'center', gap:12}}>
                <Mono dim>url</Mono><Mono>https://kennel.dixon.run/mcp</Mono><span className="km-link" style={{textAlign:'right', fontSize:12}}>copy</span>
                <Mono dim>token</Mono><Mono>knl_sk_••••••••••••••••mZ4q</Mono><span className="km-link" style={{textAlign:'right', fontSize:12, color:'var(--ember-deep)'}}>rotate</span>
                <Mono dim>last reach</Mono><Mono>14:32 from claude-desktop / mac · ok</Mono><span />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);

Object.assign(window, { RunbookView, SkillProposal, GlobalSearch, SettingsScreen });
