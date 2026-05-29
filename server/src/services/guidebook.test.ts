import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import {
  createGuidebook,
  deleteGuidebook,
  getGuidebookById,
  listGuidebooks,
  listGuidebooksByProject,
  reorderGuidebooks,
  updateGuidebook,
} from './guidebook.js';
import { HttpError } from '../errors.js';
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

const seedGuidebook = (
  projectId: string,
  overrides: Partial<{
    name: string;
    description: string | null;
    pinned: 0 | 1;
    rank: number | null;
  }> = {},
): string => {
  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO guidebooks (id, project_id, name, description, pinned, rank, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    projectId,
    overrides.name ?? 'Guidebook',
    overrides.description ?? null,
    overrides.pinned ?? 0,
    overrides.rank ?? null,
    now,
    now,
  );
  return id;
};

describe('rowToGuidebook', () => {
  test('maps DB row shape to domain shape', () => {
    const project = createProject(db, { name: 'P' });
    const id = seedGuidebook(project.id, {
      name: 'Intro',
      description: 'getting started',
      pinned: 1,
      rank: 2.5,
    });
    const gb = getGuidebookById(db, id)!;
    expect(gb).toMatchObject({
      id,
      projectId: project.id,
      name: 'Intro',
      description: 'getting started',
      pinned: true,
      rank: 2.5,
    });
    expect(gb.createdAt).toBeInstanceOf(Date);
    expect(gb.updatedAt).toBeInstanceOf(Date);
  });

  test('null description and null rank become defaults', () => {
    const project = createProject(db, { name: 'P' });
    const id = seedGuidebook(project.id, {});
    const gb = getGuidebookById(db, id)!;
    expect(gb.description).toBeUndefined();
    expect(gb.pinned).toBe(false);
    expect(gb.rank).toBe(0);
  });
});

describe('listGuidebooksByProject', () => {
  test('returns only this project, ordered by rank then name', () => {
    const a = createProject(db, { name: 'Alpha', slug: 'a' });
    const b = createProject(db, { name: 'Beta', slug: 'b' });
    seedGuidebook(a.id, { name: 'A2', rank: 2 });
    seedGuidebook(a.id, { name: 'A1', rank: 1 });
    seedGuidebook(a.id, { name: 'A-noRank' });            // null rank sorts first
    seedGuidebook(b.id, { name: 'B-only' });

    const list = listGuidebooksByProject(db, 'a');
    expect(list.map((g) => g.name)).toEqual(['A-noRank', 'A1', 'A2']);
  });

  test('404 when the project slug is unknown', () => {
    try {
      listGuidebooksByProject(db, 'nope');
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(404);
    }
  });
});

describe('listGuidebooks (global)', () => {
  test('returns every row across projects', () => {
    const a = createProject(db, { name: 'A', slug: 'a' });
    const b = createProject(db, { name: 'B', slug: 'b' });
    seedGuidebook(a.id);
    seedGuidebook(b.id);
    expect(listGuidebooks(db)).toHaveLength(2);
  });
});

describe('getGuidebookById', () => {
  test('returns undefined for an unknown id', () => {
    expect(getGuidebookById(db, 'missing')).toBeUndefined();
  });
});

