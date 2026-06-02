-- 0012 · Smart Routing — routings table + settings additions
--
-- Records every Smart Routing event: a chunk of source content
-- (pasted in v1; emailed in Phase 1) that the classifier dispatched
-- into an existing Steep artefact. One row per dispatch.
--
-- Schema notes:
-- - source_kind already includes 'email' so Phase 1's transport
--   doesn't need a fresh migration — just a new route writing rows
--   with source_kind='email'.
-- - artefact_id is FK-free; it points across five different tables
--   (items / docs / guidebook_entries / runbooks / field_notes).
--   Same shape as activity.entity_id; resolution is by
--   artefact_kind first, then id within the resolved table.
-- - rejected_at is reserved for Phase 2's Undo upgrade (soft reject
--   instead of hard delete). Phase 0 never writes to it.
-- - classifier_confidence is nullable for the over_ai_budget
--   case — when we don't call Anthropic, there's no real
--   confidence to record.

CREATE TABLE routings (
  id                      TEXT PRIMARY KEY,
  project_id              TEXT NOT NULL REFERENCES projects(id),

  source_kind             TEXT NOT NULL
                            CHECK (source_kind IN ('paste','email')),
  source_meta             TEXT,            -- JSON: { sender? } for email; null for paste
  raw_content             TEXT NOT NULL,
  hint                    TEXT
                            CHECK (hint IS NULL
                                   OR hint IN ('bench','doc','guidebook','runbook','field-notes')),

  classifier_action       TEXT NOT NULL
                            CHECK (classifier_action IN
                              ('bench','doc','guidebook','runbook','field-notes')),
  classifier_confidence   REAL,
  classifier_explanation  TEXT,
  over_ai_budget          INTEGER NOT NULL DEFAULT 0,

  artefact_kind           TEXT NOT NULL
                            CHECK (artefact_kind IN
                              ('item','doc','guidebook_entry','runbook','field_notes')),
  artefact_id             TEXT NOT NULL,

  rejected_at             TEXT,
  created_at              TEXT NOT NULL
);

CREATE INDEX idx_routings_project_recent ON routings(project_id, created_at DESC);
CREATE INDEX idx_routings_artefact ON routings(artefact_kind, artefact_id);

-- Settings additions — per-day cap on classifier calls (defends
-- against runaway costs) and the confidence floor below which the
-- classifier's pick is overridden with 'bench'. Both tunable from
-- Settings → Routing once the UI ships in slice 5.
ALTER TABLE settings ADD COLUMN routing_daily_cap INTEGER NOT NULL DEFAULT 200;
ALTER TABLE settings ADD COLUMN routing_confidence_threshold REAL NOT NULL DEFAULT 0.55;
