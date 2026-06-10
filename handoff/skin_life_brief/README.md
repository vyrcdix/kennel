# Design brief — the "Life" skin

**To:** Claude design
**From:** Product (Craig)
**Date:** 2026-06-09
**Status:** Brief / handoff — awaiting direction boards
**Package contents:** this brief · `surface-inventory.md` (every screen,
component, token, and state the skin must cover) · `current-tokens.css`
(the shipping token sheet, verbatim) · `persona-life-guide.md` (the
user's guide written for this audience — the primary source document)

---

## 1. What we're asking for

A complete second **skin** for Steep: new look, feel, and interaction
texture for someone using the product to run their *life* rather than
their work — **with zero functional change**. Same routes, same
components, same data, same keyboard model. Different room.

This is intended as the first of a series of purpose skins (a "studio"
skin for creative-heavy use and a "research" skin are plausible
successors), so part of the job is establishing the *skin system* —
what a skin is allowed to change, and the token architecture that
makes the next one cheap.

The existing codebase already proves the mechanism: the v0.4/v0.5
"blaze + dust" look ships as an opt-in `.km-v4` class that re-maps CSS
custom properties over unchanged components (see `current-tokens.css`,
lines 51–102). The Life skin is the same move at full scale: a
`.km-skin-life` root class, a complete token sheet (light + dark), and
— where tokens aren't enough — a small set of new *layout tokens*
(radius, density, motion scale) that the base skin sets to today's
values so existing screens are pixel-identical until a skin overrides
them.

## 2. Who this is for — the analysis behind the ask

Read `persona-life-guide.md` first; it's the contract. The short
version: this user has many concurrent interests (reading, marathon
training, trip planning, a novel, a household), ADHD tendencies, and
uses Steep as the capture surface for *everything*. From building that
guide, six concrete challenges fell out. Each one is a design
requirement, not background color:

| Challenge | What it means for the skin |
|---|---|
| **Re-entry cost.** Two weeks away must feel like walking back into a kitchen, not an audit. | Warmth and orientation over density. "Where was I" must be answerable at a glance — recency needs visual salience, not just sort order. |
| **Shame susceptibility.** Badges, reds, and overdue-styling read as accusation and cause avoidance. The base skin is already quiet; Life should be *kind*. | No alarm hues anywhere. Counts present but soft. "Let go" and "File" styled as satisfying, not destructive — letting go is a *supported outcome*, and the skin should make it feel like one. |
| **Overwhelm at density.** The base skin is GitHub/Linear-dense by design brief ("dense but breathable"). This user drowns in simultaneous panels. | More air, larger type scale, fewer things per viewport, stronger progressive disclosure. One clear primary action per view. This is the biggest *layout* divergence we're inviting. |
| **Object permanence.** Out of sight = ceased to exist. But notifications are banned (core product principle). | Ambient, glanceable presence for the shelf (Reflecting) and the cold pile (Aging) — visible weight without urgency. Think "stack of books on the nightstand," not "badge: 14". |
| **Novelty/reward wiring.** Small dopamine moments keep the habit alive; the base skin is deliberately flat. | Micro-celebration at the moments that matter: a capture landing, a crystal forming, a "Still true" press, a cleared bench. Delight budget is real but spent in milliseconds — see motion constraints (§5). |
| **Decision fatigue.** Eight choices per row is fine for a power user at work; it's a wall at 9 p.m. | Calmer affordance hierarchy: the keyboard-first model stays fully intact, but on-screen buttons can recede behind hover/selection more aggressively, with the *one most likely* action visually forward. |

One meta-principle ties these together: **the base skin is a
workshop; the Life skin is a home.** Same tools, same drawers, same
muscle memory — but you'd light it differently, soften the surfaces,
and you wouldn't bolt a parts bin to the kitchen wall.

## 3. What a skin may change

- **Every color token**, light and dark — full palette replacement is
  on the table. (Reserve-rule structure must survive; see §5.)
- **Type** — families, scale, weights. The Oswald/Inter/JetBrains
  Mono stack is the workshop voice; Life may want a different one.
  Mono must remain for timestamps/slugs/kbd (it's load-bearing for
  scannability), but which mono is open.
- **Shape & texture** — radius, borders, elevation strategy (the base
  skin's "lift without shadow" rule is a *base-skin* rule, not a
  product rule), background texture if it's CSS-cheap.
- **Density & layout rhythm** — row padding, panel spacing, type
  scale, column proportions; via the new layout tokens. Reflowing a
  screen's sections (e.g., Dashboard panel order/grouping) is
  allowed where it serves the persona, provided every section
  remains reachable — flag each reflow explicitly in the handback.
- **Motion** — the base skin bans nearly all animation. Life gets a
  small motion budget (§5).
- **Iconography accents** — the stroke icon set stays (it's a
  component), but per-skin stroke weight / corner treatment via
  tokens is fine.
- **Voice (flagged separately).** Empty states and microcopy
  ("The bench is clear.", "Nothing's gone cold.") are strings in
  components — changing them per skin is a code mechanism we haven't
  built. You may *propose* a Life voice pass as an appendix; mark it
  clearly as not-token work and we'll decide whether to build
  per-skin strings.

## 4. What a skin may NOT change

- **Functionality.** No new/removed/merged screens, actions, fields,
  or flows. The surface inventory is the complete and closed set.
- **The keyboard model.** J/K + single-key decisions on Sort, Aging,
  and Reflecting are the product's spine — visible kbd hints must
  survive (restyle freely).
- **Information parity.** Everything visible in the base skin must
  remain *discoverable* in Life. Progressive disclosure is welcome;
  burial is not. Test: a base-skin user switching to Life finds
  everything within one obvious interaction.
- **Vocabulary.** Thread, bench, Sort, crystal, reflecting, filed,
  let go — locked. (Voice pass may adjust *sentences*, never these
  *nouns*.)
- **The component tree.** Skins are tokens + classes + layout flags
  consumed by existing components. If a screen truly cannot express
  the direction without a per-skin component fork, flag it in the
  handback with a cost note — forks are a last resort and a product
  decision.
- **Accessibility floor.** WCAG AA contrast in both modes; no
  color-only state signals; `prefers-reduced-motion` honored
  completely (the skin must be fully usable with motion off).

## 5. Structural rules that must survive re-skinning

These are *system invariants* — the hues can change, the grammar
cannot:

1. **One sacred color.** Base skin reserves blaze gold for crystals
   and nothing else. Life must have an equivalent: exactly one hue
   that means "this is a crystal / a kept thing," used nowhere else.
   It does not have to be gold.
2. **One action accent.** Ember's job (primary action + "in focus"
   marker), re-castable in any hue, but singular and rationed.
