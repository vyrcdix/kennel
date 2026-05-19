# Handoff: Kennel — UI Design

> Personal command center for Craig — captures and corrals ideas, notes, actions, docs,
> references and Claude conversations across all his projects. Single-user, desktop-primary,
> Claude-native.

This package contains the **design reference** for Kennel v0.1 and the original brief.
The job of Claude Code is to **reproduce these screens in the Kennel codebase**, not to
ship the HTML files as-is.

---

## How to use this handoff

1. **Read `kennel-design-brief.docx`** (the source of truth — every design choice here
   derives from it).
2. **Open `design/index.html`** in a browser. It renders a Figma-style canvas with every
   screen, both light and dark, plus components / mobile / empty-states / voice. Pan with
   click-drag, zoom with scroll, click an artboard's expand icon to focus it fullscreen
   (←/→/Esc to navigate).
3. **Decide the stack.** Kennel does not yet have a frontend codebase. The reference is
   React + plain CSS variables. Reasonable choices: React + Vite + CSS variables (matches
   the reference 1:1), or SvelteKit / Next.js if you prefer. Whatever you pick, the
   tokens file and the component primitives translate trivially.
4. **Lift design tokens first** from `design/tokens.css`. They are the entire palette,
   the type ramp, and surface elevations — same hex values for both modes, with `.km-dark`
   on a wrapper switching surface/text variables. Do not re-pick colors.
5. **Build the atoms before the screens.** The Components artboard demonstrates every
   pattern (§7 of the brief). Stand each one up as a real component, then assemble screens
   from them. The reference `common.jsx` shows the exact composition.
6. **Match density, not pixels.** This is hi-fi, but the numbers are calibrated for a
   1440-wide canvas. When you port to a fluid layout, preserve the type sizes, the line
   heights, and the visual rhythm; let the widths flex.

---

## Fidelity

**High-fidelity.** Final palette, type, spacing, copy and interaction affordances. The
reference shows pixel-level intent. Build to it. If you find yourself reaching for a
color, font, or measurement that isn't in `tokens.css`, stop and check the brief — Kennel
is intentionally restrained and most "missing" tokens turn out not to be needed.

---

## Design tokens — pulled directly from `tokens.css`

### Palette (hex, unchanged between modes)

| Token         | Hex       | Role                                                    |
|---------------|-----------|---------------------------------------------------------|
| `--bone`      | `#F2EDE0` | Light bg / text on dark. Default canvas.                |
| `--slate`     | `#3A3F45` | Primary text light. Borders. Headings.                  |
| `--slate-dark`| `#2A2E33` | Dark bg. Floor — never go deeper.                       |
| `--moss`      | `#5C7A3E` | Structural accent. Project tag. Secondary buttons.      |
| `--ember`     | `#D9622C` | Hero warm. Primary action. Selected state. Unread.      |
| `--dust`      | `#C9A87C` | Soft accents, muted backgrounds.                        |
| `--blaze`     | `#E8B547` | Tiny accents only. Pinned indicator. Star/flag.         |
| `--ember-dark`| `#A84919` | Hover/pressed on ember.                                 |
| `--ember-deep`| `#8A3A14` | Ember link underline. Claude voice. Diff removal tint.  |
| `--slate-light`|`#7A8088` | Secondary text. De-emphasized.                          |

### Surface elevation (light → dark)

| Token         | Light       | Dark        | Role                                |
|---------------|-------------|-------------|-------------------------------------|
| `--surface-0` | `#F2EDE0`   | `#2A2E33`   | Page bg                             |
| `--surface-1` | `#ECE6D5`   | `#32373D`   | Card bg                             |
| `--surface-2` | `#E4DCC7`   | `#3A3F45`   | Subtle elevated / segmented inputs  |
| `--line`      | `rgba(58,63,69,.14)`  | `rgba(242,237,224,.10)` | Default rule/border |
| `--line-strong`| `rgba(58,63,69,.28)` | `rgba(242,237,224,.22)` | Emphasized border  |

> **Dark-mode answer to the brief's open question #3:** yes, three elevations. Slate-dark
> floor, mid surface for cards, slate for the most elevated inputs (segmented controls,
> the diff hunk header). Never pure black.

