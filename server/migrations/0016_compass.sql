-- 0016 · Compass (orientation layer)
--
-- Typed columns on `items` for the Compass feature (see
-- docs/compass-build-plan.md P0 and handoff/design_handoff_compass-2/).
-- Mirrors the cadence migration (0014): nullable/defaulted columns, no CHECK
-- constraints (enums policed at the application layer so a future value doesn't
-- need another migration), no behaviour change in this slice.
--
-- A bearing is a forward-pointed crystal: ctype='orientation' (a 6th crystal
-- type, app-layer only — no DB column, validated by the CRYSTAL_TYPES set).
-- Everything else Compass needs reuses existing machinery: what's built toward
-- a bearing = getItemsServing(serves_id); compounding evidence (the wake) =
-- the activity log (verb='KEPT') filtered to the bearing; "still about?" =
-- the crystal resurface cadence re-pointed. Net-new persistence is the four
-- nullable columns below.

-- The horizon — optional, only on concrete bearings with a real finish line.
-- "day N / total" and "days ahead" are DERIVED (the Temperature pattern), never
-- stored, never a progress bar or countdown. Intangible bearings carry neither
-- date. ISO-8601 text, like every other timestamp column.
ALTER TABLE items ADD COLUMN horizon_start_at TEXT;
ALTER TABLE items ADD COLUMN horizon_target_at TEXT;

-- Small promises are daily cadences attached to a bearing. `role` splits a
-- promise (belongs to a bearing — requires serves_id, suppressed from "Do this
-- week") from an ordinary practice. Default 'practice' so every existing
-- cadence reads correctly; on bearing let-go a promise reverts to 'practice'.
ALTER TABLE items ADD COLUMN role TEXT NOT NULL DEFAULT 'practice'; -- promise | practice

-- Cheap insurance against a future work-vs-life split: bearings are keyed by
-- persona/workspace. null = the single set we render now. No backfill needed if
-- personas later land.
ALTER TABLE items ADD COLUMN persona TEXT;
