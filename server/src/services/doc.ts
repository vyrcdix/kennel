import { join } from 'node:path';
import mammoth from 'mammoth';
import type { DB } from '../db.js';

/** mammoth ships an incomplete `index.d.ts` that omits `convertToMarkdown`,
 *  even though the runtime exposes it. Narrow shim so the rest of this
 *  file stays typed. */
const mammothConvertToMarkdown = (
  mammoth as unknown as {
    convertToMarkdown: (input: { buffer: Buffer }) => Promise<{
      value: string;
      messages: unknown[];
    }>;
  }
).convertToMarkdown;
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
import type { Doc, DocSourceKind, DocType } from '../../../shared/types.js';

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
  source_filename: string | null;
  source_kind: DocSourceKind | null;
  source_uploaded_at: string | null;
  doctype: string;
  supports_crystal: string | null;
  created_at: string;
  updated_at: string;
};

const absolutePath = (filePath: string) => join(contentRoot(), filePath);

/** v0.5: only 'doc' is valid today. Anything else falls back to 'doc' so
 *  an out-of-band write can't poison the read path. */
const VALID_DOCTYPES = new Set<DocType>(['doc']);
const safeDoctype = (raw: string): DocType =>
  VALID_DOCTYPES.has(raw as DocType) ? (raw as DocType) : 'doc';

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
  sourceFilename: r.source_filename ?? undefined,
  sourceKind: r.source_kind ?? undefined,
  sourceUploadedAt: fromIso(r.source_uploaded_at ?? undefined),
  doctype: safeDoctype(r.doctype),
  supportsCrystal: r.supports_crystal ?? undefined,
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

type PersistDocInput = {
  projectId: string;
  projectSlug: string;
  title: string;
  body: string;
  pinned: boolean;
  filename?: string;
  sourceKind: DocSourceKind;
  sourceFilename: string | null;
};

/** Shared insert path for createDoc + createDocFromUpload. Writes the
 *  markdown file then the row in a transaction; rolls back the FS on
 *  failure; logs activity. */
