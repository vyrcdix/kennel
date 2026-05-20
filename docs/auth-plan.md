# Steep — Authentication plan (Option B)

> Status: **shipped.** All five slices landed. Migration is `0007`
> (not `0005` — `0005` was unused, `0006` went to field-notes). Once
> deployed, revert the live Caddy `basic_auth` stopgap — the app's
> session gate replaces it.

## Context

Steep is deployed publicly at `steep.work`. As shipped, the HTTP API
had **no authentication** — `/api/*` and the web UI were readable and
writable by anyone who found the domain. Only `/mcp` was gated, by the
`KENNEL_MCP_TOKEN` bearer token.

**Current stopgap (in place):** Caddy `basic_auth` fronts `/api/*` and
the static SPA. `/mcp` is exempt (it uses the Bearer token — Basic and
Bearer both occupy the `Authorization` header and can't stack). This
closes the hole but the UX is poor: browser-native prompt, no logout,
one credential, no session concept.

This plan replaces the stopgap with app-level auth: a real login
screen in Steep, a shared password, server-side sessions.

## Framing: authentication, not user management

Two different things; Steep needs only one.

- **Authentication** — "is this request allowed in." Needed.
- **User management / multi-tenancy** — per-user data, ownership,
  isolation. **Out of scope.** Steep's schema has no concept of users:
  `actor` is a label string (`'craig' | 'claude' | 'cli'`), no
  `user_id` foreign key on any table. Real multi-user means
  owner-scoping every table and rewriting the service layer — a
  rebuild, and wrong for the stated audience ("me + a small circle").
  The circle shares *one* Steep; nobody gets a private partition.

So: gate access with a single shared credential. Skip multi-tenancy.

## Decisions locked

- **One shared password.** Hash stored server-side. Adding someone to
  the circle = giving them the password.
- **Server-side sessions, not JWT.** A `sessions` table in SQLite, an
  HttpOnly + Secure + SameSite=Lax cookie. Revocable; no
  token-in-localStorage XSS surface.
- **Hashing: Node's built-in `crypto.scrypt`.** No `bcrypt` native
  module — we already fought one native compile (better-sqlite3); not
  inviting another. scrypt is a sound password KDF and ships with Node.
- **`/api/*` gated by session; `/mcp` keeps its Bearer token.** Two
  mechanisms for two audiences (humans vs Claude clients). The static
  SPA bundle stays open — it isn't secret, and the login screen *is*
  part of the SPA.
- **`actor` unchanged.** A shared password means every human action
  logs as the same actor. Per-person attribution is the multi-user
  rabbit hole — not in scope.
- **Caddy reverts.** Once app auth ships, the Caddyfile drops
  `basic_auth` and goes back to the plain SPA-serving config. Steep
  owns its own auth.

## Slices

### Slice 1 — schema + password storage
Migration `0005_auth.sql`:
- `sessions` table — `token` (PK), `created_at`, `expires_at`,
  `last_seen_at`.
- `auth_password_hash` + `auth_password_salt` columns on the single
  `settings` row.
- First-boot: if the hash is empty, seed it from a
  `KENNEL_INITIAL_PASSWORD` env var so a fresh install isn't locked
  out. Documented in `docs/deploy.md`.

### Slice 2 — server: auth service + routes + middleware
- `server/src/services/auth.ts` — `hashPassword`, `verifyPassword`
  (scrypt), `createSession`, `validateSession`, `revokeSession`,
  expired-session sweep.
- Routes — `POST /api/auth/login` (password → set cookie),
  `POST /api/auth/logout`, `GET /api/auth/status`.
- Express middleware on `/api/*` — allowlist `/api/auth/login` and
  `/api/auth/status`; everything else requires a valid session cookie
  or returns 401. `/mcp` untouched.

### Slice 3 — frontend: login screen + 401 handling
- `src/screens/LoginScreen.tsx` — on-brand, single password field.
- `src/data/api.ts` — on any 401, flip a global "unauthenticated"
  state.
- `src/main.tsx` boot flow — `GET /api/auth/status` first; authed →
  render the app, not authed → render `LoginScreen`. After successful
  login, hydrate bootstrap and start the SSE stream.

### Slice 4 — logout + session UX
- Logout control in `ChromeBar` (or a Settings → Account row).
- Settings: change-password — verify current, set new, option to
  revoke all other sessions.
- Optional: active-session list ("3 sessions · revoke all").

### Slice 5 — wire-up, docs, verification
- `docs/deploy.md` — document `KENNEL_INITIAL_PASSWORD`; drop the
  Caddy `basic_auth` stopgap from the Caddyfile (app handles it now);
  keep the `/mcp` Bearer note.
- Tests — scrypt round-trip, session expiry, middleware 401, login
  flow.
- Caddyfile reverts to the plain SPA config.

## Critical files

**Server (new):**
- `server/migrations/0005_auth.sql`
- `server/src/services/auth.ts`
- `server/src/routes/auth.ts`

**Server (modified):**
- `server/src/index.ts` — mount the auth router + the `/api/*`
  middleware
- `shared/types.ts` — `Settings` / a `Session` type if surfaced
- `server/src/services/settings.ts` — password hash columns

**Frontend (new):**
- `src/screens/LoginScreen.tsx`

**Frontend (modified):**
- `src/main.tsx` — auth-gated boot flow
- `src/data/api.ts` — 401 handling
- `src/components/ChromeBar.tsx` — logout control
- `src/screens/SettingsScreen.tsx` — change-password row

## Open question

**Change-password in the UI, or env-var only?**
- UI change-password (Slice 4) is nicer but adds a flow.
- Env-var only is simpler — changing the password means editing the
  systemd unit and restarting.

Recommendation: include the UI change-password. It's cheap once
sessions exist, and you don't want to SSH in every time the circle
changes.

## Effort

~half a day to a day. Five slices, one branch, `npm test` green at
every slice boundary — same shape as the v0.3 reframe.

## Out of scope

- Multi-tenancy / per-user data — see "Framing" above. A rebuild, not
  a feature.
- OAuth / SSO (Cloudflare Access, Tailscale, Authelia) — clean but
  requires moving DNS to a provider that offers it. Revisit only if
  the audience outgrows a shared password.
- Per-person `actor` attribution — depends on multi-user.
- Rate limiting / lockout on failed logins — worth adding later;
  scrypt's cost already makes brute force expensive, and the audience
  is tiny.
