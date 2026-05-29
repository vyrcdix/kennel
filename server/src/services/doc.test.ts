import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { contentRoot, ensureProjectDirs } from '../content.js';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import {
  createDoc,
  createDocFromUpload,
  getDocById,
  updateDocBody,
} from './doc.js';
import { HttpError } from '../errors.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };

beforeEach(() => {
  content = useTempContent();
  db = makeTestDb();
});
afterEach(() => {
  db.close();
  content.cleanup();
});

const seedDoc = (projectSlug = 'test', filename = 'note.md', body = 'hello'): string => {
  const project = createProject(db, { name: 'Test', slug: projectSlug });
  ensureProjectDirs(projectSlug);
  const filePath = `${projectSlug}/docs/${filename}`;
  const id = newId();
  db.prepare(
    `INSERT INTO docs
     (id, project_id, title, file_path, body_preview, word_count, revision, pinned, created_at, updated_at)
     VALUES (?, ?, 'Note', ?, ?, ?, 1, 0, ?, ?)`,
  ).run(id, project.id, filePath, body, body.split(/\s+/).length, nowIso(), nowIso());
  // Seed the file on disk to match the row
  const abs = join(contentRoot(), filePath);
  require('node:fs').writeFileSync(abs, body, 'utf8');
  return id;
};

describe('updateDocBody', () => {
  test('atomic: writes file + bumps revision + logs activity', () => {
    const id = seedDoc('atomic', 'a.md', 'initial');
    const updated = updateDocBody(db, id, 'new content');
    expect(updated.revision).toBe(2);
    expect(updated.body).toBe('new content');
    const abs = join(contentRoot(), updated.filePath);
    expect(readFileSync(abs, 'utf8')).toBe('new content');
    const a = db.prepare('SELECT count(*) as c FROM activity WHERE verb = ?').get('EDITED') as { c: number };
    expect(a.c).toBe(1);
  });

  test('no-op when body unchanged', () => {
    const id = seedDoc('noop', 'a.md', 'same');
    const before = getDocById(db, id)!;
    const after = updateDocBody(db, id, 'same');
    expect(after.revision).toBe(before.revision);
  });
});

describe('createDoc — provenance', () => {
  test('inline docs are tagged sourceKind=inline', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const doc = createDoc(db, { projectSlug: 'p', title: 'A', body: '# A' });
    expect(doc.sourceKind).toBe('inline');
    expect(doc.sourceFilename).toBeUndefined();
    expect(doc.sourceUploadedAt).toBeInstanceOf(Date);
  });
});

// ─── Upload helpers ────────────────────────────────────────────────
/** Build a minimal valid .docx in-memory — one paragraph of text. */
const makeDocxBuffer = async (text: string): Promise<Buffer> => {
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
      '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
      '<Default Extension="xml" ContentType="application/xml"/>' +
      '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
      '</Types>',
  );
  zip.folder('_rels')!.file(
    '.rels',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
      '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
      '</Relationships>',
  );
  zip.folder('word')!.file(
    'document.xml',
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
      `<w:body><w:p><w:r><w:t>${text}</w:t></w:r></w:p></w:body>` +
      '</w:document>',
  );
  return zip.generateAsync({ type: 'nodebuffer' });
};

describe('createDocFromUpload', () => {
  test('.md upload becomes a Doc with sourceKind=md + sourceFilename', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const doc = await createDocFromUpload(db, {
      projectSlug: 'p',
      filename: 'design notes.md',
      kind: 'md',
      body: Buffer.from('# Design notes\n\nbody text', 'utf8'),
    });
    expect(doc.title).toBe('design notes');
    expect(doc.body).toBe('# Design notes\n\nbody text');
    expect(doc.sourceKind).toBe('md');
    expect(doc.sourceFilename).toBe('design notes.md');
    expect(doc.sourceUploadedAt).toBeInstanceOf(Date);
    const a = db
      .prepare('SELECT count(*) as c FROM activity WHERE verb = ?')
      .get('CREATED') as { c: number };
    // 1 for the project + 1 for the doc upload
    expect(a.c).toBe(2);
  });

  test('.docx upload is converted via mammoth', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const buf = await makeDocxBuffer('Hello from a DOCX upload test.');
    const doc = await createDocFromUpload(db, {
      projectSlug: 'p',
      filename: 'architecture brief.docx',
      kind: 'docx',
      body: buf,
    });
    expect(doc.title).toBe('architecture brief');
    expect(doc.body).toMatch(/Hello from a DOCX upload test/);
    expect(doc.sourceKind).toBe('docx');
    expect(doc.sourceFilename).toBe('architecture brief.docx');
  });

  test('corrupt .docx surfaces docx_conversion_failed', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    try {
      await createDocFromUpload(db, {
        projectSlug: 'p',
        filename: 'bad.docx',
        kind: 'docx',
        body: Buffer.from('not a real docx, just some text'),
      });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).body).toMatchObject({
        fields: { body: 'docx_conversion_failed' },
      });
    }
  });

  test('explicit title override beats the filename stem', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const doc = await createDocFromUpload(db, {
      projectSlug: 'p',
      filename: 'whatever.md',
      kind: 'md',
      body: Buffer.from('content'),
      title: 'Designed Title',
    });
    expect(doc.title).toBe('Designed Title');
  });

  test('rejects empty buffer + unknown kind + bad project slug', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    await expect(
      createDocFromUpload(db, {
        projectSlug: 'p',
        filename: 'x.md',
        kind: 'md',
        body: Buffer.alloc(0),
      }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      createDocFromUpload(db, {
        projectSlug: 'p',
        filename: 'x.zip',
        // @ts-expect-error — exercising the runtime guard
        kind: 'zip',
        body: Buffer.from('hi'),
      }),
    ).rejects.toBeInstanceOf(HttpError);
    await expect(
      createDocFromUpload(db, {
        projectSlug: 'nope',
        filename: 'x.md',
        kind: 'md',
        body: Buffer.from('hi'),
      }),
    ).rejects.toBeInstanceOf(HttpError);
  });
});
