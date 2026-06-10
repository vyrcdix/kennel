# Handoff: Steep — "Tidewater" Life skin

## Overview
**Tidewater** is a complete reskin ("skin") of the Steep app for the *life-management*
persona — someone running their personal life (training, travel, reading, a creative
project) rather than a work project. It is **direction D** of the Life-skin exploration
and the one selected for build.

The skin keeps every route, component, data shape and keyboard model of the base
("Workshop") skin and only changes the *dress*: palette, type, shape, density, motion
and voice. The governing metaphor is **tide & sediment** — thoughts wash in onto *the
bench*, you sort them with the current, and the things you decide are true **settle out
as crystals** (sea-glass that glows warm against cool water). Releasing something is
"letting the tide take it," never a destructive "delete."

It ships in two temperatures: **warm day** (light) and **cool night** (dark).

## About the design files
The files in this bundle are **design references created in HTML/React-via-Babel** —
runnable prototypes that show the intended look and behavior. They are **not production
code to copy directly.** The task is to **recreate these designs in the target
codebase's environment** (the existing Steep app — React + its real component library,
router and state) using its established patterns. The prototype deliberately fakes data,
routing and persistence; map those onto the real app's equivalents.

If you only read one thing: implement the **`skin-tokens.css`** variable contract and the
**Tidewater System.html** spec — everything else follows from them.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, motion and copy are all
specified. Recreate the UI faithfully using the codebase's existing primitives. Exact
token values are in `skin-tokens.css` and tabulated in `Tidewater System.html` (§1).

---

## How the skin is structured (the core idea)
The entire skin is a **CSS custom-property remap** applied via one class on the app root:

- `.sk-tide` → day (warm)
- `.sk-tide.night` → night (cool)

Every component reads only `var(--…)` tokens (never literals), so swapping the class
re-skins the whole app. This is the `.km-skin-life` mechanism the brief asked for. To add
Tidewater to the real app, port `skin-tokens.css` into the app's token layer and gate it
behind the skin/theme selector — **do not** fork component styles per skin.

Invariant across skins (must not change): routes, component structure, the 6 item states,
5 crystal types, 4 temperature states, 6 thread-label hues, keyboard maps, copy keys.

---

## Screens / Views
All screens share **chrome** (top bar: logo, ⌘K search, Paste & route, Capture, day/night
toggle, avatar) and a **left nav rail** (Moods: Dashboard, The bench, Reflecting, Aging,
Weekly review, Crystals, Settings · Pinned threads · New thread · version/sync footer).
Main content is a single scroll region; min app width ≈ 1040px (desktop).

### 1. Dashboard (`/`) — re-entry
- **Purpose:** calm re-orientation, not an audit. No greeting, no streak.
- **Layout:** orientation strip (date · "The tide's calm." · subline · primary button
  "Sort the bench"); then **Worth revisiting** hearth (full-width, 3 crystal cards);
  then a 2-col grid — left: **In focus** + **This week**, right: **Where you were**
  (threads w/ depth bars) + **Lately** (activity).
- **In focus** has a **lens toggle**: *What it serves* (grouped by goal/crystal, clock on
  time-sensitive items) ⇄ *By when* (grouped This week / Soon / When it comes around,
  thread pill on each). Neither order is imposed — the user picks the frame.

### 2. The bench / Sort (`/triage`) — keyboard triage
- **Layout:** two-pane. Left = queue (384px) with filter chips + kbd legend footer.
  Right = preview: item kind/meta, large text, body, **"Claude suggests"** routing panel
  (thread + kind + Change…), action row.
- **Keyboard:** `J/K` move · `↵`/`A` accept route · `S` set aside · `C` crystallize ·
  `X` let go. Acting animates the row out, then a toast (with Undo).

### 3. Reflecting (`/reflecting`) — the shelf ("shallows")
- **Purpose:** things set aside; a holding state, never a graveyard. Longest-shelved first,
  no due dates, no nag.
- **Layout:** centered single list (max 780). Thread filter chips + kbd legend.
- **Row:** state dot · kind icon · text · thread pill (navigates) · `#tag` · shelved-age.
  A resolved question shows "answer came in — ready to settle."
- **Selected row** reveals an inline action bar: **Pick back up** (`U`), **Crystallize**
  (`C`), **File** (`F`), **Open** (items with a body), **Let the tide take it** (`X`).
  `J/K` walk. Pick-back-up/let-go animate the row off the shelf + toast w/ Undo.

