// Component library artboard — showcases the patterns from §7 of the brief.

const CRow = ({ label, children, w = 480 }) => (
  <div style={{display:'grid', gridTemplateColumns:'180px 1fr', alignItems:'flex-start', gap:24, padding:'14px 0', borderTop:'1px solid var(--line)'}}>
    <div>
      <div className="km-display-sm">{label}</div>
    </div>
    <div style={{display:'flex', flexWrap:'wrap', alignItems:'center', gap:12, maxWidth: w}}>{children}</div>
  </div>
);

const ChatRow = ({ tagline, since, stale, claudeUrl = true }) => (
  <div className="km-row" style={{display:'flex', alignItems:'center', gap:10, padding:'7px 10px', borderRadius:3, opacity: stale ? 0.6 : 1}}>
    <span style={{color:'var(--fg-faint)'}}><Icons.chat size={13} /></span>
    <span style={{flex:1, fontFamily:'var(--ff-sans)', fontStyle:'italic', fontSize:13, lineHeight:1.4, color:'var(--fg)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{tagline}</span>
    <Mono>{since}</Mono>
    {claudeUrl && <span style={{color:'var(--fg-faint)'}}><Icons.ext size={12} /></span>}
  </div>
);

const ActivityEntry = ({ time, who, verb, target, payload }) => (
  <div style={{display:'flex', alignItems:'baseline', gap:10, padding:'5px 0', fontSize:13}}>
    <Mono style={{minWidth:50}}>{time}</Mono>
    <Actor who={who} />
    <span className="km-display-sm" style={{fontSize:10, minWidth:62}}>{verb}</span>
    <span className="km-link" style={{borderBottomStyle:'dashed'}}>{target}</span>
    <span className="km-body-sm" style={{flex:1}}>{payload}</span>
  </div>
);

const ComponentBoard = () => (
  <div className="km" style={{padding:'28px 36px', height:'100%', overflow:'hidden'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:16, marginBottom: 4}}>
      <div className="km-display-lg">Components</div>
      <Mono>§7 patterns · drop-in reusable atoms</Mono>
    </div>
    <div className="km-body-sm" style={{maxWidth: 720, marginBottom: 14}}>
      Every pattern called out in the brief, demonstrated here so Claude Code can reach for them as primitives.
    </div>

    <div style={{borderBottom:'1px solid var(--line)'}}>
      <CRow label="Project tag">
        <ProjectTag slug="picnic-engage" />
        <ProjectTag slug="kennel" />
        <ProjectTag slug="pacecraft" />
        <ProjectTag slug="klein-advisory" />
        <span className="km-body-sm">always the slug · never the full name</span>
      </CRow>

      <CRow label="Free-form tag">
        <span className="km-tag">#outreach</span>
        <span className="km-tag">#draft</span>
        <span className="km-tag">#read-later</span>
        <span className="km-tag" style={{cursor:'pointer'}}>+ tag</span>
      </CRow>

      <CRow label="Kind icons">
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="idea" /><span className="km-body-sm">idea</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="note" /><span className="km-body-sm">note</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="action" /><span className="km-body-sm">action</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="doc" /><span className="km-body-sm">doc</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="ref" /><span className="km-body-sm">reference</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><KindIcon kind="chat" /><span className="km-body-sm">chat</span></span>
      </CRow>

      <CRow label="State indicator">
        <span style={{display:'flex', alignItems:'center', gap:6}}><span className="km-body-sm">inbox</span><span className="km-body-sm" style={{color:'var(--fg-faint)'}}>(no indicator)</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><StateDot state="active" /><span className="km-body-sm">active</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><StateDot state="parked" /><span className="km-body-sm">parked</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><StateDot state="done" /><span className="km-body-sm">done</span></span>
        <span style={{display:'flex', alignItems:'center', gap:6}}><StateDot state="archived" /><span className="km-body-sm">archived</span></span>
      </CRow>

      <CRow label="Revision indicator">
        <Rev n={7} /> <Rev n={12} /> <Rev n={104} />
        <span className="km-body-sm">tooltip on hover reveals last-updated timestamp</span>
      </CRow>

      <CRow label="Buttons">
        <button className="km-btn km-btn-primary">Activate</button>
        <button className="km-btn">Park</button>
        <button className="km-btn km-btn-moss">Accept</button>
        <button className="km-btn">Dismiss</button>
        <button className="km-btn km-btn-ghost">Cancel</button>
      </CRow>

      <CRow label="Pinned (blaze)" w={620}>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-pin"><Icons.pin size={12} /></span><span className="km-body">Project pinned</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-pin"><Icons.star size={12} /></span><span className="km-body">Doc pinned</span></span>
        <span className="km-body-sm">tiny accents only · never a large surface</span>
      </CRow>

      <CRow label="Activity entry" w={680}>
        <div style={{width:'100%', display:'flex', flexDirection:'column', gap:1, fontFamily:'var(--ff-sans)'}}>
          <ActivityEntry time="14:32" who="C"  verb="EDITED"   target="draft Q3 outreach plan" payload="rev 7 → rev 8 · 4 lines changed" />
          <ActivityEntry time="13:58" who="Cl" verb="PROPOSED"  target="skill / outreach-cadence" payload="add fallback for paused contacts" />
          <ActivityEntry time="11:11" who="CLI" verb="CAPTURED" target="ref / Stripe pricing docs" payload="https://stripe.com/pricing" />
          <ActivityEntry time="08:04" who="sys" verb="BACKUP"   target="nightly snapshot" payload="2.4 MB · ok" />
        </div>
      </CRow>

      <CRow label="Chat row" w={620}>
        <div style={{width:'100%', display:'flex', flexDirection:'column', gap:2, background:'var(--surface-1)', padding:6, border:'1px solid var(--line)', borderRadius:4}}>
          <ChatRow tagline="working through the segmentation logic — we landed on three tiers and a churn-risk overlay" since="2h ago" />
          <ChatRow tagline="quick check on whether the runbook should call out the staging URL or read it from .env" since="yesterday" />
          <ChatRow tagline="experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet" since="74d ago" stale />
        </div>
      </CRow>

      <CRow label="Input · mono">
        <input className="km-input km-input-mono" placeholder='tag:#outreach kind:action state:active' style={{width: 360}} />
      </CRow>

      <CRow label="Keyboard hints">
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">J</span><span className="km-kbd">K</span> <span className="km-body-sm">navigate</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">A</span> <span className="km-body-sm">activate</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">P</span> <span className="km-body-sm">park</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">X</span> <span className="km-body-sm">dismiss</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">D</span> <span className="km-body-sm">done</span></span>
        <span style={{display:'inline-flex', alignItems:'center', gap:6}}><span className="km-kbd">⌘</span><span className="km-kbd">K</span> <span className="km-body-sm">search</span></span>
      </CRow>
    </div>
  </div>
);

Object.assign(window, { ComponentBoard, ChatRow, ActivityEntry });
