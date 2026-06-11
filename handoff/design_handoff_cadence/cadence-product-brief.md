# Cadence — Recurring Actions as a Habit-Forming Tool

*Handoff for Claude Design (and, downstream, Claude Code). This
proposes a new concept layered onto Steep's existing lifecycle. It
introduces no new top-level object and reuses machinery the product
already has: attach, the crystal resurface timer, references, aging,
and the temperature signal. Read alongside `kennel-user-guide.md`
(lifecycle reference), `persona-life-guide.md` (the busy-brain voice
this feature is for), and `kennel-data-model.docx` (the item +
metadata model this extends).*

---

## 1. The gap this fills

Steep runs one loop well: **capture → sort → work → crystallize →
resurface**. That loop is built around *durable thinking* (crystals)
and *one-shot actions* (do it, mark done, it's gone). There is no home
for the thing in between: a **standing commitment to keep feeding a
line of interest.**

This is precisely where a distractible, many-interested brain fails —
not at single tasks, but at *re-contacting* an interest before it goes
cold. The crystal *"tourism development opportunities in the South
Pacific"* is alive in the user's head. What's missing is the gentle,
repeating nudge — *"catch up on Foreign Affairs"* — that keeps it
alive in practice.

So this feature is: **an action that recurs on a rhythm, attached to
the thing it serves, carrying a resource, surfaced (never pushed) on
the user's own cadence, and swept into honest amnesty the moment it
stops being true.**

Framed at the level that matters: **crystals are what you care about;
cadenced actions are how you keep caring about it.** The crystal is
the identity; the cadence is the practice that builds it. This is a
habit-formation tool, not a recurring-chore list.

---

## 2. The stance: "do this week," never "due"

This is a deliberate design position and the hard part of the job.

A **due date** imports the entire failure-grammar of every task app: a
due date is a tiny deadline you can miss, and missing it generates the
guilt that makes this user abandon the tool. Steep's persona guide is
explicit — *"no notifications, no red, no overdue."* A cadence must not
quietly reintroduce all three.

So the surfaced framing is **"do this week"** (or this day / this
month): an **invitation within a window**, not a debt that accrues. A
cadenced action can't be *late*. It can only be **done**, or **roll**.
The absence of an overdue state is not a missing feature — it *is* the
feature. Build the harder thing: a rhythm the user is invited into,
never a clock counting down on them.

> Design rule: there is no red, no "overdue" badge, no count of misses
> shown as a deficit. A skipped cycle simply rolls to the next window.

---

## 3. Where it fits conceptually

**No new top-level entity.** A cadenced action is an ordinary **action
item** (existing `kind=action`) with two familiar things layered on:

1. **A cadence** (daily / weekly / monthly) — the quiet engine. This
   is a near-clone of the crystal **resurface timer** the product
   already runs. We're applying that same "bring it back on an
   interval" machinery to an action instead of a crystal.
2. **An attachment to a parent** — already exists via `S` (Attach).
   The action serves a crystal, idea, or thread. A cadenced action
   attached to the *South Pacific tourism* crystal is exactly the
   existing pattern, just repeating.

The dashboard already groups actions under what they serve. Cadenced
ones simply appear there with their cadence and a "do this week"
framing — the rest of the model doesn't move.

The cadence is the **clock**. What the user actually *sees and feels*
is two other things, described next: **commitment** (what they
declare) and **vitality** (what the system observes).

---

## 4. The softer model: commitment + vitality

We deliberately avoid scorecards, points, and badges. Extrinsic
gamification makes the *tool* the thing you're succeeding at, which is
backwards for a thinking tool and corrosive for a brain with a
complicated relationship to performance metrics. Instead, degree of
commitment is expressed two-sidedly:

### 4.1 Commitment — what the user *declares*

When creating (or later editing) a cadence, the user sets a
**commitment level** — a deliberate dial, not an earned rank. Proposed
levels:

| Level | Meaning | System behaviour |
|---|---|---|
| **Trying it** | An experiment; might not stick | Surfaces lightly; ages out quickly and guiltlessly |
| **Committed** | A real intention to keep up | Normal presence; normal patience before aging |
| **Core practice** | Part of how I live right now | More present; given the most grace before aging |

Declaring intent is itself a habit-formation technique (stated
commitment), so the dial does double duty: it's a UX control *and* a
behavioural nudge. It also tells the system **how hard to surface** the
cadence and **how patient to be** before it cools — see §6.

### 4.2 Vitality — what the system *observes*

A quiet, passive **vitality signal** reflects how alive the practice
actually is — not a count of points but a sense of warmth, modelled on
Steep's existing **temperature** signal (fresh / active / aging /
dormant). A cadence you're keeping up **glows**; one you've been
skipping **cools**. It *describes*; it does not *score*. The user reads
it as information, never as judgment.

