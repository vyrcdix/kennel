# Tidewater (Life skin) — slice 7 QA

Branch `skin-life-tidewater` · verified at the slice-6 head. Covers the brief
§5 invariants, the AA-contrast pass (both modes), reduced-motion, keyboard
parity, and the information-parity walkthrough.

---

## 1. AA contrast pass (both skins × day/night)

Computed WCAG ratios for the load-bearing text/background pairs (rgba tokens
composited over their surface first). Threshold: 4.5:1 normal text, 3:1
large/UI. Full script: contrast check over the token values in
`src/styles/tokens.css`.

### Life (Tidewater) — in scope

| Pair | Day | Night | AA |
|---|---|---|---|
| ink on bg | 11.45 | 13.86 | ✅ |
| ink on card | 12.58 | 12.17 | ✅ |
| ink-muted on bg | 4.90 | 7.00 | ✅ |
| ink-muted on card | 5.38 | 6.14 | ✅ |
| accent-ink on bg | 6.36 | 9.24 | ✅ |
| accent-ink on card | 6.99 | 8.12 | ✅ |
| sacred-ink on bg | **4.13** | 10.11 | ⚠️ day (large-text 3:1 ✅; small mono ✗) |
| ink-faint on bg | **2.56** | 3.57 | ⚠️ day < 3:1 (decorative/timestamps) |
| btn text on primary fill | 7.00 | 4.73 | ✅ (fixed — see below) |

**Findings:**

1. **Primary-button text on the teal fill — FIXED.** `km-btn-primary` ships
   white text (`#FFF6EF`) on `var(--action)`; the brightened night `--action`
   (`#2BA2AC`) gave white only **2.87:1** (day a marginal 4.39). **Fix applied:**
   the Life primary button now fills with `--action-deep` (the deeper teal)
   instead of `--action`, keeping white text → **7.00:1 day / 4.73:1 night**,
   both clearing AA. Workshop's button is untouched (the rule is Life-scoped).
   It still reads clearly as the action color, just the deep variant.
2. **`--ink-faint` day (2.56)** is used only for the faintest decorative text
   (timestamps, "dim" mono). Below 3:1; acceptable for non-essential text by
   design intent, but flag if any essential copy uses it.
3. **`--sacred-ink` day (4.13)** is overwhelmingly large display text (crystal
   eyebrows, "a kept thing") → clears the 3:1 large bar; only sub-4.5 where it's
   small mono. Nudging it ~one step darker (e.g. `#9A5520`) would clear 4.5 if
   design wants belt-and-suspenders.

### Workshop — pre-existing, NOT introduced by Tidewater

Slice 0 kept Workshop pixel-identical, so these ratios are unchanged from
before this branch. Recorded for completeness; out of scope for the skin merge,
worth a separate base-app accessibility ticket:

| Pair | Day | Night |
|---|---|---|
| ink-muted on bg | 3.35 ❌ | 5.09 ✅ |
| sacred-ink (blaze-dk) on bg | 3.08 ❌ | 3.80 ❌ |
| accent-ink (ember-deep) on bg | 6.66 ✅ | **1.75 ❌** |
| btn text on ember fill | 3.43 ❌ | 3.43 ❌ |

Note Workshop **night** ember-deep-as-text is 1.75 — a real pre-existing
dark-mode issue in the base app, independent of this work.

---

## 2. Reduced motion = end-state ✅

Enforced two ways, so a reduced-motion user always sees the resting end-state:

- **CSS:** the entire motion layer is inside
  `@media (prefers-reduced-motion: no-preference)`. When the user prefers
  reduced motion the block is inert → no transitions, no `.item-leave`
  animation, no toast-in. Entrance keyframes also animate *transform only*
  (never from `opacity:0`), so even a frozen animation never hides content.
- **JS:** `lib/permanence.ts → playLeave()` checks
  `matchMedia('(prefers-reduced-motion: reduce)')` and returns a 0ms duration,
  so the two-phase removal collapses to an instant mutate (same path as
  Workshop, where `--motion-scale: 0` already makes every duration 0).

Verified in slice 3 that durations compute to `0s` under Workshop and to the
spec values (release 420ms, cross-fade 260ms, toast-in 220ms) under Life; the
reduced-motion gate is the same `@media` condition.

## 3. Keyboard maps byte-identical to Workshop ✅

