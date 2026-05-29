import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DB } from './db.js';
import { newId } from './ids.js';
import { contentRoot, ensureProjectDirs } from './content.js';
import { logActivity } from './activity.js';

// All timestamps anchored to "now at seed time" so relative dates feel current
// on first boot. Once the user mutates data, real timestamps take over.
const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const nowMs = Date.now();
const isoMinusMs = (ms: number) => new Date(nowMs - ms).toISOString();
const isoPlusMs = (ms: number) => new Date(nowMs + ms).toISOString();

// ─── Projects ──────────────────────────────────────────────────────────────

type ProjectSeed = {
  slug: string;
  name: string;
  description: string;
  context?: string;
  status: 'active' | 'paused' | 'archived';
  pinned: boolean;
  rank: number;
  color?: string;
  createdMs: number;
  updatedMs: number;
};

const PROJECTS: ProjectSeed[] = [
  {
    slug: 'kennel',
    name: 'Kennel',
    description: 'Personal command center. Currently in scoping and core schema.',
    context:
      'Single-user command center for projects, ideas, notes, actions, docs and Claude chats. Inherits Pacecraft palette and aesthetic. Built in Node.js with SQLite + FTS5. Currently building the UI port from the design handoff.',
    status: 'active',
    pinned: true,
    rank: 1,
    color: 'sage',
    createdMs: 74 * DAY,
    updatedMs: 7 * MIN,
  },
  {
    slug: 'picnic-engage',
    name: 'Picnic — Engagement',
    description: 'Q3 outreach refresh for the engagement workstream.',
    context:
      'Engagement workstream for Picnic. Audience: existing customers in dormant tiers. Cadence rules and segmentation live in skills/outreach-cadence.md.',
    status: 'active',
    pinned: true,
    rank: 2,
    color: 'stone',
    createdMs: 168 * DAY,
    updatedMs: 2 * HOUR,
  },
  {
    slug: 'pacecraft',
    name: 'Pacecraft',
    description: 'Brand system and field manual; supplies vocabulary.',
    context:
      'Parent brand. Sun glyph and Lily mascot live here, not in Kennel. Palette and voice rules inherited from this project.',
    status: 'active',
    pinned: true,
    rank: 3,
    createdMs: 245 * DAY,
    updatedMs: 3 * DAY,
  },
  {
    slug: 'klein-advisory',
    name: 'Klein Advisory',
    description: 'Quarterly check-ins and review notes.',
    context: 'Client engagement. Quarterly cadence. Light project, mostly notes.',
    status: 'active',
    pinned: true,
    rank: 4,
    createdMs: 351 * DAY,
    updatedMs: 2 * DAY,
  },
  {
    slug: 'training-block',
    name: 'Training Block',
    description: 'Pre-season ultra block. Mostly logs, occasional plan tweaks.',
    status: 'paused',
    pinned: false,
    rank: 5,
    createdMs: 460 * DAY,
    updatedMs: 18 * DAY,
  },
  {
    slug: 'reading-stack',
    name: 'Reading Stack',
    description: 'Long reads, papers, references to revisit.',
    status: 'active',
    pinned: true,
    rank: 6,
    color: 'stone',
    createdMs: 530 * DAY,
    updatedMs: 1 * HOUR,
  },
  {
    slug: 'hardcourt-passport',
    name: 'Hardcourt Passport',
    description: 'Interactive demo project. Now retired.',
    status: 'archived',
    pinned: false,
    rank: 7,
    createdMs: 700 * DAY,
    updatedMs: 120 * DAY,
  },
];

// ─── Items ──────────────────────────────────────────────────────────────────

type ItemSeed = {
  projectSlug: string;
  kind: 'idea' | 'note' | 'action' | 'doc' | 'ref';
  state: 'inbox' | 'active' | 'reflecting' | 'crystallized';
  title: string;
  body?: string;
  hash?: string;
  dueMs?: number;
  dueAhead?: boolean;
  rank?: number;
  createdMsAgo?: number;
  updatedMsAgo?: number;
  docKey?: string;
  refKey?: string;
};

