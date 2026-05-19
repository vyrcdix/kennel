-- v0.3 reframe migration: state/kind enum updates, last_touched_at,
-- settings table, field_notes table.
--
-- The items.state and items.kind columns have CHECK constraints that
-- can't be ALTERed in place — SQLite requires the table-rebuild dance.

-- ─── Step 1: drop the FTS5 dependents on items so we can swap the table.
DROP TRIGGER IF EXISTS items_fts_insert;
DROP TRIGGER IF EXISTS items_fts_update;
DROP TRIGGER IF EXISTS items_fts_delete;
DROP TABLE IF EXISTS items_fts;

-- ─── Step 2: drop the indexes on items (will recreate below).
DROP INDEX IF EXISTS idx_items_project_state;
DROP INDEX IF EXISTS idx_items_state_updated;
DROP INDEX IF EXISTS idx_items_kind;
DROP INDEX IF EXISTS idx_items_rank;

-- ─── Step 3: new items table with extended CHECKs + last_touched_at.
CREATE TABLE items_new (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id),
  kind              TEXT NOT NULL
                      CHECK (kind IN ('idea','note','action','doc','ref','question','crystallization')),
  state             TEXT NOT NULL DEFAULT 'inbox'
                      CHECK (state IN ('inbox','active','reflecting','crystallized','filed','dismissed')),
  title             TEXT NOT NULL,
  description       TEXT,
  context           TEXT,
  body              TEXT,
  expected_outcome  TEXT,
  due_at            TEXT,
  done_at           TEXT,
  archived_at       TEXT,
  rank              REAL,
  doc_id            TEXT REFERENCES docs(id),
  reference_id      TEXT REFERENCES refs(id),
  hash              TEXT,
  metadata          TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT NOT NULL,
  last_touched_at   TEXT
);

-- ─── Step 4: copy + migrate state values + backfill last_touched_at.
INSERT INTO items_new (
  id, project_id, kind, state, title, description, context, body,
  expected_outcome, due_at, done_at, archived_at, rank, doc_id,
  reference_id, hash, metadata, created_at, updated_at, last_touched_at
)
SELECT
  id, project_id, kind,
  CASE state
    WHEN 'parked'   THEN 'reflecting'
    WHEN 'done'     THEN 'crystallized'
    WHEN 'archived' THEN 'filed'
    ELSE state
  END AS state,
  title, description, context, body,
  expected_outcome, due_at, done_at, archived_at, rank, doc_id,
  reference_id, hash, metadata, created_at, updated_at,
  COALESCE(updated_at, created_at) AS last_touched_at
FROM items;

-- ─── Step 5: swap tables.
DROP TABLE items;
ALTER TABLE items_new RENAME TO items;

-- ─── Step 6: recreate indexes.
CREATE INDEX idx_items_project_state    ON items(project_id, state);
CREATE INDEX idx_items_state_updated    ON items(state, updated_at DESC);
CREATE INDEX idx_items_kind             ON items(kind);
CREATE INDEX idx_items_rank             ON items(project_id, state, rank);
CREATE INDEX idx_items_last_touched_at  ON items(last_touched_at DESC);

-- ─── Step 7: recreate FTS5 + triggers + rebuild index from data.
CREATE VIRTUAL TABLE items_fts USING fts5(
  title, body,
  content='items', content_rowid='rowid'
);

CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
  INSERT INTO items_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;
CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
END;
CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
  INSERT INTO items_fts(items_fts, rowid, title, body) VALUES('delete', old.rowid, old.title, old.body);
  INSERT INTO items_fts(rowid, title, body) VALUES (new.rowid, new.title, new.body);
END;

-- Seed FTS5 from the rebuilt items table.
INSERT INTO items_fts(rowid, title, body)
  SELECT rowid, title, body FROM items;

-- ─── Step 8: settings (single-row table).
CREATE TABLE IF NOT EXISTS settings (
  id                       INTEGER PRIMARY KEY CHECK (id = 1),
  aging_threshold_days     INTEGER NOT NULL DEFAULT 21,
  filing_prompt_days       INTEGER NOT NULL DEFAULT 0,
  created_at               TEXT NOT NULL,
  updated_at               TEXT NOT NULL
);

INSERT OR IGNORE INTO settings (id, aging_threshold_days, filing_prompt_days, created_at, updated_at)
  VALUES (1, 21, 0,
          strftime('%Y-%m-%dT%H:%M:%fZ','now'),
          strftime('%Y-%m-%dT%H:%M:%fZ','now'));

-- ─── Step 9: field_notes (one row per project; same shape as runbooks).
CREATE TABLE IF NOT EXISTS field_notes (
  id               TEXT PRIMARY KEY,
  project_id       TEXT NOT NULL UNIQUE REFERENCES projects(id),
  premise          TEXT,
  what_i_know      TEXT,
  open_questions   TEXT,
  sources          TEXT,
  crystallizations TEXT,
  revision         INTEGER NOT NULL DEFAULT 1,
  created_at       TEXT NOT NULL,
  updated_at       TEXT NOT NULL
);
