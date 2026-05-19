-- Kennel initial schema. Mirrors §6 of kennel-data-model.docx.
-- All ids are ULID strings; timestamps are ISO-8601 strings in UTC.

PRAGMA foreign_keys = ON;

-- ─── Projects ──────────────────────────────────────────────────────────────
CREATE TABLE projects (
  id                     TEXT PRIMARY KEY,
  slug                   TEXT NOT NULL UNIQUE,
  name                   TEXT NOT NULL,
  description            TEXT,
  context                TEXT,
  status                 TEXT NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'paused', 'archived')),
  pinned                 INTEGER NOT NULL DEFAULT 0,
  rank                   REAL,
  color                  TEXT
                           CHECK (color IS NULL OR color IN ('moss','ember','dust','blaze','slate')),
  next_steps_dismissed   INTEGER NOT NULL DEFAULT 0,
  metadata               TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pinned ON projects(pinned);

-- ─── Items ─────────────────────────────────────────────────────────────────
CREATE TABLE items (
  id                TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL REFERENCES projects(id),
  kind              TEXT NOT NULL
                      CHECK (kind IN ('idea','note','action','doc','ref')),
  state             TEXT NOT NULL DEFAULT 'inbox'
                      CHECK (state IN ('inbox','active','parked','done','archived','dismissed')),
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
  updated_at        TEXT NOT NULL
);

CREATE INDEX idx_items_project_state ON items(project_id, state);
CREATE INDEX idx_items_state_updated ON items(state, updated_at DESC);
CREATE INDEX idx_items_kind ON items(kind);
CREATE INDEX idx_items_rank ON items(project_id, state, rank);

-- ─── Docs ──────────────────────────────────────────────────────────────────
CREATE TABLE docs (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id),
  title         TEXT NOT NULL,
  description   TEXT,
  context       TEXT,
  file_path     TEXT NOT NULL,
  body_preview  TEXT,
  word_count    INTEGER,
  revision      INTEGER NOT NULL DEFAULT 1,
  pinned        INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

CREATE INDEX idx_docs_project ON docs(project_id);
CREATE INDEX idx_docs_pinned ON docs(pinned);

