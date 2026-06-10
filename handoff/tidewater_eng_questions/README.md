# Handback: Tidewater — engineering questions before build

**To:** Claude design
**From:** Engineering (via Craig)
**Date:** 2026-06-10
**Re:** `handoff/design_handoff_tidewater/` (Tidewater Life skin)
**Status:** Build plan drafted; branch `skin-life-tidewater` open. We can start
the token/plumbing slices immediately — the questions below gate the
*screen-level* slices, so answers can arrive while slices 0–2 land.

We reviewed the bundle against the brief (`handoff/skin_life_brief/`) and the
codebase at `5abce3d`. The token contract (`skin-tokens.css`) and system sheet
are clear and we're implementing them as specified: a semantic token layer
(`--sacred`, `--action`, `--fam-*`, `--dot-*`, `--r-card`, `--r-ctrl`,
density + `--motion-scale`) landed first as no-ops at base-skin values, then
`.km-skin-life` / `.km-skin-life.km-dark` remapping onto it. Below are the
places where the prototype conflicts with the brief's invariants, plus surfaces
the bundle doesn't cover. For each we state our proposed default — **if a
default is fine, just say "confirmed"; only elaborate where we guessed wrong.**

---

## A. Conflicts with brief invariants (need a ruling)

### A1. Sort keyboard map — prototype legend conflicts with the locked map
Brief §4: the keyboard model may not change. The shipping Sort map is
`J/K · A pick up · P set aside · C crystallize · D crystallize(direct) ·
V convert · S attach-to-thinking · X let go` (`TriageQueue.tsx:361-391`).
The prototype's legend and handlers show `J/K · ↵/A accept route · S set
aside · C crystallize · X let go` — i.e. **S is rebound** (set-aside vs
attach), **P/V/D are dropped**, and **↵/A gets new "accept route" semantics**.

**Proposed default:** keep the shipping key bindings exactly; restyle the
legend in Tidewater dress with Tidewater verbs (`A` "Pick up", `P` "Set
aside", `X` "Let the tide take it", with `V`/`S` still listed). No `↵` accept.
**Need from you:** confirm, or redesign the legend around the full base map
(it has 7 verbs, your legend shows 5 — tell us how to present the other two
without re-creating the decision-fatigue wall).

Reflecting matches base exactly (`U/C/F/X`) — no issue there.

### A2. "Claude suggests" routing panel in the Sort preview
The prototype's preview pane centers on a per-item routing suggestion
(thread + kind + "Change…", accepted with ↵/A). **The product has no
per-item routing suggestion** — Smart Routing exists only in the Paste &
route flow. Building per-item suggestions is server-side feature work, out
of skin scope per brief §4.

**Product ruling (2026-06-10): deferred.** We ship the preview pane in
Tidewater dress *without* the suggests panel — in its slot we show the item's
current thread + kind as a quiet, editable block (same visual anatomy as your
panel, minus the spark/"Claude suggests" header and accept semantics). When
per-item routing ships later, the panel drops into the reserved slot.
**Need from you:** only a small spec if the no-suggestion slot anatomy above
isn't what you'd want; otherwise nothing.

### A3. `te-fresh` uses the sacred hue
`skin-tokens.css:214` paints the *fresh* temperature edge with a
`var(--sacred)` gradient. Your own "one rule" (README, system sheet §1) says
sacred appears **only** on crystals/hearth. Base skin uses ember-deep for
fresh.

**Proposed default:** fresh edge uses `--action` (lagoon) instead.
**Need from you:** confirm, or declare fresh an intentional second sacred
site (and update the one-rule text so QA doesn't flag it forever).

### A4. Dashboard "In focus" lens toggle is new functionality
The *What it serves ⇄ By when* segmented toggle (plus the horizon grouping
"This week / Soon / When it comes around") doesn't exist in the base
Dashboard — it's new UI state + new grouping logic, which brief §4 bans and
the handback didn't flag.
**Product ruling (2026-06-10): approved — we're building it** (grouping
derived from `dueAt`, lens state persisted). **Need from you:** nothing.

### A5. Voice strings are baked in, but per-skin strings was a flagged extra
Brief §3 said copy changes must be proposed as a clearly-marked appendix;
the prototype bakes the full Tidewater voice in ("Let the tide take it",
"Set aside on the shelf.", "The tide took it.", empty states, toast lines).
**Product ruling (2026-06-10): approved — we're building per-skin strings**
(a copy table keyed by skin) and will extract the full Tidewater table from
the prototype ourselves.
**Need from you:** a quick sanity pass on our extracted table once we post it
(particularly: Aging-board strings, which the prototype never shows — see B2).

---

## B. Surfaces the bundle doesn't cover (need token/pattern guidance)

The brief's surface inventory is the closed set; these appear in it but not
in the prototype. Pattern-level guidance is enough — one-liners, not canvases.

1. **Login screen** (`/login`) — single password field, first impression of
   the skin. Proposed: centered `.panel` on the tinted `--bg` wash, display
   face wordmark, `--action` primary button.
2. **Aging board** (`/aging`) — nav lists "Aging" but there's no screen in
   the bundle. Proposed: identical anatomy to Reflecting (it shares
   `AgingRow`), threshold input as a quiet mono control, empty state
   "Nothing's gone cold." Keys are `U/C/F` (no X) — legend shows three verbs.
   Confirm the Tidewater verb for *aging* rows' "pick up" ("Pick back up"?)
   and the section voice.
3. **Skill proposal** (`/proposal/:id`) — side-by-side diff. Need: Tidewater
   values for `--diff-add` / `--diff-del` (day + night) and the proposal
   accent (base uses a moss inset border). Proposed: derive from
   `--fam-guide` (sea-green) at low alpha for add, a desaturated
   `--fam-field` wash for del.
4. **Actor attribution** — base marks Claude-authored content with ember +
   `CLAUDE` chip. Proposed: `--action` carries attribution in Life.
   Confirm this doesn't dilute the "action accent is rationed" rule, or give
   attribution its own treatment.
5. **Pinned indicator** (`km-pin`, base = blaze). Sacred is reserved for
   crystals in Life — proposed: `--ink-muted` star, filled when pinned.
6. **Density control** — the Settings canvas shows Roomy / Cozy / Compact but
   no values. Send a 3-row table for the density tokens
   (`--pad-panel`, `--gap-panel`, row padding, type scale if it moves), or
   tell us to ship Tidewater at its native density with the control stubbed
   to one value (our default: ship the control with Roomy = spec values,
   Cozy = −15%, Compact = −30%, clamped to AA-safe type sizes).
7. **Drag affordances** (guidebook reorder) — drop-indicator + dragging-row
   treatment in Tidewater (base uses line-strong indicator). Proposed:
   `--action` 2px drop line, lifted row gets `--shadow-lift`.
8. **`window.confirm` dialogs** — staying native per brief; no action needed,
   noted for completeness.

## C. Smaller confirmations

1. **Night = dark mode.** `.km-skin-life.km-dark` carries the night sheet;
   the existing Light/Dark/System theme setting drives it.
   **Product ruling (2026-06-10):** the chrome day/night toggle button is
   dropped — theme control stays in Settings only, both skins. The chrome
   keeps its current control set.
2. **Skin class naming.** We implement the brief's `.km-skin-life` (not
   `.sk-tide`) and fold the night block accordingly. Tidewater's `.sk-tide`
   selectors in `skin-tokens.css` are translated 1:1.
3. **`.km-v4` surfaces.** When the Life skin is active it overrides the v4
   look on CrystalDetail/Trace/CrystalCard (v4 vars get remapped under
   `.km-skin-life`); base skin keeps v4 untouched.
4. **Fonts.** Bricolage Grotesque / Hanken Grotesk / Spline Sans Mono via
   Google Fonts (same mechanism as today's stack). Self-hosting is a
   separate infra task if we want it.
5. **Dashboard reflow mapping** — we read the prototype's dashboard as:
   bench rollup → orientation strip + "Sort the bench" button; aging
   presence → nav-rail badge only; recent chats → "Lately"; weekly-review
   entry → "This week" panel footer link; next-up/due items → "In focus".
   Confirm aging losing its dashboard strip is intentional (brief's
   object-permanence requirement says ambient presence — a nav badge may be
   too quiet; if you want an aging whisper on the dashboard, say where).
6. **Toast undo.** We're extending the toast system with kinds
   (`crystal`/`release`/`focus`) + Undo callback and the two-phase
   `.item-leave` removal, gated by `--motion-scale` (0 = instant in base).
   **Product ruling (2026-06-10):** Undo toasts ship in *all* skins —
   Workshop gets Undo too (instant removal, no leave animation; toast copy
   stays in the Workshop voice via the per-skin string table).

---

*Fastest path: reply inline per item number. Anything marked "proposed
default" we will build as stated unless told otherwise by the time the
relevant slice starts (slices 3+, roughly a few days of work away).*
