// §6.9 Create Project modal — and post-creation next-steps strip

// Color swatch (none + 5 palette)
const ColorSwatch = ({ name, hex, selected }) => {
  const isNone = name === 'none';
  return (
    <div style={{display:'flex', flexDirection:'column', alignItems:'center', gap:5, cursor:'pointer'}}>
      <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: isNone ? 'transparent' : hex,
        border: selected ? '2px solid var(--ember)' : (isNone ? '1px dashed var(--line-strong)' : '1px solid var(--line)'),
        boxShadow: selected ? '0 0 0 3px rgba(217,98,44,.18)' : 'none',
        position:'relative',
        display:'flex', alignItems:'center', justifyContent:'center'
      }}>
        {isNone && <span className="km-mono-sm" style={{color:'var(--fg-faint)', fontSize:9, letterSpacing:'.06em'}}>NONE</span>}
        {selected && !isNone && (
          <span style={{
            position:'absolute', bottom:-2, right:-2,
            width: 14, height: 14, borderRadius:'50%',
            background:'var(--ember)', color:'#F2EDE0',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 6 2 2 4-4" /></svg>
          </span>
        )}
      </div>
      <span className="km-mono-sm" style={{fontSize:10, color: selected ? 'var(--ember-deep)' : 'var(--fg-faint)'}}>{name}</span>
    </div>
  );
};

// Tiny toggle (matches Settings)
const MiniToggle = ({ on }) => (
  <span style={{
    display:'inline-block', width: 32, height: 18, borderRadius: 9,
    background: on ? 'var(--moss)' : 'var(--surface-2)',
    position:'relative', cursor:'pointer', flex:'0 0 auto'
  }}>
    <span style={{
      position:'absolute', top:2, left: on ? 16 : 2,
      width:14, height:14, borderRadius:'50%', background:'var(--surface-0)',
      transition:'left .15s ease'
    }} />
  </span>
);

// Field label
const FieldLabel = ({ children, required, hint }) => (
  <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:5}}>
    <span className="km-display-sm" style={{fontSize:11, letterSpacing:'.18em'}}>{children}</span>
    {required && <span className="km-mono-sm" style={{color:'var(--ember-deep)', fontSize:10}}>required</span>}
    {hint && <span style={{flex:1}} />}
    {hint && <span className="km-body-sm" style={{fontSize:11, color:'var(--fg-faint)'}}>{hint}</span>}
  </div>
);

