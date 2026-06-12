-- 0015 · Cadence cooling tolerance (Settings → Lifecycle)
--
-- Per-commitment tolerance: how many consecutive skipped windows a cadence
-- waits before it drifts onto the Aging board (A4 defaults). Configurable;
-- range policed at the application layer (1–60 windows). The Settings UI dial
-- lands in C5; the aging query reads these in C2/C4.

ALTER TABLE settings ADD COLUMN cadence_tolerance_trying    INTEGER NOT NULL DEFAULT 3;
ALTER TABLE settings ADD COLUMN cadence_tolerance_committed INTEGER NOT NULL DEFAULT 6;
ALTER TABLE settings ADD COLUMN cadence_tolerance_core      INTEGER NOT NULL DEFAULT 10;
