# Life skin ("Tidewater") — build plan

Branch: `skin-life-tidewater` · **Authoritative design source:
`handoff/design_handoff_tidewater_2/`** (rev 2 = rev 1 + the `te-fresh` fix +
`ENG-ANSWERS.md`; rev 1 kept for history) against `handoff/skin_life_brief/` ·
Questions/answers: `handoff/tidewater_eng_questions/README.md` →
`handoff/design_handoff_tidewater_2/ENG-ANSWERS.md`.

## Product decisions (recorded 2026-06-10)

1. **Per-skin voice strings: build it.** A copy table keyed by skin
   (`src/lib/copy.ts` or similar); Tidewater strings extracted from the
   prototype, Workshop keeps current strings verbatim.
2. **"Claude suggests" per-item routing in Sort: deferred.** The preview
   pane ships with a reserved slot showing the item's current thread + kind
   as a quiet editable block; the suggests panel drops in when per-item
   routing ships (separate server-side feature).
3. **Undo toasts: all skins.** The toast system gains kinds
   (`crystal`/`release`/`focus`) + Undo callbacks; Workshop gets Undo too,
   with instant removal (no leave animation) and Workshop-voice copy.
4. **Dashboard "In focus" lens toggle: build it.** *What it serves ⇄ By
   when*, horizon grouping derived from `dueAt`, lens choice persisted.
5. **Chrome day/night toggle: dropped.** Theme control stays in Settings
   only, both skins.

## Design rulings (ENG-ANSWERS.md, 2026-06-10) — all questions resolved

- **A1 Sort legend.** Shipping key bindings unchanged; Tidewater verbs:
  `A` Pick up · `P` Set aside · `C` Crystallize · `D` Crystallize now ·
  `V` Convert · `S` Attach to a thread · `X` Let the tide take it.
  **Tiered legend:** footer shows only `A` Pick up · `P` Set aside ·
  `X` Let go; the rest behind a quiet **"more · ?"** affordance (hover or
  `?` opens a small popover with the full map). All keys always live —
  labels are tiered, bindings never are. No `↵` accept.
- **A2 suggests slot.** Reserved slot shows current thread + kind as a
  quiet editable block — labels "In" / "As a", `--ink-muted`,
  inline-editable on click, **on `--card`** (not `--action-soft`; it must
  read as state, not a CTA).
- **A3 `te-fresh`.** Confirmed bug; fresh edge uses `--action` gradient.
  Already fixed in rev 2's `skin-tokens.css:214`. Fresh is not a second
  sacred site.
- **B1 Login.** As proposed, plus a faint `Wave` divider under the wordmark
  (opacity ≈ .35). No temperature, no motion on error states.
- **B2 Aging board.** Anatomy = Reflecting (`AgingRow`), keys `U/C/F`,
  3-verb legend. Strings: subtitle *"Threads settling deeper. Nothing's
  wrong with that — just so you know."* · rows are "deepening", oldest
  "still." · `U` = **"Bring back up"** · threshold *"show threads quiet
  for"* + mono `[ 21 ] days` · empty *"Nothing's gone cold."* /
  *"Everything's still within reach."*
- **B3 Diff tokens** (proposal screen): `--diff-add-bg`
  `rgba(78,138,106,.14)` day / `rgba(111,181,142,.16)` night ·
  `--diff-add-ink` `#3F7458` / `#6FB58E` · `--diff-del-bg`
  `rgba(156,122,82,.12)` / `rgba(193,154,110,.13)` · `--diff-del-ink`
  `#8A6A45` / `#C19A6E` · proposal inset border `--fam-guide` 3px.
  Diffs ride the family hues, never sacred/action.
- **B4 Actor attribution.** `--action-soft` chip + `--action-ink` "CLAUDE"
  label (the chat-row "AI" medallion is canonical). Never solid `--action`
  fill — tint for attribution, accent itself only for actions.
- **B5 Pin.** `--ink-muted` star, filled when pinned.
- **B6 Density.** Only spacing tightens; **type never shrinks.**
  Roomy/Cozy/Compact: `--pad-panel` 22/18/14 · `--gap-panel` 18/14/11 ·
  `--density-row-pad` 12/9/7 · `--r-card`/`--r-ctrl` 17/11 · 15/10 · 13/9 ·
  type scale 1.0 everywhere.
- **B7 Drag.** `--action` 2px drop line (animates in under
  `--motion-scale`), lifted row `--shadow-lift` + opacity ≈ .92, cursor
  `grabbing`.