3. **Family markers.** Field notes / guidebook / runbook each carry a
   consistent identifying tint (clay/moss/ember-dark today). Three
   distinguishable family hues, applied where the base skin applies
   them (top borders, icon tints, group labels).
4. **The temperature signal.** Fresh / active / aging / dormant must
   read at panel level. Today: top-edge tints + a mono stamp. Life
   may *translate* the metaphor (paper warming/fading, saturation
   decay…) but the four states must remain distinguishable without
   reading text, and `aging` must never look like an alarm.
5. **Thread label colors stay neutral-quiet.** Six muted label hues
   exist (stone/sage/dusk/plum/slate/teal); re-pick them freely but
   they must never compete with the sacred color or action accent.
6. **State dots.** Six item states have a dot language
   (ember=focus, dust=reflecting, moss=crystallized…). Re-map hues,
   keep one-glance distinguishability.
7. **Motion budget.** Each animation ≤ 250 ms, eased, interruptible,
   never blocking input, and with a defined reduced-motion fallback.
   Celebration moments (crystal formed, bench cleared, still-true)
   get the budget first; navigation gets none (instant remains
   correct). No looping/idle animation anywhere — this audience is
   *more* distractible, not less; delight is a pulse, never a hum.

## 6. Direction territories (explore, then pick one)

Three starting territories — react to these, don't feel bound. We
want 2–3 direction boards, then one chosen direction developed fully.

**A. Field journal.** Warm paper, ink, generous margins; the product
as a well-used notebook. Rounded corners, ruled-line dividers,
serif-or-humanist display face. Temperature as paper age. Risk to
manage: twee; the user is an adult with a marathon plan, not a
scrapbooker.

**B. Morning kitchen.** Soft daylight neutrals, one warm accent;
larger type, deep air, matte surfaces. Calm-tech: the Dieter-Rams-
kitchen-radio version of Steep. Probably the safest density win;
risk to manage: blandness — the celebration moments need somewhere
to go.

