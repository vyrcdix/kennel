-- @rebuild — needs FK checks off (table-rebuild dance below)
-- 0011 · Thread label palette (v0.5 §A)
--
-- Replaces the pre-v0.5 ProjectColor enum (moss|ember|dust|blaze|slate)
-- with the new label palette (stone|sage|dusk|plum|slate|teal). The
-- family-language tokens (blaze=crystals, ember=action, moss=guidebook,
-- clay=field notes) are now reserved and never selectable as a thread
-- colour.
--
-- The CHECK constraint on projects.color limits the column to the old
-- value set, so we can't UPDATE directly — SQLite has no ALTER TABLE
-- DROP/MODIFY CONSTRAINT, so this uses the standard table-rebuild
-- idiom: create the new table next to the old, copy + remap values,
-- drop the old, rename. Indexes are recreated from the 0001 schema.
--
-- The @rebuild marker at the top tells applyMigrations to toggle
-- foreign_keys=OFF around this migration, then run
-- PRAGMA foreign_key_check inside the transaction before commit. This
-- is the SQLite-recommended dance (https://sqlite.org/lang_altertable.html
-- §"Making Other Kinds Of Table Schema Changes"). Without it, the
-- DROP+RENAME in the middle of the rebuild trips items.project_id
-- and other FK references that point at projects(id).

CREATE TABLE projects_v05 (
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
                           CHECK (color IS NULL OR color IN ('stone','sage','dusk','plum','slate','teal')),
  next_steps_dismissed   INTEGER NOT NULL DEFAULT 0,
  metadata               TEXT,
  created_at             TEXT NOT NULL,
  updated_at             TEXT NOT NULL
);

-- Copy + remap colour values per v0.5 §A. CASE expression instead of
-- four separate UPDATEs because we're already touching every row.
INSERT INTO projects_v05
  (id, slug, name, description, context, status, pinned, rank, color,
   next_steps_dismissed, metadata, created_at, updated_at)
SELECT
  id, slug, name, description, context, status, pinned, rank,
  CASE color
    WHEN 'dust'  THEN 'stone'
    WHEN 'moss'  THEN 'sage'
    WHEN 'ember' THEN 'stone'
    WHEN 'blaze' THEN 'stone'
    WHEN 'slate' THEN 'slate'
    ELSE color
  END,
  next_steps_dismissed, metadata, created_at, updated_at
FROM projects;

DROP TABLE projects;
ALTER TABLE projects_v05 RENAME TO projects;

CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_pinned ON projects(pinned);