const ITEMS: ItemSeed[] = [
  // kennel : active (12)
  { projectSlug: 'kennel', kind: 'action', state: 'active', title: 'Decide on dark-mode third elevation tone', hash: '#design', dueMs: 0, rank: 1, updatedMsAgo: 2 * HOUR },
  { projectSlug: 'kennel', kind: 'action', state: 'active', title: 'Sketch triage keyboard shortcut sheet', dueMs: 2 * DAY, dueAhead: true, rank: 2 },
  { projectSlug: 'kennel', kind: 'idea',   state: 'active', title: 'Move chats panel above pinned docs?', rank: 3 },
  { projectSlug: 'kennel', kind: 'doc',    state: 'active', title: 'Skill proposal review — wireframe notes', hash: 'rev 3', dueMs: 3 * DAY, dueAhead: true, docKey: 'prop-wireframe', rank: 4 },
  { projectSlug: 'kennel', kind: 'action', state: 'active', title: 'Resolve chat-tagline character budget edge case', dueMs: 5 * DAY, dueAhead: true, rank: 5 },
  { projectSlug: 'kennel', kind: 'doc',    state: 'active', title: 'Triage queue — keyboard interaction notes', hash: 'rev 7', docKey: 'triage-keyboard', rank: 6 },
  { projectSlug: 'kennel', kind: 'ref',    state: 'active', title: "Linear's filter-chip pattern · screenshots collected", refKey: 'linear-filter', rank: 7 },
  { projectSlug: 'kennel', kind: 'note',   state: 'active', title: 'Concerns about FTS5 ranking on short titles', rank: 8 },
  { projectSlug: 'kennel', kind: 'action', state: 'active', title: 'Wire NavRail item counts to live store', rank: 9 },
  { projectSlug: 'kennel', kind: 'idea',   state: 'active', title: 'Surface "last triaged" timestamp on empty inbox', rank: 10 },
  { projectSlug: 'kennel', kind: 'note',   state: 'active', title: 'Audit copy for second-person nouns ("your", "yours")', rank: 11 },
  { projectSlug: 'kennel', kind: 'action', state: 'active', title: 'Add Esc-closes-modal handler to global search', dueMs: 6 * DAY, dueAhead: true, rank: 12 },
  // kennel : parked (5)
  { projectSlug: 'kennel', kind: 'idea',   state: 'reflecting', title: 'Per-project density override', rank: 20 },
  { projectSlug: 'kennel', kind: 'idea',   state: 'reflecting', title: 'Quote-of-the-day on empty-canvas state', rank: 21 },
  { projectSlug: 'kennel', kind: 'note',   state: 'reflecting', title: 'Tag autocomplete: keyboard vs typeahead', rank: 22 },
  { projectSlug: 'kennel', kind: 'action', state: 'reflecting', title: 'Investigate sqlite-vec for similar-item lookup', rank: 23 },
  { projectSlug: 'kennel', kind: 'idea',   state: 'reflecting', title: 'Click-and-drag select for batch triage', rank: 24 },
  // kennel : inbox (7)
  { projectSlug: 'kennel', kind: 'idea',  state: 'inbox', title: 'Move chats panel above pinned docs?', body: "Chats panel currently lives at the bottom of the project landing page and feels right that it's quiet, but feels wrong that it's lower. Maybe the answer is to keep it at the bottom but make stale chats render at even lower opacity.\n\nTension: chats should be discoverable but should not feel central.", createdMsAgo: 2 * MIN },
  { projectSlug: 'kennel', kind: 'note',  state: 'inbox', title: 'Concerns about FTS5 ranking on short titles', createdMsAgo: 3 * HOUR },
  { projectSlug: 'kennel', kind: 'idea',  state: 'inbox', title: 'Convert idea → action should preserve markdown body', createdMsAgo: 3 * DAY },
  { projectSlug: 'kennel', kind: 'note',  state: 'inbox', title: 'Dark mode: ember-deep underline contrast on slate-dark', createdMsAgo: 1 * DAY },
  { projectSlug: 'kennel', kind: 'action',state: 'inbox', title: 'Try a 1px outline on selected row instead of 2px inset shadow', createdMsAgo: 2 * DAY },
  { projectSlug: 'kennel', kind: 'ref',   state: 'inbox', title: 'Obsidian — graph view interaction inspiration', refKey: 'obsidian-graph', createdMsAgo: 7 * HOUR },
  { projectSlug: 'kennel', kind: 'idea',  state: 'inbox', title: 'Yesterday rollup should collapse same-actor consecutive entries', createdMsAgo: 4 * DAY },
  // kennel : done (1)
  { projectSlug: 'kennel', kind: 'action', state: 'crystallized', title: 'Port tokens.css to src/styles/', updatedMsAgo: 5 * HOUR },

  // picnic-engage
  { projectSlug: 'picnic-engage', kind: 'doc',    state: 'active', title: 'Draft Q3 outreach plan', hash: 'rev 7', dueMs: 1 * DAY, dueAhead: true, docKey: 'q3-outreach', rank: 1 },
  { projectSlug: 'picnic-engage', kind: 'action', state: 'active', title: 'Send revised copy to A. Klein before Friday standup', dueMs: 2 * DAY, dueAhead: true, rank: 2 },
  { projectSlug: 'picnic-engage', kind: 'idea',   state: 'active', title: 'Paused branch should expire after 6 weeks, not 8', rank: 3 },
  { projectSlug: 'picnic-engage', kind: 'note',   state: 'active', title: 'OOO auto-replies were getting bucketed as opted-out', rank: 4 },
  { projectSlug: 'picnic-engage', kind: 'ref',    state: 'reflecting', title: 'Stripe — billing tiers reference', refKey: 'stripe-tiers', rank: 10 },
  { projectSlug: 'picnic-engage', kind: 'note',   state: 'reflecting', title: 'Q2 retro themes worth carrying forward', rank: 11 },
  { projectSlug: 'picnic-engage', kind: 'ref',    state: 'inbox', title: 'Stripe — billing tiers reference', createdMsAgo: 14 * MIN },
  { projectSlug: 'picnic-engage', kind: 'action', state: 'inbox', title: 'Send revised copy to A. Klein before Friday standup', createdMsAgo: 1 * DAY },
  { projectSlug: 'picnic-engage', kind: 'idea',   state: 'inbox', title: 'Cap re-check loop at 3 attempts not 4', createdMsAgo: 20 * HOUR },

  // pacecraft
  { projectSlug: 'pacecraft', kind: 'action', state: 'active', title: 'Revise voice section for Kennel adaptation', dueMs: 4 * DAY, dueAhead: true, rank: 1 },
  { projectSlug: 'pacecraft', kind: 'doc',    state: 'active', title: 'Pacecraft brand guide — palette inheritance notes', hash: 'rev 11', rank: 2 },
  { projectSlug: 'pacecraft', kind: 'note',   state: 'reflecting', title: 'Mascot-free empty states — copy patterns audit', rank: 10 },

  // klein-advisory
  { projectSlug: 'klein-advisory', kind: 'note', state: 'active', title: 'Prep Q2 retro talking points', dueMs: 7 * DAY, dueAhead: true, rank: 1 },
  { projectSlug: 'klein-advisory', kind: 'note', state: 'inbox',  title: 'Q2 retro — opening framing', createdMsAgo: 2 * DAY },

  // reading-stack
  { projectSlug: 'reading-stack', kind: 'ref', state: 'active', title: 'Reread §3 of Cal Newport on capture friction', refKey: 'newport-capture', rank: 1 },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'reflecting', title: "Christensen — Innovator's Dilemma", rank: 10 },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'reflecting', title: 'Latour — Reassembling the Social', rank: 11 },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'reflecting', title: 'Hofstadter — Surfaces & Essences', rank: 12 },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'inbox',  title: 'Newport on capture friction · §3', createdMsAgo: 1 * HOUR },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'inbox',  title: 'Linear changelog · keyboard model', createdMsAgo: 2 * DAY },
  { projectSlug: 'reading-stack', kind: 'ref', state: 'inbox',  title: 'Stripe Docs — programmable customer pricing', createdMsAgo: 1 * DAY },
];

