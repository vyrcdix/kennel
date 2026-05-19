import { join } from 'node:path';
import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import {
  commitDocWrite,
  contentRoot,
  ensureProjectDirs,
  readDoc,
  writeDocAtomic,
} from '../content.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import { getProjectBySlug } from './project.js';
import type { Doc } from '../../../shared/types.js';

type DocRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  context: string | null;
  file_path: string;
  body_preview: string | null;
  word_count: number | null;
  revision: number;
  pinned: number;
  created_at: string;
  updated_at: string;
};

const absolutePath = (filePath: string) => join(contentRoot(), filePath);

export const rowToDoc = (r: DocRow): Doc => ({
  id: r.id,
  projectId: r.project_id,
  title: r.title,
  description: r.description ?? undefined,
  context: r.context ?? undefined,
  filePath: r.file_path,
  body: readDoc(absolutePath(r.file_path)),
  revision: r.revision,
  pinned: r.pinned === 1,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listDocs = (db: DB): Doc[] =>
  db
    .prepare<[], DocRow>('SELECT * FROM docs ORDER BY updated_at DESC')
    .all()
    .map(rowToDoc);

export const getDocById = (db: DB, id: string): Doc | undefined => {
  const row = db.prepare<[string], DocRow>('SELECT * FROM docs WHERE id = ?').get(id);
  return row ? rowToDoc(row) : undefined;
};

const previewOf = (body: string) =>
  body.replace(/^[#>*\-\s]+/gm, '').slice(0, 500);

const wordCount = (body: string) =>
  body
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

export type CreateDocInput = {
  projectSlug: string;
  title: string;
  body: string;
  pinned?: boolean;
  filename?: string;
};

const filenameFrom = (title: string, fallbackId: string): string => {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `${slug || fallbackId}.md`;
};

export const createDoc = (db: DB, input: CreateDocInput, actor: 'craig' | 'claude' | 'cli' = 'craig'): Doc => {
  if (!input.title?.trim()) throw validationError({ title: 'required' });
  if (typeof input.body !== 'string') throw validationError({ body: 'required' });
  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  ensureProjectDirs(project.slug);
  const id = newId();
  const filename = input.filename ?? filenameFrom(input.title, id);
  const filePath = `${project.slug}/docs/${filename}`;
  const now = nowIso();

  const fsHandle = writeDocAtomic(join(contentRoot(), filePath), input.body);
  try {
    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO docs
         (id, project_id, title, file_path, body_preview, word_count, revision, pinned, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?)`,
      ).run(
        id,
        project.id,
        input.title.trim(),
        filePath,
        previewOf(input.body),
        wordCount(input.body),
        input.pinned ? 1 : 0,
        now,
        now,
      );
      logActivity(db, {
        projectId: project.id,
        entityType: 'doc',
        entityId: id,
        verb: 'CREATED',
        target: `doc / ${input.title.trim()}`,
        actor,
        occurredAt: now,
      });
    });
    tx();
    commitDocWrite(join(contentRoot(), filePath));
  } catch (err) {
    fsHandle.rollback();
    throw err;
  }
  return getDocById(db, id)!;
};

export const updateDocBody = (db: DB, id: string, body: string): Doc => {
  const existing = getDocById(db, id);
  if (!existing) throw notFound('doc', id);
  if (existing.body === body) return existing;

  const now = nowIso();
  const newRev = existing.revision + 1;
  const fsHandle = writeDocAtomic(absolutePath(existing.filePath), body);
  try {
    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE docs
         SET body_preview = ?, word_count = ?, revision = ?, updated_at = ?
         WHERE id = ?`,
      ).run(previewOf(body), wordCount(body), newRev, now, id);
      logActivity(db, {
        projectId: existing.projectId,
        entityType: 'doc',
        entityId: id,
        verb: 'EDITED',
        target: `doc / ${existing.title}`,
        payload: `rev ${existing.revision} → rev ${newRev}`,
        actor: 'craig',
        occurredAt: now,
      });
    });
    tx();
    commitDocWrite(absolutePath(existing.filePath));
  } catch (err) {
    fsHandle.rollback();
    throw err;
  }
  return getDocById(db, id)!;
};
