# Re: Tidewater — answers to engineering questions

**To:** Engineering (via Craig)
**From:** Claude design
**Date:** 2026-06-10
**Re:** your handback on `design_handoff_tidewater/`

Great review — you caught a real one (A3). Replies inline by item number.
Short version: almost all your proposed defaults are **confirmed**; the few
that need design are A1 (legend), B3/B6 (token tables), and C5 (an aging
whisper). Nothing here should block slices 0–2.

---

## A. Conflicts with brief invariants

**A1 — Sort keyboard map. You're right; my legend drifted. Keep the shipping
bindings exactly.** The deviation was a prototype shortcut, not a proposal.
Final ruling on presentation (this is the real design answer to "how to show 7
verbs without the decision-fatigue wall"):

- **Bind nothing new. Restyle the existing map only.** Tidewater verbs, base keys:
  - `A` → **Pick up**
  - `P` → **Set aside**
  - `C` → **Crystallize**
  - `D` → **Crystallize now** (direct)
  - `V` → **Convert**
  - `S` → **Attach to a thread**
  - `X` → **Let the tide take it**
- **Tier the legend so it's calm, not a wall.** Footer legend shows the three
  high-frequency verbs inline: `A` Pick up · `P` Set aside · `X` Let go.
  The rest (`C/D/V/S`) live behind a quiet **“more · ?”** affordance (hover/`?`
  reveals the full map as a small popover). All keys stay live whether or not
  the popover is open — we're hiding *labels*, never *bindings*.
- **No `↵` accept.** That came with the routing panel (A2), which is gone.

This satisfies §4 (map unchanged) and the ADHD brief (visible surface area
stays at 3, full power is one keystroke away).

**A2 — “Claude suggests” routing panel. Confirmed deferred.** Your
no-suggestion slot is exactly right: same preview anatomy, drop the
spark/“Claude suggests” header and accept semantics, show **current thread +
kind as a quiet editable block** (label it “In” / “As a”, `--ink-muted`,
inline-editable on click). Reserve the slot so the suggests panel drops in
later with zero relayout. One note: keep the block on `--card` (not the
`--action-soft` wash my panel used) so it reads as state, not a CTA.

**A3 — `te-fresh` using `--sacred`. Confirmed bug; use `--action`.** Good
catch — that violates the one rule. Fresh edge → `--action` (lagoon) gradient,
matching base's ember-deep logic. I've left the prototype as-is for now;
the fix is one line and I'll mirror it so the files don't diverge. **Fresh is
not a second sacred site** — the one-rule text stands.

**A4 — In-focus lens toggle. Acknowledged; thanks for approving.** Nothing
from me. (For the record it's the one piece of genuinely new UX in the skin
and I think it earns its place — glad it cleared the §4 bar on your side.)

**A5 — Voice strings. Confirmed** — extract the table yourselves; I'll do the
sanity pass when you post it. Aging-board strings you don't have yet are in
B2 below so you can include them in the same table.

---

## B. Uncovered surfaces

**B1 — Login. Confirmed** as proposed (centered `.panel` on tinted `--bg`
wash, display wordmark, `--action` primary). Add one grace note: a single
faint wave divider under the wordmark (the `Wave` atom, opacity ~.35) — it's
the skin's signature mark and the login is the first impression. Empty/error
states stay still (no temperature, no motion).

**B2 — Aging board. Confirmed** — identical to Reflecting (`AgingRow`),
threshold as a quiet mono control, keys `U/C/F` (no X), 3-verb legend.
Tidewater strings for it:

- Title: **Aging** (nav label unchanged) · page voice subtitle:
  *“Threads settling deeper. Nothing’s wrong with that — just so you know.”*
- The rows are **“deepening”** (not “stale”); oldest reads **“still.”**
- `U` verb here: **“Bring back up”** (it's resurfacing from depth, not the
  shelf — keeps it distinct from Reflecting's “Pick back up” without being
  fussy; if you'd rather one verb everywhere, “Pick back up” is fine).
- Threshold control label: *“show threads quiet for”* + mono `[ 21 ] days`.
- Empty state: **“Nothing’s gone cold.”** / sub *“Everything’s still within
  reach.”*

**B3 — Skill proposal. Confirmed** your derive direction; concrete values:

| token | day | night |
|---|---|---|
| `--diff-add-bg` | `rgba(78,138,106,.14)` | `rgba(111,181,142,.16)` |
| `--diff-add-ink` | `#3F7458` | `#6FB58E` |
| `--diff-del-bg` | `rgba(156,122,82,.12)` | `rgba(193,154,110,.13)` |
| `--diff-del-ink` | `#8A6A45` | `#C19A6E` |
| proposal inset border | `--fam-guide` 3px | `--fam-guide` 3px |

Rationale: add/del ride the **family** hues (guide=sea-green, field=driftwood),
not sacred/action — diffs are neither “kept” nor a primary verb, and the
family palette is exactly the quiet-but-distinct register diffs want.

**B4 — Actor attribution. Use the action *family*, not solid `--action` —
and you're right to worry about dilution.** Spec: Claude-authored content gets
an **`--action-soft` chip with `--action-ink` “CLAUDE” label** (the “AI”
medallion in the prototype's chat rows is the canonical treatment). Never the
solid `--action` fill — that stays rationed to primary buttons + the in-focus
dot. So: attribution = *tint* of the accent, actions = the *accent itself*.
That keeps the hierarchy intact.

**B5 — Pinned indicator. Confirmed** — `--ink-muted` star, filled when pinned.
(Correct call keeping sacred off it.)

**B6 — Density. Confirmed** your Roomy/Cozy/Compact default, with one
constraint: **only spacing tightens; type never shrinks** (keeps every density
AA-safe without clamping math). Table:

| token | Roomy (native) | Cozy | Compact |
|---|---|---|---|
| `--pad-panel` | 22px | 18px | 14px |
| `--gap-panel` | 18px | 14px | 11px |
| `--density-row-pad` | 12px | 9px | 7px |
| `--r-card` / `--r-ctrl` | 17 / 11 | 15 / 10 | 13 / 9 |
| type scale | 1.0 | 1.0 | 1.0 |

(Radii ease down slightly with density so tight rows don't look bubbly. Type
fixed.)

**B7 — Drag affordances. Confirmed** — `--action` 2px drop line, lifted row
gets `--shadow-lift`. Add: dragging row at ~0.92 opacity, grip cursor
`grabbing`, and the drop line animates in under `--motion-scale` (instant at 0).

**B8 — `window.confirm`. Noted, no action.** Forward-note for whenever an
in-app confirm replaces it: use the modal shell + the release-promise voice
(“Let the tide take it?” / “Still recoverable from search.”) — destructive
confirms are exactly where the kind register matters most.

---

## C. Smaller confirmations

1. **Night = dark mode → confirmed.** `.km-skin-life.km-dark` driven by the
   existing Light/Dark/System setting is correct. The chrome day/night button
   is additive convenience chrome; the skin is complete without it — ship it
   only if product wants the one-tap.
2. **Skin class naming → confirmed.** `.km-skin-life` / `.km-skin-life.km-dark`
   is the canonical name; my `.sk-tide` / `.sk-tide.night` translate 1:1
   (`.sk-tide`→`.km-skin-life`, `.night`→`.km-dark`).
3. **`.km-v4` surfaces → confirmed.** Life remaps v4 vars under
   `.km-skin-life`; base keeps v4 untouched.
4. **Fonts → confirmed.** Google Fonts now; self-hosting is a separate infra
   task, not design-gating.
5. **Dashboard reflow → mapping confirmed, with one change: give aging a
   whisper, don't bury it in a nav badge.** Object-permanence wants ambient
   presence, and a badge alone is too quiet. Add a **single quiet line at the
   foot of the “Where you were” panel**, no card, no count-badge:
   *“6 more deepening on the shelf →”* (`--ink-muted`, links to Aging). That's
   the ambient cue; everything else in your mapping is right (bench→orientation
   strip, chats→Lately, review→This-week footer link, due→In focus).
6. **Toast undo → mechanism confirmed.** Kinds + Undo callback + two-phase
   `.item-leave`, gated by `--motion-scale`. My recommendation on “does base
   skin also get Undo toasts”: **yes** — it's a pure kindness with no palette
   or voice dependency, and the two-phase removal reads well in any skin. But
   it's a product call; the mechanism is shared regardless.

---

*Net: build per your defaults; the only things that changed your plan are A1's
tiered legend, the aging whisper (C5), and the concrete B3/B6 tables. Ping me
for the A5 voice-table pass whenever it's posted.*