// ─── Docs ──────────────────────────────────────────────────────────────────

type DocSeed = {
  key: string; // referenced by items via docKey
  projectSlug: string;
  title: string;
  filename: string;
  revision: number;
  pinned: boolean;
  body: string;
  createdMsAgo: number;
  updatedMsAgo: number;
};

const DOCS: DocSeed[] = [
  {
    key: 'triage-keyboard',
    projectSlug: 'kennel',
    title: 'Triage queue — keyboard interaction notes',
    filename: 'triage-keyboard-notes.md',
    revision: 7,
    pinned: false,
    createdMsAgo: 14 * DAY,
    updatedMsAgo: 0,
    body: `# Triage queue — keyboard interaction notes

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
   verb. Risky.`,
  },
  {
    key: 'design-brief',
    projectSlug: 'kennel',
    title: 'Design brief v0.1',
    filename: 'design-brief.md',
    revision: 4,
    pinned: true,
    createdMsAgo: 40 * DAY,
    updatedMsAgo: 2 * DAY,
    body: '# Design brief v0.1\n\nEight core screens, Pacecraft palette inheritance, capture-friction-first design principles.',
  },
  {
    key: 'data-model',
    projectSlug: 'kennel',
    title: 'Data model',
    filename: 'data-model.md',
    revision: 9,
    pinned: true,
    createdMsAgo: 35 * DAY,
    updatedMsAgo: 1 * DAY,
    body: '# Data model\n\nEntities and relationships — items, docs, refs, runbooks, skills, chats, activity.',
  },
  {
    key: 'user-flows',
    projectSlug: 'kennel',
    title: 'User flows',
    filename: 'user-flows.md',
    revision: 6,
    pinned: true,
    createdMsAgo: 30 * DAY,
    updatedMsAgo: 4 * DAY,
    body: '# User flows\n\nWhat happens on each screen and why — capture, triage, review, write-back.',
  },
  {
    key: 'prop-wireframe',
    projectSlug: 'kennel',
    title: 'Skill proposal review — wireframe notes',
    filename: 'skill-proposal-wireframe.md',
    revision: 3,
    pinned: false,
    createdMsAgo: 8 * DAY,
    updatedMsAgo: 1 * DAY,
    body: '# Skill proposal — wireframes\n\nSide-by-side diff, moss accept, ember write-to-source.',
  },
  {
    key: 'q3-outreach',
    projectSlug: 'picnic-engage',
    title: 'Q3 outreach plan',
    filename: 'q3-outreach-plan.md',
    revision: 7,
    pinned: true,
    createdMsAgo: 20 * DAY,
    updatedMsAgo: 2 * HOUR,
    body: '# Q3 outreach plan\n\nWe expect 30% of contacts to enter the paused state at least once in a cycle. Align on the paused-contact branch before the cadence ships.',
  },
  {
    key: 'cadence-rules',
    projectSlug: 'picnic-engage',
    title: 'Cadence rules · field manual',
    filename: 'cadence-rules.md',
    revision: 2,
    pinned: false,
    createdMsAgo: 12 * DAY,
    updatedMsAgo: 2 * DAY,
    body: '# Cadence rules\n\nOpted-out is terminal; paused is a re-check loop. Re-check every 14 days, demote after three failed attempts.',
  },
];

