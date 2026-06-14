-- 0017 · Compass — a current points at the bearing it's under
--
-- Corrects the 1:1 thread↔bearing binding: a bearing's items.project_id is now
-- just its storage home, and the real relation is thread → bearing, assigned
-- from within the thread. A current optionally points at the single bearing
-- it's currently under; a bearing gathers many currents (the related-currents
-- roll-up). Threads are ephemeral — this can repoint or clear anytime.
--
-- Nullable, no CHECK / FK (app-policed, mirrors 0016). null = not under a
-- bearing. See docs/compass-build-plan.md + the bearing-model feedback.

ALTER TABLE projects ADD COLUMN serves_bearing_id TEXT;
