# Steep — User's Guide

Steep (repo codename: Kennel) is a personal command center for thinking
work. It is not a project manager — there are no sprints, assignees, or
burndown charts — and it is not a filing cabinet. It exists to run one
cycle well:

> **capture → sort → work → crystallize → resurface → repeat**

You throw raw material onto **the bench**, sort it into the **thread**
it serves, work it until something durable settles out, promote that
into a **crystal**, and let the system bring the crystal back to you on
a cadence so it stays true.

This guide covers the day-to-day surfaces. Server setup, backups, and
MCP wiring live in `kennel-sys-admin-guide.md`.

---

## 1. The vocabulary

| Term | What it is |
|---|---|
| **Thread** | A container for one line of work or inquiry (a "project" in the schema). Holds items, docs, references, chats, field notes, a runbook, and guidebooks. |
| **The bench** | The inbox. Raw, context-free captures wait here until you sort them. |
| **Item** | A single captured thought. Kinds: `idea`, `note`, `action`, `question`, `ref`, `doc`, `crystallization`. |
| **Sort** | The screen where bench items get a decision: pick up, set aside, attach, crystallize, convert, or let go. |
| **In focus** | Items you're actively working (`active` state). |
| **Reflecting** | Items deliberately set aside to come back to. |
| **Crystal** | A durable outcome — a principle, quote, reminder, hint, or memory distilled from your material. The product's hero object. |
| **Filed** | Soft archive. Out of every default surface, still searchable. |
| **Let go** | Dismissed. You decided it isn't worth keeping. |
| **Field notes** | A thread's sense-making notebook: Premise / What I know / Open questions / Sources / Crystallizations. |
| **Runbook** | A thread's operational how-to: Prerequisites / Setup / Run / Deploy / Troubleshoot / Notes, plus labeled URLs. |
| **Guidebook** | A curated, ordered spine of docs and references for a topic. |
| **Trace** | A reverse-chronological timeline of how a thread's thinking evolved. |
| **Temperature** | A passive freshness signal on panels: fresh (≤ 24 h), active, aging (past your threshold), dormant (60 d+). |

---

## 2. Signing in and finding your way around

Steep is gated by a single password (set by whoever runs your server).
Sign in once; the session persists.

The frame is constant on every screen:

- **Chrome bar** (top): the search box (`⌘K`), **Paste & route**
  (`⌘⇧V`), and **Capture**.
- **Nav rail** (left): Dashboard, All crystals, The bench (with a count
  of unsorted items and pending proposals), Reflecting (with a count of
  set-aside items), Search, Skills, Settings — then your threads, and
  **New thread** (`⌘⇧N`).

Global shortcuts, available everywhere:

| Keys | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Open search |
| `⌘⇧N` | New thread |
| `⌘⇧V` | Paste & route (Smart Routing) |
| `⌘⇧F` | Toggle focus mode (hides side panels) |

On Windows/Linux, read `⌘` as `Ctrl` throughout.

---

## 3. Capture — get it out of your head

Capture is designed to take under five seconds. Nothing is required
except the thought itself; context comes later, at Sort.

1. Click **Capture** in the chrome bar.
2. Pick a kind (idea, note, action…) — or don't think hard about it;
   you can convert later.
3. Type a title. A body is optional.
4. Submit. The item lands on the bench.

**Example.** You're mid-task and remember something about a different
thread:

> Capture → kind: *idea* → title: `Resurface cadence should slow down
> after 3 consecutive "still true" acks` → Enter.

Done. You haven't decided what it serves, which thread owns it, or
whether it's any good. That's the point — the bench absorbs it so your
head doesn't have to.

### Paste & route (Smart Routing)

When you have a *chunk* of content — meeting notes, a pasted article,
a snippet from a chat — let the classifier file it for you:

1. Press `⌘⇧V` (or the **Paste & route** button).
2. Pick the thread. Optionally hint the destination (Bench, Doc,
   Guidebook, Runbook, Field notes) or leave **Let Claude pick**.