// ─── References ───────────────────────────────────────────────────────────

type RefSeed = {
  key: string;
  projectSlug: string;
  type: string;
  label: string;
  url?: string;
  notes?: string;
  createdMsAgo: number;
};

const REFS: RefSeed[] = [
  { key: 'newport-capture',  projectSlug: 'reading-stack', type: 'link', label: 'Newport — capture friction §3', url: 'https://newport.com/capture', createdMsAgo: 6 * DAY },
  { key: 'linear-filter',    projectSlug: 'kennel',        type: 'link', label: 'Linear filter-chip pattern',     url: 'https://linear.app/filters', createdMsAgo: 5 * DAY },
  { key: 'obsidian-graph',   projectSlug: 'kennel',        type: 'link', label: 'Obsidian — graph view',          url: 'https://obsidian.md/plugins/graph', createdMsAgo: 7 * HOUR },
  { key: 'stripe-tiers',     projectSlug: 'picnic-engage', type: 'link', label: 'Stripe — billing tiers',         url: 'https://stripe.com/pricing', createdMsAgo: 9 * DAY },
];

// ─── Runbooks ────────────────────────────────────────────────────────────

const RUNBOOKS: { projectSlug: string; url?: string; revision: number; prerequisites?: string; setup?: string; run?: string; deploy?: string; troubleshoot?: string; notes?: string; createdMsAgo: number; updatedMsAgo: number }[] = [
  {
    projectSlug: 'kennel',
    url: 'http://localhost:8421',
    revision: 12,
    createdMsAgo: 60 * DAY,
    updatedMsAgo: 12 * HOUR,
    prerequisites: `- macOS 14+ with Xcode CLT installed.
- \`uv\` 0.4.x or newer.
- Claude desktop with MCP enabled (Settings → Developer).
- A VPS reachable over SSH for the persistence layer (optional in dev).`,
    setup: `One-time clone and dependency bootstrap.

\`\`\`
$ git clone git@github.com:craig/kennel.git ~/work/kennel
$ cd ~/work/kennel
$ uv sync                            # python deps + sqlite-vec extension
$ cp .env.sample .env
$ vim .env                           # KENNEL_TOKEN, MCP_URL, BACKUP_DIR
\`\`\`

FTS5 is enabled in the default sqlite build; nothing else to install.`,
    run: `Day-to-day.

\`\`\`
$ uv run kennel serve --reload --port 8421
$ open http://localhost:8421
$ kennel mcp register --token $KENNEL_TOKEN  # one-shot per machine
\`\`\`

Reload watches the python sources and the static frontend; markdown edits in \`~/work/skills\` are hot-reloaded on next request.`,
    deploy: `\`\`\`
$ make deploy   # builds wheels, rsyncs to vps:/srv/kennel, restarts systemd unit
\`\`\`

The deploy script refuses to run if there are uncommitted changes or pending migrations.`,
    troubleshoot: `**MCP says "could not reach kennel".** Token mismatch is by far the most common cause. Reset it: \`kennel mcp rotate-token\` then re-register the client.

**FTS5 search returns nothing.** The trigram index can drift if rows were inserted with WAL checkpointing paused. Rebuild: \`kennel db reindex --fts\`.`,
    notes: `Backups run at 03:00 PDT via launchd. The MCP token has no expiry; rotate it any time anyone but Craig touches a Claude client.`,
  },
  {
    projectSlug: 'picnic-engage',
    url: 'https://picnic-staging.dixon.run/cadence',
    revision: 3,
    createdMsAgo: 80 * DAY,
    updatedMsAgo: 7 * DAY,
    prerequisites: '- HubSpot API key with scope `contacts.read`.\n- A staging segment named `paused-pilot`.',
    setup: '`$ cp picnic.env.sample picnic.env && vim picnic.env`',
    run: '`$ uv run picnic cadence run --dry`',
    troubleshoot: 'If the dry-run produces zero candidates, check the segment filter — most often the `paused` state is misnamed.',
  },
];

