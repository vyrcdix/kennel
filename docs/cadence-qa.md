# Cadence — QA (C6)

Branch `feat-cadence` (off `skin-life-tidewater`). Covers the no-due/no-red/
no-deficit audit, both-skin parity, AA contrast, reduced motion, and the one
open flag. Verified on a seeded instance in headless Chrome across C0–C6.

---

## 1. The hard stance — no due, no red, no deficit ✅

The defining invariant. Audited by construction across the engine + surfaces:

- **No due date / no "overdue" / no late.** A cadence has a `window_opens_at`
  (when it *invites*), never a deadline. `nextWindow` rolls to the next FUTURE
  window — skipping several still lands at the next one, never owing the missed
  ones (`cadence.test.ts` "no deficit on missed ones").
- **"Did it" never completes/deletes.** It logs the contact, rolls the window,
  bumps the streak; the item stays `active` and returns next window
  (`cadence.test.ts` "never deletes").
- **Skip breaks no chain, shows no deficit.** Rolls the window, leaves
  `kept_count` untouched, records nothing negative.
- **No deficit number anywhere in the UI.** RhythmTrace shows kept marks +
  "kept up N … running" / "quiet just now" — never a miss count. No red, no
  badge, no scorecard. The divergence block is a gentle question
  ("…gone quiet. No harm done — is it still true?"), not a scold.
- **No notifications.** Cadences only *surface* when their window opens (in
  "Do this week"); the system never pings.

## 2. Both-skin parity ✅

One component set, two token maps — no per-skin component fork. Verified
rendering in Workshop and Life (+ night):

- **CadenceCard** (C3): Life "SUNLIT/STILL" vs Workshop "FRESH/DORMANT", same
  layout, sea-glass vs blaze dress.
- **Do this week** (C4): renders below the hearth (Life) / above the rail
  (Workshop), same cards. Cadences suppressed from In-focus in both.
- **Cooled cadences** (C4), **RecurModal** + **Kept warm by** + the Settings
  tolerance dial (C5), **MemoComposer/Chip** (C6): all token-driven, both skins.

Vocabulary is per-skin via `lib/copy.ts` (vitality words); the loop, dial,
trace, divergence and memo are identical in structure.

## 3. AA contrast ✅

Cadence reuses the slice-7-audited tokens. The two cadence-specific pairs:

| Pair | Workshop | Life day | Life night |
|---|---|---|---|
| "Did it"/Re-commit dark ink on the sacred fill (#2A1B08) | 8.84 | 6.16 | 7.30 |
| window chip — action-ink on action-soft/card | 5.65 | 6.16 | — |

Both clear AA in both skins. The dark-ink-on-warm-fill button follows the same
pattern the slice-7 primary-button fix established. Vitality labels, serves
row, divergence copy all ride `--ink`/`--ink-muted`/`--action-ink`/
`--sacred-ink`, already AA-clean.

## 4. Reduced motion = end-state ✅

The two cadence animations — `cadKept` (Did-it warm pulse) and `cadRec` (voice
record dot) — live inside the same `@media (prefers-reduced-motion: no-
preference)` block and are scaled by `--motion-scale`. So: motionless in
Workshop (scale 0), and a reduced-motion user sees the resting end-state (same
gate verified in slice 7). Vitality/temperature never animates.

---

## Open flag — B4 field-notes default section

The memo files into the served thread's field notes (verified end-to-end:
"Did it" → Note → text → Save lands in the section). The composer offers the
**real** `FieldNotesSectionKey` enum (premise / whatIKnow / openQuestions /
sources / crystallizations) — see `lib/cadenceMemo.ts`.

**Awaiting design confirm** (`handoff/cadence_eng_questions/FOLLOWUP-fieldnotes-
sections.md`): the design response's suggested defaults used sections we don't
have (People / Scratch). We shipped the **proposed remap** — default section is
`whatIKnow` (the neutral "what came of it" bucket); People→`whatIKnow`,
Scratch→`premise`, Resources→`sources`, What's-working→`whatIKnow`,
Open-questions→`openQuestions`. If design rules otherwise (an enum extension),
revise `DEFAULT_SECTION` + `MEMO_SECTIONS` in `lib/cadenceMemo.ts`.

## Voice memo — behind a flag (B3)

`VOICE_MEMO_ENABLED = false` (`lib/cadenceMemo.ts`). The composer is text-only
in v1; the voice affordance is hidden but the layout/mental model are intact
for when mic capture + storage + transcription land as a follow-on.

## Deploy

Cadence ships on `feat-cadence`. Once the Tidewater skin merges and this branch
merges, it deploys to the Tidewater test instance unchanged — same Caddy/
systemd setup as `docs/deploy-tidewater.md` (the migrations 0014/0015 apply on
boot; fresh seed has no cadences, which is correct — they're user-created).
