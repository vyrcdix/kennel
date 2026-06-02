# Steep — Smart Routing (paste + email) (FRD)

> Status: **functional requirements, not started.** Companion
> implementation plan ships as `docs/email-ingestion-plan.md` once
> design is signed off. Scope here is what a user sees and does; the
> plan covers schema, services, routes, and UI wiring.
>
> File kept as `email-ingestion-frd.md` for git history; rename to
> `routing-frd.md` whenever convenient.

## Summary

A user can drop a chunk of content into Steep — pasted into an
in-app "Paste & route" modal, or (later) sent by email to a
personal Steep address — and Claude classifies what kind of artefact
the material should become: a captured item, a doc, a guidebook
entry, a runbook section update, or a field-notes paragraph. The
matching service runs immediately, the artefact appears in the
normal Steep UI, and the user can revert or re-route the placement
for a short window afterward.

There are two ways material can arrive:

1. **Paste & route** — an in-app modal. The user picks a thread,
   pastes content (a forwarded email, an article excerpt, a typed
   thought), optionally hints what kind of artefact it is, and
   submits. This is the canonical v1 surface.
2. **Email** — a personal `<token>@inbox.steep.work` address that
   accepts mail from an allowlisted sender, with a thread tag in
   the subject. Ships later as a transport-layer add-on to the same
   classifier and dispatcher.

The point isn't to bypass Steep's existing capture flow. It's to
give the user a *frictionless second input mode* that doesn't need
the user to also be the sorter — Claude makes the routing call,
and the user reviews after the fact instead of triaging before.

## Problem

Today material lands in Steep only via:
- The Capture modal (in-app, requires triaging into a state + kind
  at the moment of capture).
- MCP-driven calls from a Claude client (requires being in a Claude
  conversation).
- An uploaded `.md` or `.docx` via the Doc upload path (in-app,
  always becomes a Doc).

None of these handle the very common case of *"I have a chunk of
text from somewhere and I'm not yet sure where it belongs."*
Forwarded articles, meeting transcripts, deploy notes, a thought
typed on a phone — all of these arrive with no obvious target. The
existing flow forces the user to choose at capture; Smart Routing
lets the system propose and the user correct.

## Concept

| Concept | Definition |
| --- | --- |
| **Source** | Either a paste (in-app modal) or an inbound email (Phase 1+). Each source carries plaintext / markdown / HTML content plus optional attachments. |
| **Thread** | The Steep project the material belongs to. Picked explicitly in the paste modal; parsed from the subject in email. |
| **Hint** | An optional user-supplied suggestion of what kind of artefact the material should become. Claude uses it as a strong prior — it'll override a low-confidence hint, but a high-confidence hint usually wins. |
| **Routing decision** | Claude's classification of the material into one of the existing Steep artefact types plus the payload the chosen handler needs. |
| **Routing** | A persisted record of one source — the raw content, the resolved thread, the hint (if any), Claude's decision, the artefact it became, and the time. Surfaces in a "Recently sorted" strip so the user can review, re-route, or undo. |

A thread can receive any number of routings. Each becomes exactly
one artefact (or a small set, when attachments come along).

## Routing taxonomy

| Action | When Claude picks it | Result in Steep |
|---|---|---|
| **`bench`** | The material is genuinely a quick thought, todo, or context-free fragment. Default for ambiguous cases. | One inbox item per source, body becomes the item body. Same shape as Capture > kind=note. |
| **`doc`** | Long-form prose, an essay, meeting notes, an article. Anything with structure that wants to keep its formatting. | A new Doc in the thread; first heading or first sentence becomes the title; body is markdown-converted. Provenance carries `source_kind='inline'` and a fresh `source_filename` derived from the title. |
| **`guidebook-entry`** | The material clearly references an external resource (a URL is the primary signal) and reads as "here's something to read on this topic." | An entry in the thread's most recently touched guidebook, or — if the user maintains multiple — the one whose name best matches the content. Falls back to bench if no guidebook exists. |
| **`runbook-section`** | The material documents a procedure, command sequence, or operational note. | An append to the matching runbook section (`prerequisites` / `setup` / `run` / `deploy` / `troubleshoot` / `notes`). Existing content is preserved with a date-stamped divider above the appended block. |
| **`field-notes`** | First-person observation, hunch, running commentary, a question I want to revisit. | An append to a named section of the thread's field notes. Claude picks the section (`premise` / `whatIKnow` / `openQuestions` / `sources` / `crystallizations`); date-stamped divider above the appended block. |

