import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound } from '../errors.js';
import { fromIso, nowIso } from '../time.js';
import type { Runbook, RunbookUrl } from '../../../shared/types.js';

type RunbookRow = {
  id: string;
  project_id: string;
  urls: string | null;
  prerequisites: string | null;
  setup: string | null;
  run: string | null;
  deploy: string | null;
  troubleshoot: string | null;
  notes: string | null;
  revision: number;
  supports_crystal_item_id: string | null;
  created_at: string;
  updated_at: string;
};

/** Parse the urls JSON column, defensively — bad rows become []. */
const parseUrls = (raw: string | null): RunbookUrl[] => {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v
      .filter(
        (e): e is RunbookUrl =>
          !!e && typeof e.label === 'string' && typeof e.url === 'string',
      )
      .map((e) => ({ label: e.label, url: e.url }));
  } catch {
    return [];
  }
};

export const rowToRunbook = (r: RunbookRow): Runbook => ({
  id: r.id,
  projectId: r.project_id,
  urls: parseUrls(r.urls),
  prerequisites: r.prerequisites ?? undefined,
  setup: r.setup ?? undefined,
  run: r.run ?? undefined,
  deploy: r.deploy ?? undefined,
  troubleshoot: r.troubleshoot ?? undefined,
  notes: r.notes ?? undefined,
  revision: r.revision,
  supportsCrystalItemId: r.supports_crystal_item_id ?? undefined,
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
  urls: RunbookUrl[];
  prerequisites: string | null;
  setup: string | null;
  run: string | null;
  deploy: string | null;
  troubleshoot: string | null;
  notes: string | null;
}>;

import { newId } from '../ids.js';

/** Drop blank entries (no url) and trim — keeps the JSON tidy. */
const cleanUrls = (urls: RunbookUrl[]): RunbookUrl[] =>
  urls
    .map((u) => ({ label: u.label.trim(), url: u.url.trim() }))
    .filter((u) => u.url !== '')
    .map((u) => ({ label: u.label || 'URL', url: u.url }));

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
       (id, project_id, urls, prerequisites, setup, run, deploy, troubleshoot, notes,
        revision, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
    ).run(
      id,
      projectId,
      sections.urls ? JSON.stringify(cleanUrls(sections.urls)) : null,
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
    urls: sections.urls !== undefined ? cleanUrls(sections.urls) : existing.urls,
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
     SET urls = ?, prerequisites = ?, setup = ?, run = ?, deploy = ?,
         troubleshoot = ?, notes = ?, revision = ?, updated_at = ?
     WHERE project_id = ?`,
  ).run(
    JSON.stringify(merged.urls),
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

export const updateRunbookUrls = (
  db: DB,
  projectId: string,
  urls: RunbookUrl[],
): Runbook => {
  const existing = getRunbookByProject(db, projectId);
  if (!existing) throw notFound('runbook', projectId);
  return upsertRunbook(db, projectId, { urls });
};