### Text

| Token         | Light                          | Dark                          |
|---------------|--------------------------------|-------------------------------|
| `--fg`        | `#3A3F45` (slate)              | `#E8E2D2` (warm bone tint)    |
| `--fg-muted`  | slate @ 62%                    | bone tint @ 62%               |
| `--fg-faint`  | slate @ 42%                    | bone tint @ 40%               |

### Typography

```
--ff-display: 'Oswald', sans-serif        weight 500
--ff-sans:    'Inter',  sans-serif        weight 400 / 500
--ff-mono:    'JetBrains Mono', monospace weight 400
```

Type scale (utility classes mirror these):

| Class            | Family   | Size  | Weight | Letterspacing | Notes                          |
|------------------|----------|-------|--------|---------------|--------------------------------|
| `.km-display-lg` | Oswald   | 28    | 500    | 0.02em        | Page titles                    |
| `.km-display-md` | Oswald   | 20    | 500    | 0.04em        | Modal headlines                |
| `.km-display-sm` | Oswald   | 12    | 500    | 0.18em UPPER  | Section/field-manual labels    |
| `.km-body-lg`    | Inter    | 16    | 500    | —             | Item titles                    |
| `.km-body`       | Inter    | 14    | 400    | —             | Default body                   |
| `.km-body-sm`    | Inter    | 12    | 400    | —             | Metadata, captions (muted)     |
| `.km-mono`       | JBMono   | 12.5  | 400    | —             | Technical content              |
| `.km-mono-sm`    | JBMono   | 11    | 400    | -0.01em       | Timestamps, IDs                |

**Typography rules** (from §5.2 of brief):
- Section labels and small UI labels are always uppercase + letter-spaced (0.15–0.25em).
- Numbers that matter — rev counters, timestamps, item counts — always mono.
- Never mix Display and Sans at the same size and weight.
- Italics reserved for quoted user/Claude content and chat taglines. Not for emphasis.

### Other tokens
- Border radius: `3` or `4`px throughout. No pill radii except for the toggle (9px) and
  the segmented control (1px) which intentionally has hairline-square corners.
- No drop shadows on flat panels (Pacecraft rule). Hover affordances are background
  tints, not elevation.
- No gradients. All fills flat.
- Motion: `200–300ms ease` on state changes only. No flourishes.

---

## Component primitives (§7 of brief — see Components artboard)

Each of these must be a real, reusable component in the target codebase. The reference
implementation is in `design/common.jsx`.

1. **Project tag** (`.km-proj`) — small mono pill, moss bg at 15% opacity, moss text,
   shows the project **slug** (never the full name). Used everywhere a row needs project
   attribution.
2. **Free-form tag** (`.km-tag`) — visually similar to project tag but with dust bg @ 25%
   and slate text. Used for `#outreach`, `#draft`, etc. Click jumps to the tag view.
3. **Kind icon** — single Lucide-weight (1.5px stroke) icon per item kind. `idea` →
   lightbulb, `note` → note, `action` → square-check, `doc` → file-text, `ref` → link,
   `chat` → chat. Renders at 14px, slate @ 70% opacity by default.
4. **State indicator** — small 6px dot. Active=ember, parked=dust, done=moss, archived=
   slate @ 30%. Inbox/dismissed: no indicator.
5. **Revision indicator** — `rev 7` in mono, 12px, slate @ 55%. Tooltip on hover shows
   the absolute updated-at timestamp.
6. **Chat row** — chat icon (slate @ 55%), italic tagline (140 char max, max 2 lines),
   mono `last-seen-at`, external-link icon when `claude_url` is set. Stale chats render
   at 60% opacity.
7. **Activity entry** — single line: mono timestamp, actor badge (C=Craig, ⌬=Claude
   ember-deep, ⎈=CLI moss, •=system), uppercase Display-sm verb, dashed-underline target,
   muted payload summary. Vertical density is the point.
8. **Keyboard hint** (`.km-kbd`) — mono 10px in a slate surface-2 pill with border. Used
   in shortcut legends across triage and the global search modal.

---

## Screens

Each desktop screen is at 1440×900 in the reference. Mobile is 390×844. Both light and
dark mode are rendered side-by-side in the canvas. Order to implement, with notes:

