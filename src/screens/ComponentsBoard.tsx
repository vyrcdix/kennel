import type { ReactNode } from 'react';
import { Icons } from '../components/Icon';
import { ProjectTag } from '../components/ProjectTag';
import { KindIcon } from '../components/KindIcon';
import { StateDot } from '../components/StateDot';
import { Rev } from '../components/Rev';
import { ChatRow } from '../components/ChatRow';
import { ActivityEntry } from '../components/ActivityEntry';

const CRow = ({
  label,
  children,
  w = 480,
}: {
  label: string;
  children: ReactNode;
  w?: number;
}) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: '180px 1fr',
      alignItems: 'flex-start',
      gap: 24,
      padding: '14px 0',
      borderTop: '1px solid var(--line)',
    }}
  >
    <div>
      <div className="km-display-sm">{label}</div>
    </div>
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 12,
        maxWidth: w,
      }}
    >
      {children}
    </div>
  </div>
);

export const ComponentsBoard = () => (
  <div className="km" style={{ padding: '28px 36px', height: '100%', overflow: 'auto' }}>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, marginBottom: 4 }}>
      <div className="km-display-lg">Components</div>
      <span className="km-mono-sm">§7 patterns · drop-in reusable atoms</span>
    </div>
    <div className="km-body-sm" style={{ maxWidth: 720, marginBottom: 14 }}>
      Every pattern called out in the brief, demonstrated here so Claude Code can reach for them as primitives.
    </div>

    <div style={{ borderBottom: '1px solid var(--line)' }}>
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
        <span className="km-tag" style={{ cursor: 'pointer' }}>+ tag</span>
      </CRow>

      <CRow label="Kind icons">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="idea" />
          <span className="km-body-sm">idea</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="note" />
          <span className="km-body-sm">note</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="action" />
          <span className="km-body-sm">action</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="doc" />
          <span className="km-body-sm">doc</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="ref" />
          <span className="km-body-sm">reference</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <KindIcon kind="chat" />
          <span className="km-body-sm">chat</span>
        </span>
      </CRow>

      <CRow label="State indicator">
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="km-body-sm">on the bench</span>
          <span className="km-body-sm" style={{ color: 'var(--fg-faint)' }}>(no indicator)</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StateDot state="active" />
          <span className="km-body-sm">in focus</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StateDot state="reflecting" />
          <span className="km-body-sm">reflecting</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StateDot state="crystallized" />
          <span className="km-body-sm">crystallized</span>
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <StateDot state="filed" />
          <span className="km-body-sm">filed</span>
        </span>
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
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-pin">
            <Icons.pin size={12} />
          </span>
          <span className="km-body">Project pinned</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-pin">
            <Icons.star size={12} />
          </span>
          <span className="km-body">Doc pinned</span>
        </span>
        <span className="km-body-sm">tiny accents only · never a large surface</span>
      </CRow>

      <CRow label="Activity entry" w={680}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            fontFamily: 'var(--ff-sans)',
          }}
        >
          <ActivityEntry
            time="14:32"
            who="C"
            verb="EDITED"
            target="draft Q3 outreach plan"
            payload="rev 7 → rev 8 · 4 lines changed"
          />
          <ActivityEntry
            time="13:58"
            who="Cl"
            verb="PROPOSED"
            target="skill / outreach-cadence"
            payload="add fallback for paused contacts"
          />
          <ActivityEntry
            time="11:11"
            who="CLI"
            verb="CAPTURED"
            target="ref / Stripe pricing docs"
            payload="https://stripe.com/pricing"
          />
          <ActivityEntry
            time="08:04"
            who="sys"
            verb="BACKUP"
            target="nightly snapshot"
            payload="2.4 MB · ok"
          />
        </div>
      </CRow>

      <CRow label="Chat row" w={620}>
        <div
          style={{
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            background: 'var(--surface-1)',
            padding: 6,
            border: '1px solid var(--line)',
            borderRadius: 4,
          }}
        >
          <ChatRow
            tagline="working through the segmentation logic — we landed on three tiers and a churn-risk overlay"
            since="2h ago"
          />
          <ChatRow
            tagline="quick check on whether the runbook should call out the staging URL or read it from .env"
            since="yesterday"
          />
          <ChatRow
            tagline="experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet"
            since="74d ago"
            stale
          />
        </div>
      </CRow>

      <CRow label="Input · mono">
        <input
          className="km-input km-input-mono"
          placeholder="tag:#outreach kind:action state:active"
          style={{ width: 360 }}
        />
      </CRow>

      <CRow label="Keyboard hints">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">J</span>
          <span className="km-kbd">K</span>
          <span className="km-body-sm">navigate</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">A</span>
          <span className="km-body-sm">activate</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">P</span>
          <span className="km-body-sm">park</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">X</span>
          <span className="km-body-sm">dismiss</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">D</span>
          <span className="km-body-sm">done</span>
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <span className="km-kbd">⌘</span>
          <span className="km-kbd">K</span>
          <span className="km-body-sm">search</span>
        </span>
      </CRow>
    </div>
  </div>
);

export default ComponentsBoard;
