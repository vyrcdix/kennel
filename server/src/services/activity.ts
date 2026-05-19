import type { DB } from '../db.js';
import { fromIso } from '../time.js';
import type { ActivityEntry, Actor, EntityType } from '../../../shared/types.js';

type ActivityRow = {
  id: string;
  project_id: string;
  entity_type: EntityType | null;
  entity_id: string | null;
  verb: string;
  target: string;
  payload: string | null;
  actor: Actor;
  occurred_at: string;
};

export const rowToActivity = (r: ActivityRow): ActivityEntry => ({
  id: r.id,
  projectId: r.project_id,
  entityType: r.entity_type ?? undefined,
  entityId: r.entity_id ?? undefined,
  verb: r.verb,
  target: r.target,
  payload: r.payload ?? undefined,
  actor: r.actor,
  occurredAt: fromIso(r.occurred_at)!,
});

export const listActivity = (db: DB, limit = 200): ActivityEntry[] =>
  db
    .prepare<[number], ActivityRow>(
      'SELECT * FROM activity ORDER BY occurred_at DESC LIMIT ?',
    )
    .all(limit)
    .map(rowToActivity);

export const listActivitySince = (db: DB, since: string): ActivityEntry[] =>
  db
    .prepare<[string], ActivityRow>(
      'SELECT * FROM activity WHERE occurred_at >= ? ORDER BY occurred_at DESC',
    )
    .all(since)
    .map(rowToActivity);