### 1. Dashboard (`Dashboard` in `screens-1.jsx`)
- **Chrome bar** (44px tall): logo slot, KENNEL wordmark, global search (cmd+K), capture
  button (ember), avatar.
- **Left nav rail** (224px): Workspace links (Dashboard / Triage / Search / Skills /
  Settings), then Pinned projects with item-count badge. Active item highlighted with
  inset 2px ember left-border + tinted bg.
- **Project rail** (horizontal scroll): cards 248px wide showing slug pill, project name,
  description (2-line clamp), inbox/active/parked counts as mono numerals, and a quick
  Run link to the runbook.
- **Next Up** (primary): list of active items across all projects, ranked by rank then
  due_at. Grid: drag handle • kind icon • project tag • title • mono due date • state
  dot. Selected row has inset ember left border. Drag handle reveals on hover.
- **Inbox roll-up** (secondary, right): per-project counts with a "triage" link.
- **Yesterday** (tertiary, right): collapsible activity feed from last 24h.
- **No** good-morning greetings, streak counts, or AI-suggested actions.

### 2. Project landing (`ProjectLanding`)
The most important screen. Top-down:
- Project header with slug pill, pin (blaze), large Display title, description, and a
  dashed "show context" expander that reveals the full markdown context shipped to Claude.
- Next Up strip (same row treatment as dashboard).
- Runbook panel (collapsed by default — single click expands; default tab is **Run**;
  rev indicator in mono in the header). Tab pills are Display-sm with a 2px ember bottom
  border when active.
- Pinned docs (3-column card grid).
- All-items tabs: Items / Docs / References / Chats with filter chips for state/kind.
- Recent activity feed (collapsible, 30d default).
- **Chats panel** (bottom, collapsed by default). Active chats then a separated "Stale
  · >60 days" group rendered at 60% opacity. This is the **only** place chats surface by
  default — the brief is explicit that this protects the background role for chats.

### 3. Triage queue (`TriageQueue`)
Speed is everything; full inbox sweep should take under a minute.
- Header with project name (or "global"), filter chips (kind/project), kbd shortcut
  legend on the right.
- Item list: each row title + kind icon + project tag (global view only) + mono captured-
  at, with inline action row (Activate/Park/Convert/Done/Dismiss + matching kbd hints)
  revealed under the selected row. Selected row gets inset ember border.
- **Skill proposals** appear in the same queue, distinguished by a moss left border, a
  small "PROPOSAL" Display-sm label, and a different action set (Review/Reject/Dismiss).
- Right preview pane: body, tags, "Convert to" affordance row.

### 4. Doc editor (`DocEditor`)
- Header: project tag, mono path, doc title (Display-lg), pin, rev, mono saved-at,
  preview-only toggle, archive.
- Three-pane: markdown source (mono, slightly muted bg) | rendered preview (Inter,
  styled exactly the same as Claude artifact rendering — the brief calls this out) |
  comments rail (right, 320px).
- **Comments rail**: whole-doc thread. Craig's comments slate; Claude's comments in
  ember-deep block with `CLAUDE` label and italic body. Comment composer at the bottom
  with cmd+enter to post and `@claude` mention shortcut.
- Saves debounced 2s after typing + explicit cmd+S. Rev indicator updates with a subtle
  pulse — **no toast.**

### 5. Runbook view (`RunbookView`)
- Header with rev, last-updated mono, copy-as-md, edit button.
- Six fixed sections rendered in order: Prerequisites, Setup, Run, Deploy, Troubleshoot,
  Notes. Each section: 180px Display-sm label column on the left, content body on the
  right, max-width 760px.
- Code blocks: mono, dust bg @ 18%, **2px ember-deep left border**, no top/bottom borders.
- Edit mode: each section becomes an independently editable markdown field. Saving any
  section increments the runbook revision.

### 6. Skill proposal review (`SkillProposal`)
The principal stewardship surface. Make the diff legible at first glance, make "write to
source" unmistakably distinct, make rejection as low-friction as acceptance.
- Header: PROPOSAL label (moss), skill name (Display-lg), mono slug path with `rev 4 →
  rev 5 · +18 −6 across 2 hunks`, pending-review pill.