### 4. Project landing (`/project/:slug`) — largest screen
- **Header:** medallion, name, temperature pill, blurb, stat row (in focus / on the shelf
  / crystals / docs), actions (Field notes, Trace, Ask Claude, Capture here).
- **2-col:** left = In focus, Crystals (2-up grid → Crystal detail), Docs & guides (→ Doc /
  Runbook / Guidebook); right = Recently sorted (+Undo), On the shelf (→ Reflecting),
  Conversations.

### 5. Crystal detail (`/crystal/:id`)
- **Layout:** 2-col. Left = the crystal hero (sea-glass wash, "a kept thing", big text,
  note, re-surfaced count, "Still true" button) + a crystal-type picker. Right = **Built
  on** (inbound lineage with amber left-borders, +Attach more) and **It serves**.

### 6. Weekly review (`/review/weekly`)
- Summary strip (captured / kept / let go / sorted / waiting — "kept" in amber); **What you
  kept** (crystallized this week) + **What you did** (verb groups) + **Still deepening**.
  Register: "Not a report card."

### Secondary surfaces
- **Doc editor (`/doc/:id`)** — 3 columns: markdown source / live preview (see `.md-body`
  typography) / rail (tags, connections, comments, Ask Claude). Autosave stamp + rev chip.
- **Trace (`/project/:slug/trace`)** — vertical timeline, day clusters, crystal milestone
  nodes (sea-glass), struck-through discards, chat + capture entries, filter chips.
- **Field notes (`/project/:slug/field-notes`)** — five sections, each tagged *Claude-kept*
  or *scratchpad*, per-section edit + Ask.
- **Runbook (`/runbook/:slug`)** — six fixed numbered sections, labeled URL chips, rev stamp.
- **Guidebook (`/guidebook/:id`)** — ordered entry spine with drag grips; Order/Tags views.
- **Global search (⌘K)** — overlay: query box, syntax-hint chips, grouped results with
  `.hl` match highlight.
- **Settings (`/settings`)** — Appearance (live **skin picker**: Life/Workshop cards +
  Day/Night + Density), Lifecycle, Smart Routing. This is where the skin switch lives.
- **Modals** — Capture (textarea + kind chips), Paste & route (textarea/drop zone + mode
  seg + "Claude sees N things" preview).

---

