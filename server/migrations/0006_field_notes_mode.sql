-- 0006 · Field Notes scratchpad/managed mode
--
-- Per-thread toggle. 'scratchpad' (default) keeps every section as a
-- markdown blob. 'managed' renders Open Questions as question-kind
-- items and Sources as references — a lens over entities that already
-- exist, not a new store. Switching modes never migrates data.

ALTER TABLE field_notes
  ADD COLUMN mode TEXT NOT NULL DEFAULT 'scratchpad';
