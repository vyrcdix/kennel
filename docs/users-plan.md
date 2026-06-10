# Steep — Multiple users, shared workspace (Option 2)

> Status: **plan only.** Not started. Builds directly on the shipped
> auth (`0007_auth`). Sibling plan: `docs/multi-tenancy-plan.md`
> (Option 3 — private per-user data). This plan is a prerequisite for
> that one.

## Context

Steep shipped with **one shared password** (`docs/auth-plan.md`,
Option B). Everyone in the circle logs in with the same credential,
gets an anonymous session, and every human action logs as the same
`actor` — the literal string `'craig'`. There is no notion of *who*
did anything.

This plan adds **named users**: each person gets their own login and
their own password, and every action records which user performed it.
What it does **not** do is partition data — everyone still sees and
edits the same threads, docs, and items. One shared workspace, real
per-person attribution.

If you need private per-user data, that is Option 3
(`docs/multi-tenancy-plan.md`) — a much larger change. Read the
"Framing" section of `docs/auth-plan.md` first; the distinction
between *authentication* and *user management* still applies.

## What "shared workspace" means here

- Every user sees every thread. No `owner_id`, no scoping.
- The activity feed, comments, and `actor` become user-attributed —
  "Sarah picked up *draft the brief*" instead of an anonymous entry.
- Adding a person = an admin creates a user row. Removing them =
  disabling it. No more password-sharing.
- `/mcp` is unchanged — it stays on the `KENNEL_MCP_TOKEN` bearer
  token and logs as `'claude'`. MCP has no user identity in this
  option.

## Decisions to lock

- **Login is name + password.** A `users` table; per-user scrypt hash
  (reuse `hashPassword`/`verifyPassword` from `services/auth.ts`
  verbatim). Display name doubles as the login handle; keep it unique.
- **Sessions gain a `user_id`.** The `sessions` table currently keys
  on `token` alone. Add `user_id`; `validateSession` returns the user,
  not just a boolean.
- **`actor` becomes a category + a user reference.** Today
  `activity.actor` is `CHECK (actor IN ('craig','claude','cli',
  'system'))`. It becomes `IN ('human','claude','cli','system')` plus
  a nullable `actor_user_id`. Same shape for `entity_comments.author`.
  Non-human actors keep a NULL user id.
- **First user seeded from the existing password.** The migration
  mints one user (name from `KENNEL_INITIAL_USER`, default `craig`)
  carrying the current `auth_password_hash`/`auth_password_salt`. The
  shared-password columns on `settings` then go inert (like the
  runbook `url` column post-`0008`).
- **Existing sessions are wiped** on migration — they have no
  `user_id` and cannot be retro-assigned safely. Everyone logs in
  once after the upgrade.
- **Flat roles, one admin flag.** A `users.is_admin` boolean gates
  user management (create / disable / reset password). No finer
  permission model — the circle is small and trusted.

## Schema migration (`0009_users.sql`)

```sql
CREATE TABLE users (
  id             TEXT PRIMARY KEY,
  name           TEXT NOT NULL UNIQUE,
  password_hash  TEXT NOT NULL,
  password_salt  TEXT NOT NULL,
  is_admin       INTEGER NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','disabled')),
  created_at     TEXT NOT NULL,
  updated_at     TEXT NOT NULL
);

-- Sessions belong to a user. Existing rows are deleted first.
DELETE FROM sessions;
ALTER TABLE sessions ADD COLUMN user_id TEXT NOT NULL REFERENCES users(id);
```

Then two **table rebuilds** — SQLite cannot `ALTER` a `CHECK` in
place (same mechanical pattern as `0002_v03_reframe`):

- `activity` — widen `actor` to `('human','claude','cli','system')`,
  add `actor_user_id TEXT REFERENCES users(id)`. Re-create the three
  indexes (`idx_activity_project_time`, `idx_activity_time`,
  `idx_activity_entity`).
- `entity_comments` — widen `author` to `('human','claude')`, add
  `author_user_id`. Re-create `idx_entity_comments_target`; preserve
  the `parent_id` self-reference.

The migration finishes by seeding the first user and rewriting its
historical rows: `activity` rows with `actor='craig'` →
`actor='human', actor_user_id=<seeded id>`; `entity_comments` with
`author='craig'` likewise.

