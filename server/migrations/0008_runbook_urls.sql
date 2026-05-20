-- 0008 · runbook: multiple labelled URLs
--
-- The runbook's single `url` field becomes a list of {label, url} pairs
-- (Admin / Dev / Prod / …), stored as a JSON array in `urls`. The old
-- `url` column is migrated into the list as a "Default" entry and then
-- left frozen (SQLite can't drop columns cleanly pre-3.35; it's inert).

ALTER TABLE runbooks ADD COLUMN urls TEXT;

UPDATE runbooks
  SET urls = json_array(json_object('label', 'Default', 'url', url))
  WHERE url IS NOT NULL AND trim(url) != '';