// ─── Chats ────────────────────────────────────────────────────────────────

const CHATS: { projectSlug: string; claudeUrl?: string; tagline: string; startedMsAgo: number; lastSeenMsAgo: number }[] = [
  { projectSlug: 'picnic-engage', claudeUrl: 'https://claude.ai/chat/segmentation', tagline: 'working through the segmentation logic — three tiers and a churn-risk overlay', startedMsAgo: 3 * DAY, lastSeenMsAgo: 2 * HOUR },
  { projectSlug: 'kennel',        claudeUrl: 'https://claude.ai/chat/runbook-staging', tagline: 'quick check on whether the runbook should call out the staging URL or read it from .env', startedMsAgo: 1 * DAY, lastSeenMsAgo: 1 * DAY },
  { projectSlug: 'kennel',        claudeUrl: 'https://claude.ai/chat/proposal-batching', tagline: 'figuring out whether the proposal queue should batch by skill or interleave', startedMsAgo: 4 * DAY, lastSeenMsAgo: 4 * DAY },
  { projectSlug: 'kennel',        tagline: 'experimenting with a cold-open hook for the founder profile piece — three drafts, none great yet', startedMsAgo: 74 * DAY, lastSeenMsAgo: 74 * DAY },
];

// ─── Skills ────────────────────────────────────────────────────────────────

const outreachCadenceCurrent = `# outreach-cadence

A skill for sequencing outreach to Picnic engagement contacts.

## Branching

When a contact is in an active sequence, the cadence
proceeds as defined. When a contact is **opted out**,
the cadence halts and the contact is marked complete.
No re-check is performed.

## Notes

Cadence interval is 7 days unless overridden.`;

