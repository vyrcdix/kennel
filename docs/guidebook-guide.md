# Guidebooks — user guide

> A guidebook is a per-topic ordered set of curated references —
> uploaded docs and links — that you author into a scannable spine:
> *idea → architecture → design → user guide*, for example.
> A topic can hold any number of guidebooks; the same source can
> appear in more than one with different labels and order.

This guide describes what's shipped through Slice 4 (full data model
+ create/list/pin/reorder/delete guidebooks + add-from-existing
entries with drag-reorder, inline rename, and remove). What's still on
the way is called out under [Not yet](#not-yet).

For the design behind these decisions, see `docs/guidebook-frd.md`.
For the implementation breakdown, see `docs/guidebook-plan.md`.

## Concepts

| Term | Meaning |
| --- | --- |
| **Guidebook** | An ordered collection of entries inside a topic. Has a name, an optional description, and a pinned flag. |
| **Entry** | One position in a guidebook. Points at exactly one source — a Doc or a Reference already in the topic — and carries its own name, description, and (later) tags. |
| **Spine** | The list of `(name, description)` pairs across a guidebook, rendered as a scannable index. The reader's-eye view. |
| **Per-membership metadata** | Name/description/order are *on the entry*, not the source. The same Doc can appear in two guidebooks with different labels. |

## Where to find it on the screen

A topic's landing page now has two new surfaces:

- **Pinned guidebooks section.** Above the Items/Docs/References
  tabs, parallel to Pinned docs. Cards link straight into the
  dedicated GuidebookView.
- **Guidebooks tab.** A new "Guidebooks · *N*" tab next to
  References. Lists every guidebook in the topic with affordances to
  pin, move up/down, rename, delete. A `+ New guidebook` button sits
  in the tab header when the tab is active.

Each guidebook opens at `/project/:slug/guidebook/:id` — the
**GuidebookView**. Its header carries the click-to-edit name and
description; the spine renders below as a draggable list of entry
rows. The header pin star is the same toggle as on the topic-level
list.

## Walkthroughs

### Create your first guidebook

1. Open a topic.
2. Click the **Guidebooks** tab.
3. Click **+ New guidebook**.
4. Type a name (required, ≤ 80 chars) and optional description (≤
   280 chars). Toggle **Pin to this thread's landing page** if you
   want it surfacing in the pinned section right away.
5. **Create**. You're taken to the guidebook view.

### Add an entry from an existing Doc or Reference

1. From the GuidebookView, click **+ Add entry**.
2. The modal lists every Doc and Reference already in the topic.
   Search to narrow. The first match auto-selects.
3. Click the source you want. The **NAME** field placeholder shows
   what the spine label defaults to (the source's title); type
   anything to override per-entry.
4. (Optional) Write a one-line **DESCRIPTION** for the spine.
5. **Add entry**. The row appears at the bottom of the spine with
   rank = max + 1.

### Reorder the spine

Grab the **grip handle** on the left of any entry row and drag it
above or below another row. While dragging, the target row shows an
ember top-border. Release to drop; the order persists to the server
in one PATCH and re-stamps every row's rank.

### Reorder guidebooks within the topic

On the topic's **Guidebooks** tab, use the **↑** / **↓** buttons on
each row. These are disabled for the first/last row respectively.
(There is no drag-to-reorder for guidebooks themselves yet — see
[Not yet](#not-yet).)

### Rename / re-describe inline

- **Guidebook name + description**: click the title or the
  description text in the GuidebookView header. The text becomes an
  input. Enter (or Cmd+Enter in description) or blur to save; Esc
  cancels.
- **Entry name**: click the entry's name in its row. Same input
  pattern. Source title and description remain visible below.

### Pin a guidebook to landing

- Star button on a tab row, on the GuidebookView header, or in the
  CreateGuidebookModal. Pinned guidebooks show as cards above the
  tabs section.

### Remove an entry vs. delete a guidebook

- **Remove an entry** (trash button on a row): drops the membership
  only. The source Doc or Reference stays in the topic and remains
  attached to any other guidebooks that referenced it.
- **Delete a guidebook** (header button or row icon): drops the
  guidebook *and* every entry in it. Sources are never touched.

Both prompt with a `window.confirm` first.

## Behavior reference

| Behavior | Where it lives | Notes |
| --- | --- | --- |
| Name required, ≤ 80 chars | server `services/guidebook.ts` validation | Trimmed before insert. |
| Description ≤ 280 chars | server validation | `null` = clear. |
| Append-rank on create | `nextRankForProject` | New guidebook lands at the bottom. |
| Drag-reorder persists | `PATCH /api/guidebooks/:id/entries/reorder` | Single transaction; every entry gets re-ranked by position. |
| Cross-topic source forbidden | `assertDocInSameTopic`, `assertReferenceInSameTopic` | Returns `400 validation_error / docId: wrong_topic`. |
| Same source twice in one guidebook | Allowed | Per-membership metadata is independent. |
| Delete cascades | `services/guidebook.ts deleteGuidebook` | Removes entries in the same transaction; never sources. |
| Source removed externally | Row shows `source unavailable`, open-source button disabled | Future-proofing — no Doc-delete UI today. |
| Activity log | `entity_type = 'guidebook' | 'guidebook_entry'` | Activity feed widened; comments and tags tables intentionally not. |

## Not yet

| Feature | When |
| --- | --- |
| Upload `.md` / `.docx` from the Add modal | Slice 5 — backend already supports it via `createDocFromUpload`; UI surface lands next. |
| Paste a link to create a Reference inline | Slice 5 — same modal, third tab. |
| Per-entry tags + tag filter + grouped-by-tag view | Slice 6. |
| Drag-reorder for **guidebooks** themselves (not entries) | Future polish — use ↑/↓ buttons today. |
| LLM-powered description / link enrichment | Out of v1 scope (see FRD). |
| Cross-topic source sharing | Out of v1 scope (see FRD). |
| MCP `read_guidebook` tool | Revisit after v1 ships. |

# UI-driven test cases (black-box)

Each case lists preconditions, steps, and expected results. They are
written so a human can run them as manual QA today and so a future
Playwright/Cypress suite can lift them with minimal translation.
"Topic" and "thread" are the same thing in this app.

## Smoke

### TC1 — Create first guidebook on a topic with none

**Pre**: a topic exists with zero guidebooks; you're signed in.
**Steps**
1. Navigate to `/project/<slug>`.
2. Click the **Guidebooks · 0** tab.
3. Click **Create one** in the empty state.
4. In the modal, type `Product handbook` in the NAME field.
5. Click **Create**.

**Expected**
- The modal closes.
- URL is `/project/<slug>/guidebook/<id>`.
- Header shows `Product handbook`.
- Spine section shows `SPINE` and the copy `no entries yet`.
- The back-link reads the topic's name; clicking it returns to
  `/project/<slug>`.
- On return, the tab now reads `Guidebooks · 1` and the row exists.

### TC2 — Cannot create a guidebook with an empty name

**Pre**: any topic.
**Steps**
1. Open the **+ New guidebook** modal.
2. Leave the NAME field blank.
3. Observe the **Create** button.

**Expected**
- The button is visibly disabled (greyed) and does not submit.
- Typing any non-whitespace character enables it.

### TC3 — Pin from the create modal

**Pre**: any topic.
**Steps**
1. Open **+ New guidebook**.
2. Type `Pinned one`.
3. Tick **Pin to this thread's landing page**.
4. **Create**.
5. Click the back-link to return to the topic.

**Expected**
- A **Pinned guidebooks** section appears above the tabs section
  with a card titled `Pinned one`, showing `0 entries`.

## Listing + reorder of guidebooks themselves

### TC4 — Guidebook tab lists every guidebook in user-defined order

**Pre**: the topic has three guidebooks created in order A → B → C.
**Steps**
1. Click the **Guidebooks** tab.

**Expected**
- Rows appear top-to-bottom: A, B, C.
- Each row shows: star icon, name, description preview (if any),
  entry count, ↑, ↓, rename, trash.

### TC5 — Move guidebook up / down

**Pre**: TC4 state.
**Steps**
1. Click the **↓** arrow on row A.
2. Click the **↓** arrow on row A again.

**Expected**
- After step 1: order is B, A, C.
- After step 2: order is B, C, A.
- The **↓** arrow on the last row is visually disabled (opacity ~25%
  + non-interactive cursor) and does nothing on click.
- The **↑** arrow on the first row is similarly disabled.

### TC6 — Pin / unpin from the tab row

**Pre**: TC4 state, none pinned.
**Steps**
1. Click the star icon on row B.

**Expected**
- The star fills (ember color) in place.
- Returning to the top of the landing, a **Pinned guidebooks**
  section shows a card for B.
- Clicking the star a second time returns it to the empty state and
  removes the pinned card.

### TC7 — Rename via the tab row prompt

**Pre**: a guidebook exists.
**Steps**
1. Click the **rename** (note) icon on the row.
2. In the browser prompt, change the name and confirm.

**Expected**
- The row's name updates in place.
- Refreshing the page preserves the new name.
- Cancelling the prompt or submitting an unchanged value is a no-op.

### TC8 — Delete via the tab row trash

**Pre**: a guidebook exists.
**Steps**
1. Click the trash icon on the row.
2. Confirm in the prompt.

**Expected**
- The row disappears.
- The tab count decrements.
- Any pinned card for that guidebook disappears.
- The topic's Docs and References lists are unchanged.

## Single guidebook (GuidebookView)

### TC9 — Click-to-edit guidebook name + description

**Pre**: a guidebook exists with a name and an empty description.
**Steps**
1. Open the guidebook.
2. Click the large name. Edit. Press Enter.
3. Click the placeholder description text. Type a description.
   Cmd/Ctrl+Enter (or blur) to save.
4. Click the description text again, clear it entirely, blur.

**Expected**
- The name updates on Enter; pressing Esc instead reverts.
- The description text becomes a textarea on click and saves the
  trimmed value.
- Clearing the description to empty + blur removes the description
  (the placeholder line `add a one-line description` returns).

### TC10 — Pin / Unpin from the GuidebookView header

**Pre**: a guidebook, not pinned.
**Steps**
1. Click **☆ Pin**.
2. Click **★ Pinned**.

**Expected**
- After step 1: button label changes to **★ Pinned**; the pinned
  card appears on the topic landing.
- After step 2: button reverts; the pinned card disappears.

### TC11 — Delete from the GuidebookView

**Pre**: a guidebook with at least one entry.
**Steps**
1. Click **Delete** in the header.
2. Confirm.

**Expected**
- Navigation returns to `/project/<slug>`.
- The guidebook no longer appears in the tab or the pinned section.
- The source docs/references attached to the deleted entries are
  still present in the topic's Docs and References tabs.

## Entries

### TC12 — Add an existing Doc as an entry

**Pre**: a guidebook with no entries; the topic has at least one
Doc.
**Steps**
1. From the GuidebookView, click **+ Add entry**.
2. Confirm the picker shows the Doc.
3. Click the Doc row.
4. Leave NAME and DESCRIPTION blank.
5. Click **Add entry**.

**Expected**
- Modal closes.
- A new entry row appears in the spine: position `1`, doc icon, name
  = the Doc's title.
- Clicking the eye icon on the row navigates to `/doc/<id>`.

### TC13 — Add an existing Reference as an entry

**Pre**: the topic has at least one Reference with a URL.
**Steps**
1. **+ Add entry** → select the Reference.
2. **Add entry**.

**Expected**
- New row appears with the external-link icon and name = the Ref's
  label.
- Clicking the open-source button opens the URL in a new tab.

### TC14 — Filter the add-entry source list

**Pre**: a topic with at least one Doc *and* one Reference whose
titles share a substring (e.g. both contain "spec").
**Steps**
1. **+ Add entry**.
2. Type that substring into the filter.

**Expected**
- The list narrows to matches across both kinds.
- The first match is auto-selected (highlighted in ember-tint).
- Clearing the filter restores the full list.
- If no source matches, the list shows `no matches`.

### TC15 — Cross-topic doc cannot be attached

**Pre**: two topics A and B; a Doc lives in A; a guidebook lives in
B.
**Steps**
1. (Hand-crafted) Issue a `POST` to
   `/api/guidebooks/<B-guidebook-id>/entries` with `{ docId: <A-doc-id> }`.

**Expected**
- HTTP 400 with body
  `{ error: 'validation_error', fields: { docId: 'wrong_topic' } }`.
- The UI doesn't surface A's docs in B's add-entry picker, so this
  is genuinely a server-edge guarantee.

### TC16 — Rename an entry inline

**Pre**: a guidebook with at least one entry.
**Steps**
1. Click the entry's name.
2. Edit to a new value. Press Enter.

**Expected**
- The name updates in place.
- The source's own title remains visible underneath as
  `source · <original title>` (only when the override differs from
  the source title).
- Pressing Esc instead reverts.
- Entering whitespace-only or the same name is a no-op (no server
  call expected).

### TC17 — Reorder entries by drag

**Pre**: a guidebook with three entries in order 1: A, 2: B, 3: C.
**Steps**
1. Grab the grip handle on row C.
2. Drag it above row A. Release.

**Expected**
- During drag, row A shows an ember top-border indicating drop
  target.
- After release: order is C, A, B; position numbers re-stamp to 1,
  2, 3 in that order.
- Reloading the page preserves the order.

### TC18 — Remove an entry

**Pre**: a guidebook with at least one entry.
**Steps**
1. Click the trash icon on a row.
2. Confirm.

**Expected**
- The row disappears.
- Position numbers re-stamp on the remaining rows.
- The source Doc / Reference is still in the topic's Docs /
  References tab.
- If the removed row's source is referenced by *another* guidebook,
  that guidebook's entry is unaffected.

### TC19 — Same source attached to two guidebooks with different labels

**Pre**: a topic with a Doc; two guidebooks in the same topic.
**Steps**
1. In guidebook A, **+ Add entry** → pick the Doc, override NAME to
   `Intro reading`, Add.
2. In guidebook B, **+ Add entry** → pick the same Doc, override
   NAME to `Reference appendix`, Add.

**Expected**
- Both guidebooks list the Doc as an entry.
- A's row reads `Intro reading`; B's row reads `Reference appendix`.
- Editing the Doc itself (via DocEditor) updates the body that both
  rows point at, but neither entry's name/description changes.

### TC20 — Empty-state guidebook offers an inline Create CTA

**Pre**: a topic with no guidebooks.
**Steps**
1. Click the **Guidebooks · 0** tab.

**Expected**
- The tab body shows `no guidebooks in this thread` and a primary
  button `+ Create one` that opens the same modal as the header
  `+ New guidebook`.

## Persistence + concurrency edges

### TC21 — Refresh after each operation preserves state

**Pre**: any of the operations above.
**Steps**
1. After each of: create, rename, pin, reorder, add entry, rename
   entry, drag-reorder, remove entry, delete guidebook — perform a
   browser refresh.

**Expected**
- Every change is durable. No state is lost. The page hydrates from
  `/api/bootstrap` and the UI re-renders identically.

### TC22 — Two tabs editing the same guidebook stay coherent on refresh

**Pre**: a guidebook visible in two browser tabs.
**Steps**
1. In Tab 1, rename the guidebook.
2. In Tab 2, refresh.

**Expected**
- Tab 2 now shows the new name.
- (We don't broadcast change events to other tabs in v1 — staleness
  resolves on next read, not in real time. That's a known limit, not
  a bug.)

### TC23 — Server error on rename surfaces an inline message

**Pre**: simulate the server returning a 400 for an update (e.g.
exceed the name length cap by typing > 80 chars in DevTools).
**Steps**
1. Edit the name to a 200-char string and Enter.

**Expected**
- The header shows a red mono message under the description with the
  validation fields.
- The previous (server-persisted) name is still in place; no partial
  save.

---

These cases are the canonical contract for what shipped through
Slice 4. When Slice 5 adds the upload + link-paste paths, this file
gains a new section (TC24 onwards) and the **Not yet** table loses
two rows.