## Server changes

**Shared types** (`shared/types.ts`):
- New `User` type (`id`, `name`, `isAdmin`, `status`, timestamps — no
  hash/salt; those never leave `services/auth.ts`).
- `Actor` becomes `'human' | 'claude' | 'cli' | 'system'`.
- `ActivityEntry` gains `actorUserId?: string`; `EntityComment` gains
  `authorUserId?: string`.

**Auth service** (`services/auth.ts`) — the biggest change:
- `createUser`, `listUsers`, `setUserStatus`, `verifyUser(name,
  password)`, per-user `setUserPassword`.
- `createSession(userId)`; `validateSession` returns
  `{ userId } | null` instead of a boolean.
- Keep `hashPassword`/`verifyPassword`/scrypt untouched.

**Routes** (`routes/auth.ts`):
- `POST /api/auth/login` takes `{ name, password }`.
- `GET /api/auth/status` also returns the current user.
- `change-password` operates on the session's user.
- New `routes/users.ts` — admin-only `GET/POST /api/users`,
  `PATCH /api/users/:id` (disable, reset password). Gated by
  `req.user.isAdmin`.

**Middleware** (`index.ts`): the `/api/*` session gate resolves the
session to a user and attaches `req.user`. 401 when absent.

**Activity threading** — `activity.ts`'s `LogEntry.actor` already
flows through every service. Add an optional `actorUserId`;
`logActivity` writes both columns. Service functions that take an
`actor` param (most of `item.ts`, `doc.ts`, `runbook.ts`, …) keep it,
but routes now pass the real category + user id derived from
`req.user`. MCP call sites keep `actor: 'claude'`, `actorUserId`
null.

**Bootstrap** (`services/bootstrap.ts`): add `users: User[]` to the
payload so the client can render names without N+1 lookups.

## Frontend changes

- `src/screens/LoginScreen.tsx` — add a name field above the password.
- `src/data/auth.ts` / `src/main.tsx` — carry the current user through
  the boot flow; expose it to the app.
- `src/components/ChromeBar.tsx` — the avatar/sign-out reflects the
  signed-in user.
- `src/screens/SettingsScreen.tsx` — new **Users** section (admin
  only): list, add, disable, reset password.
- Activity rendering (Dashboard, WeeklyReview, ProjectLanding feeds,
  `AgingRow`, etc.) — resolve `actorUserId` → user name.
- `src/data/actions.ts` / `selectors.ts` — a `getUsers()` selector and
  user-management actions.

## Slices (one branch, `npm test` green at each boundary)

1. **Schema** — `0009_users.sql`: `users`, `sessions.user_id`, the two
   table rebuilds, seed + historical backfill.
2. **Auth service + types** — `User` type, user CRUD, user-aware
   sessions.
3. **Routes + middleware** — `req.user`, name+password login,
   `routes/users.ts`, admin gate.
4. **Attribution** — `actor_user_id` written on every mutation; verify
   the activity feed and comments record the right user.
5. **Frontend** — login, ChromeBar, Settings → Users, activity names.

## Critical files

**New:** `server/migrations/0009_users.sql`, `server/src/routes/users.ts`.
**Modified:** `server/src/services/auth.ts`, `server/src/routes/auth.ts`,
`server/src/index.ts`, `server/src/activity.ts`,
`server/src/services/comment.ts`, `server/src/services/bootstrap.ts`,
`shared/types.ts`, `src/screens/LoginScreen.tsx`,
`src/screens/SettingsScreen.tsx`, `src/components/ChromeBar.tsx`,
`src/data/{auth,actions,selectors}.ts`, `src/main.tsx`.

## Open questions

- **Login handle** — display name (this plan) or email? Email is
  tidier if the circle grows and is the natural key for Option 3.
- **Self-service password reset** — out of scope; an admin reset is
  enough for a small circle.
- **`/mcp` identity** — left as `'claude'` here. Per-user MCP tokens
  only become necessary under Option 3, where they also scope data.

## Effort

~1.5–2 days. Five slices, one branch. Comparable to the auth build.

## Out of scope

- Private per-user data / ownership scoping — Option 3,
  `docs/multi-tenancy-plan.md`.
- Per-user MCP identity — Option 3.
- Roles beyond a single admin flag.
