// The Chart — Steep's master help / orientation page. A single-scroll guide:
// hero → the pieces (led by the Horizon/Compass banner) → a reserved slot for
// the relationship diagram (delivered separately) → a week with Steep → the
// "Why it works" modal. Recreated from design_handoff_chart in the app's token
// system: a self-contained full route at /chart, always Tidewater-dressed
// (km-skin-life), day/night driven by the app's global theme. Copy is verbatim.
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { useTheme } from '../lib/theme';
import {
  PIECE_GROUPS,
  PRINCIPLES,
  WALKTHROUGH,
  type ChartGroup,
  type ChartPiece,
  type WalkCrystal,
  type WalkStep,
} from '../data/chartContent';

// chart icon name → app Icon name (the rest resolve 1:1)
const ICON_ALIAS: Record<string, string> = { shelf: 'park', review: 'filter' };
const glyph = (name: string, size = 18, style?: CSSProperties): ReactNode => {
  const fn = Icons[ICON_ALIAS[name] ?? name] ?? Icons.tide;
  return fn({ size, style });
};

const DISPLAY: CSSProperties = { fontFamily: 'var(--ff-display)' };
const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const Eyebrow = ({ children, style }: { children: ReactNode; style?: CSSProperties }) => (
  <div
    className="km-display-sm"
    style={{ color: 'var(--ink-faint)', letterSpacing: '.14em', fontSize: 11.5, ...style }}
  >
    {children}
  </div>
);