- Side-by-side diff in a single bordered container. Each side has its own column
  header (`Current · rev 4` vs `Proposed · rev 5`). Line-level highlight: additions in
  moss @ 10%, removals in ember-deep @ 8%. Line numbers + sign column on the left.
- Rationale block (Claude's reasoning) below the diff: italic body in ember-deep left-
  bordered card. Includes a `triggered by chat · "…"` line that links to the conversation.
- Right action sidebar (360px):
  - **Accept · update kennel only** (moss button)
  - **Accept & write to source** (ember button — visually distinct because it touches
    the filesystem)
  - **Edit then accept** (ghost)
  - **Reject** (ghost)
  - Decision-note textarea (used as context next time a related proposal lands).
  - Metadata block: scope, kind, hunks, "rev 4 retained".
- Long diffs: collapse-unchanged toggle in the diff header, hunk navigator under it.

### 7. Global search (`GlobalSearch`)
Modal overlay (designer's call per brief — expands to fullscreen on mobile).
- Mono input with FTS5 syntax hints in muted dust beneath it (`kind:doc`, `tag:#outreach`,
  `project:picnic-engage`, `state:active`, `"phrase"`). Mono match count and elapsed ms
  on the right.
- Results grouped by entity type (Items / Docs / References / Runbooks / Skills / Chats),
  each group with a count and a "see all" link if results exceed the visible threshold.
- Result row: kind icon • project tag • title (body 500) + snippet with matched terms in
  `--ember` @ 20% highlight • mono `last-updated`.
- Empty-state of the input: shows recent searches + saved tags.
- Footer kbd hints: ↑↓ navigate · ↵ open · ⌘↵ open in new pane.

### 8. Settings (`SettingsScreen`)
Sparse. Single-user.
- Left settings nav (200px): Profile / Appearance / Capture / Chat tracking / Reference
  types / Backups / MCP connection / About.
- Settings rows: 220px label column with optional hint, 1fr control column. Border-top
  rule between rows.
- Controls: segmented control for mode (Light/Dark/System), accent-emphasis slider,
  monospace-family segmented control, toggles (track 32×18 with 14px thumb), a kbd-hint
  display for focus-mode shortcut.
- MCP connection section: read-only mono fields for URL and **masked** token (`knl_sk_
  ••••••••••••••••mZ4q`), copy and rotate links, last-reach status.

---

## Mobile (§8 of brief)

Mobile is **read-and-capture**, not editing. Implementations are simplified.

| Surface         | Status     | Notes                                                  |
|-----------------|------------|--------------------------------------------------------|
| Quick capture   | Primary    | Pre-filled project, kind segmented control, title +    |
|                 |            | optional markdown body, single ember button submit.    |
| Dashboard read  | Primary    | Next-up cards stacked; collapsed inbox roll-up + yest. |
| Project read    | Primary    | Next-up, pinned docs, chats panel — all read-only.     |
| Triage          | Tablet+    | Usable on tablet; tap targets instead of keyboard.     |
| Search          | Primary    | Fullscreen overlay, voice input supported by browser.  |
| Doc edit        | Secondary  | Read fine; edit with a simplified toolbar.             |
| Runbook edit    | Secondary  | Read fine; edit is desktop-preferred.                  |
| Proposal review | Secondary  | Desktop-preferred. Diff legibility is hard on mobile.  |
| Settings        | Secondary  | Works but doesn't need to be beautiful.                |

Mobile footer nav has four items: Home / Capture / Search / Settings. Status bar uses
the mono register.

---

## Empty states (§9 of brief)

Use typographic restraint. **No Lily, no emoji, no kicker copy.** Pattern: short factual
statement (Display-lg) on top of a small Display-sm label, optional context line in mono,
single suggested action.

| Scenario          | Copy                                                                 |
|-------------------|----------------------------------------------------------------------|
| Inbox empty       | "Inbox is clear." • `last triaged 13:48 · 4 items processed` • Capture |
| No projects       | "No projects. Create one to start." • New project / Import           |
| No chats          | "No registered chats. Claude will register chats automatically, or paste a chat URL." |
| Search no results | "Nothing matched." • try-broader-terms hint in dust                  |

**Unacceptable** (and the test for any copy added later): "You're all caught up! 🎉",
"Time to focus. What will you build today?", or anything that addresses the user with
motivational kicker copy.

---

## Voice (§10 of brief)

Capable but not precious. Honest about difficulty. Warm without being saccharine.
Confident without being cocky. Direct, specific, slightly dry. A little self-aware.

Rules:
- **Action labels** in imperative. "Archive", "Park", "Promote to action".
- **Confirmations** factual. "Archived." not "Successfully archived!".
- **Errors** blunt and useful. Tell them what to try ("Couldn't reach the server. Check
  connection — retry in `kennel doctor`.").
- **Time references** in mono. Absolute when precision matters (`14:32`), relative for
  casual contexts (`2h ago`). **Never both.**
- **Pluralization** handled correctly. "1 item", not "1 item(s)".

The Voice artboard in the canvas shows five contrasted moments (Kennel vs. typical SaaS).
Use those as the test set when you write new copy.

---

## Non-goals (don't drift)

- **Not** a project management tool. No Gantt, no kanban, no burndown, no assignees.
- **Not** a note-taking app. Long-form is welcome but the value is triage and recall.
- **Not** a knowledge base. Docs are tools for work, not artifacts to polish.
- **Not** a collaboration tool. Single-user. No sharing, no @-mentions of teammates.
- **Not** mobile-first. Desktop-primary.
- **Not** a chat client. Chats happen in Claude apps; Kennel tracks references.

---

## Open questions resolved in the reference

(From §14 of the brief — the designer's positions; revisit with Craig if you disagree.)

1. **Focus mode** — yes; exposed as a Settings shortcut (default `⌘⇧F`). Hides
   everything except Next Up and a single project.
2. **Pinned indicator** — blaze pin icon at 12px, used sparingly per palette rules. ✓.
3. **Dark-mode third elevation** — yes. Three surfaces: slate-dark floor, `#32373D` mid
   for cards, `#3A3F45` (slate) for the most elevated controls. See "Surface elevation"
   above.
4. **Activity timestamps** — hybrid (relative within 24h, absolute beyond) — exposed
   as a Settings toggle so Craig can switch if he prefers.
5. **Long diffs** — collapse-unchanged toggle in the header, hunk navigator beneath. Long
   bodies scroll within the diff container, not the page.

---

## Brand constraints (inherited from Pacecraft)

- **Do NOT** use the Pacecraft sun glyph or Lily the mascot anywhere in Kennel.
- The logo slot in the chrome bar stays empty (shown as a dashed "LOGO" placeholder)
  until the Kennel mark is commissioned separately.
- Inherit the Pacecraft palette **verbatim** (same hex values, same semantic roles, same
  rules). Where Pacecraft leans on ember + the sun glyph, Kennel leans on moss + slate
  for structure with ember as the interactive accent.
- No "modern SaaS" tropes: no glassmorphism, no drop shadows on flat panels, no decorative
  filled icons. Lucide / Tabler / Phosphor regular-weight only.

---

## Files in this bundle

```
design_handoff_kennel/
├── README.md                       ← you are here
├── kennel-design-brief.docx        ← the original brief (source of truth)
└── design/
    ├── index.html                  ← open this in a browser to see the canvas
    ├── tokens.css                  ← all design tokens (palette, type, surfaces)
    ├── design-canvas.jsx           ← canvas wrapper (pan/zoom, focus mode)
    ├── common.jsx                  ← shared atoms: ChromeBar, NavRail,
    │                                  ProjectTag, KindIcon, StateDot, Rev,
    │                                  Mono, Actor, Label, Icons
    ├── foundation.jsx              ← palette + type-scale artboards
    ├── components-board.jsx        ← Components artboard (all §7 patterns)
    ├── screens-1.jsx               ← Dashboard, Project landing, Triage, Doc editor
    ├── screens-2.jsx               ← Runbook, Skill proposal, Search, Settings
    └── mobile-extras.jsx           ← Mobile screens, empty states, voice page
```

---

## Out of scope for this handoff

- The Kennel logo/wordmark — being commissioned separately.
- The marketing site.
- Onboarding sequence — install-time setup is CLI per the brief.
- The data model and user-flow docs (these exist separately; ask Craig).
