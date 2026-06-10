# Steep — Private per-user workspaces (Option 3)

> Status: **plan only.** Not started. The largest change proposed for
> Steep so far — read this as a feasibility study, not a committed
> roadmap. Depends on Option 2 (`docs/users-plan.md`) for the `users`
> table and user-aware sessions.

## Context

Steep was built single-user. The schema has no ownership concept:
`projects` is the root table, everything else hangs off `project_id`,
and every `list*` service function returns **all** rows. Auth
(`0007_auth`) gates *entry*; it does not scope *data*.

Option 2 (`docs/users-plan.md`) adds named users sharing one
workspace. **Option 3 goes further: each user gets their own private
Steep** — their own threads, docs, items, runbooks, search, activity
feed, MCP endpoint. A user never sees another user's data.

This is not a feature bolted onto the side. It is a change to every
read path in the system. Treat the effort estimate as a real
multi-week commitment, and the "Risks" section as the reason to be
sure you want this before starting.

## The core decision: how to isolate

Two viable architectures. **Pick this first — everything else
follows from it.**

### Architecture A — database per user (recommended)

A shared `auth.db` holds `users` + `sessions`. Each user gets their
own `data-<userId>.db`, created from the migrations as an empty
Steep. A request resolves its session in `auth.db`, then opens (from
a cached connection map) that user's data DB; **every existing
service function runs unchanged** — it still thinks it is the only
tenant, because within that file it is.

- **Isolation is structural.** The DB file *is* the boundary. There
  is no query that can leak across tenants because there is no shared
  table to leak through. This is the whole argument: Steep's entire
  service layer assumes single-tenant, and this keeps that assumption
  *true* instead of auditing 15 service files to make it false safely.
- Content directory namespaces cleanly: `content/<userId>/<slug>/`.
- Backups stay trivial — one file per user.
- Cost: a connection map keyed by user (open lazily, cap the LRU),
  and migrations now run per-DB. SSE and MCP resolve a user up front,
  which they must anyway.

### Architecture B — row-level scoping (shared database)

One DB; add `owner_id` to `projects` and scope every query. Because
all content tables descend from `projects`, ownership can live on
`projects` alone — but child queries must then either join to
`projects` or carry a denormalised `owner_id` for safety and speed.

- Every `list*`/`get*`/search/FTS path takes a `userId` and filters.
  One missed filter is a cross-tenant data leak.
- Needs a systematic guard — a scoped DB wrapper, or a mandatory
  `userId` argument the type system enforces — not discipline.
- The only reason to choose B over A: a future need for cross-user
  features (shared threads, an admin-wide view). None is on the
  roadmap. Until one is, B is strictly more risk for no gain.

**Recommendation: Architecture A.** The rest of this plan is written
for A, with B's extra work noted where it diverges.

## Decisions to lock

- **Option 2 ships first.** Multi-tenancy needs `users` and
  user-aware sessions. Do not fold them together — land Option 2,
  verify it, then start this.
- **Architecture A** — `auth.db` + per-user `data-<userId>.db`.
- **Per-user MCP tokens.** `/mcp` currently has one `KENNEL_MCP_TOKEN`.
  Each user gets their own token (stored on the `users` row); the MCP
  middleware resolves token → user → that user's data DB. A shared
  token cannot exist in a per-tenant world.
- **Content is namespaced by user** — `content/<userId>/<slug>/`.
  Thread slugs stay unique only *within* a user.
- **Sign-up is admin-invite, not open.** An admin creates the user;
  first login provisions an empty `data-<userId>.db` from the
  migrations. No public registration — the audience is still a known
  circle, just one that wants privacy from each other.
- **Migration assigns all current data to one user.** The existing
  `kennel.db` becomes the first user's `data-<id>.db` wholesale.

## Server changes (Architecture A)

**Database layer** (`server/src/db.ts`) — the heart of the change:
- `openAuthDb()` — the shared users/sessions DB.
- `openUserDb(userId)` — opens/creates `data-<userId>.db`, applies
  migrations, caches the connection. An LRU map with a sane cap.
- `provisionUser(userId)` — first-login: create the DB, run
  migrations, **skip the demo seed** (`KENNEL_SKIP_SEED` semantics).
- `applyMigrations` now runs against the auth DB *and* every user DB.