**C. Seasons / garden.** The lifecycle rendered as growth: capture
as seed, shelf as greenhouse, crystals as something kept from the
harvest. Strong metaphor alignment with "let things go to compost"
(guilt-free letting go is the product's most distinctive emotional
move — this territory gives it imagery). Risk to manage: metaphor
overreach colliding with the locked vocabulary; the metaphor must
live in *color/texture/motion*, never in renamed nouns.

In all three: dark mode is not an inversion afterthought. This user
does their Sunday review at 9 a.m. and their capture at 11 p.m.; the
two modes can have *different warmth*, not just flipped lightness.

## 7. Key screens (canvas-level treatment required)

Full inventory in `surface-inventory.md`; these six need full design
canvases in the handback (the others are covered by the token sheet +
pattern rules):

1. **Dashboard** — the re-entry screen. This is where "walking back
   into the kitchen" is won or lost. Resurfacing slot ("Worth
   revisiting") deserves special love: it's the product handing you
   your own wisdom — in Life, that's a hearth, not a queue.
2. **Sort (the bench)** — decision fatigue ground zero. Keyboard
   table intact; affordance hierarchy redesigned.
3. **Reflecting** — the shelf. The emotional center of the Life
   skin: "not now" rendered as care, not backlog.
4. **Thread landing** — one life-area's home (use the marathon or
   trip thread from the persona guide as content).
5. **Crystal detail** — the trophy room moment; sacred-color
   showcase; Built-on panel and connections re-textured.
6. **Weekly review** — from audit to "look what happened this week."
   Numbers present, judgment absent.

## 8. Deliverables

Matching your previous handback format (`design/*.jsx` canvases +
README), plus the system artifacts a skin series needs:

1. **Direction boards** — 2–3 territories, one screen each
   (Dashboard), quick fidelity. Checkpoint with product before
   developing.
2. **Token sheet** — complete `.km-skin-life` + `.km-skin-life.km-dark`
   custom-property mapping in the `tokens.css` format, covering every
   token in `current-tokens.css` *plus* your proposed layout/motion
   tokens (with the base-skin values for those new tokens stated, so
   engineering can land them as no-ops first).
3. **Design canvases** — the six key screens (§7), light + dark,
   desktop. Use real persona content from `persona-life-guide.md`
   (the Thursday bench, the marathon runbook, the Kyoto trip).
4. **Pattern sheet** — rows, cards, chips, buttons, inputs, dots,
   kbd hints, toasts, modals, empty states: one board showing every
   shared component in Life dress (the `surface-inventory.md`
   component list is the checklist).
5. **Motion spec** — a table: moment → animation → duration/easing →
   reduced-motion fallback. Within the §5 budget.
6. **Skin-switch note** — a short proposal for how Settings →
   Appearance presents skins (it's a settings row like theme;
   half-page is plenty).
7. **Flagged extras** (optional, clearly separated): voice pass on
   empty states; any reflow that needs a component fork, with
   rationale.

## 9. Acceptance checklist

The handback is complete when:

- [ ] Token sheet covers 100% of `current-tokens.css` tokens, both
      modes, plus new layout/motion tokens with stated base values.
- [ ] All six §5 invariants demonstrably survive (call each out
      explicitly in the README).
- [ ] AA contrast verified for text-on-surface pairs in both modes.
- [ ] Six key-screen canvases, light + dark, persona content.
- [ ] Pattern sheet covers every component in `surface-inventory.md`.
- [ ] Motion spec complete with reduced-motion column.
- [ ] Zero component-API changes assumed — or each exception flagged
      with a cost note.
- [ ] No vocabulary changes anywhere in the canvases.

## 10. Source documents in this package

| File | What it is |
|---|---|
| `persona-life-guide.md` | The Life user's guide — the persona, their threads, their week. Canvas content comes from here. |
| `surface-inventory.md` | Closed inventory: 21 routes, shared components, tokens, states, interaction patterns, with code references. |
| `current-tokens.css` | The shipping token sheet (base + dark + `.km-v4` precedent). |

Also in the repo, for deeper context: `kennel-design-brief.docx`
(the original aesthetic contract — what Life is deliberately
diverging from), `docs/kennel-user-guide.md` (the base-skin manual),
and `handoff/kennel_v05_handoff/` (your last handback, for format).

---

*Questions, or a fourth territory worth boarding — bring them to the
direction-board checkpoint rather than polishing in private. The
fastest version of this project is boards → one direction → full
develop.*