// The modal body — props drive variant: { name, slug, slugError, description, contextOpen, contextChars, color, pinned, focusField, mobile, dark }
const CreateProjectModal = ({
  name = '',
  slug = '',
  slugLabel,
  slugError,
  description = '',
  contextOpen = false,
  contextValue = '',
  contextChars = 0,
  color = 'none',
  pinned = false,
  focusField = 'name',
  mobile = false,
}) => {
  // Caret indicator (visible only when no value typed yet)
  const Caret = () => (
    <span style={{
      display:'inline-block', width:1, height:18,
      background:'var(--ember)', verticalAlign:'middle',
      animation:'kmCaret 1.05s steps(2) infinite'
    }} />
  );

  return (
    <div style={{
      width: mobile ? '100%' : 480,
      maxWidth: '100%',
      background: 'var(--surface-0)',
      border: mobile ? 'none' : '1px solid var(--line-strong)',
      borderRadius: mobile ? 0 : 6,
      display:'flex', flexDirection:'column',
      overflow:'hidden',
      maxHeight: mobile ? '100%' : 'none'
    }}>
      {/* Caret keyframes scoped to this canvas */}
      <style>{`@keyframes kmCaret { to { opacity: 0; } }`}</style>

      {/* Header */}
      <div style={{
        padding: mobile ? '14px 18px' : '14px 20px',
        display:'flex', alignItems:'center', justifyContent:'space-between',
        borderBottom:'1px solid var(--line)',
        flex:'0 0 auto'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <span className="km-display-sm" style={{fontSize: mobile ? 13 : 12}}>NEW PROJECT</span>
          {!mobile && <Mono dim>⌘⇧N</Mono>}
        </div>
        <button className="km-btn km-btn-ghost" style={{padding:'4px 6px', color:'var(--fg-muted)'}}>
          <Icons.x size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{
        padding: mobile ? '18px 18px 24px' : '20px 22px 22px',
        display:'flex', flexDirection:'column', gap: mobile ? 18 : 16,
        flex:1, overflow: mobile ? 'auto' : 'visible'
      }}>
        {/* Name + slug grouped */}
        <div>
          <FieldLabel required>Name</FieldLabel>
          <div style={{
            padding:'9px 12px',
            background:'var(--surface-1)',
            border: focusField === 'name' ? '1px solid var(--ember)' : '1px solid var(--line)',
            boxShadow: focusField === 'name' ? '0 0 0 3px rgba(217,98,44,.18)' : 'none',
            borderRadius:4,
            display:'flex', alignItems:'center', gap:2,
            fontFamily:'var(--ff-sans)', fontWeight:500, fontSize:16, lineHeight:1.3, color:'var(--fg)'
          }}>
            {name ? <span>{name}</span> : <span style={{color:'var(--fg-faint)', fontWeight:400}}>Picnic — Engagement</span>}
            {focusField === 'name' && <Caret />}
          </div>

          {/* Slug derivation/input */}
          <div style={{display:'flex', alignItems:'baseline', gap:10, marginTop:8, paddingLeft: 2}}>
            <span className="km-mono-sm" style={{color:'var(--fg-faint)', minWidth: 32}}>slug:</span>
            <div style={{flex:1, display:'flex', alignItems:'baseline', gap:6}}>
              {slug ? (
                <span style={{
                  fontFamily:'var(--ff-mono)', fontSize:14, color: slugError ? 'var(--ember-deep)' : 'var(--fg)',
                  borderBottom: '1px dashed var(--line-strong)',
                  paddingBottom: 2
                }}>{slug}</span>
              ) : (
                <span className="km-mono" style={{color:'var(--fg-faint)', fontStyle:'italic'}}>derived from name</span>
              )}
              {slug && !slugError && <Mono dim>· auto · click to edit</Mono>}
            </div>
          </div>

          {slugError && (
            <div style={{
              marginTop: 8, padding:'7px 10px',
              background:'rgba(138,58,20,.08)',
              borderLeft:'2px solid var(--ember-deep)',
              borderRadius:'0 3px 3px 0',
              display:'flex', alignItems:'center', gap:8
            }}>
              <span style={{color:'var(--ember-deep)', fontFamily:'var(--ff-mono)', fontSize:11}}>!</span>
              <span style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ember-deep)'}}>{slugError}</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <FieldLabel hint="≤ 140 chars · single line">Description</FieldLabel>
          <div style={{
            padding:'9px 12px',
            background:'var(--surface-1)',
            border:'1px solid var(--line)',
            borderRadius:4,
            fontFamily:'var(--ff-sans)', fontSize:14, color: description ? 'var(--fg)' : 'var(--fg-faint)'
          }}>
            {description || 'Short label · shown next to the project name'}
          </div>
        </div>

        {/* Context — collapsed or expanded */}
        {!contextOpen ? (
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            padding:'8px 0',
            color:'var(--ember-deep)',
            cursor:'pointer',
            borderTop:'1px solid var(--line)',
            paddingTop:14
          }}>
            <Icons.arrowR size={12} />
            <span className="km-body" style={{fontWeight:500, fontSize:13, color:'var(--ember-deep)'}}>Add context for Claude</span>
            <Mono dim>· markdown · shipped to Claude on read</Mono>
          </div>
        ) : (
          <div style={{borderTop:'1px solid var(--line)', paddingTop:14}}>
            <FieldLabel hint={
              <span style={{fontFamily:'var(--ff-mono)', fontSize:11, color: contextChars > 2000 ? 'var(--ember-deep)' : (contextChars > 1800 ? 'var(--dust)' : 'var(--fg-faint)')}}>
                {contextChars.toLocaleString()} / 2,000 soft
              </span>
            }>Context for Claude</FieldLabel>
            <div style={{
              padding:'10px 12px',
              background:'var(--surface-1)',
              border:'1px solid var(--line)',
              borderRadius:4,
              fontFamily:'var(--ff-mono)', fontSize:12.5, lineHeight:1.6,
              color:'var(--fg)',
              minHeight: 132,
              whiteSpace:'pre-wrap'
            }}>
              {contextValue}
            </div>
            <div style={{marginTop:6, display:'flex', alignItems:'center', gap:8}}>
              <Mono dim>shipped to Claude when this project is opened in chat</Mono>
              <span style={{flex:1}} />
              {contextChars > 1800 && contextChars <= 2000 && (
                <Mono style={{color:'var(--dust)'}}>approaching soft cap</Mono>
              )}
              {contextChars > 2000 && (
                <Mono style={{color:'var(--ember-deep)'}}>soft cap exceeded · hard cap 8,000</Mono>
              )}
            </div>
          </div>
        )}

        {/* Color */}
        <div>
          <FieldLabel hint="tints the project card border">Color</FieldLabel>
          <div style={{display:'flex', gap: mobile ? 10 : 12, marginTop:2}}>
            <ColorSwatch name="none"  hex="transparent" selected={color === 'none'} />
            <ColorSwatch name="moss"  hex="#5C7A3E"     selected={color === 'moss'} />
            <ColorSwatch name="ember" hex="#D9622C"     selected={color === 'ember'} />
            <ColorSwatch name="dust"  hex="#C9A87C"     selected={color === 'dust'} />
            <ColorSwatch name="blaze" hex="#E8B547"     selected={color === 'blaze'} />
            <ColorSwatch name="slate" hex="#3A3F45"     selected={color === 'slate'} />
          </div>
        </div>

        {/* Pinned */}
        <div style={{display:'flex', alignItems:'center', gap:14, paddingTop:2}}>
          <MiniToggle on={pinned} />
          <div style={{flex:1}}>
            <div className="km-body" style={{fontSize:13, fontWeight:500}}>Pin to dashboard</div>
            <div className="km-body-sm" style={{fontSize:11.5, lineHeight:1.4, color:'var(--fg-muted)'}}>
              Show on the pinned rail at the top of the dashboard. You can change this anytime.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: mobile ? '14px 18px 18px' : '14px 20px',
        borderTop:'1px solid var(--line)',
        background: mobile ? 'var(--surface-0)' : 'var(--surface-1)',
        display:'flex', alignItems:'center', gap:10,
        flex:'0 0 auto'
      }}>
        {!mobile && (
          <Mono dim>enter to submit · esc to close</Mono>
        )}
        <span style={{flex:1}} />
        {mobile && (
          <button className="km-btn km-btn-ghost" style={{padding:'10px 14px', fontSize:14}}>Cancel</button>
        )}
        {!mobile && (
          <button className="km-btn km-btn-ghost" style={{color:'var(--fg-muted)', padding:'8px 12px'}}>Cancel</button>
        )}
        <button
          className="km-btn km-btn-primary"
          style={{
            padding: mobile ? '12px 18px' : '8px 14px',
            fontSize: mobile ? 14 : 13,
            opacity: name && (!slugError) ? 1 : 0.5,
            cursor: name && (!slugError) ? 'pointer' : 'not-allowed',
            flex: mobile ? 1 : '0 0 auto',
            justifyContent:'center'
          }}
        >
          Create project
          {!mobile && <span className="km-kbd" style={{marginLeft:4, background:'rgba(0,0,0,.18)', color:'#fff', borderColor:'transparent'}}>↵</span>}
        </button>
      </div>
    </div>
  );
};

