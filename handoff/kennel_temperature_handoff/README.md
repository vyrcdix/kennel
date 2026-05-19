# Handoff: Temperature · time-sensitive panel treatments

> **Scope:** add a subtle, peripheral signal to panels showing how
> recently their content was touched. Builds on v0.3 (`last_touched_at`
> and the Aging threshold setting already exist).
>
> **Not** about styling rows. Not about notifications. The signal sits on
> the *panel*, never on individual items inside it.

## What's in this bundle

```
kennel_temperature_handoff/
├── README.md                ← you are here
└── design/
    └── temperature.jsx      ← React reference for the system + applied demo
```

`temperature.jsx` exports three components used in the design canvas:

- `TemperatureSystem` — the explainer artboard (scale, rules, anti-patterns).
- `ProjectLandingThermal` — full project landing with the system applied.
- `TemperatureComparison` — four side-by-side treatment variants.

It also defines the two real primitives that need to land in the codebase:

- `<ThermalPanel temp="fresh|active|aging|dormant">` — drop-in panel wrapper.
- `<ThermalStamp temp="..." since="..." />` — header-right timestamp.

Port both into the existing component library. Don't ship the reference file.

---

## Fidelity

**High-fidelity.** Treatment, levels, thresholds, copy, and where-to-apply
are final.

## Locked decision

**Treatment = A + D composite.** Top edge for peripheral awareness, mono
stamp in the header for the explicit timestamp. The other three options
(surface tint, timestamp tint, stamp alone) were considered and rejected.

---

## The scale

| Level    | Window                       | Top edge          | Surface tint              | Opacity | Header stamp                                       |
|----------|------------------------------|-------------------|---------------------------|---------|---------------------------------------------------|
| **fresh**   | last touched ≤ 24h        | `--ember-deep`, 2px | `rgba(217,98,44,.04)`   | 1.00    | ember-deep `●` + mono `FRESH · {since}` (ember-deep) |
| **active**  | 1d ≤ last touched ≤ aging | _none_ (default 1px line) | _none_           | 1.00    | muted `touched {since}` (default styling)         |
| **aging**   | past aging threshold      | `--dust`, 2px       | `rgba(201,168,124,.06)` | 0.96    | ember-deep `AGING · {since} cold`                 |
| **dormant** | past 60d                  | `--slate-light`, 2px| `rgba(201,168,124,.04)` | 0.82    | muted uppercase `DORMANT · {since}`               |

> The exact hex / rgba values come from the existing palette tokens —
> don't introduce new ones. `--ember-deep` is `#8A3A14`,
> `--dust` is `#C9A87C`, `--slate-light` is `#7A8088`.

### Computing a panel's temperature

```ts
function panelTemperature(items: Item[], settings: Settings, now: Date): Temp {
  // Most-recent touch across all items rendered in the panel.
  // Empty panel = 'active' (the silent default).
  const lastTouched = items.length
    ? Math.max(...items.map(i => i.last_touched_at.getTime()))
    : 0;
  const ageDays = (now.getTime() - lastTouched) / 86_400_000;

  if (ageDays < 1)                                return 'fresh';
  if (ageDays > 60)                               return 'dormant';
  if (ageDays > settings.aging_threshold_days)    return 'aging';
  return 'active';
}
```

**Aging threshold** comes from `settings.aging_threshold_days` (default 21,
already added in v0.3). **Dormant** is fixed at **60 days** — also add a
new setting for it (below).

---

## Rules — the part Claude Code will be tempted to violate

1. **Top edge only.** Left edge stays reserved for row-level selection /
   skill-proposal markers. Right and bottom edges stay quiet. *Don't*
   give panels a colored full border.
2. **One temperature per panel.** Never tint individual rows inside a
   panel based on their own age — multiplied attention is noise. The
   panel's temperature is `max(temperature of its items)`.
3. **`active` is the floor, not a state.** Most panels most of the time
   are `active` — render with **no chrome at all**. The signal only
   shows up when there's something to say.
4. **No animation.** Temperature changes on next render. Don't pulse,
   don't fade in, don't transition. Violates the "restrained motion"
   rule from the brief.
5. **Never coloured fills.** The surface tints are 3–6% opacity. The
   panel still reads as bone / slate-dark, not as "an ember panel".
6. **Never use blaze.** Blaze is reserved for the pinned indicator.

---

## Where it applies — and where it doesn't

### Apply to
- **Dashboard:** In focus, Crystallized this week, per-project rail cards.
- **Project landing:** In focus, Crystallizations, Field notes, Runbook,
  Conversations, pinned-doc cards.
- **Sort screen:** the per-project group headers (when global view is filtering by project).
- **Aging surface:** the threshold strip itself (always `aging` by definition).

### Don't apply to
- Chrome: `ChromeBar`, `NavRail`, modals, popovers, toasts.
- Empty states.
- Doc editor and runbook editor surfaces — the user is the source of
  activity here, so a temperature reading would be either trivially
  fresh or misleading.
- The Create Project modal and any other form/wizard surface.
- The Skill proposal review screen — proposals already carry their own
  moss-bordered state; layering temperature on top would clash.

---

## Component contract

```tsx
type Temp = 'fresh' | 'active' | 'aging' | 'dormant';

interface ThermalPanelProps {
  temp: Temp;
  children: ReactNode;
  /** Optional override — defaults to the surface-1 + top-edge per level. */
  style?: CSSProperties;
}

interface ThermalStampProps {
  temp: Temp;
  /** Human-readable "12m ago", "yesterday", "27d ago" — same formatter
   *  used by `Mono` for timestamps elsewhere in the app. */
  since: string;
}
```

