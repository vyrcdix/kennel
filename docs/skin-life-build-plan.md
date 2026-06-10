# Life skin ("Tidewater") — build plan

Branch: `skin-life-tidewater` · Inputs: `handoff/design_handoff_tidewater/`
(the chosen direction D) against `handoff/skin_life_brief/` · Open questions
to design: `handoff/tidewater_eng_questions/README.md`.

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

Design-side rulings still pending (see handback doc, fastest-path defaults
stated there): Sort legend presentation (A1), suggests-slot degraded anatomy
(A2), `te-fresh` sacred-hue exception (A3), uncovered surfaces (B1–B8),
density values (B6).

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
| 4 | Dashboard + Sort + Reflecting | orientation strip, hearth, lens toggle, two-col grid; Sort preview reflow w/ reserved slot; Reflecting inline action bar | A1, A2 |
| 5 | ProjectLanding + CrystalDetail + WeeklyReview | header/stat row, Built-on, Still true, summary strip | — |
| 6 | Secondary surfaces + voice | docs/trace/search/modals, full Settings Appearance (skin picker cards, density), per-skin copy table | B1–B8, A5 table review |
| 7 | QA + parallel deploy | AA contrast both modes, reduced-motion pass, information-parity walkthrough, test instance | deploy info |

## Parallel test deployment

Second checkout of the branch, server on `PORT=8422` with its own SQLite
file, second built client pointed at it (vite proxy port becomes env-driven
in slice 1). Pending from product: where prod runs (host/reverse proxy) and
whether the test instance gets a copy of real data (recommended — re-entry
feel can't be judged on fixtures).

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
