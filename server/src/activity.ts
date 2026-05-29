import type { DB } from './db.js';
import { publish } from './events.js';
import { newId } from './ids.js';
import { nowIso } from './time.js';
import type { ActivityEntry, ActivityEntityType } from '../../shared/types.js';

export type LogEntry = {
  projectId: string;
  entityType?: ActivityEntityType;
  entityId?: string;
  verb: string;
  target: string;
  payload?: string;
  actor: 'craig' | 'claude' | 'cli' | 'system';
  occurredAt?: string;
};

export const logActivity = (db: DB, entry: LogEntry) => {
  const id = newId();
  const occurredAt = entry.occurredAt ?? nowIso();
  db.prepare(
    `INSERT INTO activity
     (id, project_id, entity_type, entity_id, verb, target, payload, actor, occurred_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    entry.projectId,
    entry.entityType ?? null,
    entry.entityId ?? null,
    entry.verb,
    entry.target,
    entry.payload ?? null,
    entry.actor,
    occurredAt,
  );
  const published: ActivityEntry = {
    id,
    projectId: entry.projectId,
    entityType: entry.entityType,
    entityId: entry.entityId,
    verb: entry.verb,
    target: entry.target,
    payload: entry.payload,
    actor: entry.actor,
    occurredAt: new Date(occurredAt),
  };
  publish({ type: 'activity', entry: published });
};