## Interactions & behavior
- **Routing:** `go(name, arg?)` in `tide-app.jsx`; route + theme + current project persisted
  to localStorage (so refresh keeps your place — replace with the app's router/store).
- **Toasts:** fire `window.dispatchEvent(new CustomEvent('tide-toast',{detail:{text,kind,undo,onUndo}}))`;
  `ToastHost` renders a bottom-center stack, auto-dismiss 4.2s, optional Undo. Kinds:
  `crystal` (amber gem), `release` (tide), `focus` (pickup).
- **List item removal** is two-phase: add `.item-leave` (+ `.release`/`.crystal` modifier),
  wait the animation duration, then remove from state and fire the toast. This is what makes
  "let go" feel like a release, and every removal offers Undo (object permanence).
- **Empty states** matter most here — see Voice below; render display line + mono subline.

## Motion (literal spec — see `Tidewater System.html` §3)
All motion lives in `skin-tokens.css`, gated on `@media (prefers-reduced-motion: no-preference)`
and scaled by `--motion-scale` (`0` = motionless = base skin). Durations: row select 140ms,
hover 120ms, toast-in 220ms, pick-back-up 360ms, let-go 420ms, crystallize 300ms, route
180ms, day⇄night 260ms. Easing: gentle ease / ease-out / ease-in-out — never bouncy.
**Critical rule:** entrance keyframes animate **transform only, never `opacity:0`**, so a
frozen/again-disabled animation never hides content (the resting state is always the visible
end-state). Temperature is never animated.

## State management
Prototype state is local React state per screen. For the real app, map to:
- selected-row index per keyboard board (Sort, Reflecting)
- In-focus lens (`serves` | `horizon`)
- overlay (`search` | `capture` | `paste` | null)
- theme (`day` | `night`) and skin — persisted, app-wide
- list mutations (remove on pick-up/file/let-go/crystallize) with an undo snapshot

## Design tokens
Authoritative source: **`skin-tokens.css`**. Summary (day → night):
- **Ground:** `--bg` #EBEEE3 → #0E1B20 · `--card` #F7F8F0 → #16272D · `--card-2` #FFFFFF →
  #1B3038 · `--sunk` #DEE2D2 → #0A151A
- **Ink:** `--ink` #213138 → #DCE7E3 · `--ink-muted` #566A66 → #93A8A3 · `--ink-faint`
  #8A988F → #5F7570
- **Sacred (crystals only):** `--sacred` #DB8A4C → #E89A57 · `--sacred-ink` #A85F22 → #F0BA8A
- **Action (primary + in-focus):** `--action` #14808A → #2BA2AC · `--action-ink` #0E5E66 → #6FCAD2
- **Families:** field #9C7A52→#C19A6E · guide #4E8A6A→#6FB58E · run #3E6E8C→#6FA3C6
- **Thread hues (6):** stone/sage/dusk/plum/slate/teal — `--tint-*`, lightened for night
- **Shape:** `--radius-card` 17px · `--radius-control` 11px
- **Type:** display **Bricolage Grotesque**, body/UI **Hanken Grotesk**, mono **Spline Sans
  Mono** (load-bearing: slugs, timestamps, kbd)
- **Motion:** `--motion-scale` 1
- The **one rule**: `--sacred` appears only on crystals/hearth; `--action` carries every
  primary verb + the in-focus dot. Nothing else borrows either hue.

## Voice (see `Tidewater System.html` §5)
Kind, never alarm; recoverable, never lost; a choice, never a chore. Verbs: *Let the tide
take it* (not Delete), *Set aside / Pick back up* (not Archive/Snooze), *Crystallize / a kept
thing* (not Save/Pin), *deepening / still* (not Stale/Overdue), *Still true?* (not Review due).
Empty states carry the emotion: "The bench is clear." / "Nothing's gone cold." / "Nothing's
set aside." Every removal toast: "…Still in search if you want it back."

## Assets
No raster assets. All icons are inline stroke SVGs (Lucide-style) in `helpers.jsx` (`Ic` set).
Logo is a CSS gradient medallion — style the slot only; the real Steep logo is a separate
commission. Fonts load from Google Fonts (swap for the app's self-hosted equivalents).

## Screenshots (`screens/`)
Reference captures of the key surfaces. Day = warm (light), Night = cool (dark).
- `day-01-dashboard.png` — re-entry dashboard + Worth-revisiting hearth
- `day-02-sort.png` — the bench / Sort, two-pane with Claude's routing
- `day-03-reflecting.png` — the shelf
- `day-04-project.png` — project landing
- `day-05-crystals-gallery.png` — crystals gallery
- `day-06-crystal-detail.png` — crystal detail + Built-on
- `day-07-weekly-review.png` — weekly review
- `night-01-dashboard.png` — dashboard, cool night
- `night-02-crystal-detail.png` — crystal detail at night (the sea-glass amber glowing warm
  against deep water — the skin's signature moment)

## Files in this bundle
- `Tidewater.html` — the full app (open this first; all 13 screens + modals + search)
- `Tidewater System.html` — the system sheet: tokens, patterns, motion, skin-switch, voice
- `skin-tokens.css` — **the token + component + motion contract** (the heart of the skin)
- `helpers.jsx` — icon set + small atoms (Icon, Ic, KindIcon, Mono, Kbd)
- `data.jsx` — all demo persona content + data shapes
- `tide-core.jsx` — Chrome, NavRail, shared atoms (Pill, CType, Depth, Wave, SegBtn,
  EmptyState), ToastHost, `toast()`
- `tide-home.jsx` — Dashboard, Reflecting
- `tide-work.jsx` — Project landing, Sort
- `tide-keep.jsx` — Crystal detail, Weekly review, Crystals gallery, Settings
- `tide-docs.jsx` — Doc editor, Field notes, Runbook, Guidebook
- `tide-trace.jsx` — Trace, Global search
- `tide-modals.jsx` — Capture, Paste & route, modal shell
- `tide-app.jsx` — app shell: theme, routing, overlay state, ⌘K

> Note: the prototype loads JSX via in-browser Babel for portability. In the real codebase,
> these become ordinary components — keep the file/feature grouping, drop the `window.*`
> globals and the Babel script tags.