A light, honest streak signal is welcome here *as warmth, not as
points* — e.g. the crystal model's *"re-surfaced 5× · kept fresh"* has
a cadence equivalent like *"kept up 6 weeks running."* This is the
dopamine of a maintained practice without a leaderboard. **No badges,
no totals-as-trophies.**

### 4.3 The interesting moment: when they diverge

The design payoff is the gap between **declared commitment** and
**observed vitality**. You marked something *core practice* but the
vitality has gone cold. This is **not** a failure notification. It's
the same honest question aging always asks: *is this still true?* The
user can re-commit, downgrade the dial (*core practice → trying it*),
crystallize the lesson, or let it go. The system surfaces the
divergence gently and hands them a one-keystroke verdict — it never
scolds.

---

## 5. Creating a cadence — the promotion flow

Promotion is the primary entry point and should feel like the existing
Sort verbs.

**At Sort**, add a decision verb — proposed **`R` — Recur** — beside
the existing `A` pick up, `P` set aside, `S` attach, `C` crystallize,
`V` convert, `X` let go. `R` opens a small popover:

- **Cadence** — daily / weekly / monthly
- **Commitment** — trying it / committed / core practice (default:
  *trying it* — the low-pressure entry)
- **Resource** — optional link/label (§7)
- **Attach to** — the existing attach typeahead over crystals, ideas,
  questions, and the thread (what does this serve?)

**Worked example.** On the bench: *"catch up on Foreign Affairs
magazine."* `R` → weekly → *committed* → paste the FA link → attach to
the *South Pacific tourism* crystal. One gesture, done.

**Born from a crystal/idea page.** A cadence can also start from the
thing it serves: a **"+ Recurring action"** affordance beside the
existing **+ Attach** on a crystal or idea page. The user reading their
crystal thinks *"what would keep this warm?"* and creates the cadence
in place, pre-attached.

---

## 6. How it surfaces — the cadence loop

Mirror the crystal resurface model; the user already understands it and
it honours Steep's no-notification philosophy. **Steep never pings.**

When a cadenced action enters its window, it appears in a dashboard
slot — proposed **"Do this week"** — which can live alongside *Worth
revisiting* crystals (a unified "worth your attention" area is fine).
Daily cadences appear on the daily rhythm, weekly on the weekly,
monthly on the monthly sweep. **Commitment level orders this surface:**
*core practice* sits up top and present; *trying it* sits lighter and
lower.

Three one-click responses, parallel to crystal resurfacing:

- **Did it** — logs the contact, rolls the timer to the next window,
  warms the vitality signal, and ticks the gentle streak (*"kept up 6
  weeks running"*). The action is **never "done"** — done would delete
  it. It is *fed*, and it returns.
- **Skip** — not this window. Rolls to the next window **without
  breaking the chain and without any deficit shown.** One bad week must
  not kill a six-month practice, and skipping must read as guilt-free,
  not as failing.
- **Snooze / push** — bump a few days inside the current window without
  advancing the whole cadence.

The **Did it** reset is the heart of the loop: contact → warmth → it
comes back. That's the habit forming.

The **resource is on the surfaced card itself**, not one click deep
(§7) — the whole point is to erase the friction between *"it's time"*
and *"I'm doing it."*

---

## 7. The resource / link

Almost every cadenced action points at something to *do the contact
with*: a magazine, a feed, a saved search, a person to email. This maps
cleanly onto the existing **reference** system — the `link` type
already ships (url + label + notes). No new schema.

- A cadenced action may carry **one attached reference** (reuse `link`).
- **The link renders on the surfaced "Do this week" card**, one click
  to act. If the link is buried, the user bounces — treat its presence
  on the card as a hard requirement, not a nicety.

---

## 8. Aging — the same honesty applies

This is the safety valve that keeps cadences from becoming what
recurring-task apps always become: a graveyard of guilt-inducing
repeats the user has trained themselves to ignore. In Steep, an
abandoned cadence **surfaces its own abandonment and asks to be
released.** That is the system working, not failing.

A cadence that keeps getting skipped is the system asking a real
question: *do you still care?* Reuse the existing aging logic, tuned by
commitment level:

- When a cadence is skipped/ignored past its tolerance, it drops onto
  the **Aging board** with the rest of the cold material. Tolerance is
  **set by commitment**: *trying it* ages out fast; *core practice* is
  given the most grace.
- On the Aging board it gets the same one-keystroke amnesty already in
  the product: `U` keep it going · `C` crystallize the lesson (*"I
  thought I'd follow Pacific tourism weekly; turns out I cared about it
  for one season"*) · `F` file it · `X` let it go.
- Framing stays as it is everywhere in Steep: *sweeping the workshop*,
  not *confronting your failures.* Most cold cadences should be filed or
  released, shamelessly.

---

## 9. Data model implications (light touch — for Claude Code later)

No new top-level entity. On the **item** (`kind=action`), extend the
existing `metadata` JSON column (which already absorbs kind-specific
extensions without migration — see `kennel-data-model.docx` §6.13):

| Key | Type | Notes |
|---|---|---|
| `cadence` | enum `daily \| weekly \| monthly` | null for ordinary one-shot actions |
| `commitment` | enum `trying \| committed \| core` | the user-declared dial (§4.1) |
| `window_opens_at` | ISO timestamp | when this enters the "do this week" surface |
| `last_done_at` | ISO timestamp | last logged contact |
| `kept_count` | int | gentle streak for the vitality readout — **not** a score |
| `resource_ref_id` | id | optional FK to a `reference` (`link`) row |

- **Attachment** to the parent crystal/idea/thread uses the **existing
  attach relation** — no new join semantics.
- **Vitality** (§4.2) is *derived*, not stored: compute warmth from
  `last_done_at` vs `cadence` (and weight by `commitment`), exactly as
  temperature is derived today. Don't persist a vitality field.
- The **recurrence + aging engine** is a near-clone of the crystal
  resurface timer already in Lifecycle settings. A new Lifecycle
  setting — *cadence aging tolerance*, ideally per commitment level —
  sits naturally beside the existing resurface interval and aging
  threshold.

---

## 10. One-line summary for the deck

> Crystals are what you care about. Cadenced actions are how you keep
> caring about it — a repeating, resource-bearing nudge attached to the
> crystal it serves, surfaced as an invitation ("do this week," never
> "due"), warmed by a quiet vitality signal rather than a scorecard,
> and swept into honest amnesty the moment it stops being true.

---

## 11. Open questions for Design

1. **Unified vs separate surface** — should "Do this week" be its own
   dashboard slot or fold into the existing *Worth revisiting* area as
   one "worth your attention" region? Lean toward folded, but it's a
   layout call.
2. **Vitality vocabulary** — temperature already uses fresh / active /
   aging / dormant. Does a cadence reuse those exact words, or does a
   practice want its own warmth language (*"kept up" / "slipping" /
   "cold"*)?
3. **Commitment default** — proposed default is *trying it* (lowest
   pressure). Confirm that's the right on-ramp, or whether *committed*
   is the more honest default for something a user bothered to set up.
4. **Streak expression** — exact wording/visual for *"kept up 6 weeks
   running"* so it reads as warmth, never as a metric to defend.
5. **Daily cadence pressure** — daily is the most habit-app-like and
   the most likely to reintroduce guilt. Should daily cadences surface
   more softly than weekly/monthly, or is the same model fine?