// ── Backdrop: a dimmed dashboard behind the modal, for context ─────────────
const Backdrop = ({ children }) => (
  <div className="km" style={{position:'relative', height:'100%', width:'100%', overflow:'hidden'}}>
    {/* Dim'd dashboard */}
    <div style={{position:'absolute', inset:0, filter:'opacity(.42)', pointerEvents:'none'}}>
      <Dashboard />
    </div>
    {/* Modal wash */}
    <div style={{position:'absolute', inset:0, background:'rgba(42,46,51,.28)'}} />
    {/* Modal */}
    <div style={{
      position:'absolute', inset:0,
      display:'flex', alignItems:'flex-start', justifyContent:'center',
      paddingTop: 64
    }}>
      {children}
    </div>
  </div>
);

// ── Variants ──────────────────────────────────────────────────────────────
const CPDefault = () => (
  <Backdrop>
    <CreateProjectModal />
  </Backdrop>
);

const CPMidTyping = () => (
  <Backdrop>
    <CreateProjectModal
      name="Kennel"
      slug="kennel"
      focusField="name"
    />
  </Backdrop>
);

const CPContextExpanded = () => (
  <Backdrop>
    <CreateProjectModal
      name="Kennel"
      slug="kennel"
      description="Personal command center for ideas, notes, and Claude chats"
      color="moss"
      contextOpen
      contextChars={1200}
      contextValue={`Personal command center. Captures ideas, notes, actions, docs and
Claude conversations across all my projects; surfaces what needs
attention without nagging.

The product is built around a small set of principles:

  - capture friction is the enemy — every capture path under 5s
  - corral over manage — not a project tool; no sprints, no kanban
  - Claude is integral — chats and skill proposals live in the same
    review surfaces as inbox items, not behind a panel
  - recall beats organization — FTS5 search and activity history
    matter more than perfect folders
  - quiet by default — no badges, no notifications, no streak counts

Architecturally: SQLite + sqlite-vec + FTS5 for storage and search;
markdown on disk for docs and runbooks; MCP for Claude clients.
Single-user. Self-hosted on a VPS in Penticton.`}
      focusField="context"
    />
  </Backdrop>
);

