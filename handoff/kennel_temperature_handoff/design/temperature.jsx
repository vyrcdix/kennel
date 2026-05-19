// Temperature · time-sensitive panel treatments
// Subtle peripheral signal for "this panel is fresh / active / aging"
// All treatments use the existing palette. No new colors. No badges.

// ─── The treatment, applied to any panel via prop ──────────────────────────
// Levels: 'fresh' | 'active' | 'aging' | 'dormant'
const TEMP_META = {
  fresh:   { topEdge: 'var(--ember-deep)',           label: 'FRESH',   tint: 'rgba(217,98,44,.04)',  edgeWidth: 2, opacity: 1   },
  active:  { topEdge: 'transparent',                  label: null,      tint: 'transparent',         edgeWidth: 0, opacity: 1   },
  aging:   { topEdge: 'var(--dust)',                  label: 'AGING',   tint: 'rgba(201,168,124,.06)',edgeWidth: 2, opacity: .96 },
  dormant: { topEdge: 'var(--slate-light)',           label: 'DORMANT', tint: 'rgba(201,168,124,.04)',edgeWidth: 2, opacity: .82 },
};

const ThermalPanel = ({ temp = 'active', children, style = {} }) => {
  const m = TEMP_META[temp];
  return (
    <div className="km-card" style={{
      padding: 0,
      borderTop: m.edgeWidth ? `${m.edgeWidth}px solid ${m.topEdge}` : '1px solid var(--line)',
      background: temp === 'active' ? 'var(--surface-1)' : `linear-gradient(${m.tint}, ${m.tint}), var(--surface-1)`,
      opacity: m.opacity,
      ...style
    }}>
      {children}
    </div>
  );
};

// Tiny header-right stamp that gives the temperature an explicit timestamp
const ThermalStamp = ({ temp, since }) => {
  const m = TEMP_META[temp];
  if (temp === 'active') return <Mono dim>touched {since}</Mono>;
  if (temp === 'fresh') return (
    <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
      <span style={{
        display:'inline-block', width:6, height:6, borderRadius:'50%',
        background:'var(--ember)', boxShadow:'0 0 0 3px rgba(217,98,44,.18)'
      }} />
      <Mono style={{color:'var(--ember-deep)'}}>{m.label} · {since}</Mono>
    </span>
  );
  if (temp === 'aging') return (
    <Mono style={{color:'var(--ember-deep)'}}>{m.label} · {since} cold</Mono>
  );
  return (
    <Mono dim style={{textTransform:'uppercase', letterSpacing:'.08em'}}>{m.label} · {since}</Mono>
  );
};