**Request context** — middleware resolves the session (auth DB) to a
user, opens that user's data DB, and attaches it as `req.db`. Every
route handler uses `req.db` instead of the process-wide `db`. This is
the mechanical bulk of the work: ~16 route files, every handler.

**Services** — *unchanged.* This is the payoff of Architecture A.
`listProjects(db)` etc. take whatever DB they are handed.

**MCP** (`server/src/mcp/`) — `mcpAuth` resolves a per-user token to
a user DB; `createMcpServer(db)` is already built per-session, so it
binds to the right DB. Tools and resources are otherwise untouched.

**SSE / events** (`server/src/events.ts`) — `publish()` currently
broadcasts to all subscribers. It becomes per-user: a subscriber is
tagged with its user id, and events only fan out within that user's
channel. (Under Architecture B this is mandatory *and* harder —
events would have to be filtered by `owner_id`.)

**Content** (`server/src/content.ts`) — `contentRoot()` becomes
user-scoped: `content/<userId>/`. `projectDir`, `docsDir`, the
field-notes writer all inherit it.

**Auth / users** — extend Option 2's `users` table with `mcp_token`;
add token rotation to the users admin routes.

## Frontend changes

Comparatively small — the client already only renders what the API
returns, and the API now returns one user's world.
- Bootstrap, SSE, and all screens work as-is once the API is scoped.
- Settings → Users (from Option 2) gains MCP-token display + rotate.
- A first-run empty state for a freshly provisioned account (the
  `KENNEL_SKIP_SEED` "No threads yet" path already exists).

## Slices (each a shippable step; `npm test` green at every boundary)

1. **Option 2** — land `docs/users-plan.md` in full first.
2. **DB layer** — `auth.db` split, `openUserDb`, the connection
   cache, per-DB migrations. No behaviour change yet: one user, one
   data DB carved out of today's `kennel.db`.
3. **Request context** — `req.db` middleware; convert all ~16 route
   files off the process-wide `db`.
4. **Provisioning** — admin-create a user → empty data DB on first
   login.
5. **MCP per-user tokens** — token on the `users` row; `mcpAuth`
   resolves it; rotation in the admin UI.
6. **SSE per-user channels** — scope `publish()`/subscribe.
7. **Content namespacing** — `content/<userId>/`; migrate the
   existing tree under the first user.
8. **End-to-end** — two real users, each provisioned, verified fully
   isolated across UI, search, MCP, SSE, and the content directory.

## Critical files

**New:** per-user DB provisioning in `server/src/db.ts`; a
`req.db` middleware module.
**Heavily modified:** `server/src/db.ts`, `server/src/index.ts`, all
of `server/src/routes/*` (~16 files), `server/src/events.ts`,
`server/src/content.ts`, `server/src/mcp/auth.ts`,
`server/src/mcp/transport.ts`, `server/src/services/auth.ts`.
**Mostly untouched (Architecture A's win):** every file in
`server/src/services/*` except `auth.ts`; the MCP tools and
resources; the entire frontend.

## Risks

- **Cross-tenant leak.** Architecture A makes this structurally hard;
  Architecture B makes it a permanent audit burden. The single
  biggest reason to prefer A.
- **The `db` handle is process-wide today.** Routes, SSE, MCP, and
  the boot sequence all close over one `db`. Threading `req.db`
  through is mechanical but touches nearly every server file — the
  bulk of the effort and the easiest place to miss a spot.
- **Connection management.** An unbounded connection map leaks file
  handles; the LRU cap and idle-close need real testing.
- **Migrations now run N times.** A migration that is slow or fragile
  is slow or fragile per user. The boot path must apply pending
  migrations to every user DB and fail loudly if one breaks.
- **Backup/restore story changes** — `docs/deploy.md` assumes one
  `kennel.db`. It needs a rewrite for the per-user file set.
- **No going back cleanly.** Once users have separate DBs, merging
  back to single-tenant means a data-merge tool. Decide before
  slice 2.

## Effort

~1–2 weeks of focused work, Option 2 not included. Architecture B is
*longer*, not shorter — every service function and its tests change,
versus Architecture A where they do not.

## Out of scope

- Open / self-service registration — admin-invite only.
- Shared or cross-user threads — would force Architecture B; revisit
  only if genuinely needed.
- Org/team grouping, per-tenant billing, quotas — a different product.
- Moving off SQLite to Postgres — unnecessary under Architecture A
  and a separate decision if ever the tenant count outgrows the
  file-per-user model.