const CPSlugConflict = () => (
  <Backdrop>
    <CreateProjectModal
      name="Picnic Engage"
      slug="picnic-engage"
      slugError="Slug already used by Picnic — Engagement"
      description=""
      focusField="slug"
    />
  </Backdrop>
);

const CPDarkDefault = () => (
  <div className="km km-dark" style={{position:'relative', height:'100%', width:'100%', overflow:'hidden'}}>
    <div style={{position:'absolute', inset:0, filter:'opacity(.50)', pointerEvents:'none'}}>
      <Dashboard />
    </div>
    <div style={{position:'absolute', inset:0, background:'rgba(20,22,26,.55)'}} />
    <div style={{position:'absolute', inset:0, display:'flex', alignItems:'flex-start', justifyContent:'center', paddingTop:64}}>
      <CreateProjectModal />
    </div>
  </div>
);

// Mobile sheet — full-screen with sticky header/footer
const CPMobileSheet = () => (
  <div className="km" style={{display:'flex', flexDirection:'column', height:'100%', width:'100%', background:'var(--surface-0)', overflow:'hidden'}}>
    {/* status bar */}
    <div style={{height:32, padding:'0 18px', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--fg-muted)', flex:'0 0 32px'}}>
      <span>14:32</span>
      <span>● ● ●</span>
    </div>
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <CreateProjectModal mobile />
    </div>
  </div>
);

// ── Next-steps strip + empty project landing (post-creation) ───────────────
const NextStepsStrip = ({ onProject }) => (
  <div style={{
    padding:'12px 20px',
    background:'rgba(201,168,124,.25)',
    borderBottom:'1px solid rgba(201,168,124,.45)',
    display:'flex', alignItems:'center', gap:14,
    flexWrap:'wrap'
  }}>
    <span className="km-display-sm" style={{color:'var(--ember-deep)', fontSize:11}}>NEXT STEPS</span>
    <div style={{display:'flex', alignItems:'center', gap:18, flex:1, flexWrap:'wrap'}}>
      <button className="km-btn km-btn-ghost" style={{padding:0, color:'var(--fg)', textDecoration:'underline', textDecorationColor:'var(--ember-dark)', textUnderlineOffset:3, fontSize:13}}>
        <Icons.plus size={12} /> Capture an item
      </button>
      <span className="km-mono-sm" style={{color:'var(--fg-faint)'}}>·</span>
      <button className="km-btn km-btn-ghost" style={{padding:0, color:'var(--fg)', textDecoration:'underline', textDecorationColor:'var(--ember-dark)', textUnderlineOffset:3, fontSize:13}}>
        <Icons.note size={12} /> Add a description
      </button>
      <span className="km-mono-sm" style={{color:'var(--fg-faint)'}}>·</span>
      <button className="km-btn km-btn-ghost" style={{padding:0, color:'var(--fg)', textDecoration:'underline', textDecorationColor:'var(--ember-dark)', textUnderlineOffset:3, fontSize:13}}>
        <Icons.runbook size={12} /> Set up a runbook when you're ready
      </button>
    </div>
    <Mono dim>dismissed per-project · persists</Mono>
    <button className="km-btn km-btn-ghost" style={{padding:'4px 6px', color:'var(--fg-muted)'}}>
      <Icons.x size={13} />
    </button>
  </div>
);

const EmptyKennelProjectLanding = ({ withStrip = true }) => (
  <div className="km" style={{display:'flex', flexDirection:'column', height:'100%'}}>
    <ChromeBar projectChip={<ProjectTag slug="kennel" />} />
    <div style={{flex:1, display:'flex', overflow:'hidden'}}>
      <NavRail active="" />
      <main className="km-scroll" style={{flex:1, overflow:'auto'}}>
        {withStrip && <NextStepsStrip />}

        {/* Project header */}
        <div style={{padding:'22px 32px 18px', borderBottom:'1px solid var(--line)'}}>
          <div style={{display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:24}}>
            <div style={{flex:1}}>
              <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6}}>
                <ProjectTag slug="kennel" />
                <Mono dim>created just now · 14:32</Mono>
              </div>
              <div className="km-display-lg" style={{marginBottom:6}}>Kennel</div>
              <div className="km-body" style={{maxWidth: 640, color:'var(--fg-faint)', fontStyle: withStrip ? 'italic' : 'normal'}}>
                {withStrip
                  ? 'No description yet. Add one to label this project in lists.'
                  : 'Personal command center for ideas, notes, and Claude chats.'}
              </div>
            </div>
            <div style={{display:'flex', alignItems:'center', gap:8}}>
              <button className="km-btn"><Icons.plus size={12} /> New item</button>
              <button className="km-btn"><Icons.runbook size={12} /> Run</button>
              <button className="km-btn km-btn-ghost"><Icons.cog size={13} /></button>
            </div>
          </div>
        </div>

        {/* Empty body */}
        <div style={{padding:'48px 32px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, flex:1, minHeight: 380}}>
          <div className="km-display-sm" style={{color:'var(--fg-faint)'}}>EMPTY PROJECT</div>
          <div className="km-display-md" style={{textAlign:'center', maxWidth:520}}>
            Nothing here yet.
          </div>
          <div className="km-body" style={{textAlign:'center', color:'var(--fg-muted)', maxWidth: 520, lineHeight:1.55}}>
            {withStrip
              ? 'Capture your first item from any device, or use the actions above.'
              : 'Capture an item or open the runbook to begin populating this project.'}
          </div>
          <div style={{display:'flex', gap:8, marginTop:4}}>
            <button className="km-btn km-btn-primary"><Icons.plus size={12} /> Capture an item</button>
            {!withStrip && <button className="km-btn">Open runbook</button>}
          </div>
        </div>
      </main>
    </div>
  </div>
);

Object.assign(window, {
  CreateProjectModal,
  CPDefault, CPMidTyping, CPContextExpanded, CPSlugConflict, CPDarkDefault,
  CPMobileSheet,
  NextStepsStrip, EmptyKennelProjectLanding
});