Reference renderings: see the `ThermalPanel` and `ThermalStamp` exports
in `design/temperature.jsx`. The CSS for each level is a single
`border-top` + optional `background` + optional `opacity`.

### Header pattern

Every thermal panel's header should follow this shape:

```
┌───────────────────────────────────────────────────────────┐
│ {Label}        {sub-label · mono dim}    {ThermalStamp}   │ ← header row
├───────────────────────────────────────────────────────────┤
│ ... content ...                                            │
└───────────────────────────────────────────────────────────┘
```

The stamp is the *only* place the timestamp appears in the header.
Don't double up with a separate "updated 14:02" mono.

---

## Schema additions

```sql
-- Settings: dormant threshold (aging_threshold_days already exists from v0.3)
ALTER TABLE settings ADD COLUMN dormant_threshold_days INT DEFAULT 60;
```

No new item-level columns. `last_touched_at` (added in v0.3) carries
everything we need.

---

## Settings UI additions

In **Settings → Appearance** (or wherever the v0.3 Lifecycle section
landed), add a single row beneath the existing "Aging threshold":

| Label              | Control                                   | Default | Range  |
|--------------------|-------------------------------------------|---------|--------|
| Dormant threshold  | numeric · "days untouched before dormant" | 60      | 30–365 |
| Show temperature   | toggle · "panel-level time signal"        | on      | —      |

The toggle lets a power user kill the system entirely. When off:
all panels render as `active` regardless of their content's age.
This honours the brief's "quiet by default" principle as a per-user
opt-out, since the system, however subtle, *is* visual information.

---

## Voice / copy

The stamp text is the only user-visible copy. Final strings:

| Level    | Stamp text             | Notes                                                    |
|----------|------------------------|----------------------------------------------------------|
| fresh    | `FRESH · {since}`      | All caps, ember-deep. `{since}` is relative ("12m ago"). |
| active   | `touched {since}`      | Lowercase, default muted. ALWAYS use "touched", never "updated" / "modified". |
| aging    | `AGING · {since} cold` | All caps, ember-deep. The word "cold" is required.       |
| dormant  | `DORMANT · {since}`    | All caps, muted slate-light. No "cold" suffix.           |

Bad copy to refuse:
- "Recently updated" / "Updated just now" / "🟢 Live" — sells what the
  system is communicating; violates "quiet by default".
- "Stale" — pejorative. "Aging" / "Cold" / "Dormant" are descriptive.
- Tooltips that explain the temperature on hover — if the user has to
  hover to read it, the signal failed. Either keep the stamp visible
  or drop it entirely.

---

## Activity log impact

No new activity verbs. The temperature is derived state, not user
action. Don't log temperature transitions.

---

## Performance

`panelTemperature()` runs on render for every visible panel. Two notes:

1. The dashboard / project landing render at most ~10 thermal panels
   each. Computing `max(last_touched_at)` over the items already in
   each panel's data is O(N) on data the renderer holds anyway.
2. For per-project rail cards on the dashboard, push the computation
   server-side: add `last_touched_at` to the project list response
   (computed as `MAX(items.last_touched_at) WHERE items.project_id = ?`).

---

## Suggested rollout order

1. **Add the `dormant_threshold_days` setting** (schema + Settings UI).
2. **Add the `ThermalPanel` + `ThermalStamp` primitives** to the
   component library. Unit tests around the temperature formula.
3. **Wrap existing panels.** Start with Project landing → Dashboard →
   Sort. Skip the don't-apply list explicitly so a future contributor
   doesn't add them by accident.
4. **Add the "Show temperature" toggle.** Wire it to a context that
   short-circuits `<ThermalPanel>` to always render as `active`.
5. **Push project-card `last_touched_at` into the list API** so the
   dashboard rail can render temperature without N+1 queries.

---

## Acceptance checklist

A clean implementation should pass all of:

- [ ] `ThermalPanel` renders as plain (no extra chrome) when `temp="active"`.
- [ ] The four levels are visually distinguishable in peripheral vision
      on a 24" display from 2m away — but a panel-by-panel scan doesn't
      feel "decorated".
- [ ] No animation, no transition, on temperature change.
- [ ] Toggling "Show temperature" off in Settings flattens every panel
      to `active` without reloading.
- [ ] A panel containing no items renders as `active`, never `dormant`.
- [ ] `last_touched_at` is updated whenever an item is touched, edited,
      or has its state changed — but **not** when it's filed.
- [ ] Stamps say "touched", "FRESH", "AGING · X cold", "DORMANT · X" —
      exact strings from the table above.
- [ ] Don't-apply list is honoured: doc editor, runbook editor, modals,
      empty states, skill proposals, chrome all render without temperature.

---

## What's NOT changing

- The palette, type system, surface elevations.
- The v0.3 lifecycle states (`active`, `reflecting`, `crystallized`,
  `filed`). Temperature is **orthogonal** to state — a filed item
  doesn't appear in panels at all, so it has no temperature.
- The Aging surface from v0.3. That surface already filters explicitly
  by `last_touched_at > threshold` and presents per-item action buttons.
  Temperature is the *quiet* version of the same signal on every other
  panel.
- The Create Project modal (§6.9).
- Keyboard shortcuts.
