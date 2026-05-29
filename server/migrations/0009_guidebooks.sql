-- 0009 · Guidebooks (per-topic ordered collections of sources)
--
-- A guidebook is an ordered list of entries. Each entry points at
-- exactly one source — a Doc or a Reference already in the same
-- topic — and carries per-membership metadata (name, description,
-- order, free-text tags). Multiple guidebooks per topic; the same
-- source can appear in many guidebooks with different metadata.
--
-- Tags are stored as a JSON array of strings on the entry row, not
-- as rows in `entity_tags`. They are guidebook-membership-local, by
-- design — see docs/guidebook-frd.md.
--
-- This migration also adds provenance columns to `docs` so uploads
-- (.md, .docx) remember the original filename and upload time.
-- Existing rows are backfilled to source_kind = 'inline'.

CREATE TABLE guidebooks (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  name         TEXT NOT NULL,
  description  TEXT,
  pinned       INTEGER NOT NULL DEFAULT 0,
  rank         REAL,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

CREATE INDEX idx_guidebooks_project      ON guidebooks(project_id);
CREATE INDEX idx_guidebooks_project_rank ON guidebooks(project_id, rank);
CREATE INDEX idx_guidebooks_pinned       ON guidebooks(project_id, pinned);

CREATE TABLE guidebook_entries (
  id            TEXT PRIMARY KEY,
  guidebook_id  TEXT NOT NULL REFERENCES guidebooks(id),
  -- Exactly one of doc_id / reference_id is set. The CHECK below
  -- enforces this XOR at the storage layer; the service layer
  -- enforces it again before insert for a friendly error.
  doc_id        TEXT REFERENCES docs(id),
  reference_id  TEXT REFERENCES refs(id),
  name          TEXT NOT NULL,
  description   TEXT,
  tags          TEXT,                                  -- JSON array of strings
  rank          REAL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  CHECK ((doc_id IS NOT NULL) <> (reference_id IS NOT NULL))
);

CREATE INDEX idx_gb_entries_guidebook ON guidebook_entries(guidebook_id, rank);
CREATE INDEX idx_gb_entries_doc       ON guidebook_entries(doc_id);
CREATE INDEX idx_gb_entries_ref       ON guidebook_entries(reference_id);

-- ─── Doc provenance ───────────────────────────────────────────────
-- Useful beyond guidebooks; lives on `docs` rather than on the entry
-- because provenance belongs to the file itself, not to a membership.

ALTER TABLE docs ADD COLUMN source_filename    TEXT;
ALTER TABLE docs ADD COLUMN source_kind        TEXT;    -- 'md' | 'docx' | 'inline'
ALTER TABLE docs ADD COLUMN source_uploaded_at TEXT;

-- Backfill: existing rows predate the upload flow and are inline.
UPDATE docs
   SET source_kind        = 'inline',
       source_uploaded_at = created_at
 WHERE source_kind IS NULL;
