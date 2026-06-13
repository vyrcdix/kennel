# Compass — QA audit (P6)

Static audit against the build-plan invariants. The **live both-skin browser
pass** (puppeteer on the test instance) is the remaining step — it runs where a
node server can stay up (this dev sandbox kills long-lived port-bound servers,
signal 144). Everything checkable without a browser is below.

## Invariants

- **No progress bar / no countdown / no invented percentage.** The only filled
  bar is the **horizon** (`.cmp-horizon`), shown *only* for a concrete bearing
  with both dates — it's elapsed-time position ("day N / total") framed as room
  remaining ("N days of water/road **ahead**"), never "X left". Intangibles
  (`getHorizon` → null) carry no clock. ✓ matches the design prototype.
- **No streak / "don't break the chain."** The wake renders only kept marks
  (`getWake.marks`); missed windows leave no entry, so gaps are simply absent.
  "N kept" is a mono total, not a streak. grep for streak/chain/consecutive in
  the Compass surfaces: none. ✓
- **No red.** Compass colours are the sacred (amber) + thread-tint families only
  — no red/error/danger hue anywhere in the `.cmp-*` block or components. ✓
- **Quiet / few / high-friction.** No badges or notifications; the bearing count
  badge is a plain count. Creation is the two-beat SetBearingSheet with the
  "N of ~6 · few by design" counter; never offered in capture/Sort. ✓
- **Both-skin parity (information).** One component set, two token maps. The
  sky/star register is a token remap across the 4 skin×mode contexts
  (`--cmp-sky` / `--cmp-star` / `--cmp-sky-ink`), not Workshop-specific
  components. Vocabulary is per-skin via `lib/copy.ts` (water metaphor +
  Harbour/Driftwood/Currents are Life-only; navigation words stay in both).
  Bearings surface in both skins (band + nav); the "Under a bearing" lens is the
  Life dashboard's 3rd lens, and Workshop's serves-grouping already nests focus
  under the served bearing — same information. ✓
- **Reduced motion.** Compass adds no `@keyframes` / auto / infinite animation;
  the wake marks are a static scatter, the band rotates on click only. The two
  CSS transitions (`.cmp-rot` width, `.cmp-bearingcard` hover shadow) are
  interaction-driven. ✓

## AA contrast (computed, all 4 skin×mode contexts)

Amber text on light surfaces is the hard case (the sacred family is amber). The
eyebrow / anchor / horizon-chip / type-label inks route through a context-correct
token `--cmp-ink` (deepest ink on light, light gold on dark) so the dark-mode
cases don't vanish on a dark card.

| Element | W-day | W-dark | Life-day | Life-dark |
|---|---|---|---|---|
| Eyebrow (section headers) | 4.52 | 5.63 | 6.17 | 7.92 |
| Sky eyebrow (over band) | (deep) | 7.52 | (deep) | 7.52 |
| Horizon / type chip (on amber-soft) | **4.22** | AA | 5.49 | AA |
| Sacred button (`#2A1B08` on amber) | 8.84 | 8.84 | 8.84 | 8.84 |
| Display text on deep-sky | — | — | — | 14.69 |

All **pass AA (≥4.5)** except the **Workshop-light small amber chip at 4.22**
(AA-large). This is a property of the shared Workshop `--sacred-ink-deep` token
(amber can't clear 4.5 on a light amber-tinted chip at 10.5px), **not
Compass-specific** — and the same value ("day N / total", room-remaining) is
shown AA-clean in the larger horizon readout on the orientation page. Follow-up
(out of scope): darken the global Workshop `--sacred-ink-deep` if a strict pass
is wanted everywhere.

## Naming sweep (this round)

Core nav renames, Life-only, via `lib/copy.ts` + `useSkin` (Workshop unchanged):
Dashboard → **Harbour**, Aging → **Driftwood** (`aging.title`), Pinned threads →
**Currents**, New thread → **New current**. The broad **thread → current**
visible-string sweep (toasts, sub-copy across many screens) is the staged
fast-follow (A2) — keys are seeded; surfaces migrate incrementally.

## Remaining gate

- [ ] Live both-skin browser pass on the test instance (the puppeteer harness):
      walk Compass → set a bearing → orientation page → keep / still-true /
      reword / let-go, in Life+Workshop × light+dark; spot-check the dawn band +
      the "Under a bearing" lens on the dashboard.
- [ ] Deploy to the test instance (Hetzner) — see docs/deploy.
