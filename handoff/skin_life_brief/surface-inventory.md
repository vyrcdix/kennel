# Life skin — surface inventory

The closed set of everything the skin must cover. If it isn't listed
here, it doesn't exist; if it is listed here, the token sheet and/or
pattern sheet must account for it. Code references are to the repo at
commit `5abce3d`.

## 1. Routes / screens (21)

| Route | Screen | Skin notes |
|---|---|---|
| `/` | Dashboard | Key screen (canvas). Panels: In focus (grouped by serves), Worth revisiting (resurfacing slot), crystallized-this-week gallery, pinned-thread cards, the bench rollup, aging strip, recent chats, weekly-review entry. |
| `/login` (pre-auth gate) | LoginScreen | Single password field; first impression of the skin. |
| `/project/:slug` | ProjectLanding | Key screen (canvas). Largest screen: header w/ actions, In focus panel, crystal gallery, pinned docs + guidebooks, recently-sorted strip, aging strip, conversations, tabbed item/doc/reference lists. |
| `/triage` | TriageQueue ("Sort") | Key screen (canvas). Two-pane: queue + preview. Filter chip rows (thread / kind / tag). Inline action bar on the selected row, convert popover, attach modal. |
| `/reflecting` | ReflectingBoard | Key screen (canvas). Single-list board, `?project=` scoped variant, "Show all threads" clearer. |
| `/aging` | AgingBoard | Single-list board + threshold number input. Same row anatomy as Reflecting (shared AgingRow). |
| `/crystal/:id` | CrystalDetail | Key screen (canvas). Two-pane: crystal (sacred-color wash, ctype picker, connections) + Built-on panel with attach picker. Currently the only `.km-v4` surface — Life replaces both looks here. |
| `/crystals` | CrystalsGallery | Card grid, ctype + thread filters. |
| `/project/:slug/trace` | TraceView | Timeline: crystal milestones, struck-through discards, day clusters, chat entries, filter row. Also `.km-v4`. |
| `/project/:slug/field-notes` | FieldNotesView | Five sections, scratchpad/managed toggle, per-section edit + Ask Claude. |
| `/runbook/:slug` | RunbookView | Six fixed sections, labeled URLs, revision stamp, section editors. |
| `/project/:slug/guidebook/:id` | GuidebookView | Ordered entry spine, drag reorder, entry-local tag chips, order/tags views. |
| `/doc/:id` (+ `/doc`) | DocEditor | Three columns: markdown source / preview / rail (tags, connections, comments). Autosave + revision stamps. |
| `/review/weekly` | WeeklyReview | Key screen (canvas). Summary strip, crystallized section, activity verb groups, still-aging list. |
| `/search` | GlobalSearch | Overlay-style screen: query box, syntax hints, grouped results with snippets + highlight marks. |
| `/proposal` + `/proposal/:id` | SkillProposal | Side-by-side diff (add/del tints), rationale, decision buttons, prev/next nav. |
| `/settings` | SettingsScreen | Appearance / Lifecycle / Smart Routing / Account sections. Skin picker will live here. |
| `/components` | ComponentsBoard | Internal component gallery — free QA surface for the pattern sheet. |
| `*` | redirect to `/` | — |

## 2. Shared components (the pattern-sheet checklist)

Chrome & navigation: `ChromeBar` (search box w/ ⌘K hint, Paste & route,
Capture primary button, logo slot, project chip slot) · `NavRail`
(workspace items w/ count badges, active-row treatments incl. the
crystal-gold special case, pinned threads w/ ●/○ markers, New thread,
version/sync footer).

Rows & cards: `NextUpRow` (grip, kind icon, project tag, due, state
dot) · `AgingRow` (shared by Aging + Reflecting; 3–4 action buttons,
aged label) · `ActivityEntry` · `ChatRow` · `CrystalCard` (sacred-color
card) · `ResurfacingSlot` (header + Still true / Revisit / Retire rows,
show-all toggle) · `RecentlySortedStrip` (routing rows + Undo) ·
`NextStepsStrip` · project cards (in Dashboard) · pinned doc/guidebook
cards (in ProjectLanding).

Atoms: `Icon` set (24-box stroke icons) · `KindIcon` · `StateDot` ·
`ProjectTag` (km-proj pill + 6 label hues) · `Label` · `Mono` · `Rev` ·
`Actor` (CRAIG/CLAUDE chips) · `SegBtn` · `TabButton` · `ThermalPanel`
+ `ThermalStamp` (temperature) · `TagChips` (chips + inline add input)
· `ConnectionsPanel` (inbound-edge groups w/ accent left borders) ·
`Toaster`.