The taxonomy maps 1:1 onto existing Steep services. Nothing here is
a new artefact type.

## Paste & route — the in-app surface

A modal reachable from:
- A "Paste & route" button in the thread landing header (defaults
  to that thread).
- A "Paste & route" item in the global Capture menu (defaults to
  last-active thread).
- A keyboard shortcut (`⌘⇧V`).

The modal contains:

- **Thread** — dropdown of active threads, defaulting per the entry
  point above.
- **Hint** — segmented control: *let Claude pick* (default) ·
  *bench* · *doc* · *guidebook* · *runbook* · *field-notes*. The
  user-visible labels are short; the underlying values map to the
  taxonomy.
- **Body** — large textarea. Accepts plain text, markdown, or
  pasted HTML (the latter is converted on submit). Drag-drop of a
  `.md` / `.docx` file lands the file content into the body. No
  attachment slot in v1.
- **Submit** — runs the classifier and routes. Closes the modal on
  success; surfaces the resulting placement as a toast linking to
  the artefact.

The modal does not block on the routing call. Submitting closes the
modal immediately and the toast appears when the dispatch completes
(typically <2s). If Claude or the dispatch fails, the toast surfaces
the failure with a "Try again" affordance that re-opens the modal
with the content preserved.

## Routing UX (both surfaces)

The user does not wait on a UI prompt for the classification:

1. Source arrives (paste submitted, or email received).
2. Thread resolves (modal selection, or subject tag).
3. Claude classifies the content + thread context + optional hint.
4. The matching service runs.
5. A routings row records what happened.

On the next page load (or the next SSE tick if the user is in the
app), the thread shows the new artefact in its normal place.

### Recently sorted strip

Each thread's landing page gets a slim **"Recently sorted · last N
days"** strip — analogous to the Resurfacing slot in v0.5 — listing
recent routings. Each row shows:

- The artefact icon + title.
- A small `from` chip: *pasted* / *email · `<sender>`*.
- The routing decision label (`captured to bench` / `appended to
  runbook · deploy` / etc.).