- **B8 confirm dialogs.** Native for now; future in-app confirm uses modal
  shell + release-promise voice ("Let the tide take it?" / "Still
  recoverable from search.").
- **C5 Aging whisper (dashboard).** Don't bury aging in a nav badge: one
  quiet line at the foot of "Where you were" — *"6 more deepening on the
  shelf →"* (`--ink-muted`, links to `/aging`). No card, no count badge.
  Rest of the reflow mapping confirmed as planned.

Still pending: A5 voice-table sanity pass by design once we extract it
(slice 6), and from product: prod hosting details + whether the test
instance gets a copy of real data.

## Architecture

- **Semantic token layer first, as no-ops.** New tokens (`--sacred`,
  `--action`, `--fam-field/-guide/-run`, `--dot-*`, `--r-card`, `--r-ctrl`,
  density tokens, `--motion-scale: 0`) defined in `:root` at base-skin
  values; `km-*` classes and the ~104 inline color literals re-pointed onto
  them. Base skin must remain pixel-identical (QA on `/components`).
- **Skin plumbing mirrors theme.ts.** `src/lib/skin.ts`:
  `'workshop' | 'life'`, persisted to `km.skin`, applies `.km-skin-life` on
  `document.documentElement`. Night = existing `.km-dark` composition.
- **Tidewater sheet** ported from `skin-tokens.css` (`.sk-tide` →
  `.km-skin-life`, `.sk-tide.night` → `.km-skin-life.km-dark`), including
  remaps of the `--v-*` (km-v4) vars so CrystalDetail/Trace/CrystalCard
  re-dress without forking. v4 untouched under Workshop.
- **Motion** lives entirely in CSS gated on
  `prefers-reduced-motion: no-preference` and scaled by `--motion-scale`
  (0 in Workshop = motionless). Entrance keyframes animate transform only,
  never from `opacity: 0`. Temperature never animates.
- **Reflows are skin-conditional layout branches** inside existing screen
  components (no component-tree forks); every Workshop section stays
  reachable in Life (brief §4 information parity).

## Slices

| # | Slice | Contents | Gate |
|---|---|---|---|
| 0 | Semantic tokens, no-op | token layer + literal-tokenizing pass; base pixel-identical | none |
| 1 | Skin plumbing | `skin.ts`, fonts (Bricolage Grotesque / Hanken Grotesk / Spline Sans Mono), minimal Settings skin row, env-driven vite proxy port | none |
| 2 | Tidewater sheet | day + night token values, v4 remap, chrome/nav/atoms wearing Life dress everywhere | none |
| 3 | Motion + permanence | toast kinds + Undo (all skins), two-phase `.item-leave`, day⇄night cross-fade | none |
| 4 | Dashboard + Sort + Reflecting | orientation strip, hearth, lens toggle, aging whisper (C5), two-col grid; Sort preview reflow w/ reserved slot (A2) + tiered legend (A1); Reflecting inline action bar | none |
| 5 | ProjectLanding + CrystalDetail + WeeklyReview | header/stat row, Built-on, Still true, summary strip | none |
| 6 | Secondary surfaces + voice | docs/trace/search/modals, Aging board strings (B2), proposal diff tokens (B3), full Settings Appearance (skin picker cards, density per B6), per-skin copy table | A5 table review (post-hoc) |
| 7 | QA + parallel deploy | AA contrast both modes, reduced-motion pass, information-parity walkthrough, test instance | deploy info |

## Parallel test deployment (decided 2026-06-10)

Hosted on Craig's Hetzner server alongside prod (`steep.work`), behind a
subdomain (e.g. `tide.steep.work` — TBD). Second checkout of the branch,
server on its own port (e.g. `PORT=8422`) with its own SQLite file, reverse
proxy route added for the subdomain; built client served from that instance
(vite proxy port becomes env-driven in slice 1 for local dev). Data:
**fresh test data from scratch** (seed), not a copy of prod.

## Invariants checklist (brief §5 — verify before merge)

- [ ] One sacred hue (sea-glass amber) on crystals/hearth only
      (incl. A3 resolution for `te-fresh`)
- [ ] One action accent (lagoon teal), rationed
- [ ] Three family markers (driftwood / sea-green / deep blue)
- [ ] Four temperature states distinguishable without text; aging ≠ alarm
- [ ] Six thread hues never compete with sacred/action
- [ ] Six state dots one-glance distinguishable
- [ ] All motion ≤ spec durations, interruptible, reduced-motion = end-state
- [ ] Keyboard maps byte-identical to Workshop
- [ ] Locked vocabulary intact (thread, bench, Sort, crystal, reflecting,
      filed, let go)
- [ ] AA contrast, both modes