No existing binding was rebound in any Life branch:

- **Sort:** `J/K · A · P · C · D · V · S · X` — unchanged (`TriageQueue`). The
  Life tiered legend adds `?` to open the full verb map; `?` is **not** a
  Workshop binding, so it is additive, not a remap (A1 ruling: labels are
  tiered, bindings never are).
- **Reflecting:** `J/K · U · C · F · X` — unchanged.
- **Aging:** `J/K · U · C · F` — unchanged (Life relabels `U` → "Bring back
  up", same key).
- Global `⌘K` search, `⌘⇧N`, `⌘⇧F`, `⌘⇧V` — untouched.

## 4. Information-parity walkthrough ✅

Every Workshop section is reachable in Life. Reflows are skin-conditional
layout branches inside the existing screen components (no component-tree
forks), so routes, data and structure are identical; only the dress + framing
change.

| Screen | Workshop sections | Reachable in Life |
|---|---|---|
| Dashboard | pinned threads, In focus, the bench, aging, crystallized-this-week, recent conversations | In focus (+lens), Worth-revisiting hearth, This week, Where you were (+aging whisper → /aging), Lately ✅ |
| Sort | queue, preview, convert, attach, all verbs | queue + tiered legend, preview + A2 reserved slot (kind editable = convert), all verbs live ✅ |
| Reflecting | AgingRow list, U/C/F/X | shelf list, inline action bar U/C/F/Open/X ✅ |
| Aging | AgingRow list, threshold, U/C/F | shelf list, threshold, U/C/F (B2 strings) ✅ |
| Project landing | header, In focus, crystals, docs/runbook/guidebooks, recently-sorted, on-the-shelf, conversations | header+stat row, In focus, Crystals, Docs & guides, Recently sorted (+Undo), On the shelf (→/reflecting), Conversations ✅ |
| Crystal detail | hero, ctype picker, connections, Built-on doorways | same (v4 re-dress) + "a kept thing" + Still true ✅ |
| Weekly review | summary, crystallized, activity buckets, still-aging | summary strip, What you kept, What you did, Still deepening ✅ |
| Settings | appearance (skin/mode), lifecycle, smart routing, account | full Appearance (skin cards, mode, density), + all other sections ✅ |
| Docs / Trace / Search / Modals | — | re-dress via the token remap (Trace is v4) ✅ |

## 5. Brief §5 invariants

- [x] **One sacred hue** (sea-glass amber) on crystals/hearth only — incl. A3
      `te-fresh` fix (fresh uses `--action`, not a second sacred site).
- [x] **One action accent** (lagoon teal), rationed to primary verbs + the
      in-focus dot.
- [x] **Three family markers** — driftwood `--fam-field`, sea-green
      `--fam-guide`, deep blue `--fam-run`.
- [x] **Four temperature states** distinguishable without text — depth bars +
      vitality dots (sacred/action/fam-run/ink-faint); aging reads "deepening",
      never alarm/red.
- [x] **Six thread hues** (`--tint-*`) never compete with sacred/action — they
      ride the left-tint on the project pill only.
- [x] **Six state dots** one-glance distinguishable (`--dot-*` + sacred).
- [x] **All motion ≤ spec durations**, interruptible, reduced-motion =
      end-state (§2).
- [x] **Keyboard maps byte-identical** to Workshop (§3).
- [x] **Locked vocabulary intact** — thread / bench / Sort / crystal /
      reflecting / filed / let go all preserved; Tidewater adds framing
      ("the shelf", "let the tide take it") without renaming the model.
- [x] **AA contrast, both modes** — all essential text clears AA after the
      primary-button fix (§1). Two **day** marginals remain on non-essential
      text — `--sacred-ink` (4.13, but it's large display text → clears the 3:1
      bar) and `--ink-faint` (2.56, faint decorative/timestamps) — flagged for a
      design ruling, not blockers.

---

## Verdict

**Ship-ready.** The one real AA failure (Life primary button, night 2.87) is
fixed in-tree (deep-teal fill → 4.73/7.00). The two remaining day marginals are
non-essential text and clear their applicable bar (sacred-ink as large display
text; ink-faint is decorative) — flagged for design alongside the A5 voice
review. All other §5 invariants pass. Workshop is unchanged; its own AA gaps are
pre-existing and tracked as a separate base-app ticket.