3. Paste (you can also drag a `.md` or `.txt` file in) and submit.

The modal closes immediately; a toast reports where the content landed
and why. The thread's landing page shows a **Recently sorted** strip of
the last week's routings, each with a one-click **Undo**.

**Example.** You paste deploy steps from a chat with the hint
*Runbook*: the classifier appends them to that thread's runbook under
**Deploy**, with a dated divider. Wrong call? Hit **Undo** in the strip
and the section reverts verbatim.

Smart Routing needs an Anthropic API key configured on the server
(Settings → Smart Routing shows whether one is set, the daily cap, and
the confidence floor). Below-confidence or over-budget pastes fall
through safely to the bench — nothing is lost.

---

## 4. Sort — give everything a home

Open **The bench** in the nav rail. Sort is a keyboard-first screen:
the left pane lists unsorted items (and pending skill proposals), the
right pane previews the selection.

| Key | Decision | Meaning |
|---|---|---|
| `J` / `K` | — | Move down / up the queue |
| `A` | **Pick up** | Into *in focus* — you're working it now |
| `P` | **Set aside** | Into *reflecting* — deliberately later |
| `S` | **Attach** | Attach this action to the crystal, idea, or thread it serves |
| `C` | **Crystallize** | Promote straight to a crystal |
| `V` | **Convert** | Change kind (idea ↔ note ↔ action ↔ question ↔ ref; or spawn a doc/reference) |
| `D` | **Done** | Mark crystallized without promoting the kind |
| `X` | **Let go** | Dismiss |
| `Esc` | — | Close the convert/attach popovers |

Filter chips at the top narrow by thread, kind, and tag.

**Attaching to thinking.** Actions in Steep are never free-floating
to-dos — they serve something. `S` opens a typeahead over your
crystals, ideas, questions, and the thread itself. An attached action
shows up on the Dashboard grouped under what it serves.

**Example.** Yesterday you captured `Email Priya re: API limits`.
At Sort: `S` → type `rate` → select the crystal *"Rate limits are a
product decision, not an infra one"* → `A` to pick it up. The Dashboard
now shows the email task nested under that crystal in **In focus**.