// ─── 1. Explainer artboard ─────────────────────────────────────────────────
const TemperatureSystem = () => (
  <div className="km" style={{padding:'30px 40px', height:'100%', overflow:'auto'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom: 4}}>
      <div className="km-display-lg">Temperature</div>
      <Mono>panel-level signal · time since last touch · subtle, peripheral</Mono>
    </div>
    <div className="km-body" style={{maxWidth: 920, color:'var(--fg-muted)', marginBottom: 22, lineHeight:1.55}}>
      A panel's <i>temperature</i> reflects how recently any of its content was touched. The signal is carried by a 1–2px top edge (palette-tinted), a tiny mono stamp in the header, and a barely-perceptible surface tint. The ember left-border stays reserved for row-level selection — temperature uses the <b>top</b> edge so the two never collide.
    </div>

    {/* Scale */}
    <Label style={{marginBottom: 10}}>Scale</Label>
    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap: 14, marginBottom: 28}}>
      {[
        { temp:'fresh',  win:'≤ 24h',         desc:'New activity. Ember-deep hairline top, ember stamp.',         since:'12m ago' },
        { temp:'active', win:'1d – 21d',      desc:'Default. No top edge. Plain timestamp.',                       since:'3d ago' },
        { temp:'aging',  win:'> aging threshold', desc:'Dust top edge. Cold stamp. Surface tinted dust at 6%.', since:'27d ago' },
        { temp:'dormant',win:'> 60d',          desc:'Slate-light edge. Opacity .82. Mono DORMANT stamp.',          since:'74d ago' },
      ].map(s => (
        <ThermalPanel key={s.temp} temp={s.temp}>
          <div style={{padding:'12px 14px', display:'flex', flexDirection:'column', gap: 8}}>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <Label>{s.temp.toUpperCase()}</Label>
              <span style={{flex:1}} />
              <Mono>{s.win}</Mono>
            </div>
            <ThermalStamp temp={s.temp} since={s.since} />
            <div className="km-body-sm" style={{lineHeight:1.5, color:'var(--fg-muted)'}}>{s.desc}</div>
          </div>
        </ThermalPanel>
      ))}
    </div>

    {/* Rules */}
    <Label style={{marginBottom: 8}}>Rules</Label>
    <ul className="km-body" style={{margin:0, paddingLeft: 18, lineHeight: 1.85, maxWidth: 920, marginBottom: 24}}>
      <li><b>Top edge only.</b> Left edge stays for row-level selection / proposal markers. Right and bottom edges stay quiet.</li>
      <li><b>One temperature per panel.</b> A panel's temperature = max(temperature of its content). Don't tint individual rows.</li>
      <li><b>Active is the floor, not a state.</b> Most panels most of the time are "active" — no chrome at all. The signal only kicks in when there's something to say.</li>
      <li><b>No animation.</b> Temperature changes on next render, not via transition. Quiet by default.</li>
      <li><b>Aging threshold is user-configurable</b> (Settings · default 21 days). Dormant is fixed at 60d.</li>
      <li><b>Never coloured fills.</b> The surface tints are 3–6% opacity — the panel still reads as bone / slate-dark, not as "an ember panel".</li>
    </ul>

    {/* Anti-patterns */}
    <Label style={{marginBottom: 8}}>Anti-patterns</Label>
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap: 14, maxWidth: 920, marginBottom: 30}}>
      <div style={{padding:'10px 12px', borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.05)'}}>
        <div className="km-display-sm" style={{color:'var(--ember-deep)', fontSize:10, marginBottom:4}}>✗ DON'T</div>
        <div className="km-body" style={{lineHeight:1.5}}>Color the whole card body. Reads as a state, not a signal — and breaks the bone-dominated canvas.</div>
      </div>
      <div style={{padding:'10px 12px', borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.05)'}}>
        <div className="km-display-sm" style={{color:'var(--ember-deep)', fontSize:10, marginBottom:4}}>✗ DON'T</div>
        <div className="km-body" style={{lineHeight:1.5}}>Animate the transition (fade-in, pulse). Violates "restrained motion" and reads as a notification.</div>
      </div>
      <div style={{padding:'10px 12px', borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.05)'}}>
        <div className="km-display-sm" style={{color:'var(--ember-deep)', fontSize:10, marginBottom:4}}>✗ DON'T</div>
        <div className="km-body" style={{lineHeight:1.5}}>Apply at row level inside a quiet panel. Multiplies attention; visual noise.</div>
      </div>
      <div style={{padding:'10px 12px', borderLeft:'2px solid var(--ember-deep)', background:'rgba(138,58,20,.05)'}}>
        <div className="km-display-sm" style={{color:'var(--ember-deep)', fontSize:10, marginBottom:4}}>✗ DON'T</div>
        <div className="km-body" style={{lineHeight:1.5}}>Use blaze. Blaze is reserved for pinned indicators (palette rule, inherited from Pacecraft).</div>
      </div>
    </div>

    <Label style={{marginBottom: 8}}>Where it applies</Label>
    <div className="km-body" style={{maxWidth:920, color:'var(--fg-muted)', lineHeight:1.6}}>
      In focus, Field notes, Conversations, Crystallizations, per-thread Aging strip, pinned-doc cards, sort-queue project headers. Not applied to chrome (header bar, nav rail), modals, or empty states. Doc and runbook editors do <i>not</i> carry temperature — the user is the source of activity there.
    </div>
  </div>
);

// ─── 2. Project landing with the system applied ───────────────────────────
const ProjectLandingThermal = () => (
  <div className="km" style={{display:'flex', flexDirection:'column'}}>
    <ChromeBar projectChip={<ProjectTag slug="kennel" />} />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        <div style={{padding:'22px 32px 14px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
            <ProjectTag slug="kennel" />
            <Mono dim>thread · 73 days in · last touched 12m ago</Mono>
          </div>
          <div className="km-display-lg" style={{marginBottom: 4}}>Kennel</div>
          <div className="km-body" style={{maxWidth: 760, color:'var(--fg-muted)'}}>Designing and building a personal information-organization tool.</div>
        </div>

        <div style={{padding:'18px 32px 32px', display:'flex', flexDirection:'column', gap: 16}}>
          {/* In focus — FRESH */}
          <ThermalPanel temp="fresh">
            <div style={{display:'flex', alignItems:'center', padding:'12px 16px'}}>
              <Label>In focus</Label>
              <span style={{flex:1}} />
              <ThermalStamp temp="fresh" since="12m ago" />
            </div>
            <div className="km-rule" />
            {[
              { kind:'question', title:'Is the temperature top-edge enough signal, or do we also need a stamp?', tag:'#design', touched:'12m ago', ember:true },
              { kind:'idea',     title:'Move chats panel higher — it\'s a primary input',                       tag:'#ia',     touched:'1h ago',  ember:true },
              { kind:'action',   title:'Decide on dark-mode third elevation tone',                                tag:'#design', touched:'3h ago' },
            ].map((r, i, arr) => (
              <div key={i} className={`km-row ${r.ember ? 'km-active-row' : ''}`} style={{
                display:'grid', gridTemplateColumns:'14px 1fr 110px',
                alignItems:'center', gap:12, padding:'9px 14px',
                borderBottom: i < arr.length-1 ? '1px solid var(--line)' : 0
              }}>
                {r.kind === 'question'
                  ? <span style={{color:'var(--ember-deep)', fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:600}}>?</span>
                  : <KindIcon kind={r.kind} />}
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <span className="km-body">{r.title}</span>
                  <Mono dim>{r.tag}</Mono>
                </div>
                <Mono>{r.touched}</Mono>
              </div>
            ))}
          </ThermalPanel>

          {/* Crystallizations — ACTIVE (default, no chrome) */}
          <ThermalPanel temp="active" style={{borderColor:'rgba(92,122,62,.35)'}}>
            <div style={{display:'flex', alignItems:'center', padding:'10px 16px'}}>
              <span style={{color:'var(--moss)', marginRight:8}}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 22 8v8L12 22 2 16V8z" /></svg>
              </span>
              <span className="km-display-sm" style={{color:'var(--moss)'}}>CRYSTALLIZATIONS · 4</span>
              <span style={{flex:1}} />
              <ThermalStamp temp="active" since="2d ago" />
            </div>
            <div className="km-rule" />
            <div style={{padding:'10px 14px', display:'flex', flexDirection:'column', gap:6}}>
              <div className="km-body" style={{fontWeight:500}}>Three dark-mode elevations, no pure black.</div>
              <div className="km-body" style={{fontWeight:500}}>Stale chats deserve opacity, not lower placement.</div>
              <div className="km-body" style={{fontWeight:500}}>Capture friction is the design constraint.</div>
              <div className="km-body" style={{fontWeight:500}}>Slug is the most consequential field at creation.</div>
            </div>
          </ThermalPanel>

          {/* Field notes + Runbook side-by-side, different temperatures */}
          <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', gap: 14}}>
            {/* Field notes — ACTIVE */}
            <ThermalPanel temp="active">
              <div style={{display:'flex', alignItems:'center', padding:'10px 14px'}}>
                <span style={{color:'var(--fg-muted)', marginRight:8}}><Icons.note size={13} /></span>
                <Label>Field notes</Label>
                <Mono dim style={{marginLeft:8}}>sense-making</Mono>
                <span style={{flex:1}} />
                <ThermalStamp temp="active" since="yesterday" />
              </div>
              <div className="km-rule" />
              <div style={{padding:'12px 14px 14px', display:'flex', flexDirection:'column', gap:8}}>
                {[
                  'Is information aging better surfaced by opacity, or by a dedicated Aging surface?',
                  'When the user crystallizes an item, do its sources auto-file?',
                  'Does a thread carry an explicit \"current focus\"?',
                ].map((q, i) => (
                  <div key={i} style={{display:'flex', alignItems:'baseline', gap:10}}>
                    <span style={{color:'var(--ember-deep)', fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:600, minWidth: 10}}>?</span>
                    <span className="km-body" style={{flex:1, lineHeight:1.5, fontSize:13}}>{q}</span>
                    <Mono dim>{['28d','11d','4d'][i]}</Mono>
                  </div>
                ))}
              </div>
            </ThermalPanel>

            {/* Runbook — AGING (last edit was a while ago) */}
            <ThermalPanel temp="aging">
              <div style={{display:'flex', alignItems:'center', padding:'10px 14px'}}>
                <span style={{color:'var(--fg-muted)', marginRight:8}}><Icons.runbook size={13} /></span>
                <Label>Runbook</Label>
                <Mono dim style={{marginLeft:8}}>operational</Mono>
                <span style={{flex:1}} />
                <ThermalStamp temp="aging" since="27d ago" />
              </div>
              <div className="km-rule" />
              <div style={{padding:'12px 14px 14px'}}>
                <div className="km-display-sm" style={{fontSize:10, marginBottom:6}}>RUN</div>
                <div style={{fontFamily:'var(--ff-mono)', fontSize:12, padding:'8px 10px', background:'rgba(201,168,124,.18)', borderLeft:'2px solid var(--ember-deep)', whiteSpace:'pre', lineHeight:1.6}}>$ uv run kennel serve --reload</div>
                <div className="km-display-sm" style={{fontSize:10, margin:'12px 0 6px'}}>LIVE</div>
                <div style={{display:'flex', alignItems:'center', gap:8}}>
                  <Icons.ext size={11} />
                  <span className="km-link" style={{borderBottomStyle:'dashed', fontSize:13}}>kennel.dixon.run</span>
                  <Mono dim>up</Mono>
                </div>
              </div>
            </ThermalPanel>
          </div>

          {/* Conversations — FRESH */}
          <ThermalPanel temp="fresh">
            <div style={{display:'flex', alignItems:'center', padding:'12px 16px'}}>
              <Label>Conversations</Label>
              <Mono dim style={{marginLeft:8}}>4 active · 2 stale</Mono>
              <span style={{flex:1}} />
              <ThermalStamp temp="fresh" since="12m ago" />
            </div>
            <div className="km-rule" />
            <div style={{padding:'4px 8px', display:'flex', flexDirection:'column', gap:2}}>
              <ChatRow tagline="working through the segmentation logic — three tiers and a churn-risk overlay" since="12m ago" />
              <ChatRow tagline="figuring out whether the proposal queue should batch by skill or interleave" since="4d ago" />
              <ChatRow tagline="experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet" since="74d ago" stale />
            </div>
          </ThermalPanel>

          {/* Pinned docs — ACTIVE */}
          <ThermalPanel temp="active">
            <div style={{display:'flex', alignItems:'center', padding:'10px 14px'}}>
              <Label>Pinned docs</Label>
              <Mono dim style={{marginLeft:8}}>3 of 14</Mono>
              <span style={{flex:1}} />
              <ThermalStamp temp="active" since="6h ago" />
            </div>
            <div className="km-rule" />
            <div style={{padding:'10px 14px', display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap: 10}}>
              {[
                { title:'Design brief v0.3', preview:'Eight core screens, Pacecraft palette inheritance, capture-friction-first principles.', rev:6, temp:'active' },
                { title:'Data model',         preview:'Entities, fields, relationships — items, docs, refs, runbooks, skills, chats.',       rev:9, temp:'active' },
                { title:'Original onboarding sketch', preview:'First-run flow ideas; superseded but kept for reference.',                      rev:2, temp:'dormant' },
              ].map((d, i) => {
                const m = TEMP_META[d.temp];
                return (
                  <div key={i} style={{
                    padding:'8px 10px',
                    border:'1px solid var(--line)',
                    borderTop: m.edgeWidth ? `${m.edgeWidth}px solid ${m.topEdge}` : '1px solid var(--line)',
                    borderRadius:3, background:'var(--surface-1)',
                    opacity: m.opacity,
                    display:'flex', flexDirection:'column', gap:4
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:6}}>
                      <Icons.doc size={11} />
                      <span className="km-body" style={{fontWeight:500, fontSize:13, flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{d.title}</span>
                      <Mono dim>rev {d.rev}</Mono>
                    </div>
                    <div className="km-body-sm" style={{lineHeight:1.45, fontSize:11.5}}>{d.preview}</div>
                    {d.temp === 'dormant' && <Mono dim style={{fontSize:10, letterSpacing:'.06em'}}>DORMANT · 84d</Mono>}
                  </div>
                );
              })}
            </div>
          </ThermalPanel>
        </div>
      </main>
    </div>
  </div>
);

// ─── 3. Treatment comparison — pick one ────────────────────────────────────
const Variant = ({ title, desc, children }) => (
  <div style={{display:'flex', flexDirection:'column', gap:8, padding:'14px 14px', border:'1px solid var(--line)', background:'var(--surface-0)', borderRadius:3}}>
    <div style={{display:'flex', alignItems:'baseline', gap:8}}>
      <Label>{title}</Label>
    </div>
    <div className="km-body-sm" style={{lineHeight:1.5, color:'var(--fg-muted)', minHeight: 36}}>{desc}</div>
    {children}
  </div>
);

const SamplePanel = ({ children, ...style }) => (
  <div style={{
    padding:'10px 12px', borderRadius:3,
    background:'var(--surface-1)',
    border:'1px solid var(--line)',
    ...style
  }}>
    {children}
  </div>
);

const TemperatureComparison = () => (
  <div className="km" style={{padding:'30px 36px', height:'100%', overflow:'auto'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:14, marginBottom: 4}}>
      <div className="km-display-lg">Temperature · treatment options</div>
      <Mono>pick one or combine</Mono>
    </div>
    <div className="km-body" style={{maxWidth: 920, color:'var(--fg-muted)', marginBottom: 22, lineHeight:1.55}}>
      Four ways to carry the signal, each shown for FRESH (left) and AGING (right) against an unmarked baseline (middle). The recommended composite combines A + D — top edge for peripheral signal, header stamp for explicit timestamp.
    </div>

    <div style={{display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:16, maxWidth: 1100}}>
      {/* A · Top edge accent */}
      <Variant title="A · Top edge accent (recommended)" desc="2px solid colored top edge. Bottom/left/right stay default. Peripheral-vision strong, explicit cost zero.">
        <SamplePanel borderTop="2px solid var(--ember-deep)">
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>In focus</Label>
            <span style={{flex:1}} />
            <Mono dim>3 items</Mono>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Conversations</Label>
            <span style={{flex:1}} />
            <Mono dim>4 active</Mono>
          </div>
        </SamplePanel>
        <SamplePanel borderTop="2px solid var(--dust)">
          <div style={{display:'flex', alignItems:'center', gap:8, opacity:.96}}>
            <Label>Runbook</Label>
            <span style={{flex:1}} />
            <Mono dim>operational</Mono>
          </div>
        </SamplePanel>
      </Variant>

      {/* B · Surface tint only */}
      <Variant title="B · Surface tint only" desc="3–6% palette tint across the whole panel. Quietest option; harder to notice across long lists.">
        <SamplePanel background="rgba(217,98,44,.05)">
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>In focus</Label>
            <span style={{flex:1}} />
            <Mono dim>3 items</Mono>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Conversations</Label>
            <span style={{flex:1}} />
            <Mono dim>4 active</Mono>
          </div>
        </SamplePanel>
        <SamplePanel background="rgba(201,168,124,.08)">
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Runbook</Label>
            <span style={{flex:1}} />
            <Mono dim>operational</Mono>
          </div>
        </SamplePanel>
      </Variant>

      {/* C · Header timestamp tint */}
      <Variant title="C · Header timestamp tint" desc="Just recolor the existing 'touched X ago' stamp. No chrome at all. Subtlest; relies on the user reading the stamp.">
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>In focus</Label>
            <span style={{flex:1}} />
            <Mono style={{color:'var(--ember-deep)'}}>touched 12m ago</Mono>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Conversations</Label>
            <span style={{flex:1}} />
            <Mono dim>touched 6h ago</Mono>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Runbook</Label>
            <span style={{flex:1}} />
            <Mono style={{color:'var(--dust)', textTransform:'uppercase', letterSpacing:'.06em'}}>27d cold</Mono>
          </div>
        </SamplePanel>
      </Variant>

      {/* D · Header stamp */}
      <Variant title="D · Header stamp (explicit)" desc="Mono uppercase label in the header: FRESH · 12m / AGING · 27d cold. Most readable; most chrome.">
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>In focus</Label>
            <span style={{flex:1}} />
            <span style={{display:'inline-flex', alignItems:'center', gap:6}}>
              <span style={{display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--ember)', boxShadow:'0 0 0 3px rgba(217,98,44,.18)'}} />
              <Mono style={{color:'var(--ember-deep)'}}>FRESH · 12m</Mono>
            </span>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Conversations</Label>
            <span style={{flex:1}} />
            <Mono dim>touched 6h ago</Mono>
          </div>
        </SamplePanel>
        <SamplePanel>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <Label>Runbook</Label>
            <span style={{flex:1}} />
            <Mono style={{color:'var(--ember-deep)'}}>AGING · 27d cold</Mono>
          </div>
        </SamplePanel>
      </Variant>
    </div>

    <div style={{marginTop: 22, padding:'14px 16px', background:'rgba(92,122,62,.08)', border:'1px solid rgba(92,122,62,.25)', borderRadius:3, maxWidth:1100}}>
      <div className="km-display-sm" style={{color:'var(--moss)', marginBottom:6}}>RECOMMENDED · A + D</div>
      <div className="km-body" style={{lineHeight:1.55}}>
        Top edge for peripheral awareness across the dashboard view; explicit mono stamp inside the header for the reader who wants the number. <Mono dim>· dormant adds .82 opacity</Mono>. This is what the Explainer and Project landing demo above are using.
      </div>
    </div>
  </div>
);

Object.assign(window, { TemperatureSystem, ProjectLandingThermal, TemperatureComparison });
