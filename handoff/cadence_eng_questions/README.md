# Handback: Cadence — engineering review + questions before build

**To:** Claude design / PM
**From:** Engineering (via Craig)
**Date:** 2026-06-11
**Re:** `handoff/design_handoff_cadence/` (Cadence — recurring actions, Tidewater)
**Status:** **RESOLVED — answered in `design_handoff_cadence-2/ENG-RESPONSE.md`
(2026-06-11).** All four blockers (A1–A4) and all clarifications (B1–B4) are
answered; every proposed default was confirmed. Sequencing accepted: finish the
Tidewater skin, then build Cadence. **Key ruling: Cadence ships in BOTH skins**
(parity holds) as one component set + two token maps — Workshop proof delivered
in `Cadence Workshop.html`. So leave plug-in seams in **both** skins' surfaces.
Original review + questions retained below for history.

Reviewed against the codebase at `a290769` (Tidewater skin slices 0–4 landed;
5–7 in progress). **Recommendation: finish the Tidewater skin first; build
Cadence as its own track once the blockers below are answered.** We will leave
plug-in seams in the screens Cadence touches so it drops in without re-opening
them.

We read the full bundle (`README.md` build spec, `cadence-product-brief.md`,
`Cadence Studies.html` — Treatment C noted as shipping). The concept, voice,
and the five surfaces are clear and we like them. The questions below are the
places where the spec meets our actual schema/architecture and needs a ruling.
For each we state a proposed default — **if a default is fine, just say
"confirmed"; only elaborate where we guessed wrong.**

---

## Recommendation: sequence Cadence after the skin

Cadence is a net-new product feature (recurrence/aging engine, derived
vitality, new endpoints, field-notes memo routing), not a reskin. The
Tidewater skin is a presentational change, 4/7 done and low-risk. Bundling
them couples low-risk work to high-risk work and entangles review/rollback.
Cadence is also blocked on B1/B2 below. So: **finish skin slices 5–7, dogfood
on the parallel test instance, answer these questions, then build Cadence as a
dedicated multi-part track** (data + engine → the 5 surfaces → memo routing).
We'll leave reserved seams in Dashboard / Crystal detail / Aging / Settings
(the A2 reserved-slot pattern) so this is additive, not destructive.

---

## A. Blockers — needed before any Cadence build

### A1. Skin parity — Cadence is specced Tidewater-only
The whole bundle is in Tidewater terms (sea-glass, "sunlit/deepening" vitality
words, Tidewater components). Our app is **dual-skin** (Workshop + Life) and we
hold an **information-parity invariant** (brief §5: every section reachable in
both skins). The handoff never mentions Workshop.

**Need from you:** does Cadence ship in **Workshop** too?
- If **Life-only**, confirm that's an accepted, deliberate exception to the
  parity invariant (it's a real product divergence, not just dress).
- If **both**, give the Workshop treatment + voice: no "sunlit/deepening,"
  no sea-glass glow — what are the Workshop equivalents for the vitality
  language, the "Did it / Skip / Snooze" loop, and the divergence block?

This is the single biggest gate: it changes whether we build one surface or
two, and it interacts with A4 below.

### A2. Persistence — the "no migration" assumption doesn't hold for us
The brief (§9) says ride the item `metadata` JSON blob "without migration." We
*have* that column, but **v0.5 deliberately migrated kind facets OUT of it into
typed columns + API fields** (`migrations/0010_v05_facets.sql`), and the blob is
**not surfaced through the API or the typed `Item`** today. Reviving an untyped
blob would fight the v0.5 direction and leave the data unselectable/untyped.

**Proposed default:** promote the cadence fields (`cadence`, `commitment`,
`window_opens_at`, `last_done_at`, `kept_count`, `resource_ref_id`) to **typed
item columns + API fields via a migration**, mirroring how v0.5 facets were
done. **Need from you/PM:** confirm that's acceptable (it's the right shape, but
it *is* a migration, contrary to the brief's framing).

### A3. Backend ownership — the handoff is UI-only
The README documents "only the Cadence additions" (frontend). The recurrence +
aging engine, the derived-vitality computation, and the action endpoints
(recur-create, did-it/roll-window, skip, snooze, re-commit/ease-off, tolerance
settings) are not specced.

**Proposed default:** these are **ours to design**, modelled on the existing
crystal-resurface engine + aging routes. **Need from you:** confirm — or point
us at a server-side spec if one exists.

### A4. Vitality + tolerance numbers — "tune against existing thresholds" isn't buildable
We can't ship "roughly ~1 window behind." We need exact rules:
- The **windows-behind → fresh / active / aging / dormant** mapping.
- The **numeric grace** each commitment grants (trying / committed / core) —
  is it a multiplier on the window count? a flat offset?
- The **cooling tolerance** (when a cadence drops onto Aging) as concrete days
  or windows, per **rhythm × commitment** (e.g. weekly + trying = N skipped
  windows).

Give us a table and we'll implement it verbatim against the temperature engine.

---

## B. Clarifications

### B1. "Do this week" surface semantics
Does the slot aggregate **all open windows** (daily/weekly/monthly) under one
"Do this week" heading, with per-rhythm sub-cues? And do recurring actions
**also** appear in the normal In-focus / "what it serves" list, or **only** in
this slot? We need the **dedup rule** so a cadence isn't double-listed.
(Brief §11.1 left this a layout call — calling it now.)
**Proposed default:** one aggregated slot below the hearth; cadences appear
*only* there, suppressed from the normal In-focus list.

### B2. Vitality vocabulary — confirm final
README picks reuse of `sunlit / active / deepening / still`; brief §11.2 left it
open. Confirm final. Note this conflicts with Workshop's temperature words
(`fresh / aging / dormant`), which is bound up with A1.

### B3. Voice memo scope
README says the voice memo is "mocked in the prototype — wire to real
recording/transcription in production." Real mic capture + audio storage +
transcription is a sizeable separate lift.
**Proposed default:** **v1 ships text memo only**; the voice affordance is
stubbed/hidden and scheduled as its own follow-on. Confirm.

### B4. Field-notes memo routing
Memos route to the served thread's field-notes section. Our field notes are a
**fixed section enum per project** (`FieldNotesSectionKey`: What's working /
Open questions / People / Resources / Scratch-style). Confirm `noteTo.section`
must map to that enum. And when the cadence's parent is a **crystal or idea**
(not a thread directly), **which thread's** field notes receive the memo — the
crystal's owning thread?
**Proposed default:** map to the existing enum; route to the owning thread of
the attached parent.

---

## What we're doing meanwhile

Finishing Tidewater skin slices 5–7 (ProjectLanding / CrystalDetail /
WeeklyReview; secondary surfaces + voice + Settings; QA + parallel deploy),
leaving reserved seams where Cadence will plug in. No Cadence code lands until
A1–A4 are answered.
