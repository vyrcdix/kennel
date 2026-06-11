-- 0014 · Cadence (recurring actions)
--
-- Typed columns on `items` for the Cadence feature (see
-- docs/cadence-build-plan.md C0 and handoff/design_handoff_cadence-2/).
-- Mirrors the v0.5 facet migration (0010): nullable columns, no CHECK
-- constraints (enums policed at the application layer so a future value
-- doesn't need another migration), no behaviour change.
--
-- These are meaningful only when kind='action'; null elsewhere. A cadence is
-- "present" when `cadence` is non-null. Attachment to the parent it serves
-- reuses the existing `serves_id` column — no new join. Vitality is DERIVED
-- (last_done_at vs the cadence interval, weighted by commitment) and is NOT
-- stored.

-- The rhythm + the declared commitment dial.
ALTER TABLE items ADD COLUMN cadence TEXT;            -- daily | weekly | monthly
ALTER TABLE items ADD COLUMN commitment TEXT;         -- trying | committed | core

-- When the cadence next enters the "do this week" surface, and the last
-- logged contact. ISO-8601 text, like every other timestamp column.
ALTER TABLE items ADD COLUMN window_opens_at TEXT;
ALTER TABLE items ADD COLUMN last_done_at TEXT;

-- Gentle streak readout (NOT a score). Bumped by "Did it", untouched by Skip.
ALTER TABLE items ADD COLUMN kept_count INTEGER NOT NULL DEFAULT 0;

-- The on-card resource: an optional FK to a references row of type 'link'.
-- No DB FK constraint (matches the loose migration style); app-policed.
ALTER TABLE items ADD COLUMN resource_ref_id TEXT;

-- UI default for where a "did it" memo files (a FieldNotesSectionKey).
ALTER TABLE items ADD COLUMN note_default_section TEXT;