Modals: `CaptureModal` · `PasteRouteModal` (textarea, hint seg control,
drag-drop) · `EditItemModal` (incl. TagChips) · `AttachToThinkingModal`
(typeahead) · `CreateProjectModal` · `EditProjectModal` ·
`RegisterChatModal` · `CreateGuidebookModal` · `AddGuidebookEntryModal`
· `AskClaude` (button + info popover).

## 3. Token inventory (what the sheet must re-map)

From `current-tokens.css` — see the file for exact values.

**Color:** core palette (bone/slate/slate-dark/moss/ember/dust/blaze +
derived ember-dark/ember-deep/slate-light) · surfaces 0–2 · line /
line-strong · fg / fg-muted / fg-faint · dark-mode remaps of all the
above · the `.km-v4` set (bg/sunk/card/ink/soft/faint/line/line2 +
blaze/dust/ember/moss/clay families, light + dark) — Life supersedes
v4, so fold its jobs into one coherent sheet.

**Type:** ff-display / ff-sans / ff-mono + the class scale
(km-display-lg/md/sm, km-body-lg/body/body-sm, km-mono/mono-sm).

**Component classes with embedded color** (these contain literals the
skin must address, not just var() references): km-proj + 6 label-hue
variants · km-tag · km-btn / -primary / -ghost / -moss · km-input
(+focus) · km-dot ×5 · km-card · km-active-row · km-row hover ·
km-link / -ember · km-kbd · km-rule · km-proposal · km-pin ·
km-diff-add/del · km-hl · km-code-block / -inline · km-logo-slot.

**New tokens the skin should propose** (base values = current
hard-coded behavior, so they land as no-ops): `--radius-card`,
`--radius-control`, `--density-row-pad`, `--density-panel-gap`,
`--type-scale` (or per-step sizes), `--motion-scale` (0 = base skin),
elevation/texture tokens as the direction requires.

## 4. State language (must stay one-glance distinguishable)

**Item states (6):** inbox/bench (no dot) · active/in-focus (ember
dot + km-active-row inset bar) · reflecting (dust dot) · crystallized
(moss dot) · filed (slate dot, .5 opacity) · dismissed (no dot,
struck-through in Trace).

**Crystal types (5):** principle · quote (rendered with quotation
marks) · reminder · hint · memory. Today differentiated by label only
— Life may add per-type texture if it stays subtle.

**Temperature (4):** fresh (≤24 h, ember-deep top edge + FRESH stamp)
· active (silent default) · aging (dust top edge + AGING stamp) ·
dormant (slate edge, 0.82 opacity + DORMANT stamp). Panel-level only;
never animated; never on chrome, editors, forms, or empty states.

**Thread label hues (6):** stone `#8C8275` · sage `#79876F` · dusk
`#6C7A8C` · plum `#87697C` · slate `#5A6066` · teal `#5E807A` — left
tint on the project pill only.

**Actor attribution:** Claude-authored comments/diffs carry ember
treatment + CLAUDE label; human content is neutral.

## 5. Interaction patterns (restyle, don't rewire)

- **Keyboard boards** — Sort (J/K + A/P/S/C/V/D/X), Aging (J/K +
  U/C/F), Reflecting (J/K + U/C/F/X); selected-row highlight;
  kbd-hint legends at panel/footer level.
- **Filter chips** — thread/kind/tag rows on Sort, ctype/thread on
  CrystalsGallery, entry filters on Trace; active vs idle chip state.
- **Inline action bars** — buttons revealed on the selected/hovered
  row (Sort rows, aging strips, resurfacing rows).
- **Popovers & typeaheads** — convert popover, attach-to-thinking
  typeahead, attach picker in Built-on, AskClaude info popover.
- **Toasts** — Smart Routing progress/result with detail line.
- **Drag** — guidebook entry reorder (grip, drop indicator, dragging
  state).
- **Editors** — autosave stamp cycling (editing · ⌘S → saved HH:MM),
  revision chip, markdown preview typography (headings, lists, code
  blocks per km-code-block).
- **Empty states** — every list has one ("The bench is clear.",
  "Nothing's gone cold.", "Nothing's set aside.", "no references in
  this thread"…): display line + mono subline. The Life skin's
  emotional register shows up here more than anywhere.
- **Search highlight** — km-hl marks on matched terms; grouped
  result sections with counts.
- **Confirmation prompts** — currently `window.confirm` for deletes/
  retire; styling these is out of scope (native), but note any
  direction implications for a future in-app confirm.

## 6. Things that look like design surface but are NOT in scope

- The mobile layouts (unbuilt — roadmap).
- The Kennel/Steep logo (separate commission; style the slot only).
- Email-ingestion surfaces (Phase 1, unbuilt).
- Voice/copy strings (flagged-extra only, per brief §3).
- The `window.confirm` dialogs (native).
