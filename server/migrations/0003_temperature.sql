-- ─── 0003: temperature settings ─────────────────────────────────────────────
-- Two new fields on the settings singleton:
--   dormant_threshold_days  — items untouched longer than this read as 'dormant'
--                             (60d default; aging_threshold_days handles 'aging')
--   show_temperature        — global toggle (0|1) for the panel-level signal;
--                             when 0, all panels render as 'active' regardless
--                             of content age.

ALTER TABLE settings
  ADD COLUMN dormant_threshold_days INTEGER NOT NULL DEFAULT 60;

ALTER TABLE settings
  ADD COLUMN show_temperature INTEGER NOT NULL DEFAULT 1;
