-- 0007 · authentication
--
-- App-level auth replacing the Caddy basic_auth stopgap. Single shared
-- password (scrypt hash + salt on the settings row); server-side
-- sessions with an HttpOnly cookie. The hash columns are NEVER mapped
-- into the client-facing Settings type — the auth service reads them
-- directly.
--
-- /mcp keeps its own KENNEL_MCP_TOKEN bearer auth — separate mechanism,
-- separate audience (Claude clients vs humans).

ALTER TABLE settings ADD COLUMN auth_password_hash TEXT;
ALTER TABLE settings ADD COLUMN auth_password_salt TEXT;

CREATE TABLE sessions (
  token        TEXT PRIMARY KEY,
  created_at   TEXT NOT NULL,
  expires_at   TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX idx_sessions_expires ON sessions(expires_at);