const Wave = ({ w = 150, o = 0.4 }: { w?: number; o?: number }) => (
  <svg width={w} height="9" viewBox={`0 0 ${w} 9`} fill="none" style={{ opacity: o, display: 'block' }}>
    <path
      d={`M0 5 Q ${w / 8} 1 ${w / 4} 5 T ${w / 2} 5 T ${(w * 3) / 4} 5 T ${w} 5`}
      stroke="var(--action)"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

const CrystalArt = ({ type, text, attrib, small }: WalkCrystal & { small?: boolean }) => (
  <div
    className="km-card"
    style={{
      padding: small ? '13px 15px' : '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      boxShadow: 'inset 3px 0 0 color-mix(in oklab, var(--sacred) 45%, transparent)',
    }}
  >
    <span
      className="km-mono-sm"
      style={{
        fontSize: 10,
        letterSpacing: '.12em',
        textTransform: 'uppercase',
        color: 'var(--cmp-ink)',
        background: 'var(--sacred-soft)',
        padding: '2px 8px',
        borderRadius: 999,
        alignSelf: 'flex-start',
      }}
    >
      {type}
    </span>
    <p
      style={{
        ...DISPLAY,
        margin: 0,
        fontSize: small ? 15.5 : 17,
        fontWeight: 600,
        lineHeight: 1.4,
        color: 'var(--ink)',
        letterSpacing: '-.01em',
      }}
    >
      {text}
    </p>
    {attrib && (
      <span className="km-mono-sm" style={{ fontSize: 11.5, color: 'var(--ink-muted)' }}>
        — {attrib}
      </span>
    )}
  </div>
);

const BenchArt = ({
  kind,
  text,
  meta,
}: {
  kind: import('../data/types').Item['kind'];
  text: string;
  meta: string;
}) => (
  <div
    className="km-card"
    style={{ padding: '12px 14px', display: 'flex', gap: 11, alignItems: 'flex-start', background: 'var(--card-2)' }}
  >
    <span
      style={{
        width: 26,
        height: 26,
        borderRadius: 8,
        flex: '0 0 auto',
        background: 'var(--sunk)',
        color: 'var(--ink-muted)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <KindIcon kind={kind} size={14} />
    </span>
    <div style={{ minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.4, color: 'var(--ink)' }}>{text}</p>
      <span className="km-mono-sm" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
        {meta}
      </span>
    </div>
  </div>
);

// piece-card icon slot — handles the two custom glyphs (currents / temperature)
const PieceGlyph = ({ icon, sacred }: { icon: string; sacred?: boolean }) => {
  if (icon === 'currents') {
    const tints = ['var(--tint-sage)', 'var(--tint-dusk)', 'var(--tint-plum)'];
    return (
      <span style={{ display: 'inline-flex' }}>
        {['run', 'plane', 'spark'].map((g, i) => (
          <span
            key={g}
            style={{
              width: 20,
              height: 20,
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `color-mix(in oklab, ${tints[i]} 20%, transparent)`,
              color: tints[i],
              marginLeft: i ? -7 : 0,
              border: '1.5px solid var(--card)',
            }}
          >
            {glyph(g, 11)}
          </span>
        ))}
      </span>
    );
  }
  if (icon === 'temp') {
    const bars: [string, number][] = [
      ['var(--sacred)', 18],
      ['var(--action)', 13],
      ['var(--fam-run)', 9],
      ['var(--ink-faint)', 6],
    ];
    return (
      <span style={{ display: 'inline-flex', gap: 2.5, alignItems: 'flex-end', height: 20 }}>
        {bars.map(([c, h], i) => (
          <span key={i} style={{ width: 4, height: h, borderRadius: 999, background: c, opacity: i ? 0.85 : 1 }} />
        ))}
      </span>
    );
  }
  const med = sacred
    ? { bg: 'var(--sacred-soft)', fg: 'var(--cmp-ink)' }
    : { bg: 'var(--sunk)', fg: 'var(--ink-muted)' };
  return (
    <span
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        flex: '0 0 auto',
        background: med.bg,
        color: med.fg,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {glyph(icon, 18)}
    </span>
  );
};

const PieceCard = ({ p }: { p: ChartPiece }) => (
  <div
    className="km-card"
    style={{
      padding: '17px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 11,
      borderColor: p.sacred ? 'color-mix(in oklab, var(--sacred) 30%, var(--line))' : 'var(--line)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 34 }}>
      <PieceGlyph icon={p.icon} sacred={p.sacred} />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
        <span
          style={{
            ...DISPLAY,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: '-.015em',
            color: p.sacred ? 'var(--sacred-ink)' : 'var(--ink)',
          }}
        >
          {p.name}
        </span>
        {p.alias && (
          <span className="km-mono-sm" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
            also: the {p.alias}
          </span>
        )}
      </div>
    </div>
    <p style={{ margin: 0, fontSize: 14.5, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink)' }}>{p.what}</p>
    <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-muted)' }}>{p.how}</p>
  </div>
);

const GroupTitle = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 4 }}>
    <h3 style={{ ...DISPLAY, margin: 0, fontSize: 19, fontWeight: 700, letterSpacing: '-.02em' }}>{title}</h3>
    <span style={{ flex: 1, height: 1, background: 'var(--line)' }} />
  </div>
);

const HorizonBanner = ({ grp }: { grp: ChartGroup }) => {
  const p = grp.pieces[0];
  return (
    <div>
      <GroupTitle title={grp.title} />
      <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 680 }}>
        {grp.blurb}
      </p>
      <div
        className="km-card"
        style={{
          position: 'relative',
          padding: '26px 28px',
          display: 'flex',
          gap: 22,
          alignItems: 'center',
          flexWrap: 'wrap',
          overflow: 'hidden',
          background:
            'linear-gradient(135deg, var(--sacred-soft), color-mix(in oklab, var(--sacred) 6%, var(--card)) 55%, var(--card))',
          boxShadow:
            '0 0 0 1px color-mix(in oklab, var(--sacred) 24%, transparent), 0 14px 40px color-mix(in oklab, var(--sacred) 14%, transparent)',
        }}
      >
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          style={{ position: 'absolute', right: -36, top: '50%', transform: 'translateY(-50%)', opacity: 0.12, pointerEvents: 'none' }}
          fill="none"
        >
          {[104, 76, 48].map((r, i) => (
            <circle
              key={i}
              cx="110"
              cy="110"
              r={r}
              stroke="var(--sacred-ink)"
              strokeWidth="1"
              strokeDasharray={i === 1 ? '2 7' : 'none'}
            />
          ))}
          <path d="M110 8 L110 212 M8 110 L212 110" stroke="var(--sacred-ink)" strokeWidth="1" />
          <path d="M110 34 L122 110 L110 186 L98 110 Z" fill="var(--sacred-ink)" />
        </svg>
        <span
          style={{
            width: 64,
            height: 64,
            borderRadius: 999,
            flex: '0 0 auto',
            background: 'var(--card)',
            color: 'var(--sacred-ink)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
            boxShadow: '0 0 0 5px color-mix(in oklab, var(--sacred) 16%, transparent)',
          }}
        >
          {glyph('compass', 32)}
        </span>
        <div style={{ flex: 1, minWidth: 260, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ ...DISPLAY, fontSize: 26, fontWeight: 700, letterSpacing: '-.025em', color: 'var(--sacred-ink)' }}>
              {p.name}
            </span>
            <span
              className="km-mono-sm"
              style={{
                fontSize: 11,
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--cmp-ink)',
                background: 'var(--sacred-soft)',
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              the horizon
            </span>
          </div>
          <p style={{ margin: '8px 0 6px', fontSize: 16.5, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink)', maxWidth: 600 }}>
            {p.what}
          </p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)', maxWidth: 600 }}>{p.how}</p>
        </div>
      </div>
    </div>
  );
};

const SectionHead = ({ eyebrow, title, lead }: { eyebrow: string; title: string; lead: string }) => (
  <div style={{ maxWidth: 720, marginBottom: 26 }}>
    <Eyebrow style={{ marginBottom: 10 }}>{eyebrow}</Eyebrow>
    <h2 style={{ ...DISPLAY, margin: '0 0 12px', fontSize: 32, fontWeight: 700, letterSpacing: '-.025em', lineHeight: 1.08 }}>
      {title}
    </h2>
    <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{lead}</p>
  </div>
);

const WhyModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 80,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 24px',
        overflowY: 'auto',
        background: 'color-mix(in oklab, var(--ink) 42%, transparent)',
        backdropFilter: 'blur(3px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="km-card"
        style={{ width: '100%', maxWidth: 640, boxShadow: 'var(--shadow-lift)', overflow: 'hidden' }}
      >
        <div
          style={{
            position: 'relative',
            padding: '26px 28px 22px',
            borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(180deg, var(--sacred-soft), transparent)',
          }}
        >
          <Eyebrow style={{ color: 'var(--cmp-ink)', marginBottom: 9 }}>The thinking behind the chart</Eyebrow>
          <h3 style={{ ...DISPLAY, margin: 0, fontSize: 25, fontWeight: 700, letterSpacing: '-.02em' }}>
            Why it’s drawn this way
          </h3>
          <p style={{ margin: '10px 0 0', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)', maxWidth: 520 }}>
            Steep is shaped for a mind that captures fast, decides later, and sometimes disappears for a while. Six
            choices hold the whole thing together.
          </p>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              width: 32,
              height: 32,
              borderRadius: 999,
              border: '1px solid var(--line)',
              background: 'color-mix(in oklab, var(--card) 70%, transparent)',
              color: 'var(--ink-muted)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {glyph('x', 15)}
          </button>
        </div>
        <div style={{ padding: '8px 28px 26px' }}>
          {PRINCIPLES.map((pr, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 15,
                padding: '17px 0',
                borderBottom: i < PRINCIPLES.length - 1 ? '1px solid var(--line)' : 'none',
              }}
            >
              <span
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  flex: '0 0 auto',
                  marginTop: 2,
                  background: 'var(--sacred-soft)',
                  color: 'var(--cmp-ink)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {glyph(pr.icon, 17)}
              </span>
              <div>
                <h4 style={{ ...DISPLAY, margin: '0 0 5px', fontSize: 16.5, fontWeight: 700, letterSpacing: '-.01em' }}>
                  {pr.title}
                </h4>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: 'var(--ink-muted)' }}>{pr.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Step = ({ s, last }: { s: WalkStep; last: boolean }) => (
  <div style={{ display: 'flex', gap: 18 }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 999,
          background: 'var(--card)',
          border: '1px solid var(--line-strong)',
          color: 'var(--action-ink)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-panel)',
        }}
      >
        {glyph(s.icon, 17)}
      </span>
      {!last && <span style={{ flex: 1, width: 2, background: 'var(--line)', margin: '6px 0' }} />}
    </div>
    <div style={{ flex: 1, paddingBottom: last ? 0 : 34, minWidth: 0 }}>
      <Eyebrow style={{ marginBottom: 8 }}>{s.tag}</Eyebrow>
      <h3 style={{ ...DISPLAY, margin: '0 0 8px', fontSize: 21, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.2 }}>
        {s.head}
      </h3>
      <p style={{ margin: '0 0 14px', fontSize: 14.5, lineHeight: 1.6, color: 'var(--ink-muted)', maxWidth: 620 }}>{s.body}</p>
      {s.example && (
        <div style={{ maxWidth: 460 }}>
          <BenchArt {...s.example} />
        </div>
      )}
      {s.legend && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {s.legend.map((g) => (
            <span
              key={g.k}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--card)',
                border: '1px solid var(--line)',
                padding: '5px 11px 5px 7px',
                borderRadius: 999,
              }}
            >
              <kbd className="km-kbd">{g.k}</kbd>
              <span style={{ fontSize: 12.5, color: 'var(--ink-muted)' }}>{g.label}</span>
            </span>
          ))}
        </div>
      )}
      {s.crystal && (
        <div style={{ maxWidth: 480 }}>
          <CrystalArt {...s.crystal} />
        </div>
      )}
      {s.crystals && (
        <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', maxWidth: 640 }}>
          {s.crystals.map((c, i) => (
            <CrystalArt key={i} {...c} small />
          ))}
        </div>
      )}
      {s.quote && (
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'center',
            padding: '13px 16px',
            maxWidth: 460,
            borderRadius: 'var(--r-ctrl)',
            background: 'var(--action-soft)',
            border: '1px solid color-mix(in oklab, var(--action) 18%, var(--line))',
          }}
        >
          {glyph('tide', 17, { color: 'var(--action-ink)', flex: '0 0 auto' })}
          <span style={{ fontSize: 14.5, color: 'var(--ink)', fontWeight: 500 }}>“{s.quote}”</span>
        </div>
      )}
      {s.foot && (
        <p style={{ margin: '14px 0 0', fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-faint)', fontStyle: 'italic', maxWidth: 600 }}>
          {s.foot}
        </p>
      )}
    </div>
  </div>
);

