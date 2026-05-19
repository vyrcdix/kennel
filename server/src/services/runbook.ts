import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound } from '../errors.js';
import { fromIso, nowIso } from '../time.js';
import type { Runbook } from '../../../shared/types.js';

type RunbookRow = {
  id: string;
  project_id: string;
  url: string | null;
  prerequisites: string | null;
  setup: string | null;
  run: string | null;
  deploy: string | null;
  troubleshoot: string | null;
  notes: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
};

export const rowToRunbook = (r: RunbookRow): Runbook => ({
  id: r.id,
  projectId: r.project_id,
  url: r.url ?? undefined,
  prerequisites: r.prerequisites ?? undefined,
  setup: r.setup ?? undefined,
  run: r.run ?? undefined,
  deploy: r.deploy ?? undefined,
  troubleshoot: r.troubleshoot ?? undefined,
  notes: r.notes ?? undefined,
  revision: r.revision,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listRunbooks = (db: DB): Runbook[] =>
  db
    .prepare<[], RunbookRow>('SELECT * FROM runbooks')
    .all()
    .map(rowToRunbook);

export const getRunbookByProject = (db: DB, projectId: string): Runbook | undefined => {
  const row = db
    .prepare<[string], RunbookRow>('SELECT * FROM runbooks WHERE project_id = ?')
    .get(projectId);
  return row ? rowToRunbook(row) : undefined;
};

export type RunbookSections = Partial<{
  url: string | null;
  prerequisites: string | null;
  setup: string | null;
  run: string | null;
  deploy: string | null;
  troubleshoot: string | null;
  notes: string | null;
}>;

import { newId } from '../ids.js';

/** Set or create a project's runbook in one call. Any non-undefined section is
 *  applied; bumps revision when any section changed; logs activity. */
export const upsertRunbook = (
  db: DB,
  projectId: string,
  sections: RunbookSections,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Runbook => {
  const existing = getRunbookByProject(db, projectId);
  const now = nowIso();

  if (!existing) {
    const id = newId();
    db.prepare(
      `INSERT INTO runbooks
       (id, project_id, url, prerequisites, setup, run, deploy, troubleshoot, notes,
        revision, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      id,
      projectId,
      sections.url ?? null,
      sections.prerequisites ?? null,
      sections.setup ?? null,
      sections.run ?? null,
      sections.deploy ?? null,
      sections.troubleshoot ?? null,
      sections.notes ?? null,
      now,
      now,
    );
    logActivity(db, {
      projectId,
      entityType: 'runbook',
      entityId: id,
      verb: 'CREATED',
      target: 'runbook',
      actor,
      occurredAt: now,
    });
    return getRunbookByProject(db, projectId)!;
  }

  const merged = {
    url: sections.url !== undefined ? sections.url : existing.url ?? null,
    prerequisites:
      sections.prerequisites !== undefined ? sections.prerequisites : existing.prerequisites ?? null,
    setup: sections.setup !== undefined ? sections.setup : existing.setup ?? null,
    run: sections.run !== undefined ? sections.run : existing.run ?? null,
    deploy: sections.deploy !== undefined ? sections.deploy : existing.deploy ?? null,
    troubleshoot:
      sections.troubleshoot !== undefined ? sections.troubleshoot : existing.troubleshoot ?? null,
    notes: sections.notes !== undefined ? sections.notes : existing.notes ?? null,
  };
  const newRev = existing.revision + 1;
  db.prepare(
    `UPDATE runbooks
     SET url = ?, prerequisites = ?, setup = ?, run = ?, deploy = ?,
         troubleshoot = ?, notes = ?, revision = ?, updated_at = ?
     WHERE project_id = ?`,
  ).run(
    merged.url,
    merged.prerequisites,
    merged.setup,
    merged.run,
    merged.deploy,
    merged.troubleshoot,
    merged.notes,
    newRev,
    now,
    projectId,
  );
  const changed = Object.keys(sections).filter((k) => (sections as any)[k] !== undefined);
  logActivity(db, {
    projectId,
    entityType: 'runbook',
    entityId: existing.id,
    verb: 'EDITED',
    target: 'runbook',
    payload: `sections: ${changed.join(', ')} · rev ${existing.revision} → rev ${newRev}`,
    actor,
    occurredAt: now,
  });
  return getRunbookByProject(db, projectId)!;
};

export const updateRunbookUrl = (db: DB, projectId: string, url: string): Runbook => {
  const existing = getRunbookByProject(db, projectId);
  if (!existing) throw notFound('runbook', projectId);
  if (existing.url === url) return existing;
  const now = nowIso();
  db.prepare(
    'UPDATE runbooks SET url = ?, updated_at = ? WHERE project_id = ?',
  ).run(url || null, now, projectId);
  logActivity(db, {
    projectId,
    entityType: 'runbook',
    entityId: existing.id,
    verb: 'EDITED',
    target: 'runbook url',
    payload: url,
    actor: 'craig',
    occurredAt: now,
  });
  return getRunbookByProject(db, projectId)!;
};
