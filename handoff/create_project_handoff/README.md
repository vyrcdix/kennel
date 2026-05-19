# Handoff: Add Create Project flow to Kennel

> Scope: add the **Create Project** modal (§6.9 of the design brief) and the
> post-creation **next-steps strip** to the existing Kennel codebase.
> Everything else in Kennel already exists — do not rebuild it.

## What's in this bundle

```
create_project_handoff/
├── README.md                                ← you are here
├── specs/
│   └── kennel-create-project-flow.docx     ← authoritative spec (read first)
└── design/
    └── screens-create-project.jsx          ← React reference for all 8 modal states
```

The `.jsx` file is the **design reference** — pixel-level intent for the modal,
mobile sheet, and post-creation strip. Re-implement the same components in the
existing codebase using the project's established stack and design tokens; don't
ship the reference file itself.

---

## Fidelity

**High-fidelity.** Colors, type, copy, spacing, and validation behavior are final.
Build to it.

---

## Existing tokens / atoms this depends on

The modal reuses primitives that already exist in the Kennel codebase. Do not
re-pick colors or restyle these — pull from what's there:

- **Palette**: `--ember`, `--ember-dark`, `--ember-deep`, `--moss`, `--dust`,
  `--slate`, `--slate-dark`, `--bone`. Surface tokens `--surface-0/1/2` and
  `--line`/`--line-strong` for borders.
- **Type classes**: `.km-display-sm` (12px Oswald UPPER, letter-spaced 0.18em),
  `.km-body` (14px Inter 400), `.km-body-sm` (12px Inter 400 muted),
  `.km-mono` and `.km-mono-sm` (JetBrains Mono).
- **Buttons**: `.km-btn`, `.km-btn-primary` (ember), `.km-btn-ghost`.
- **Form controls**: `.km-input`, `.km-kbd`.
- **Components**: `ProjectTag`, `ChromeBar`, `NavRail`, `Mono`, `Icons.*` — all
  already exported.

If the codebase doesn't have one of the above, treat that as a bug in the
existing implementation, not a new requirement here.

---

## What to build

### 1. `CreateProjectModal` component

A reusable modal component, ~480px wide on desktop, full-screen sheet on mobile.

**Fields, in tab order:**

| # | Field         | Required | Treatment                                                                   |
|---|---------------|----------|-----------------------------------------------------------------------------|
| 1 | `name`        | yes      | Inter 500, 16px. Autofocus on open. 1–80 chars.                            |
| 2 | `slug`        | auto     | Mono 14px, derived from `name`; user can override. 1–40, `[a-z0-9-]+`.     |
| 3 | `description` | no       | Single-line input. ≤140 chars.                                              |
| 4 | `context`     | no       | Collapsed by default ("Add context for Claude →"). Markdown textarea when   |
|   |               |          | expanded; mono; soft cap 2,000, hard cap 8,000.                             |
| 5 | `color`       | no       | Row of 6 swatches: `none`, `moss`, `ember`, `dust`, `blaze`, `slate`.       |
| 6 | `pinned`      | no       | Single toggle, off by default.                                              |

**Submit / cancel:**
- Footer: `Cancel` (ghost text button, slate) and `Create project` (ember primary).
- Submit button disabled until `name` non-empty AND `slug` matches
  `/^[a-z0-9]+(-[a-z0-9]+)*$/`.
- **Enter** submits from any field. **Cmd/Ctrl+Enter** submits from inside the
  context textarea. **Esc** closes.

### 2. Slug derivation logic

Runs as the user types `name`:

```
slug = name
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/-+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 40);
```

Stops the moment the user manually edits the slug for this modal session.

### 3. Validation states