const outreachCadenceProposed = `# outreach-cadence

A skill for sequencing outreach to Picnic engagement contacts.

## Branching

When a contact is in an active sequence, the cadence
proceeds as defined. When a contact is **opted out**,
the cadence halts and the contact is marked complete.

When a contact is **paused** (e.g. OOO auto-reply, or
manual hold), the cadence enters a 14-day re-check loop:
every 14 days, attempt one low-touch nudge. After three
failed re-checks (~6 weeks), demote to opted-out.

## Notes

Cadence interval is 7 days unless overridden.`;

const triageWorkflowBody = '# triage-workflow\n\nKeyboard-first triage handling for the Kennel queue.';
const triageWorkflowProposed = '# triage-workflow\n\nKeyboard hints render at the bottom of each row when selected, not in the header.';

// ─── Comments ─────────────────────────────────────────────────────────────

type CommentSeed = {
  docKey: string;
  author: 'craig' | 'claude';
  body: string;
  createdMsAgo: number;
};

const COMMENTS: CommentSeed[] = [
  { docKey: 'triage-keyboard', author: 'craig',  body: "Worried about the same-key/different-verb thing. Let's prototype it before deciding — gut says it's fine because the row visually announces 'this is a proposal'.", createdMsAgo: 5 * HOUR },
  { docKey: 'triage-keyboard', author: 'claude', body: "One small idea: when a proposal is selected, animate the kbd hint row to swap labels (A → Accept). Reinforces it's a different mode and costs ~150ms of motion.", createdMsAgo: Math.round(4.5 * HOUR) },
  { docKey: 'triage-keyboard', author: 'craig',  body: 'Yes — but no animation. Just swap the labels instantly.', createdMsAgo: 4 * HOUR },
];

// ─── Activity ─────────────────────────────────────────────────────────────

const SEED_ACTIVITY: { projectSlug: string; verb: string; target: string; payload?: string; actor: 'craig' | 'claude' | 'cli' | 'system'; agoMs: number }[] = [
  { projectSlug: 'kennel',        verb: 'EDITED',   target: 'draft Q3 outreach plan',         payload: 'rev 7 → rev 8 · 4 lines changed', actor: 'craig',  agoMs: 30 * MIN },
  { projectSlug: 'picnic-engage', verb: 'PROPOSED', target: 'skill / outreach-cadence',       payload: 'add fallback for paused contacts', actor: 'claude', agoMs: 33 * MIN },
  { projectSlug: 'reading-stack', verb: 'CAPTURED', target: 'ref / Newport on capture friction', payload: 'newport.com/…', actor: 'cli',    agoMs: 1 * HOUR },
  { projectSlug: 'kennel',        verb: 'COMMENTED',target: 'doc / triage-keyboard-notes',    payload: '"swap labels instantly, no animation"', actor: 'craig', agoMs: 4 * HOUR },
  { projectSlug: 'reading-stack', verb: 'ARCHIVED', target: '3 items in reading-stack',       actor: 'craig',  agoMs: 18 * HOUR },
  { projectSlug: 'picnic-engage', verb: 'DRAFTED',  target: 'outreach-cadence skill',         payload: 'proposal pending', actor: 'claude', agoMs: 22 * HOUR },
  { projectSlug: 'kennel',        verb: 'PROMOTED', target: 'kennel idea → action',           payload: 'dark-mode elevation', actor: 'craig', agoMs: 26 * HOUR },
  { projectSlug: 'reading-stack', verb: 'CAPTURED', target: 'ref / capture friction',         payload: 'newport.com/…', actor: 'cli', agoMs: 28 * HOUR },
  { projectSlug: 'kennel',        verb: 'BACKUP',   target: 'nightly snapshot',               payload: '2.4 MB · ok', actor: 'system', agoMs: 31 * HOUR },
  { projectSlug: 'klein-advisory',verb: 'CREATED',  target: 'note / Q2 retro framing',        actor: 'craig', agoMs: 2 * DAY },
  { projectSlug: 'kennel',        verb: 'EDITED',   target: 'doc / triage-keyboard-notes',    payload: 'rev 6 → rev 7 · 12 lines', actor: 'craig', agoMs: 3 * DAY },
];

// ─── Seeders ──────────────────────────────────────────────────────────────

