# Steep — The Orientation Layer (parked design note)

*Future-round design note. Not scoped to the current build. Companion to
`steep-adhd-design-guidance.md`; grounded in `kennel-data-model.docx`
(v0.4), `persona-life-guide.md`, and the motivation/ADHD research behind the
guidance doc.*

*Version 0.1 · Draft · parked for a future round*

---

## 0. Status and why this is parked

This note specs a **new conceptual layer** for Steep — a persistent,
forward-pointing sense of *what the user is about and why*. It is
deliberately **not** folded into `steep-adhd-design-guidance.md`, which is
scoped to the current build. Pick this up when the goals/orientation layer
comes up for real. It touches a schema decision (the goal object) and
deserves its own surfaces rather than being wedged into this round's mocks.

Everything here is a sketch for ideation, not a build spec.

---

## 1. The gap this fills

Steep today is strong at the **bottom** of the stack (frictionless capture,
fast triage) and increasingly good at the **middle-as-retrospect**: crystals
distill what you *learned*, and resurfacing keeps those lessons operational.

What's missing is a **prospective top layer** — a persistent answer to
"what is all this capturing *for*?" The persona guide gestures at it: the
marathon goal is crystallized once ("Run Chicago 2027 under 4:00") and
actions attach to it with `S`. But that's a single goal living as an ad-hoc
crystal. There's no surface that says: *here are the few things I'm
orienting my life around, and here's today's small evidence I moved toward
them.*

This note proposes that surface.

---

## 2. The source idea (Gordo Byrn's 1000-day framing)

Coach/writer Gordo Byrn's "1000-day plan" is three nested ideas, and each
maps to a different design altitude:

- **The 1000-day horizon (~3 years).** Long enough to accomplish something
  meaningful, short enough to stay real. The horizon is what lets tiny daily
  actions *compound* into wholesale change. His own transformation "began
  with a simple walk."
- **Small promises / credibility with yourself.** The daily mechanism: make
  a promise so small it seems trivial ("a walk," "wake before noon"), and
  the only job is to keep it. Kept promises accrue into self-trust.
- **Attention as the daily lever.** "The most important decision you make
  each day is where you direct your attention."

Top (horizon) → middle (orientation/goals) → bottom (daily small promises).
That structure is almost perfectly shaped for what Steep already is.

---

## 3. Why this fits the ADHD-tending persona specifically

The motivation research behind the guidance doc predicts both the
opportunity and the failure mode:

- **Interest-based, not importance-based.** Goals are the canonical
  *importance-based* structure this persona's brain doesn't natively run on.
  So this layer **cannot** be a nagging tracker — that framing bounces off.
  It must orient and remind (*why*), never accuse (*you're behind*).
- **Compounding daily action is the antidote to all-or-nothing.** Byrn's
  "small promises" is the same mechanism as the literature's "smallest
  useful version" / 5-minute-start for task initiation. The long horizon
  reframes a missed day as noise, not failure — the same forgiveness logic
  that made "no red, no overdue" load-bearing.
- **Crystals are already half of this.** A `principle` or `reminder`
  crystal is already a life-orienting statement that resurfaces on a
  cadence. An orientation/goal is the same species of object, pointed
  *forward* instead of *backward*.

---

## 4. The proposal: three nested altitudes

All three surface *quietly*, per Steep's "quiet by default" rule.

### 4.1 Orientation (top — few, rarely changed)
A deliberately small set (**3–6**) of life-orienting statements:
- "Support my professional development toward X"
- "Maintain strong family and friend relationships"
- "Explore my creativity"

These live as **forward-pointed crystals** (see §5). The persistent surface
is calm and low-frequency — a dashboard band, and/or woven into resurfacing
so an orientation occasionally returns with *"still what you're about?"*
(the "still true?" loop applied to direction, not just lessons).

**Hard rule:** orientations are **not** progress bars. Byrn's intangibles
("strong relationships") have no completion percentage, and forcing one
would betray the idea.

### 4.2 Horizon (middle — gives the daily its meaning)
An optional ~1000-day frame (user-chosen length) per orientation or goal.
Surfaced as ambient context — "Day 247 / 1000" — **never** as a countdown or
time pressure. Its job is reframing: it makes one good day matter *and*
makes one missed day trivially small.

### 4.3 Small promises (bottom — the new daily texture)
The genuinely new, most ADHD-aligned piece: a lightweight way to make a
*tiny* promise attached to an orientation, and check it off.

- **Not a habit tracker with streaks.** Streaks weaponize the shame loop —
  break one and you avoid the app. The "don't break the chain" framing is
  exactly wrong for this persona.
- **Closer to** "today's one small promise" that, when kept, builds
  *credibility with yourself*. Compounding is shown as **accumulated
  evidence over the horizon**, not an unbroken chain: *"you've kept 180
  small promises across 247 days — here's what they built toward."*

### 4.4 The connective tissue (already exists)
`S`-attach wires daily actions and crystals to orientations. That lets the
dashboard finally show "your scattered captures, organized under what you're
about" — the view the persona guide says "your brain can't build on its own
at 7 a.m."

---

## 5. Schema implications (mostly already present)

This is more a new *arrangement and surface* than a new engine.

- **Goal/orientation = a long-lived orienting object**, structurally a
  sibling of the crystal. Two options:
  - **(A) A sixth crystal type** — `aspiration` (or `orientation`)
    alongside principle/quote/reminder/hint/memory. Inherits the resurfacing
    machinery for free. Lowest-cost.
  - **(B) A thin new entity** if orientations need fields crystals don't
    (horizon dates, an explicit attached-items roll-up). More room, more
    cost.
  Recommendation: start by exploring **(A)**; only move to (B) if horizon +
  roll-up fields prove awkward on a crystal.
- **Attachment already exists.** `S` (attach) + the crystal "Built on"
  link-set + polymorphic tags are the same shape. "Show my to-dos under my
  goals" is a **query and a view**, not new storage.
- **Horizon = metadata.** Start date + target date on the object. "Day 247
  of 1000" is derived (same pattern as Temperature deriving from
  `updated_at`).
- **Daily evidence = the activity log, re-pointed.** "What did I do toward
  this?" is `activity` filtered to items attached to the orientation. The
  compounding view is a roll-up over time — pure aggregation, like the
  Weekly review.

Net-new persistence is essentially just the orientation object itself (or
the crystal-type extension). Everything else reuses existing machinery —
which is the strong signal this belongs.

---

## 6. Risks to design against

1. **Importance-based nagging.** The fastest way to break this for the
   persona. No red, no streaks, no "you haven't worked toward X in 5 days."
2. **Goal proliferation.** Same failure mode as "I made 14 threads in my
   first week." Orientations must be **few and high-friction to add** — the
   inverse of capture. The constraint *is* the feature.
3. **Intangible ≠ measurable.** The surface must honor "maintain strong
   relationships" without demanding a number, or it pushes users toward only
   the legible goals.
4. **Top-down layer in a bottom-up tool.** Steep's identity is "capture
   first, decide later, never force structure at the moment of thought."
   Orientation-setting is the one place structure is *imposed* — so it must
   be a separate, deliberate, **rare mood**, never something the
   capture/triage flow asks for.

---

## 7. Open questions for the future round

- Crystal-type extension (A) vs. thin new entity (B)?
- Where does the persistent orientation surface live — a dashboard band, a
  dedicated "North" lens in the nav, woven into resurfacing, or some
  combination?
- Are "small promises" a new lightweight item kind, a mode on `action`
  items, or their own tiny object? (Lean: smallest thing that works.)
- Does the horizon attach to an orientation, to a concrete goal beneath an
  orientation, or both?
- How does compounding evidence get visualized without becoming a streak or
  a progress bar? (This is the crux UI problem — see the handoff.)