describe('createGuidebook', () => {
  test('appends with rank = max+1; logs CREATED activity', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const a = createGuidebook(db, { projectSlug: 'p', name: 'First' });
    const b = createGuidebook(db, { projectSlug: 'p', name: 'Second' });
    expect(a.rank).toBe(1);
    expect(b.rank).toBe(2);
    expect(b.pinned).toBe(false);
    const activity = db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE entity_type = 'guidebook' AND verb = 'CREATED'`,
      )
      .get();
    expect(activity?.c).toBe(2);
  });

  test('honours pinned + description; trims whitespace', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, {
      projectSlug: 'p',
      name: '  Welcome  ',
      description: '  intro doc set  ',
      pinned: true,
    });
    expect(gb.name).toBe('Welcome');
    expect(gb.description).toBe('intro doc set');
    expect(gb.pinned).toBe(true);
  });

  test('rejects empty name', () => {
    createProject(db, { name: 'P', slug: 'p' });
    try {
      createGuidebook(db, { projectSlug: 'p', name: '   ' });
      expect.unreachable('should throw');
    } catch (err) {
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).body).toMatchObject({ fields: { name: 'required' } });
    }
  });

  test('rejects unknown project slug', () => {
    expect(() => createGuidebook(db, { projectSlug: 'nope', name: 'x' })).toThrow(
      /not_found/,
    );
  });
});

describe('updateGuidebook', () => {
  test('partial patch — name only', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'Old' });
    const updated = updateGuidebook(db, gb.id, { name: 'New' });
    expect(updated.name).toBe('New');
    expect(updated.description).toBeUndefined();
  });

  test('null description clears the field', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, {
      projectSlug: 'p',
      name: 'g',
      description: 'set',
    });
    const updated = updateGuidebook(db, gb.id, { description: null });
    expect(updated.description).toBeUndefined();
  });

  test('no-op when nothing changes (no EDITED activity)', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'Same' });
    const before = (db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE verb = 'EDITED'`,
      )
      .get())!.c;
    updateGuidebook(db, gb.id, { name: 'Same' });
    const after = (db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE verb = 'EDITED'`,
      )
      .get())!.c;
    expect(after).toBe(before);
  });

  test('404 for unknown id', () => {
    expect(() => updateGuidebook(db, 'missing', { name: 'x' })).toThrow(/not_found/);
  });
});

describe('reorderGuidebooks', () => {
  test('re-stamps rank by position', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const a = createGuidebook(db, { projectSlug: 'p', name: 'A' });
    const b = createGuidebook(db, { projectSlug: 'p', name: 'B' });
    const c = createGuidebook(db, { projectSlug: 'p', name: 'C' });
    const reordered = reorderGuidebooks(db, 'p', [c.id, a.id, b.id]);
    expect(reordered.map((g) => g.name)).toEqual(['C', 'A', 'B']);
  });

  test('rejects missing ids', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const a = createGuidebook(db, { projectSlug: 'p', name: 'A' });
    createGuidebook(db, { projectSlug: 'p', name: 'B' });
    expect(() => reorderGuidebooks(db, 'p', [a.id])).toThrow(/validation/);
  });

  test('rejects duplicates', () => {
    createProject(db, { name: 'P', slug: 'p' });
    const a = createGuidebook(db, { projectSlug: 'p', name: 'A' });
    const b = createGuidebook(db, { projectSlug: 'p', name: 'B' });
    expect(() => reorderGuidebooks(db, 'p', [a.id, a.id])).toThrow(/validation/);
    expect(() => reorderGuidebooks(db, 'p', [b.id, b.id])).toThrow(/validation/);
  });
});

describe('deleteGuidebook', () => {
  test('removes the row + cascade-deletes entries', () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });

    // Seed two entries directly (so this test doesn't depend on the
    // entry service surface).
    const seedEntry = (i: number) => {
      const id = `entry-${i}`;
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO guidebook_entries
         (id, guidebook_id, doc_id, reference_id, name, description, tags, rank, created_at, updated_at)
         VALUES (?, ?, ?, NULL, 'name', NULL, NULL, ?, ?, ?)`,
      ).run(id, gb.id, `doc-${i}`, i, now, now);
    };
    // Need a real doc so the FK is satisfied.
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO docs (id, project_id, title, file_path, body_preview, word_count,
                         revision, pinned, source_kind, source_uploaded_at, created_at, updated_at)
       VALUES ('doc-1', ?, 'd', 'p/docs/d1.md', '', 0, 1, 0, 'inline', ?, ?, ?)`,
    ).run(project.id, now, now, now);
    db.prepare(
      `INSERT INTO docs (id, project_id, title, file_path, body_preview, word_count,
                         revision, pinned, source_kind, source_uploaded_at, created_at, updated_at)
       VALUES ('doc-2', ?, 'd', 'p/docs/d2.md', '', 0, 1, 0, 'inline', ?, ?, ?)`,
    ).run(project.id, now, now, now);
    seedEntry(1);
    seedEntry(2);

    deleteGuidebook(db, gb.id);
    expect(getGuidebookById(db, gb.id)).toBeUndefined();
    const remaining = (db
      .prepare<[string], { c: number }>(
        'SELECT COUNT(*) AS c FROM guidebook_entries WHERE guidebook_id = ?',
      )
      .get(gb.id))!.c;
    expect(remaining).toBe(0);

    // Source docs are NOT touched.
    const docCount = (db
      .prepare<[], { c: number }>('SELECT COUNT(*) AS c FROM docs')
      .get())!.c;
    expect(docCount).toBe(2);

    // Activity has CREATED + DELETED for the guidebook.
    const verbs = db
      .prepare<[], { verb: string }>(
        `SELECT verb FROM activity WHERE entity_type = 'guidebook' ORDER BY occurred_at`,
      )
      .all()
      .map((r) => r.verb);
    expect(verbs).toContain('DELETED');
  });

  test('404 for unknown id', () => {
    expect(() => deleteGuidebook(db, 'missing')).toThrow(/not_found/);
  });
});