- Two controls: **Re-route…** (opens the taxonomy picker, sets the
  artefact's place to the chosen target, retires the original) and
  **Undo** (deletes the artefact, marks the routing as rejected so
  the original content remains queryable).

Strip shows only routings from the last seven days. Older entries
remain queryable via the activity log.

### When Claude refuses to choose

Two cases:

- **Low confidence:** Claude's response includes a `confidence`
  field. Below a configured threshold (default 0.55), Steep ignores
  Claude's pick and routes to `bench`. The strip surfaces this as
  "captured to bench · low-confidence route".
- **Hard ambiguity:** the material could legitimately be two things
  (a runbook section *and* a field-notes observation). Claude is
  prompted to pick the single best fit; ties also route to `bench`.

The user always has the Re-route control as the safety net.

### When the user hints

A non-default hint is a strong prior, not an override:

- Claude is told the user's hint and asked to confirm or push back
  with a one-sentence justification.
- If Claude agrees, the dispatch runs the hinted action.
- If Claude disagrees with high confidence, it picks its own action
  and the strip row shows both ("captured to bench · user hinted
  runbook · low-signal procedural language").
- If Claude disagrees with low confidence, the hint wins.

This keeps hints useful without making them rigid.

## Attachments

In v1 (paste):
- Drag-dropped `.md` / `.docx` files into the textarea become the
  body content. No separate attachment slot.

In Phase 1 (email):
- `.md` and `.docx` attachments — go through the existing doc-upload
  service. One doc per attachment, attached to the same thread,
  provenance preserved. The email body still gets classified
  separately.
- All other attachment types — store the raw file under
  `content/<slug>/uploads/email/`, create a Reference pointing at
  the local path, and append a line to the routing noting what was
  preserved.
- Images embedded inline in HTML — extract, save under uploads,
  rewrite the markdown to point at the local path.

Image extraction and PDF text-extraction get smarter in Phase 3. v1
and Phase 1 are "don't lose anything."

## Auth and cost

- The Claude API call counts toward a per-day cap (default 200
  routings/day, configurable per-installation). Hitting the cap
  routes new sources to `bench` without consulting Claude (still
  routed, just unrouted). The strip surfaces this as "captured to
  bench · over daily AI budget."
- Paste is gated by the existing app-level auth (session cookie). No
  additional auth surface.
- Email transport (Phase 1) adds per-user secret + sender allowlist
  + DKIM/SPF — see Phase 1 below.

## What the user configures

A new **Settings → Routing** panel, scoped by phase:

**Phase 0 (Paste only):**
- Default thread for the global Capture menu's Paste & route entry
  (a dropdown of pinned threads + "last-active").
- The per-day Claude-call cap.
- A read-only field showing the Claude API key fingerprint (so the
  operator knows which key is in use). The key itself isn't
  editable from the UI; it lives in the systemd unit as
  `ANTHROPIC_API_KEY`.
- A `confidence threshold` slider (default 0.55, range 0.3–0.85).

**Phase 1 (Email added):**
- Their current ingest address (with a copy button).
- A "Rotate token" button (one-shot, asks for confirmation, shows
  the new address once and only once).
- The sender allowlist (one address per line; comments OK).
- A toggle: "no thread tag → land in <default thread>" vs "land in
  the bench of every project."
- The per-day email cap (separate from the Claude cap).

## Phases

Each phase ends with `npm test` green and a useful feature state.

### Phase 0 — Paste & route (the interim, and the canonical v1)

The brains, exposed via an in-app modal. No email infrastructure.

**Server:**
- New env var `ANTHROPIC_API_KEY`. Documented in
  `kennel-sys-admin-guide.md`.
- New service module wrapping the Anthropic SDK. Prompt caching on
  the per-thread context (description, guidebook list, runbook
  section titles, field-notes section names). Single
  structured-output call per source, returning `{action, payload,
  confidence, explanation}`.
- Routing dispatcher: maps each `action` to its existing service
  (`captureItem`, `createDoc`, `addEntry`, `updateRunbookSection`,
  `updateFieldNotes`). Each dispatch logs the routing decision +
  Claude's explanation.
- New `routings` table: `(id, project_id, source_kind ['paste' |
  'email'], hint, classifier_action, classifier_confidence,
  classifier_explanation, artefact_kind, artefact_id, raw_content,
  created_at, rejected_at)`.
- New `POST /api/routing/paste` route. Accepts `{projectId, hint?,
  body}`; runs the classifier; dispatches; returns the routing row.
- Confidence threshold + per-day cap enforced.

**Frontend:**
- New **Paste & route** modal at `src/components/PasteRouteModal.tsx`.
  Thread picker, hint segmented control, body textarea,
  drag-drop md/docx into body, submit. Opens via
  `openPasteRoute(projectSlug?)` from the bus pattern used by
  Capture.
- A "Paste & route" item in `CaptureModal`'s kind row, or a separate
  entry; design picks one before plan.
- A **Paste & route** button in the thread landing header.
- `⌘⇧V` global shortcut.
- New **Recently sorted** strip on ProjectLanding, listing routings
  from the last seven days with **Undo** affordance only (Re-route
  ships in Phase 2).
- Toast on successful routing showing the placement + a "View" link
  to the artefact.

After this phase, paste-driven smart routing is shippable end-to-end.
The user can drop any chunk of text into Steep without pre-sorting.

### Phase 1 — Email transport

Adds inbound email as a second input surface. The classifier +
dispatcher + `routings` table from Phase 0 are reused verbatim.

**Server:**
- New inbound-provider account (Cloudflare Email Workers /
  Postmark / Mailgun — picked in the plan based on the user's
  domain setup). MX records pointed; signing secret configured.
- New `POST /api/routing/email` route. Verifies signing secret.
  Parses the provider's payload into `{from, to, subject, text,
  html, attachments}`.
- HTML → markdown via `turndown`; quoted-reply / signature strip.
- Thread tag detection on the subject (the four-pattern parser
  below) → resolve to project via `getProjectBySlug`. No tag →
  default thread from Settings.
- Sender allowlist + DKIM/SPF check.
- Attachment handling per the v1 rules above.
- Per-day email cap; per-user secret rotation.
- Routing rows get `source_kind = 'email'` and carry the sender
  address.

**Frontend:**
- Settings → Routing panel gains the email config (address,
  rotation, allowlist, default-thread toggle, email cap).
- Recently-sorted-strip rows render the sender chip when
  `source_kind = 'email'`.

After this phase the same classifier serves two sources. Email is
zero-extra-UX for the user once configured; the body of the message
goes through the same Phase 0 pipeline.

#### Thread tag detection

The subject line is parsed for these patterns (in order, first hit
wins):

1. **`[slug]` prefix.** `[kennel] re: deploy notes` → thread `kennel`.
2. **`slug:` prefix.** `kennel: deploy notes` → thread `kennel`.
3. **Bare leading slug.** `kennel deploy notes` → thread `kennel`,
   but only when the leading word is an exact slug match. (Avoids
   accidental classification of unrelated subjects whose first word
   happens to be a project slug.)
4. **No tag.** Land on the **default thread** from Settings (default:
   the first pinned thread).

Case-insensitive; punctuation around the tag is forgiven.

#### Ingest address shape

- **Format:** `<token>@inbox.steep.work` where token is a per-user
  secret (32 chars, opaque). Generated once on the Routing panel;
  can be rotated. The old token immediately stops accepting mail.
- **Sub-addressing:** ignored on receipt. The token is the unit of
  identity.
- **Sender allowlist:** the user lists permitted sender addresses
  in the same panel. Mail from outside the allowlist is dropped
  with a soft `421` so the sender's mail server can retry once
  before giving up.
- **Spoofing protection:** the inbound provider's DKIM+SPF check
  must pass. Failures route to a debug log, not the bench.

### Phase 2 — Review UX (Re-route, rejected log, classifier insight)

The safety net for both sources.

- **Re-route…** control on every Recently-sorted-strip row. Opens a
  small modal with the taxonomy choices and the artefact's current
  placement pre-selected. Picking a different target executes the
  matching service + retires the original artefact (so an item that
  was placed into the runbook gets pulled out and recreated as a
  bench item, or vice versa).
- **Undo** behaviour upgraded: instead of just deleting the
  artefact, it marks the routing as `rejected` and preserves
  `raw_content` so the user can see what they declined.
- A "Rejected ingest" log on the Settings → Routing panel (or
  inline on the strip via a "rejected" filter) shows recent
  declines.
- New `ROUTED` and `REROUTED` activity verbs so the history is
  queryable.
- Settings → Routing panel gains a taxonomy view: per-action counts
  over the last 30 days, a confidence histogram. Lets the user tune
  the confidence threshold from data.

After this phase the auto-routed model is one-click correctable and
the user can see how the classifier is performing over time.

### Phase 3 (optional) — Better attachment handling

Quality-of-life only; nothing structural. Only meaningful once email
transport is live.

- Image extraction from HTML body → embedded into the
  doc/guidebook entry body as markdown image syntax with local URLs.
- PDF text extraction (via `pdf-parse`) so PDFs can be classified
  alongside the body text instead of always becoming references.
- HEIC and other phone-camera formats normalised on receipt.

Defer unless the user reports the v1 attachment behaviour as
limiting in practice.

## Out of scope (v1 + Phase 1)

- **Outbound mail.** Steep never sends. No acknowledgements, no
  notifications, no "I put this here, was that right?" prompts.
  The Recently-sorted strip is the only feedback channel.
- **Mailing lists / threaded conversations.** Each inbound email
  is one routing. Reply chains are flattened into the body of
  whatever the latest message becomes. Conversation tracking is a
  future ask.
- **Multi-user.** Single-user model throughout. The token is the
  user; the allowlist is the auth boundary.
- **Inline editing during routing.** No "I'm going to ask you a
  question first" flow. If Claude needs clarification, it routes
  to `bench` and the user sees a normal sort surface.
- **Forwarded chats / podcast transcripts / video summaries.** v1
  and Phase 1 treat these as plain text + attachments. Special
  handling for rich-media payloads is a separate slice.
- **Receiving from arbitrary public senders.** The allowlist is
  always on (in Phase 1). The address is not public; there is no
  signup flow.

## Success criteria

- A user can paste a meeting note into the `kennel` thread, leave
  the hint as "let Claude pick," submit, and see the content land
  in the right place — runbook section / field-notes paragraph /
  fresh doc — within a couple of seconds. (Phase 0.)
- A user can paste a deploy command sequence with the hint set to
  "runbook" and have it append to the deploy section with a date
  divider above. (Phase 0.)
- When Claude misclassifies, the user can re-route in one click
  from the Recently-sorted strip without leaving the thread page.
  (Phase 2.)
- The bench never receives a paste it could have routed somewhere
  better, *given the same thread context Claude has*. Misroutes
  that fall back to bench because of low confidence are the
  acceptable failure mode; misroutes that go to the wrong artefact
  are bugs to investigate. (Phase 0.)
- A user can forward an article URL from their phone to their
  Steep address and see it attached to a guidebook within a minute,
  with no further action. (Phase 1.)
- A user can email a deploy snippet to their `kennel` thread and
  have it land in the deploy section of the runbook, with the
  existing content preserved and a date-stamped divider above the
  new block. (Phase 1.)