**Worked session.** Eight items on the bench, ninety seconds:
`A` (do today) · `J`, `P` (interesting, not now) · `J`, `V` →
*question* (it was phrased as a note but it's really an open question)
· `J`, `C` (that one's already a principle — crystallize it) · `J`,
`X`, `X` (noise) · `J`, `S` → attach → `A`. Bench is clear.

---

## 5. The three review lenses

Steep never notifies you. Instead it keeps three dedicated surfaces
you visit on your own rhythm.

### Reflecting — what you set aside on purpose

**Nav rail → Reflecting.** Everything you `P`-ed at Sort, listed
longest-shelved first, with one-keystroke decisions:

| Key | Action |
|---|---|
| `J` / `K` | Navigate |
| `U` | Pick up (back into focus) |
| `C` | Crystallize |
| `F` | File |
| `X` | Let go |

The reflecting counts on Dashboard project cards and thread headers
link here scoped to that thread (`/reflecting?project=<slug>`); a
**Show all threads** button widens back out.

**Example.** Friday afternoon: open Reflecting, walk the list with
`J`. An idea you shelved three weeks ago has ripened — `U`. Two others
no longer spark anything — `X`, `X`. One turned out to be true all
along — `C`.

### Aging — what went cold by accident

**Dashboard → Review all** (or `/aging`). Items in any working state
untouched past your aging threshold (Settings → Lifecycle; default
21 days), oldest first. Same keyboard model: `U` pick up, `C`
crystallize, `F` file. The threshold box on the screen lets you
temporarily widen or narrow the net (7–180 days) without changing the
setting.

Most aging items should be filed or let go — the screen's job is to
make each decision cost one keystroke.

### Weekly review — the shape of the week

**Dashboard → Weekly review.** A read-only digest of the last 7 days:
counts (captured / picked up / crystallized / set aside / let go /
converted / skill changes), the crystals that landed, activity grouped
by verb, and what's still aging. Every row clicks through to its item,
doc, or thread, so "wait, what was that?" is one click, not a search.

The intended ritual: Friday, coffee, read top to bottom. Recognize the
week's shape; don't try to act on every line.

---

## 6. Crystals — the durable outcomes

A crystal is a thought that settled: a **principle**, **quote**,
**reminder**, **hint**, or **memory**. Crystals are the only thing in
Steep that gets the gold ("blaze") treatment, and they're the unit the
system keeps fresh for you.

### Making one

- At Sort or on the Aging/Reflecting boards: `C` on the item.
- In a doc: **Promote to crystallization** in the doc header.

### The crystal page

Click any crystal (gallery, dashboard, trace) to open its detail page.

**Left pane — the crystal itself:** title, body, the type picker, and
its **connections**: the backing doc if it grew out of one, the actions
currently in service of it, and any later crystals distilled from it.

**Right pane — Built on:** the supporting material behind the crystal,
in four groups: **field-notes sections** (your own observations),
**guidebooks** (curated references), the thread's **runbook**
(reproducible steps), and plain **docs** — plus the raw lineage from
`sources_from`.

Use **+ Attach** in the Built on header to link support material. The
picker offers candidates from the crystal's own thread (cross-thread
attachment isn't allowed); rows already supporting a different crystal
say so, since attaching moves them.

**Example — building out a crystal.** You crystallized *"Ship the
import CLI before the import UI."* On its page: **+ Attach** → the
*Migration tooling* guidebook (the references that convinced you) →
**+ Attach** → field-notes section *What I know*. Later, at Sort, you
attach the action `Write kennel-import man page` to it with `S`. The
crystal page now tells the whole story: what it's built on, and what's
being done in its service.

### Resurfacing — "kept fresh"

Each crystal carries a resurface timer (Settings → Lifecycle →
resurface interval; default 30 days). When it lapses, the crystal
appears in the **Worth revisiting** slot on the Dashboard and its
thread's landing page — up to three at a time, with an
**"N more due — show all"** toggle when there's overflow.

Three responses, one click each:

- **Still true** — re-confirm it. Resets the timer, bumps the
  re-surfaced count (you'll see *"re-surfaced 4× · kept fresh"* on the
  crystal page).
- **Revisit** — open the crystal page to rework it. Opening also
  resets the timer.
- **Retire** — file it. It stops resurfacing but stays searchable.

---

## 7. Threads in depth

A thread's landing page is its front porch: crystals on top, then
**In focus**, pinned docs and guidebooks, the aging strip, recent
conversations, and the full item list with state/kind tabs.

### Field notes

**Thread → Field notes.** Five sections: *Premise*, *What I know*,
*Open questions*, *Sources*, *Crystallizations*. Two modes, toggled
per thread:

- **Scratchpad** — every section is freeform markdown. Default.
- **Managed** — *Open questions* becomes a live list of your
  `question` items and *Sources* a live list of your references, so
  the notebook and the item system stop drifting apart.

Switching modes only changes the view; nothing is migrated or lost.

### Runbook

**Thread → Runbook.** Six fixed sections — Prerequisites, Setup, Run,
Deploy, Troubleshoot, Notes — each independently editable markdown,
plus a set of labeled URLs (Admin, Prod, …). Every save bumps the
revision counter. Smart Routing can append into a named section (see
§3), always under a dated divider so provenance stays visible.

### Guidebooks

A guidebook is a reading spine: ordered entries pointing at docs and
references, each with its own short name, description, and entry-local
tags. The same doc can sit in two guidebooks under different names.
Create from the thread landing; add entries by picking an existing
doc/reference, uploading a `.md`/`.docx`, or pasting a link. Pin a
guidebook to feature it on the landing page.

**Example.** A *Vendor evaluation* guidebook: entry 1 — your
requirements doc, renamed "Start here"; entry 2 — a pricing-page
reference; entry 3 — an uploaded comparison spreadsheet export. Drag
to reorder as the argument develops.

### Docs

The doc editor is markdown source + live preview + a comments rail.
Saves are automatic (2 s after you stop typing) or explicit (`⌘S`);
each save bumps the revision. The rail also shows the doc's
**tags** and **connections** — the item it backs, the crystal it
supports, crystals distilled from it, and which guidebooks include it —
each one clickable.

### Trace

**Thread → "Go back through your thinking."** A reverse-chronological
timeline: crystals as milestones, dismissed forks struck through,
same-day captures clustered, registered chats interleaved. Filter to
all / crystals / discarded / chats. Use it when you need to answer
*"how did I get here?"*

---

## 8. Tags — one label across everything

Shared tags apply to items, docs, references, and runbooks, and they
work everywhere the same way. Names are lowercase letters, digits, and
dashes (max 40); the `#` is optional when typing.

**Apply a tag:**
- *Item* — open it (click any item row) and use the tag field in the
  edit modal; or select it at Sort and tag it in the preview pane.
- *Doc* — the tag field at the top of the doc editor's right rail.

**Use tags:**
- **Sort** grows a `tag` chip row (with per-tag counts) whenever any
  *items* carry tags — click a chip to filter the bench.
- **Search** understands `tag:` — see §9.

**Example.** You tag three items and a doc `#q3-planning`. At Sort,
the chip `#q3-planning · 3` filters the bench to those three items.
In search, `tag:#q3-planning` returns all four. Removing the tag from
the last item makes the chip (and any active filter on it) clean up
after itself.

> Guidebook *entry* tags are a separate, entry-local feature — they
> group entries inside one guidebook and don't appear here.

---

## 9. Search

`⌘K` from anywhere. Results group by type — Items, Docs, References,
Runbooks, Skills, Chats — with snippets. `Enter` opens the top hit;
click any row to open it (references and chats open externally).

Two query forms work today:

| Query | Returns |
|---|---|
| `retry budget` | Anything whose title/body/notes contain the text |
| `tag:#infra` | Everything carrying the tag |
| `deploy tag:#infra` | Text *and* tag combined |

Filed items stay searchable — search is the recovery path for
everything you filed.

---

## 10. Working with Claude

Claude is a first-class collaborator, not a chat bubble. Three
integration points:

**Ask Claude (everywhere).** The **Ask Claude** button on thread
pages, docs, field notes, runbooks, and guidebooks copies a ready-made
prompt to your clipboard — e.g. *"Using the Steep MCP tools, read the
doc 'Q3 outreach plan' and help me work on it."* Paste it into a
Claude client connected to your Steep MCP server. Claude reads and
writes through the same services the UI uses, so its edits show up
live and attributed (Claude's doc comments render in ember with a
CLAUDE label).

**Registered chats.** Register a Claude conversation against a thread
(from the thread landing, or Claude can self-register via the
`register_chat` tool) with a short tagline. Registered chats appear on
the landing page and in the Trace; stale ones (60 d+) surface only in
the weekly review.

**Skill proposals.** When Claude proposes a change to one of your
skills, it lands in the same queue as your bench items. The proposal
page shows a side-by-side diff (additions in moss, removals in ember),
Claude's rationale, and what triggered it. Decide: **Accept**,
**Accept and write to source**, **Edit then accept**, or **Reject**,
optionally with a decision note. Nothing touches your filesystem
unless you choose *write to source*.

All of this rides on the MCP connection — set that up once (§11) and
every Ask Claude prompt works as written.

---

## 11. Connecting Claude — MCP setup and usage

Steep ships a Model Context Protocol (MCP) server in the same process
as the app, at `http://127.0.0.1:8421/mcp` (Streamable HTTP). Any
MCP-capable Claude client can connect: Claude Desktop, Claude Code, or
Claude Mobile. Start the Steep server once and both the web app and
the MCP endpoint are live — there is nothing extra to install.

> One naming note: the MCP server registers under the internal
> codename **`kennel`**. Same product; the prompts in the app already
> use the right names.

### Claude Desktop

Add to `claude_desktop_config.json` (location varies by OS — see the
Claude Desktop docs), then restart Claude Desktop:

```json
{
  "mcpServers": {
    "kennel": {
      "url": "http://127.0.0.1:8421/mcp"
    }
  }
}
```

### Claude Code

Either add the same block to `.claude/settings.json` (project or
global), or use the CLI:

```bash
claude mcp add kennel --url http://127.0.0.1:8421/mcp
```

### Checking it works

In a fresh Claude conversation, ask:

> *"What projects are in kennel?"*

Claude should call `list_projects` and read your threads back. If it
doesn't, the server probably isn't running (`npm --prefix server run
dev`), or the client wasn't restarted after the config change. A
client-free smoke test using `curl` lives in `docs/mcp-setup.md`.

### Remote servers (deployed Steep)

If your Steep runs on a VPS, the operator sets `KENNEL_MCP_TOKEN` on
the server and you add the matching bearer header to your client
config:

```json
{
  "mcpServers": {
    "kennel": {
      "url": "https://steep.work/mcp",
      "headers": {
        "Authorization": "Bearer knl_sk_<your-token>"
      }
    }
  }
}
```

Without a token configured, the endpoint is open — fine on
`127.0.0.1`, never on a public interface.

### What Claude can do once connected

37 tools spanning the whole system — the same services the UI uses,
so everything Claude does shows up live and attributed:

| Area | Tools (selection) |
|---|---|
| Threads | `list_projects`, `create_project`, `update_project`, `close_out_project` |
| Items & sort | `create_item`, `transition_item`, `crystallize_item`, `convert_item`, `list_queue`, `list_aging`, `list_crystallizations` |
| Docs | `read_doc`, `write_doc` |
| Runbooks & field notes | `get_runbook`, `upsert_runbook`, `read_field_notes`, `write_field_notes` |
| Chats | `register_chat`, `update_chat_tagline` |
| Skills | `list_skills`, `sync_skill`, `propose_skill_update` |
| Refs, tags, comments | `create_reference`, `apply_tag`, `remove_tag`, `add_comment` |
| Meta | `search`, `recent_activity`, `get_settings`, `update_settings` |

Docs, field notes, and runbooks are also published as read-only MCP
**resources** (`kennel:///doc/{id}`, `kennel:///field-notes/{slug}`,
`kennel:///runbook/{slug}`), so Claude can browse and read them
without spending tool calls.

### Usage examples

Things you can say in a connected Claude chat, verbatim:

- *"Capture an idea in the vendor-search thread: switch the shortlist
  scoring to weighted criteria."* → `create_item`; it appears on your
  bench within a second (live sync).
- *"Read the field notes for kennel and draft the open questions
  section."* → reads the resource, then `write_field_notes`; the
  revision bumps and the edit is attributed to Claude in the activity
  feed.
- *"What's gone cold across my threads? File anything that's pure
  noise and list what's worth picking back up."* → `list_aging`, then
  `file_item` per your instruction.
- *"Register this conversation against the q3-outreach thread with
  the tagline 'pricing-page rewrite'."* → `register_chat`; the chat
  now shows on the thread landing and in its Trace.
- *"Summarize what changed in steep this week."* → `recent_activity`,
  read back as prose — a conversational Weekly Review.

The **Ask Claude** buttons throughout the app (§10) generate prompts
in exactly this form, pre-targeted at the doc or thread you're
looking at.

---

## 12. Settings that shape the system

**Settings** (nav rail):

- **Appearance** — light / dark / system.
- **Lifecycle** — aging threshold (when items count as cold), filing
  prompt, dormant threshold, the temperature signal toggle, and the
  crystal resurface interval.
- **Smart Routing** — whether an Anthropic key is configured (read-
  only fingerprint), the daily routing cap, and the confidence floor
  under which pastes fall through to the bench.
- **Account** — change the password, sign out.

---

## 13. A day in Steep — worked example

**8:50** — Coffee. Dashboard. *Worth revisiting* shows two crystals
due: **Still true** on one; the other feels shaky — **Revisit**, tweak
its body, done (opening it reset the timer).

**8:55** — The bench badge says 6. Open Sort: `A`, `P`, `X`,
`V`→question, `S`→attach to the *pricing* crystal then `A`, `X`.
Bench clear in two minutes.

**9:00–12:00** — Deep work in the *vendor-search* thread. Notes
accumulate in the doc; `⌘S` out of habit. A realization lands —
**Promote to crystallization** from the doc header, type set to
*principle*. On the crystal page, **+ Attach** the *Vendor evaluation*
guidebook.

**13:30** — A colleague sends meeting notes. `⌘⇧V`, thread
*vendor-search*, hint *Field notes*, paste, submit. Toast: routed into
*What I know*. Good call — no Undo needed.

**16:00** — One pending skill proposal in the bench queue: Claude
wants to tighten the `commit` skill's wording. Diff looks right —
**Accept**.

**Friday 16:30** — Weekly review: 23 captured, 3 crystallized, 9 let
go. The aging section shows a thread going quiet; open it, file two
items, let one go from the aging strip. Open **Reflecting**, walk the
shelf, pick one idea back up. Close the laptop.

Nothing pinged you all week. Everything still got looked at. That's
the system working.

---

## 14. Coming soon

Planned but **not built yet** — listed here so you don't go looking
for them. Sourced from the live backlog and the plan docs in `docs/`;
order roughly follows current priority.

**Email into Smart Routing** *(Smart Routing Phase 1 — see
`email-ingestion-frd.md`).* Forward an email to your Steep address and
the same classifier that handles Paste & route files it into the right
thread and destination. Phase 2 adds a review UX: re-route a wrong
call instead of just undoing it, plus a rejected log and classifier
insight. Today, paste the email body with `⌘⇧V`.

**Mobile screens.** A read-and-capture phone experience: quick-capture
sheet, read-mode dashboard, thread reading, full-screen search.
Editing stays on the desktop by design. (The server side is ready once
the app is deployed off localhost.)

**CLI.** `kennel project create`, a `kennel-import` bulk loader for
existing markdown, and `kennel mcp register --token` for client setup.
The Dashboard's disabled "Import from filesystem" button is this
feature's placeholder.

**In-app Claude chat.** Run a Claude conversation inside Steep — with
the MCP tools attached — instead of copying a prompt into an external
client. The **Ask Claude** copy-a-prompt buttons (§10) are the
deliberate stopgap until this lands; it needs a server-side agent loop
and carries per-message API cost.

**Named users.** Two stages are planned: first a shared workspace with
named accounts, so activity says *who* captured or crystallized
(`users-plan.md`); later, fully private per-user workspaces with one
database per user (`multi-tenancy-plan.md`).

**Full search filter syntax.** The search panel hints at `kind:doc`,
`project:<slug>`, `state:active`, and `"exact phrase"` — today only
plain text and `tag:#name` actually filter (§9). The rest of the
token syntax is planned; until then the typed token is matched as
literal text.

**Inline thread editors.** Edit a thread's description and "context
for Claude" directly on its landing page. Both fields exist and are
editable through the thread settings modal and the `update_project`
MCP tool; the landing-page "show context" expander that should
display the context is still decorative.

**Drag-to-reorder items.** Guidebook entries reorder today; item
lists are still recency-ordered only. The row grips are already
drawn.

**Appearance polish.** The Settings rows for reduce-motion, accent
emphasis, and monospace family are visible but not yet wired. Theme
(light/dark/system) works.

**Doc archive.** Docs can be pinned, previewed, and deleted; a softer
archive action (out of lists, still searchable — like filing an item)
is on the list.

**MCP prompts and stdio.** Preset MCP prompt templates for recurring
rituals (weekly review, project close-out, skill review-pass), and a
stdio transport wrapper if a future client needs one. All current
clients work over HTTP.

If something here matters to your workflow, the backlog
(`18-5-backlog.md`) is the ranked source of truth for what lands
next.
