import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { resolve } from 'node:path';
import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { fromIso } from '../time.js';
import { notFound, stateConflict } from '../errors.js';
import type { Skill } from '../../../shared/types.js';

type SkillRow = {
  id: string;
  project_id: string | null;
  name: string;
  slug: string;
  source: 'local_path' | 'git_url' | 'inline';
  source_path: string | null;
  body: string;
  revision: number;
  status: 'active' | 'archived';
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
};

export const rowToSkill = (r: SkillRow): Skill => ({
  id: r.id,
  projectId: r.project_id ?? undefined,
  name: r.name,
  slug: r.slug,
  source: r.source,
  sourcePath: r.source_path ?? undefined,
  body: r.body,
  revision: r.revision,
  status: r.status,
  lastSyncedAt: fromIso(r.last_synced_at),
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listSkills = (db: DB): Skill[] =>
  db
    .prepare<[], SkillRow>('SELECT * FROM skills ORDER BY name')
    .all()
    .map(rowToSkill);

export const getSkillById = (db: DB, id: string): Skill | undefined => {
  const row = db.prepare<[string], SkillRow>('SELECT * FROM skills WHERE id = ?').get(id);
  return row ? rowToSkill(row) : undefined;
};

export const updateSkillBody = (
  db: DB,
  id: string,
  body: string,
  bumpRevision: boolean,
): Skill => {
  const skill = getSkillById(db, id);
  if (!skill) throw notFound('skill', id);
  const now = new Date().toISOString();
  const rev = bumpRevision ? skill.revision + 1 : skill.revision;
  db.prepare(
    `UPDATE skills
     SET body = ?, revision = ?, last_synced_at = ?, updated_at = ?
     WHERE id = ?`,
  ).run(body, rev, now, now, id);
  return getSkillById(db, id)!;
};

const expandTilde = (p: string) =>
  p.startsWith('~') ? resolve(homedir(), p.slice(1).replace(/^[\\/]+/, '')) : p;

/** Re-read the skill's source file from disk and replace the cached body.
 *  Only valid for `local_path` sources (`git_url` and `inline` skip). Bumps
 *  revision when the body actually changes. */
export const syncSkill = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Skill => {
  const skill = getSkillById(db, id);
  if (!skill) throw notFound('skill', id);
  if (skill.source !== 'local_path' || !skill.sourcePath) {
    throw stateConflict(`skill source ${skill.source} not supported for sync`);
  }
  const path = expandTilde(skill.sourcePath);
  if (!existsSync(path)) {
    throw stateConflict(`skill source not found at ${path}`);
  }
  const body = readFileSync(path, 'utf8');
  if (body === skill.body) {
    const now = new Date().toISOString();
    db.prepare('UPDATE skills SET last_synced_at = ? WHERE id = ?').run(now, id);
    return { ...skill, lastSyncedAt: new Date(now) };
  }
  const updated = updateSkillBody(db, id, body, true);
  logActivity(db, {
    projectId: skill.projectId ?? id,
    verb: 'SYNCED',
    target: `skill / ${skill.name}`,
    payload: `rev ${skill.revision} → rev ${updated.revision}`,
    actor,
    occurredAt: new Date().toISOString(),
  });
  return updated;
};
