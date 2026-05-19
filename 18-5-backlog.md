# Kennel backlog — 2026-05-18

Snapshot at end of Phase 2.5 (27 MCP tools shipped). Ranked by what most
unlocks daily use.

## Big chunks (multi-day)

1. **Deploy to a VPS + Tailscale + auth** — gets it off localhost. Phone
   capture starts working. Bearer-token flips on (env var ready), HTTP
   session cookies still need building. ~1–2 days plus VPS setup.
2. **Mobile screens** — quick-capture sheet, read-mode dashboard,
   project read, full-screen search. Per §8 of the brief — read-and-
   capture, not editing. ~2 days.
3. **CLI** — `kennel project create`, `kennel-import` bulk loader,
   `kennel mcp register --token`. Per §10 of the data model. ~1 day.

## Medium (half- to full-day each)

4. **UI inline editors** — small editors for description, context,
   name, and color on a project header. Pairs with the `update_project`
   MCP tool (which already works) for direct-typing fallback. Closes
   the "Add description" / "Add context for Claude" stubs in
   NextStepsStrip.
5. **Doc editor missing actions** — Archive, pin toggle, preview-only
   mode. The actions exist on the server; just wire buttons.
6. **Runbook edit mode** — each section becomes an editable markdown
   field, save bumps revision. `upsert_runbook` service already does
   the writing.
7. **Skill proposal "Edit then accept"** — currently disabled. Open
   the proposed body in a small editor before sending the accept.
8. **Triage "Convert" popover** — idea → action / note → doc / etc.
   Per §6.3 of the brief.

## Smaller polish (≤2 hours each)

9.  **`+` button next to Capture is too subtle** (already flagged).
10. **Pin/unpin from project header** — `togglePin` action exists, no button.
11. **Esc to dismiss global search** (click-outside works; Esc doesn't).
12. **Drag-to-reorder items** — `item.reorder` route exists in the data-
    model spec but no service yet; needs `services/item.ts reorder()`
    plus drag listeners.
13. **Project new-item button (top-right)** opens nothing; should open
    Capture.
14. **"show context" expander on ProjectLanding** is decorative; should
    reveal `project.context` markdown.
15. **Empty-state copy** — polished "Inbox is clear." / "Nothing
    matched." per brief §9 (some screens have this; not all).
16. **Filter chips by kind / tag in Triage** — currently decorative.
17. **Reduce motion toggle**, accent emphasis slider, monospace family
    — Settings rows that are decorative right now.

## Bigger UI surfaces

18. **Focus mode** (⌘⇧F) — hides everything except Next Up and a single
    project. Has a Settings affordance shown but no implementation.
19. **Weekly review screen** — dashboard button currently goes
    nowhere. Per brief §6.1, an aggregated view over the last 7 days.

## MCP refinement

20. **MCP resources** — expose the markdown content directory as a
    browsable resource tree. Lets Claude *read* docs without explicit
    tool calls.
21. **MCP prompts** — preset prompt templates for recurring flows:
    weekly review, project close-out, skill review-pass. Per §12.4
    of the data model these are interesting once they hit usage.
22. **Targeted SSE refetch** — currently every event refetches the
    whole bootstrap. Fine at this scale; would matter past ~1000
    items.

## Brand & meta

23. **Kennel logo** — commission is outside the code work; the slot
    exists in ChromeBar.
24. **Voice/tone page** — design canvas has it; we ported screens 1–8
    but not this internal reference page.

## Strategic next moves

- If you want to **use Kennel during your day**: **#1 (deploy + auth)**
  next — without it, the live sync and MCP are constrained to your desk.
- If you want **the product to feel finished**: **#4 + #6 + #7** in
  sequence (~1.5 days) — closes the four most-obvious "this button does
  nothing" gaps you'll hit when using it.
- If you want a **single high-leverage MCP add**: **#20 (MCP resources)**
  — Claude reads docs without explicit tool calls, which makes
  "remind me what's in the Q3 outreach plan" feel native instead of a
  tool round-trip.
