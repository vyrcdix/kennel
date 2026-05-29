-- 0010 · v0.5 facets
--
-- Schema-only additions for the v0.5 reconciled spec. See
-- handoff/kennel_v05_handoff/README.md §2 for the canonical migration
-- block. This file is its DDL realisation.
--
-- What this slice DOES NOT do:
-- - No new tables (Crystals, Field-notes sections, Playbooks — all
--   resolved as facets on existing tables in v0.5).
-- - No application-layer behaviour beyond a one-line crystallize
--   refactor (sources_from now stored in its own column rather than
--   inside items.metadata; existing metadata-stored values backfill).
-- - No thread-label palette migration — that's the next phase.

-- ─── Crystallization typing (nullable; only meaningful when kind='crystallization')
ALTER TABLE items ADD COLUMN ctype TEXT;

-- ─── Crystal lineage (backward: what a crystal was distilled from)
-- Stored as JSON text — array of source item / doc / chat ids.
-- Backfill from the previously-used items.metadata json blob so the
-- existing crystallize path keeps working without behavioural drift.
ALTER TABLE items ADD COLUMN sources_from TEXT;
UPDATE items
   SET sources_from = json_extract(metadata, '$.sources_from')
 WHERE metadata IS NOT NULL
   AND json_extract(metadata, '$.sources_from') IS NOT NULL;

-- ─── Action intent (forward: the thinking an action advances)
-- Orthogonal to sources_from. Nullable. Sort attach step (phase 7) writes.
ALTER TABLE items ADD COLUMN serves_id TEXT;

-- ─── Crystal freshness / resurfacing
ALTER TABLE items ADD COLUMN last_surfaced_at TEXT;
ALTER TABLE items ADD COLUMN surface_count INTEGER NOT NULL DEFAULT 0;

-- Backfill last_surfaced_at = created_at for existing crystallized items so
-- they enter the resurface cadence naturally rather than being permanently
-- non-due (null > N is false).
UPDATE items
   SET last_surfaced_at = created_at
 WHERE kind = 'crystallization'
    OR state = 'crystallized';

-- ─── Crystal attachment edges on existing supporting-structure tables
ALTER TABLE guidebooks ADD COLUMN supports_crystal_item_id TEXT;
ALTER TABLE runbooks   ADD COLUMN supports_crystal_item_id TEXT;

-- Plain-doc subtype + crystal link. doctype is reserved for future
-- subtypes; only 'doc' is valid now, policed at the application layer.
-- (No DB CHECK so a future subtype doesn't require another migration.)
ALTER TABLE docs ADD COLUMN supports_crystal TEXT;
ALTER TABLE docs ADD COLUMN doctype TEXT NOT NULL DEFAULT 'doc';

-- Field notes is one row per project with section columns. Section-level
-- crystal links live in a JSON map keyed by the section name. Normalising
-- into a field_notes_sections table is the right long-term shape but it's
-- a separate future "section split" slice — explicitly NOT part of v0.5.
ALTER TABLE field_notes ADD COLUMN supports_crystals TEXT;

-- ─── Resurface cadence setting (default 30 days; range 7-180 enforced
-- at the application layer to keep the migration loose).
ALTER TABLE settings ADD COLUMN resurface_interval_days INTEGER NOT NULL DEFAULT 30;