| Trigger          | Behavior                                                                      |
|------------------|-------------------------------------------------------------------------------|
| Slug invalid format on blur | Inline error in mono beneath the slug, ember-deep tint.            |
| Slug conflict (409 from server) | Inline error: `Slug already used by <other name>`.              |
| Name empty on submit  | Inline error; ember focus ring stays on name field.                      |
| Description >140 chars| Hard reject input; show char counter when over 100.                      |
| Context >2,000 chars  | Soft warning in dust tint: `approaching soft cap`.                       |
| Context >8,000 chars  | Hard reject input.                                                       |
| Network failure       | Slate-toned banner at modal footer with "Try again". Preserve form state.|

### 4. API contract

`POST /projects` (also MCP `create_project`, CLI `kennel project create`):

```jsonc
// Request
{
  "name":        "Kennel",           // required, 1-80
  "slug":        "kennel",           // required, 1-40, [a-z0-9-]+
  "description": "...",              // optional, ≤140
  "context":     "...",              // optional, ≤8000
  "color":       "moss",             // optional: moss|ember|dust|blaze|slate|null
  "pinned":      false               // optional, default false
}

// 201 Created — full project record (id, slug, name, …, created_at, updated_at)
// 400 { "error": "validation_error", "fields": {...} }
// 409 { "error": "slug_conflict", "conflicting_project": {"id","name"} }
```

Full schema, MCP tool spec, and CLI flags are in `specs/kennel-create-project-flow.docx`
§4. Implement against that doc, not from memory.

### 5. Service-layer atomicity

`project.create()` must do all of this together — directory creation +
DB insertion + activity entry — and roll back any partial work on failure. See
§4.4 of the flow doc.

### 6. Post-creation next-steps strip

Dust-toned bar at the top of the project landing page, immediately under the
project header. Dismissable. Each item shows only if its precondition holds:

| Precondition          | Action label                              |
|-----------------------|-------------------------------------------|
| project has zero items | "Capture an item"                        |
| description is empty   | "Add a description"                      |
| context is empty       | "Add context for Claude"                 |
| no runbook yet         | "Set up a runbook when you're ready"     |

- Empty strip = strip hidden entirely.
- Dismissal persists per-project: `projects.metadata.next_steps_dismissed = true`.
- Re-summon: clear the metadata flag from project settings.

### 7. Trigger surfaces

Wire the modal up to all of these:

- Dashboard empty state → `New project` button.
- Dashboard header → `+` icon next to search.
- Sidebar / project list → `New project` affordance below the list.
- Keyboard → **Cmd/Ctrl + Shift + N** from anywhere.
- MCP tool `create_project` — no UI trigger needed.
- CLI `kennel project create <slug>` — for install-time bootstrap.

---

## Modal states demonstrated in the reference

Open `design/screens-create-project.jsx` — each exported `CP*` component
corresponds to a specific state worth eyeballing:

| Export                          | State                                                        |
|---------------------------------|--------------------------------------------------------------|
| `CPDefault`                     | Default open, name autofocus, slug field empty               |
| `CPMidTyping`                   | Name "Kennel" typed, slug auto-derived to `kennel`           |
| `CPContextExpanded`             | Context expanded, ~1,200/2,000 chars with counter           |
| `CPSlugConflict`                | Slug conflict inline error                                   |
| `CPDarkDefault`                 | Dark mode (slate-dark surface, ember focus ring unchanged)   |
| `CPMobileSheet`                 | Full-screen mobile sheet, sticky header + footer             |
| `EmptyKennelProjectLanding`     | Post-creation strip · active (pass `withStrip` true/false)   |

`CreateProjectModal` itself takes props for every variant (`name`, `slug`,
`slugError`, `contextOpen`, `contextChars`, `contextValue`, `color`, `pinned`,
`focusField`, `mobile`). Lift the prop names if you want; the shape covers
every state we need.

---

## Out of scope

- **Project deletion.** v1 only supports archive via close-out. Don't add a
  delete affordance to the modal or the strip.
- **Custom hex color.** Five swatches + none; no picker.
- **Template projects.** No preset combinations of color/description/context.
- **Onboarding wizard.** First-run shows the canonical empty state with a
  New project button. That's it.
