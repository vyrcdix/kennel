// Foundation artboards: palette swatches and type scale.

const Swatch = ({ name, hex, role, dark }) => (
  <div style={{display:'flex', alignItems:'stretch', gap:0, border:'1px solid var(--line)', borderRadius:3, overflow:'hidden'}}>
    <div style={{ width: 86, background: hex, flex:'0 0 86px' }} />
    <div style={{flex:1, padding:'10px 12px', display:'flex', flexDirection:'column', gap:3, background:'var(--surface-1)'}}>
      <div className="km-display-md" style={{fontSize:14, letterSpacing:'.06em', textTransform:'uppercase'}}>{name}</div>
      <Mono>{hex}</Mono>
      <div className="km-body-sm" style={{lineHeight:1.35}}>{role}</div>
    </div>
  </div>
);

const PaletteBoard = () => (
  <div className="km" style={{padding:'32px 40px', height:'100%', overflow:'hidden'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:16, marginBottom: 6}}>
      <div className="km-display-lg">Palette</div>
      <Mono>kennel · v0.1 · inherits pacecraft</Mono>
    </div>
    <div className="km-body-sm" style={{maxWidth: 720, marginBottom: 24}}>
      Bone-dominated light mode, slate-dark dominated dark mode. Same warm accents in both. Ember leads action; moss carries structure; blaze is punctuation only.
    </div>

    <Label style={{marginBottom: 10}}>Core</Label>
    <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:10, marginBottom: 24}}>
      <Swatch name="Bone"       hex="#F2EDE0" role="Light bg. Default canvas." />
      <Swatch name="Slate"      hex="#3A3F45" role="Primary text light. Headings." />
      <Swatch name="Slate-dark" hex="#2A2E33" role="Dark bg. Floor (never deeper)." />
      <Swatch name="Moss"       hex="#5C7A3E" role="Structural accent. Project tag." />
      <Swatch name="Ember"      hex="#D9622C" role="Hero warm. Primary action." />
      <Swatch name="Dust"       hex="#C9A87C" role="Soft accents. Muted bg." />
      <Swatch name="Blaze"      hex="#E8B547" role="Pinned indicator. Punctuation." />
      <Swatch name="Slate-light"hex="#7A8088" role="Secondary text. De-emphasized." />
    </div>

    <Label style={{marginBottom: 10}}>Derived</Label>
    <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10, marginBottom: 28}}>
      <Swatch name="Ember-dark"  hex="#A84919" role="Hover / pressed on ember." />
      <Swatch name="Ember-deep"  hex="#8A3A14" role="Ember link underline. Claude voice." />
      <Swatch name="Slate-light" hex="#7A8088" role="55% slate alt." />
    </div>

    <Label style={{marginBottom: 10}}>Rules</Label>
    <ul className="km-body-sm" style={{margin:0, paddingLeft: 16, lineHeight: 1.7, color:'var(--fg)'}}>
      <li>Ember and blaze never sit side-by-side at equal weight.</li>
      <li>Never dark-on-dark or warm-on-warm at the same value.</li>
      <li>Dust is background or soft accent — never foreground type.</li>
      <li>Light mode is default; dark mode is a peer, not an afterthought.</li>
    </ul>
  </div>
);

const TypeRow = ({ token, spec, sample, sampleClass }) => (
  <div style={{display:'grid', gridTemplateColumns:'180px 240px 1fr', alignItems:'baseline', padding:'14px 0', borderTop:'1px solid var(--line)', gap: 18}}>
    <div className="km-display-sm">{token}</div>
    <Mono>{spec}</Mono>
    <div className={sampleClass}>{sample}</div>
  </div>
);

const TypeBoard = () => (
  <div className="km" style={{padding:'32px 40px', height:'100%', overflow:'hidden'}}>
    <div style={{display:'flex', alignItems:'baseline', gap:16, marginBottom: 4}}>
      <div className="km-display-lg">Typography</div>
      <Mono>oswald · inter · jetbrains mono</Mono>
    </div>
    <div className="km-body-sm" style={{maxWidth: 720, marginBottom: 22}}>
      Hierarchy carried by weight, size, and color. Display marks structural moments. Body does the work. Mono signals technical content — anything operational, slugs, timestamps, revisions.
    </div>

    <div style={{borderBottom:'1px solid var(--line)'}}>
      <TypeRow token="Display large"  spec="Oswald 500 · 28 / 0.02em"     sample="Picnic — Engagement" sampleClass="km-display-lg" />
      <TypeRow token="Display medium" spec="Oswald 500 · 20 / 0.04em"     sample="Project context"     sampleClass="km-display-md" />
      <TypeRow token="Display small"  spec="Oswald 500 · 12 / 0.18em UC"  sample="NEXT UP"             sampleClass="km-display-sm" />
      <TypeRow token="Body large"     spec="Inter 500 · 16"                sample="Draft Q3 outreach plan" sampleClass="km-body-lg" />
      <TypeRow token="Body default"   spec="Inter 400 · 14"                sample="Send revised copy to A. Klein before Friday standup." sampleClass="km-body" />
      <TypeRow token="Body small"     spec="Inter 400 · 12 / 55%"          sample="captured 2h ago via mobile share"                      sampleClass="km-body-sm" />
      <TypeRow token="Mono"           spec="JetBrains Mono 400 · 12.5"     sample="picnic-engage  rev 7  14:32  #outreach" sampleClass="km-mono" />
      <TypeRow token="Mono small"     spec="JetBrains Mono 400 · 11 / 55%" sample="2026-05-17T14:32:18-07:00"               sampleClass="km-mono-sm" />
    </div>

    <div style={{marginTop: 22, display:'grid', gridTemplateColumns:'1fr 1fr', gap: 28}}>
      <div>
        <Label style={{marginBottom: 8}}>Field-manual labels</Label>
        <div className="km-body-sm" style={{marginBottom: 10}}>Section labels and small UI labels are always uppercased and letter-spaced.</div>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <div className="km-display-sm">PROJECT RAIL</div>
          <div className="km-display-sm">YESTERDAY</div>
          <div className="km-display-sm">RUNBOOK · RUN</div>
        </div>
      </div>
      <div>
        <Label style={{marginBottom: 8}}>Numbers that matter</Label>
        <div className="km-body-sm" style={{marginBottom: 10}}>Revision counters, timestamps, item counts — always mono.</div>
        <div style={{display:'flex', flexDirection:'column', gap:6, fontFamily:'var(--ff-mono)'}}>
          <Mono>rev 12</Mono>
          <Mono>14:32 · 2h ago</Mono>
          <Mono>4 inbox · 17 active · 9 parked</Mono>
        </div>
      </div>
    </div>
  </div>
);

Object.assign(window, { PaletteBoard, TypeBoard });
