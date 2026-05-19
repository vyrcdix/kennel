import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentRoot, ensureProjectDirs } from '../content.js';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import { getDocById, updateDocBody } from './doc.js';
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
