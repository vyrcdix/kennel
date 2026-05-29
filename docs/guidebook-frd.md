# Steep — Guidebooks per Topic (FRD)

> Status: **functional requirements, not started.** Companion to
> `docs/guidebook-plan.md` (implementation slices). Scope here is what
> a user sees and does; the plan covers schema, routes, and UI wiring.

## Summary

A **guidebook** is a user-assembled, ordered set of references for a
topic (project). Each entry points at a source — either an uploaded
document (`.md` or `.docx`) or an external link — and carries a short
name + description that the user supplies. The set of names +
descriptions across a guidebook forms its **spine**: a scannable
index that lives independently of the underlying source content.

A topic supports any number of guidebooks. The same Doc or Reference
can appear in multiple guidebooks within a topic, and the
per-membership metadata (name, description, order, tags) is
independent — the same source can carry a different label in each
guidebook.

## Problem

Today a topic has Docs, References, Field Notes, Runbooks, Items.
None of these answers the question *"what's the recommended reading
order for getting up to speed on this topic?"* A reader has to guess
which doc comes first, which is the canonical source, and which links
matter. Guidebooks add the lightweight authored layer that turns a
pile of references into a narratable sequence — *idea → architecture
→ design → user guides*, for example — without duplicating any source
material.

## Concept

| Concept | Definition |
| --- | --- |
| **Guidebook** | An ordered collection of entries within a topic. Has a name, an optional description, and may be pinned to the project landing page. |
| **Entry** | A single position in the guidebook. Points at exactly one source — a Doc *or* a Reference — and adds per-membership metadata. |
| **Spine** | The list of `(name, description)` pairs across a guidebook, rendered as a scannable index. The reader's-eye view. |

A topic can hold any number of guidebooks. Each is independent;
there is no global "default" guidebook.

## Entry model

| Field | Behavior |
| --- | --- |
| **Source** | Exactly one of: an existing Doc (uploaded `.md`/`.docx`), an existing Reference (link), a newly uploaded doc, or a newly pasted link. The latter two create a Doc/Reference in the topic as a side effect, then attach. |
| **Name** | Short title used on the spine. Required. Defaults to the source's title on attach; the user can override per-entry. |
| **Description** | Quick summary used on the spine. Optional. Free-text. (Auto-generation is out of scope for v1 — see "Out of scope".) |
| **Order** | Position within the guidebook. Drag-to-reorder. Stable across edits. |
| **Tags** | Free-text string tags on the entry. Used for the grouped view. Tags are per-entry strings, not shared with the topic's tag system. |

## Source rules

- **Reuse, not duplication.** A guidebook entry references a Doc or
  Reference; it does not copy the body. Editing the Doc body (via the
  Doc editor or MCP) updates what every guidebook entry pointing at
  it shows.
- **Same-topic only in v1.** Both the guidebook and its entries'
  sources must live in the same topic. Cross-topic sharing is a
  larger refactor (Doc ownership currently includes `project_id`) and
  is deferred. Tracked separately.
- **Provenance preserved on upload.** When a user uploads a `.docx`,
  the file is converted to markdown (mammoth) and stored as a normal
  Doc, but the Doc carries provenance: original filename, source kind
  (`docx` | `md`), and uploaded-at timestamp. Useful when re-finding
  "the original Word version" later.
- **Existing source picker.** When adding an entry, the user can
  pick from the topic's existing Docs and References, or upload/paste
  new. The picker is filterable.

## Multiple guidebooks per topic

- A topic starts with zero guidebooks; the user creates the first
  explicitly.
- Guidebooks are listed in user-defined order (drag-to-reorder among
  themselves).
- Each guidebook has a `pinned` flag. Pinned guidebooks surface in a
  section on ProjectLanding (alongside pinned docs); unpinned ones
  live in the Guidebooks tab only.
- Deleting a guidebook removes the memberships but never the source
  Docs/References — those keep existing in the topic.

## Views

### List view (default)

A single scrollable list rendered in user-defined drag order. Each
row shows: name, description preview, source-type icon (doc/link),
source title (in muted text), tags. Click opens the source (Doc
editor for docs, target URL for links).

A **tag filter** row above the list narrows by tag. Multiple tags
behave as OR. Clearing returns to the full list. Order within the
filtered list is the same drag order.

### Grouped view

A view-mode toggle (Order / Tags) sits at the top of the guidebook
screen. Tags mode groups entries by tag, with one row per tag.
Entries with multiple tags appear under each. Entries with no tag
land in an "untagged" group at the bottom. Inside a group, entries
keep their drag order.

The two views never disagree about order — Tags mode is a re-grouping
of the same list, never a re-sort.

## ProjectLanding integration

- **Pinned section.** A "Guidebooks" pinned section on
  ProjectLanding, parallel to Pinned docs. Renders pinned-guidebook
  cards with name + entry count + first 2–3 entry names from the
  spine.
- **Tab.** A new "Guidebooks · N" tab joins Items / Docs / References
  in the lower section of ProjectLanding. Lists every guidebook in
  the topic (pinned and unpinned) with name, description, entry
  count, and quick actions (rename, pin, delete).
- Clicking a guidebook opens its dedicated view (the list / grouped
  view described above).

## Spine — what the user sees

The spine is what makes a guidebook a guidebook rather than a folder.
Concretely, it is:

```
1. Idea brief                  what we set out to solve
2. Architecture sketch         the two-service split, why
3. Design exploration          three layouts; the one we picked
4. User guide — v1             how a reader actually uses this
5. Roadmap notes               where this is heading
```

Each line is `(name)` then `(description)`. Source titles and
underlying doc bodies are intentionally not part of the spine view —
the spine is the user's authored layer, scannable in isolation.

## Out of scope (v1)

- **Claude-powered auto-generate.** No server-side LLM calls. No
  "generate summary" button, no enriched link previews. The data
  model leaves room for these (description is a plain text column),
  and follow-up slices can add them — likely via the same
  copy-prompt-to-clipboard pattern Field Notes uses, or a real
  server-side Anthropic SDK call once a key story exists.
- **Basic link previews** (server-side fetch of `<title>` / OG
  tags). Same rationale — defer until the auto-generate story lands.
  v1 link entries are name + description, both manually written.
- **Cross-topic sharing.** A Doc still belongs to exactly one topic.
- **Topic tag table integration.** Tags on entries are free-text
  strings, not rows in the `tags` table. Decoupled on purpose to
  keep v1 small.
- **Reordering via keyboard / API ranking heuristics.** v1 is
  drag-only.
- **Export.** No "export guidebook as PDF / Markdown bundle" in v1.
- **MCP `read_guidebook` tool.** The MCP resources surface
  (`docs/mcp-setup.md`, the resources work that just landed) is the
  right home, but out of scope here; revisit once v1 ships.

## Open questions

- *Should a guidebook have its own pinned-to-dashboard treatment, or
  only pin within ProjectLanding?* Defaulting to within-topic only.
- *What happens to entries when the source Doc is deleted?* Today
  Docs have no delete UI; if that lands, entries should soft-degrade
  to "(source removed)" rather than be silently dropped.
- *Should the spine render as a printable / shareable view?* Not in
  v1; revisit if the export question gets concrete.

## Value

- Turns scattered references into ordered narratives.
- The authored layer (name + description) is reusable across
  guidebooks without copying the source — the same architecture doc
  can be entry 3 in the engineering guidebook and entry 1 in the
  on-boarding guidebook, with different labels in each.
- Domain-agnostic — works for any topic where references need
  sequencing and context, not just software projects.
