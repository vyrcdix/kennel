# Cadence follow-up: field-notes section enum (B4)

**To:** Claude design / PM
**From:** Engineering (via Craig)
**Re:** `ENG-RESPONSE.md` §B4 — memo → field-notes routing
**Date:** 2026-06-11
**Status:** One concrete mismatch found while drafting the Cadence build plan
(`docs/cadence-build-plan.md`). Not a blocker — needs a one-line confirm on a
remap. Everything else in the response is settled and being built against.

---

## The mismatch

B4 confirmed memos route to the served thread's field notes via the
`FieldNotesSectionKey` enum, and gave suggested per-cadence defaults using the
section names **People / Resources / Scratch / What's working / Open questions**.

Those are the prototype's *illustrative* `THREAD_SECTIONS` — they are **not our
real enum.** The shipped `FieldNotesSectionKey` (shared/types.ts) is:

> **`premise · whatIKnow · openQuestions · sources · crystallizations`**

So three of the suggested defaults map cleanly and two have **no equivalent**:

| Design's suggested section | Our enum | Clean? |
|---|---|---|
| Open questions | `openQuestions` | ✅ |
| Resources | `sources` | ✅ (closest) |
| What's working | `whatIKnow` | ✅ (closest) |
| **People** | — | ❌ no equivalent |
| **Scratch** | — | ❌ no equivalent |

## What we propose (v1 — remap to the existing enum)

Your response already flagged thread-specific section vocabularies / enum
extensions as **out of scope for v1**, so we propose to **remap the seed
defaults onto the existing five** and have the memo composer offer those five.
Proposed per-cadence defaults:

| Seed cadence | Proposed default (our enum) |
|---|---|
| Sunday call with Dad | `whatIKnow` *(was People — captures what came of the call)* |
| Catch up on Foreign Affairs | `openQuestions` *(alt `sources`)* |
| Mobility before the run | `whatIKnow` *(was What's working)* |
| Read one Le Guin essay | `sources` *(was Resources)* |
| 200 words of the novel | `premise` *(was Scratch — the working ground; alt `sources`)* |

General fallback for any cadence whose default isn't obvious: **`whatIKnow`**
(the neutral "what came of it" bucket).

## The ask (one of)

1. **Confirm the remap above** (People→`whatIKnow`, Scratch→`premise`, others as
   shown) — we ship that in v1, nothing else changes. *(Our recommendation.)*
2. **Or** rule that *People* / *Scratch* are real, wanted sections — in which
   case it's the deliberate `FieldNotesSectionKey` **enum extension** you flagged
   as a separate spec (migration + field-notes UI + Smart-Routing section
   suggester all widen). We'd schedule that as its own item, **after** the
   Cadence v1 ships on the remap.

If a default is fine, just say "confirmed (remap)".