export const seedAll = (db: DB) => {
  const slugToProjectId = new Map<string, string>();
  const docKeyToId = new Map<string, string>();
  const refKeyToId = new Map<string, string>();
  const skillSlugToId = new Map<string, string>();

  const tx = db.transaction(() => {
    // Projects
    const insertProject = db.prepare(
      `INSERT INTO projects
       (id, slug, name, description, context, status, pinned, rank, color,
        next_steps_dismissed, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
    );
    for (const p of PROJECTS) {
      const id = newId();
      slugToProjectId.set(p.slug, id);
      const created = isoMinusMs(p.createdMs);
      const updated = isoMinusMs(p.updatedMs);
      insertProject.run(
        id, p.slug, p.name, p.description, p.context ?? null, p.status,
        p.pinned ? 1 : 0, p.rank, p.color ?? null, created, updated,
      );
      ensureProjectDirs(p.slug);
    }

    // Docs (DB row first; file write follows after transaction)
    const insertDoc = db.prepare(
      `INSERT INTO docs
       (id, project_id, title, file_path, body_preview, word_count, revision, pinned, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const d of DOCS) {
      const id = newId();
      docKeyToId.set(d.key, id);
      const created = isoMinusMs(d.createdMsAgo);
      const updated = isoMinusMs(d.updatedMsAgo);
      const projectId = slugToProjectId.get(d.projectSlug)!;
      const filePath = `${d.projectSlug}/docs/${d.filename}`;
      const preview = d.body.replace(/^[#>*\-\s]+/gm, '').slice(0, 500);
      const wc = d.body.split(/\s+/).filter((w) => w.length > 0).length;
      insertDoc.run(id, projectId, d.title, filePath, preview, wc, d.revision, d.pinned ? 1 : 0, created, updated);
    }

    // References
    const insertRef = db.prepare(
      `INSERT INTO refs
       (id, project_id, type, label, url, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const r of REFS) {
      const id = newId();
      refKeyToId.set(r.key, id);
      const created = isoMinusMs(r.createdMsAgo);
      insertRef.run(id, slugToProjectId.get(r.projectSlug)!, r.type, r.label, r.url ?? null, r.notes ?? null, created, created);
    }

    // Items — link doc/ref refs if present
    const insertItem = db.prepare(
      `INSERT INTO items
       (id, project_id, kind, state, title, body, hash, due_at, rank, doc_id, reference_id, created_at, updated_at, last_touched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    let itemSeq = 0;
    for (const it of ITEMS) {
      itemSeq++;
      const id = newId();
      const created = it.createdMsAgo != null ? isoMinusMs(it.createdMsAgo) : isoMinusMs(7 * DAY);
      const updated = it.updatedMsAgo != null ? isoMinusMs(it.updatedMsAgo) : it.createdMsAgo != null ? created : isoMinusMs(1 * DAY);
      const dueAt = it.dueMs != null ? (it.dueAhead ? isoPlusMs(it.dueMs) : isoMinusMs(it.dueMs)) : null;
      insertItem.run(
        id,
        slugToProjectId.get(it.projectSlug)!,
        it.kind,
        it.state,
        it.title,
        it.body ?? null,
        it.hash ?? null,
        dueAt,
        it.rank ?? null,
        it.docKey ? docKeyToId.get(it.docKey) ?? null : null,
        it.refKey ? refKeyToId.get(it.refKey) ?? null : null,
        created,
        updated,
        updated,
      );
    }

    // Runbooks
    const insertRunbook = db.prepare(
      `INSERT INTO runbooks
       (id, project_id, urls, prerequisites, setup, run, deploy, troubleshoot, notes, revision, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    );
    for (const rb of RUNBOOKS) {
      const urls = rb.url
        ? JSON.stringify([{ label: 'Default', url: rb.url }])
        : null;
      insertRunbook.run(
        newId(), slugToProjectId.get(rb.projectSlug)!, urls,
        rb.prerequisites ?? null, rb.setup ?? null, rb.run ?? null,
        rb.deploy ?? null, rb.troubleshoot ?? null, rb.notes ?? null,
        rb.revision, isoMinusMs(rb.createdMsAgo), isoMinusMs(rb.updatedMsAgo),
      );
    }

    // Chats
    const insertChat = db.prepare(
      `INSERT INTO chats
       (id, project_id, claude_url, tagline, status, started_at, last_seen_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
    );
    for (const c of CHATS) {
      const started = isoMinusMs(c.startedMsAgo);
      const seen = isoMinusMs(c.lastSeenMsAgo);
      insertChat.run(newId(), slugToProjectId.get(c.projectSlug)!, c.claudeUrl ?? null, c.tagline, started, seen, started, seen);
    }

    // Skills
    const insertSkill = db.prepare(
      `INSERT INTO skills
       (id, project_id, name, slug, source, source_path, body, revision, status, last_synced_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'local_path', ?, ?, ?, 'active', ?, ?, ?)`,
    );
    const outreachId = newId();
    const triageId = newId();
    skillSlugToId.set('outreach-cadence', outreachId);
    skillSlugToId.set('triage-workflow', triageId);
    insertSkill.run(
      outreachId, slugToProjectId.get('picnic-engage')!,
      'outreach-cadence', 'outreach-cadence',
      '~/work/skills/outreach-cadence.md', outreachCadenceCurrent, 4,
      isoMinusMs(6 * DAY), isoMinusMs(45 * DAY), isoMinusMs(6 * DAY),
    );
    insertSkill.run(
      triageId, slugToProjectId.get('kennel')!,
      'triage-workflow', 'triage-workflow',
      '~/work/skills/triage-workflow.md', triageWorkflowBody, 2,
      isoMinusMs(20 * DAY), isoMinusMs(20 * DAY), isoMinusMs(20 * DAY),
    );

    // Skill proposals
    const insertProposal = db.prepare(
      `INSERT INTO skill_proposals
       (id, skill_id, proposed_body, rationale, triggered_by, status, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
    );
    insertProposal.run(
      newId(),
      outreachId,
      outreachCadenceProposed,
      "In your chat working through tier segmentation, you noted that OOO replies and manual holds were getting bucketed as opted-out, which dropped contacts that should re-enter the cadence. This proposal adds a 'paused' branch with a bounded re-check loop so paused contacts aren't permanently lost — and so opted-out remains a deliberate terminal state, not a default.",
      null,
      isoMinusMs(33 * MIN),
    );
    insertProposal.run(
      newId(),
      triageId,
      triageWorkflowProposed,
      'Header placement was wasting vertical density.',
      null,
      isoMinusMs(1 * DAY),
    );

    // Comments on the triage-keyboard doc
    const insertComment = db.prepare(
      `INSERT INTO entity_comments
       (id, entity_type, entity_id, parent_id, body, author, created_at)
       VALUES (?, 'doc', ?, NULL, ?, ?, ?)`,
    );
    const triageDocId = docKeyToId.get('triage-keyboard')!;
    for (const c of COMMENTS) {
      insertComment.run(newId(), triageDocId, c.body, c.author, isoMinusMs(c.createdMsAgo));
    }

    // Activity log
    for (const a of SEED_ACTIVITY) {
      logActivity(db, {
        projectId: slugToProjectId.get(a.projectSlug)!,
        verb: a.verb,
        target: a.target,
        payload: a.payload,
        actor: a.actor,
        occurredAt: isoMinusMs(a.agoMs),
      });
    }
  });
  tx();

  // Doc body files on disk — done after transaction so DB row commits first.
  for (const d of DOCS) {
    const filePath = join(contentRoot(), d.projectSlug, 'docs', d.filename);
    writeFileSync(filePath, d.body, 'utf8');
  }
};

export const runSeedIfEmpty = (db: DB) => {
  // Production sets KENNEL_SKIP_SEED=1 so a wiped DB stays genuinely
  // empty instead of refilling with demo fixtures. Dev leaves it unset.
  if (process.env.KENNEL_SKIP_SEED === '1') {
    console.log('[seed] skipped — KENNEL_SKIP_SEED set');
    return;
  }
  const { c } = db.prepare<[], { c: number }>(
    'SELECT COUNT(*) as c FROM projects',
  ).get()!;
  if (c > 0) {
    console.log(`[seed] skipped — ${c} projects already exist`);
    return;
  }
  console.log('[seed] empty DB → seeding…');
  seedAll(db);
  console.log('[seed] complete');
};

// CLI entry: `tsx src/seed.ts`
if (import.meta.url === `file://${process.argv[1]}`) {
  const { openDb, applyMigrations } = await import('./db.js');
  const db = openDb();
  applyMigrations(db);
  runSeedIfEmpty(db);
  db.close();
}