export const Chart = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useTheme();
  const [why, setWhy] = useState(false);
  const night = mode === 'dark' || (mode === 'system' && prefersDark());

  return (
    <div
      className={`km km-skin-life${night ? ' km-dark' : ''}`}
      style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}
    >
      {/* header — fixed above the scroll pane (.km clips document scroll) */}
      <header
        style={{
          flex: '0 0 auto',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '0 28px',
          height: 62,
          borderBottom: '1px solid var(--line)',
          background: 'color-mix(in oklab, var(--bg) 82%, transparent)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <button
          onClick={() => navigate('/')}
          aria-label="Back to Steep"
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            border: 0,
            cursor: 'pointer',
            background: 'linear-gradient(160deg, var(--action), var(--fam-guide))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#F4FBFA',
          }}
        >
          {glyph('tide', 16)}
        </button>
        <span style={{ ...DISPLAY, fontWeight: 700, fontSize: 20, letterSpacing: '-.02em' }}>Steep</span>
        <span style={{ color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          {glyph('arrowR', 13)}
          <span className="km-mono-sm" style={{ fontSize: 12 }}>The Chart</span>
        </span>
        <span style={{ flex: 1 }} />
        <button className="km-btn km-btn-soft km-btn-sm" onClick={() => setWhy(true)}>
          {glyph('compass', 14)} Why it works
        </button>
        <button
          className="km-btn km-btn-ghost km-btn-sm"
          style={{ padding: 9, borderRadius: 999 }}
          onClick={() => setMode(night ? 'light' : 'dark')}
          title={night ? 'Switch to day' : 'Switch to night'}
          aria-label={night ? 'Switch to day' : 'Switch to night'}
        >
          {night ? glyph('sun', 17) : glyph('moon', 17)}
        </button>
      </header>

      {/* scroll pane — full width so the scrollbar sits at the viewport edge */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '0 28px 100px' }}>
        {/* hero */}
        <section style={{ position: 'relative', padding: '64px 0 40px', overflow: 'hidden' }}>
          <svg
            width="320"
            height="320"
            viewBox="0 0 320 320"
            style={{ position: 'absolute', right: -60, top: 10, opacity: night ? 0.14 : 0.1, pointerEvents: 'none' }}
            fill="none"
          >
            {[150, 110, 70, 34].map((r, i) => (
              <circle key={i} cx="160" cy="160" r={r} stroke="var(--action)" strokeWidth="1" strokeDasharray={i % 2 ? '2 7' : 'none'} />
            ))}
            <path d="M160 6 L160 314 M6 160 L314 160" stroke="var(--sacred)" strokeWidth="1" opacity=".7" />
            <path d="M160 40 L172 160 L160 280 L148 160 Z" fill="var(--sacred)" opacity=".5" />
          </svg>
          <Eyebrow style={{ marginBottom: 16 }}>A guide to how Steep works</Eyebrow>
          <h1
            style={{
              ...DISPLAY,
              margin: '0 0 18px',
              fontSize: 'clamp(40px, 6vw, 62px)',
              fontWeight: 700,
              letterSpacing: '-.035em',
              lineHeight: 1.02,
              maxWidth: 880,
            }}
          >
            The Chart
          </h1>
          <p style={{ margin: '0 0 14px', fontSize: 'clamp(17px, 2.2vw, 20px)', lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 660 }}>
            Steep is a quiet place to let your thinking <em>steep</em> — catch it fast, sort it later, and keep the few
            things that turn out to matter. This is the map of how the pieces fit, and how you’ll actually use them.
          </p>
          <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-faint)', maxWidth: 600 }}>
            Nothing here asks anything of you yet. Read it like a chart by the wheel — glance, get your bearings, carry on.
          </p>
        </section>

        <Wave />

        {/* the pieces */}
        <section style={{ padding: '46px 0 10px' }}>
          <SectionHead
            eyebrow="What it’s made of"
            title="The pieces, and what each one is for"
            lead="One piece sets your direction; everything else is a way to model, sort, and keep what flows toward it. You don’t need them all on day one — most people live in the catch-and-sort pieces for weeks before the rest become useful."
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 38 }}>
            {PIECE_GROUPS.map((grp) =>
              grp.lead ? (
                <HorizonBanner key={grp.id} grp={grp} />
              ) : (
                <div key={grp.id}>
                  <GroupTitle title={grp.title} />
                  <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 680 }}>
                    {grp.blurb}
                  </p>
                  <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))' }}>
                    {grp.pieces.map((p) => (
                      <PieceCard key={p.name} p={p} />
                    ))}
                  </div>
                </div>
              ),
            )}
          </div>
        </section>

        {/* how it all connects — diagram delivered separately (placeholder) */}
        <section style={{ padding: '64px 0 10px' }}>
          <SectionHead
            eyebrow="How it all connects"
            title="How the pieces fit together"
            lead="A single relationship map showing how a thought moves from capture, through sorting, into its home — and how the few kept things resurface, all while steering toward a target on the horizon. (Diagram in progress; delivered separately.)"
          />
          <div
            style={{
              border: '1px dashed var(--line-strong)',
              borderRadius: 'var(--r-card)',
              padding: '64px 28px',
              textAlign: 'center',
              background: 'var(--card-2)',
            }}
          >
            <div className="km-mono-sm" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>
              Relationship diagram — delivered separately. Reserve this space.
            </div>
          </div>
        </section>

        {/* a week with Steep */}
        <section style={{ padding: '64px 0 10px' }}>
          <SectionHead
            eyebrow="What it looks like in practice"
            title="A week with Steep"
            lead="No grand setup, no inbox-zero crusade. Just a thought, a sorting mood on Tuesday, a realization that sticks, a quiet stretch where you vanish — and a glance on Sunday."
          />
          <div style={{ maxWidth: 760 }}>
            {WALKTHROUGH.map((s, i) => (
              <Step key={i} s={s} last={i === WALKTHROUGH.length - 1} />
            ))}
          </div>
        </section>

        {/* why-it-works invitation + footer */}
        <section style={{ padding: '60px 0 0' }}>
          <div
            className="km-card"
            style={{
              padding: '30px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              flexWrap: 'wrap',
              background:
                'radial-gradient(90% 140% at 0% 0%, var(--sacred-soft), transparent 60%), var(--card)',
              border: '1px solid color-mix(in oklab, var(--sacred) 22%, var(--line))',
            }}
          >
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 999,
                flex: '0 0 auto',
                background: 'var(--sacred-soft)',
                color: 'var(--cmp-ink)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {glyph('compass', 26)}
            </span>
            <div style={{ flex: 1, minWidth: 260 }}>
              <h3 style={{ ...DISPLAY, margin: '0 0 6px', fontSize: 21, fontWeight: 700, letterSpacing: '-.02em' }}>
                Curious why it’s built this way?
              </h3>
              <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, color: 'var(--ink-muted)', maxWidth: 520 }}>
                The calm isn’t an accident. There are six small principles underneath every choice — the no-red rule, the
                reversible decisions, the freedom to disappear. Optional reading.
              </p>
            </div>
            <button className="km-btn km-btn-primary" onClick={() => setWhy(true)} style={{ flex: '0 0 auto' }}>
              {glyph('arrowR', 15)} Read the thinking
            </button>
          </div>
          <p className="km-mono-sm" style={{ textAlign: 'center', marginTop: 40, fontSize: 11.5, color: 'var(--ink-faint)' }}>
            Steep · the Chart · v0.6 — life
          </p>
        </section>
      </main>
      </div>

      <WhyModal open={why} onClose={() => setWhy(false)} />
    </div>
  );
};

export default Chart;