const persistDoc = (
  db: DB,
  input: PersistDocInput,
  actor: 'craig' | 'claude' | 'cli',
): string => {
  ensureProjectDirs(input.projectSlug);
  const id = newId();
  const filename = input.filename ?? filenameFrom(input.title, id);
  const filePath = `${input.projectSlug}/docs/${filename}`;
  const now = nowIso();

  const fsHandle = writeDocAtomic(join(contentRoot(), filePath), input.body);
  try {
    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO docs
         (id, project_id, title, file_path, body_preview, word_count,
          revision, pinned, source_filename, source_kind, source_uploaded_at,
          created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)`,
      ).run(
        id,
        input.projectId,
        input.title,
        filePath,
        previewOf(input.body),
        wordCount(input.body),
        input.pinned ? 1 : 0,
        input.sourceFilename,
        input.sourceKind,
        now,
        now,
        now,
      );
      logActivity(db, {
        projectId: input.projectId,
        entityType: 'doc',
        entityId: id,
        verb: 'CREATED',
        target: `doc / ${input.title}`,
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
  return id;
};

export const createDoc = (db: DB, input: CreateDocInput, actor: 'craig' | 'claude' | 'cli' = 'craig'): Doc => {
  if (!input.title?.trim()) throw validationError({ title: 'required' });
  if (typeof input.body !== 'string') throw validationError({ body: 'required' });
  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  const id = persistDoc(
    db,
    {
      projectId: project.id,
      projectSlug: project.slug,
      title: input.title.trim(),
      body: input.body,
      pinned: !!input.pinned,
      filename: input.filename,
      sourceKind: 'inline',
      sourceFilename: null,
    },
    actor,
  );
  return getDocById(db, id)!;
};

export type UploadDocInput = {
  projectSlug: string;
  /** Original uploaded filename, including extension. Stored as provenance. */
  filename: string;
  /** 'md' = body is UTF-8 markdown bytes. 'docx' = body is a Word binary. */
  kind: 'md' | 'docx';
  body: Buffer;
  title?: string;
  pinned?: boolean;
};

/** Strip extension + tidy whitespace to derive a default title from a
 *  filename. "Architecture Brief.docx" → "Architecture Brief". */
const titleFromFilename = (filename: string): string =>
  filename.replace(/\.[a-z0-9]+$/i, '').replace(/[_\-]+/g, ' ').trim();

export const createDocFromUpload = async (
  db: DB,
  input: UploadDocInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Promise<Doc> => {
  if (!input.filename?.trim()) throw validationError({ filename: 'required' });
  if (input.kind !== 'md' && input.kind !== 'docx') {
    throw validationError({ kind: 'must_be_md_or_docx' });
  }
  if (!Buffer.isBuffer(input.body) || input.body.length === 0) {
    throw validationError({ body: 'required' });
  }
  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  let markdown: string;
  if (input.kind === 'docx') {
    try {
      const result = await mammothConvertToMarkdown({ buffer: input.body });
      markdown = result.value;
    } catch {
      // Bad / corrupt / not-a-docx buffer. Surface as a friendly error
      // so the UI can prompt the user to paste contents instead.
      throw validationError({ body: 'docx_conversion_failed' });
    }
  } else {
    markdown = input.body.toString('utf8');
  }

  const title = (input.title?.trim() || titleFromFilename(input.filename)) || 'Untitled';

  const id = persistDoc(
    db,
    {
      projectId: project.id,
      projectSlug: project.slug,
      title,
      body: markdown,
      pinned: !!input.pinned,
      sourceKind: input.kind,
      sourceFilename: input.filename,
    },
    actor,
  );
  return getDocById(db, id)!;
};

export const setDocPinned = (db: DB, id: string, pinned: boolean): Doc => {
  const existing = getDocById(db, id);
  if (!existing) throw notFound('doc', id);
  if (existing.pinned === pinned) return existing;

  const now = nowIso();
  db.prepare('UPDATE docs SET pinned = ?, updated_at = ? WHERE id = ?').run(
    pinned ? 1 : 0,
    now,
    id,
  );
  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'doc',
    entityId: id,
    verb: pinned ? 'PINNED' : 'UNPINNED',
    target: `doc / ${existing.title}`,
    actor: 'craig',
    occurredAt: now,
  });
  return getDocById(db, id)!;
};

/** Hard-delete a doc + its on-disk markdown file. Items pointing at it
 *  (items.doc_id) get NULLed so the item survives — same pattern as
 *  deleteReference. Guidebook entries referencing the doc would break
 *  the XOR CHECK, so we refuse the delete with a friendly 409 if any
 *  exist. */
export const deleteDoc = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): void => {
  const existing = getDocById(db, id);
  if (!existing) throw notFound('doc', id);

  const inUse = db
    .prepare<[string], { c: number }>(
      'SELECT COUNT(*) AS c FROM guidebook_entries WHERE doc_id = ?',
    )
    .get(id);
  if ((inUse?.c ?? 0) > 0) {
    throw validationError({ doc: 'in_use_by_guidebook_entry' });
  }

  const now = nowIso();
  const tx = db.transaction(() => {
    db.prepare(
      'UPDATE items SET doc_id = NULL, updated_at = ? WHERE doc_id = ?',
    ).run(now, id);
    db.prepare('DELETE FROM docs WHERE id = ?').run(id);
  });
  tx();

  // Best-effort file unlink; the row is already gone, so a stale .md is
  // harmless. Don't throw — the user already sees the doc disappear from
  // the UI and a content-dir clean-up sweep can pick up orphans.
  try {
    const path = absolutePath(existing.filePath);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require('node:fs') as typeof import('node:fs');
    if (fs.existsSync(path)) fs.unlinkSync(path);
  } catch {
    /* leave the file; row is gone */
  }

  logActivity(db, {
    projectId: existing.projectId,
    entityType: 'doc',
    entityId: id,
    verb: 'REMOVED',
    target: `doc / ${existing.title}`,
    actor,
    occurredAt: now,
  });
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