-- ─── References ───────────────────────────────────────────────────────────
CREATE TABLE refs (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  type            TEXT NOT NULL,
  label           TEXT NOT NULL,
  description     TEXT,
  context         TEXT,
  url             TEXT,
  notes           TEXT,
  metadata        TEXT,
  last_checked_at TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_refs_project ON refs(project_id);
CREATE INDEX idx_refs_type ON refs(type);

-- ─── Reference types ──────────────────────────────────────────────────────
CREATE TABLE reference_types (
  type          TEXT PRIMARY KEY,
  display_name  TEXT NOT NULL,
  is_rich       INTEGER NOT NULL DEFAULT 0,
  schema_json   TEXT NOT NULL,
  ui_hint       TEXT,
  created_at    TEXT NOT NULL
);

-- ─── Runbooks ─────────────────────────────────────────────────────────────
CREATE TABLE runbooks (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL UNIQUE REFERENCES projects(id),
  url             TEXT,
  prerequisites   TEXT,
  setup           TEXT,
  run             TEXT,
  deploy          TEXT,
  troubleshoot    TEXT,
  notes           TEXT,
  revision        INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

-- ─── Polymorphic comments ─────────────────────────────────────────────────
CREATE TABLE entity_comments (
  id            TEXT PRIMARY KEY,
  entity_type   TEXT NOT NULL
                  CHECK (entity_type IN ('item','doc','reference','runbook')),
  entity_id     TEXT NOT NULL,
  parent_id     TEXT REFERENCES entity_comments(id),
  body          TEXT NOT NULL,
  author        TEXT NOT NULL CHECK (author IN ('craig','claude')),
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_entity_comments_target
  ON entity_comments(entity_type, entity_id, created_at);

-- ─── Activity log ─────────────────────────────────────────────────────────
CREATE TABLE activity (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  entity_type  TEXT,
  entity_id    TEXT,
  verb         TEXT NOT NULL,
  target       TEXT NOT NULL,
  payload      TEXT,
  actor        TEXT NOT NULL
                 CHECK (actor IN ('craig','claude','cli','system')),
  occurred_at  TEXT NOT NULL
);

CREATE INDEX idx_activity_project_time ON activity(project_id, occurred_at DESC);
CREATE INDEX idx_activity_time ON activity(occurred_at DESC);
CREATE INDEX idx_activity_entity ON activity(entity_type, entity_id, occurred_at DESC);

-- ─── Tags + polymorphic application ───────────────────────────────────────
CREATE TABLE tags (
  id            TEXT PRIMARY KEY,
  project_id    TEXT REFERENCES projects(id),
  name          TEXT NOT NULL,
  color         TEXT,
  created_at    TEXT NOT NULL,
  UNIQUE(project_id, name)
);

CREATE TABLE entity_tags (
  entity_type   TEXT NOT NULL
                  CHECK (entity_type IN ('item','doc','reference','runbook')),
  entity_id     TEXT NOT NULL,
  tag_id        TEXT NOT NULL REFERENCES tags(id),
  created_at    TEXT NOT NULL,
  PRIMARY KEY (entity_type, entity_id, tag_id)
);

CREATE INDEX idx_entity_tags_tag ON entity_tags(tag_id);

-- ─── Chats ────────────────────────────────────────────────────────────────
CREATE TABLE chats (
  id              TEXT PRIMARY KEY,
  project_id      TEXT NOT NULL REFERENCES projects(id),
  claude_url      TEXT,
  tagline         TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived')),
  started_at      TEXT NOT NULL,
  last_seen_at    TEXT NOT NULL,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL
);

CREATE INDEX idx_chats_project_seen ON chats(project_id, last_seen_at DESC);
CREATE INDEX idx_chats_status ON chats(status);

-- ─── Skills ───────────────────────────────────────────────────────────────
CREATE TABLE skills (
  id              TEXT PRIMARY KEY,
  project_id      TEXT REFERENCES projects(id),
  name            TEXT NOT NULL,
  slug            TEXT NOT NULL,
  source          TEXT NOT NULL
                    CHECK (source IN ('local_path','git_url','inline')),
  source_path     TEXT,
  body            TEXT NOT NULL,
  revision        INTEGER NOT NULL DEFAULT 1,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','archived')),
  last_synced_at  TEXT,
  created_at      TEXT NOT NULL,
  updated_at      TEXT NOT NULL,
  UNIQUE(project_id, slug)
);

CREATE INDEX idx_skills_project ON skills(project_id, status);

-- ─── Skill proposals ──────────────────────────────────────────────────────
CREATE TABLE skill_proposals (
  id              TEXT PRIMARY KEY,
  skill_id        TEXT NOT NULL REFERENCES skills(id),
  proposed_body   TEXT NOT NULL,
  rationale       TEXT NOT NULL,
  triggered_by    TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','accepted','rejected','superseded')),
  decision_note   TEXT,
  created_at      TEXT NOT NULL,
  reviewed_at     TEXT
);

CREATE INDEX idx_skill_proposals_status ON skill_proposals(status, created_at DESC);
CREATE INDEX idx_skill_proposals_skill ON skill_proposals(skill_id);

-- ─── FTS5 virtual tables ──────────────────────────────────────────────────
-- External-content tables that index user-typed content for the global search.
-- Triggers keep them synchronised with the base tables.

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

CREATE VIRTUAL TABLE docs_fts USING fts5(
  title, body_preview,
  content='docs', content_rowid='rowid'
);

CREATE TRIGGER docs_fts_insert AFTER INSERT ON docs BEGIN
  INSERT INTO docs_fts(rowid, title, body_preview) VALUES (new.rowid, new.title, new.body_preview);
END;
CREATE TRIGGER docs_fts_delete AFTER DELETE ON docs BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, body_preview) VALUES('delete', old.rowid, old.title, old.body_preview);
END;
CREATE TRIGGER docs_fts_update AFTER UPDATE ON docs BEGIN
  INSERT INTO docs_fts(docs_fts, rowid, title, body_preview) VALUES('delete', old.rowid, old.title, old.body_preview);
  INSERT INTO docs_fts(rowid, title, body_preview) VALUES (new.rowid, new.title, new.body_preview);
END;

CREATE VIRTUAL TABLE refs_fts USING fts5(
  label, notes,
  content='refs', content_rowid='rowid'
);

CREATE TRIGGER refs_fts_insert AFTER INSERT ON refs BEGIN
  INSERT INTO refs_fts(rowid, label, notes) VALUES (new.rowid, new.label, new.notes);
END;
CREATE TRIGGER refs_fts_delete AFTER DELETE ON refs BEGIN
  INSERT INTO refs_fts(refs_fts, rowid, label, notes) VALUES('delete', old.rowid, old.label, old.notes);
END;
CREATE TRIGGER refs_fts_update AFTER UPDATE ON refs BEGIN
  INSERT INTO refs_fts(refs_fts, rowid, label, notes) VALUES('delete', old.rowid, old.label, old.notes);
  INSERT INTO refs_fts(rowid, label, notes) VALUES (new.rowid, new.label, new.notes);
END;

CREATE VIRTUAL TABLE skills_fts USING fts5(
  name, body,
  content='skills', content_rowid='rowid'
);

CREATE TRIGGER skills_fts_insert AFTER INSERT ON skills BEGIN
  INSERT INTO skills_fts(rowid, name, body) VALUES (new.rowid, new.name, new.body);
END;
CREATE TRIGGER skills_fts_delete AFTER DELETE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, body) VALUES('delete', old.rowid, old.name, old.body);
END;
CREATE TRIGGER skills_fts_update AFTER UPDATE ON skills BEGIN
  INSERT INTO skills_fts(skills_fts, rowid, name, body) VALUES('delete', old.rowid, old.name, old.body);
  INSERT INTO skills_fts(rowid, name, body) VALUES (new.rowid, new.name, new.body);
END;

CREATE VIRTUAL TABLE chats_fts USING fts5(
  tagline,
  content='chats', content_rowid='rowid'
);

CREATE TRIGGER chats_fts_insert AFTER INSERT ON chats BEGIN
  INSERT INTO chats_fts(rowid, tagline) VALUES (new.rowid, new.tagline);
END;
CREATE TRIGGER chats_fts_delete AFTER DELETE ON chats BEGIN
  INSERT INTO chats_fts(chats_fts, rowid, tagline) VALUES('delete', old.rowid, old.tagline);
END;
CREATE TRIGGER chats_fts_update AFTER UPDATE ON chats BEGIN
  INSERT INTO chats_fts(chats_fts, rowid, tagline) VALUES('delete', old.rowid, old.tagline);
  INSERT INTO chats_fts(rowid, tagline) VALUES (new.rowid, new.tagline);
END;
