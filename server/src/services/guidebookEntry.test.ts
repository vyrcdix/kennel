import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import { createReference } from './reference.js';
import { createGuidebook } from './guidebook.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import { ensureProjectDirs } from '../content.js';
import {
  addEntry,
  getEntryById,
  listEntries,
  removeEntry,
  reorderEntries,
  updateEntry,
} from './guidebookEntry.js';
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

const seedDoc = (projectId: string, projectSlug: string, filename = 'a.md'): string => {
  ensureProjectDirs(projectSlug);
  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO docs (id, project_id, title, file_path, body_preview, word_count,
                       revision, pinned, source_kind, source_uploaded_at,
                       created_at, updated_at)
     VALUES (?, ?, 'Doc', ?, '', 0, 1, 0, 'inline', ?, ?, ?)`,
  ).run(id, projectId, `${projectSlug}/docs/${filename}`, now, now, now);
  return id;
};

const seedGuidebook = (projectId: string, rank: number | null = null): string => {
  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO guidebooks (id, project_id, name, pinned, rank, created_at, updated_at)
     VALUES (?, ?, 'Guidebook', 0, ?, ?, ?)`,
  ).run(id, projectId, rank, now, now);
  return id;
};

const seedEntry = (
  guidebookId: string,
  source: { docId?: string; referenceId?: string },
  overrides: Partial<{
    name: string;
    description: string | null;
    tags: string | null;
    rank: number | null;
  }> = {},
): string => {
  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO guidebook_entries
     (id, guidebook_id, doc_id, reference_id, name, description, tags, rank, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    guidebookId,
    source.docId ?? null,
    source.referenceId ?? null,
    overrides.name ?? 'Entry',
    overrides.description ?? null,
    overrides.tags ?? null,
    overrides.rank ?? null,
    now,
    now,
  );
  return id;
};

describe('rowToEntry — source variants', () => {
  test('doc source becomes a doc-kind discriminant', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug);
    const gb = seedGuidebook(project.id);
    const id = seedEntry(gb, { docId }, { name: 'Spec' });
    const entry = getEntryById(db, id)!;
    expect(entry.source).toEqual({ kind: 'doc', docId });
    expect(entry.name).toBe('Spec');
    expect(entry.tags).toEqual([]);
  });

  test('reference source becomes a reference-kind discriminant', () => {
    const project = createProject(db, { name: 'P' });
    const ref = createReference(db, {
      projectSlug: project.slug,
      label: 'link',
      url: 'https://example.com',
    });
    const gb = seedGuidebook(project.id);
    const id = seedEntry(gb, { referenceId: ref.id });
    const entry = getEntryById(db, id)!;
    expect(entry.source).toEqual({ kind: 'reference', referenceId: ref.id });
  });
});

describe('tags JSON column', () => {
  test('parses a string array', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug);
    const gb = seedGuidebook(project.id);
    const id = seedEntry(
      gb,
      { docId },
      { tags: JSON.stringify(['design', 'v1']) },
    );
    expect(getEntryById(db, id)!.tags).toEqual(['design', 'v1']);
  });

  test('corrupt JSON degrades to []', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug);
    const gb = seedGuidebook(project.id);
    const id = seedEntry(gb, { docId }, { tags: '{not json' });
    expect(getEntryById(db, id)!.tags).toEqual([]);
  });

  test('non-string members are filtered out', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug);
    const gb = seedGuidebook(project.id);
    const id = seedEntry(gb, { docId }, { tags: JSON.stringify(['ok', 42, null]) });
    expect(getEntryById(db, id)!.tags).toEqual(['ok']);
  });
});

describe('exactly-one-source CHECK constraint', () => {
  test('rejects both doc_id and reference_id set', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug);
    const ref = createReference(db, {
      projectSlug: project.slug,
      label: 'link',
    });
    const gb = seedGuidebook(project.id);
    expect(() =>
      seedEntry(gb, { docId, referenceId: ref.id }),
    ).toThrow(/CHECK constraint/i);
  });

  test('rejects neither doc_id nor reference_id set', () => {
    const project = createProject(db, { name: 'P' });
    const gb = seedGuidebook(project.id);
    expect(() => seedEntry(gb, {})).toThrow(/CHECK constraint/i);
  });
});

describe('listEntries', () => {
  test('returns entries for one guidebook in rank order', () => {
    const project = createProject(db, { name: 'P' });
    const docId = seedDoc(project.id, project.slug, 'a.md');
    const gbA = seedGuidebook(project.id);
    const gbB = seedGuidebook(project.id);
    seedEntry(gbA, { docId }, { name: 'A2', rank: 2 });
    seedEntry(gbA, { docId }, { name: 'A1', rank: 1 });
    seedEntry(gbB, { docId }, { name: 'B-only', rank: 0 });

    const list = listEntries(db, gbA);
    expect(list.map((e) => e.name)).toEqual(['A1', 'A2']);
  });
});

describe('getEntryById', () => {
  test('returns undefined for an unknown id', () => {
    expect(getEntryById(db, 'missing')).toBeUndefined();
  });
});

// ─── CRUD via the public service surface ───────────────────────────
describe('addEntry — existing doc', () => {
  test('attaches and defaults name to the doc title', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, { docId });
    expect(entry.source).toEqual({ kind: 'doc', docId });
    expect(entry.name).toBe('Doc');
    expect(entry.tags).toEqual([]);
    expect(entry.rank).toBe(1);
  });

  test('rejects a doc from another topic', async () => {
    const a = createProject(db, { name: 'A', slug: 'a' });
    createProject(db, { name: 'B', slug: 'b' });
    const aDoc = seedDoc(a.id, a.slug);
    const bGb = createGuidebook(db, { projectSlug: 'b', name: 'g' });
    try {
      await addEntry(db, bGb.id, { docId: aDoc });
      expect.unreachable('should throw');
    } catch (err) {
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).body).toMatchObject({
        fields: { docId: 'wrong_topic' },
      });
    }
  });

  test('404 when doc id is unknown', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    await expect(addEntry(db, gb.id, { docId: 'nope' })).rejects.toThrow(/not_found/);
  });
});

describe('addEntry — existing reference', () => {
  test('attaches and defaults name to the reference label', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const ref = createReference(db, {
      projectSlug: 'p',
      label: 'External thing',
      url: 'https://example.com',
    });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, { referenceId: ref.id });
    expect(entry.source).toEqual({ kind: 'reference', referenceId: ref.id });
    expect(entry.name).toBe('External thing');
  });

  test('cross-topic reference rejected', async () => {
    createProject(db, { name: 'A', slug: 'a' });
    createProject(db, { name: 'B', slug: 'b' });
    const aRef = createReference(db, { projectSlug: 'a', label: 'x' });
    const bGb = createGuidebook(db, { projectSlug: 'b', name: 'g' });
    try {
      await addEntry(db, bGb.id, { referenceId: aRef.id });
      expect.unreachable('should throw');
    } catch (err) {
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).body).toMatchObject({
        fields: { referenceId: 'wrong_topic' },
      });
    }
  });
});

describe('addEntry — upload', () => {
  test('.md upload creates a Doc and attaches', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, {
      upload: {
        filename: 'spec.md',
        kind: 'md',
        body: Buffer.from('# spec'),
      },
      name: 'Spec (override)',
      tags: ['design'],
    });
    expect(entry.source.kind).toBe('doc');
    expect(entry.name).toBe('Spec (override)');
    expect(entry.tags).toEqual(['design']);
    // The Doc is real and carries provenance.
    const docRow = db
      .prepare<[string], any>('SELECT * FROM docs WHERE id = ?')
      .get(entry.source.kind === 'doc' ? entry.source.docId : '');
    expect(docRow.source_kind).toBe('md');
    expect(docRow.source_filename).toBe('spec.md');
  });
});

describe('addEntry — link', () => {
  test('creates a Reference and attaches; default name = label', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, {
      link: { url: 'https://example.com/x', label: 'Useful link' },
    });
    expect(entry.source.kind).toBe('reference');
    expect(entry.name).toBe('Useful link');
    const ref = db
      .prepare<[string], any>('SELECT * FROM refs WHERE id = ?')
      .get(entry.source.kind === 'reference' ? entry.source.referenceId : '');
    expect(ref.url).toBe('https://example.com/x');
  });

  test('label defaults to url when omitted', async () => {
    createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, {
      link: { url: 'https://example.com', label: '' },
    });
    expect(entry.name).toBe('https://example.com');
  });
});

describe('addEntry — tags validation + dedup', () => {
  test('trims, drops blanks, dedups', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, {
      docId,
      tags: [' design ', '', 'design', 'v1'],
    });
    expect(entry.tags).toEqual(['design', 'v1']);
  });

  test('rejects non-string tags', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    await expect(
      addEntry(db, gb.id, { docId, tags: ['ok', 42 as any] }),
    ).rejects.toThrow(/validation/);
  });

  test('rejects > 20 tags', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
    await expect(addEntry(db, gb.id, { docId, tags })).rejects.toThrow(/validation/);
  });
});

describe('updateEntry', () => {
  test('renames + adds tags + bumps activity', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, { docId, name: 'Initial' });
    const updated = updateEntry(db, entry.id, {
      name: 'Renamed',
      tags: ['x'],
    });
    expect(updated.name).toBe('Renamed');
    expect(updated.tags).toEqual(['x']);
    const a = db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE entity_type = 'guidebook_entry' AND verb = 'EDITED'`,
      )
      .get();
    expect(a?.c).toBe(1);
  });

  test('null description clears the field', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, {
      docId,
      description: 'before',
    });
    const updated = updateEntry(db, entry.id, { description: null });
    expect(updated.description).toBeUndefined();
  });

  test('no-op when nothing changes', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, { docId, name: 'same' });
    const before = (db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE entity_type = 'guidebook_entry' AND verb = 'EDITED'`,
      )
      .get())!.c;
    updateEntry(db, entry.id, { name: 'same' });
    const after = (db
      .prepare<[], { c: number }>(
        `SELECT COUNT(*) AS c FROM activity WHERE entity_type = 'guidebook_entry' AND verb = 'EDITED'`,
      )
      .get())!.c;
    expect(after).toBe(before);
  });
});

describe('reorderEntries', () => {
  test('re-stamps rank by position', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const d1 = seedDoc(project.id, project.slug, 'a.md');
    const d2 = seedDoc(project.id, project.slug, 'b.md');
    const d3 = seedDoc(project.id, project.slug, 'c.md');
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const e1 = await addEntry(db, gb.id, { docId: d1, name: 'one' });
    const e2 = await addEntry(db, gb.id, { docId: d2, name: 'two' });
    const e3 = await addEntry(db, gb.id, { docId: d3, name: 'three' });

    const reordered = reorderEntries(db, gb.id, [e3.id, e1.id, e2.id]);
    expect(reordered.map((e) => e.name)).toEqual(['three', 'one', 'two']);
  });

  test('rejects subset / dupes', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const d1 = seedDoc(project.id, project.slug, 'a.md');
    const d2 = seedDoc(project.id, project.slug, 'b.md');
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const e1 = await addEntry(db, gb.id, { docId: d1 });
    await addEntry(db, gb.id, { docId: d2 });
    expect(() => reorderEntries(db, gb.id, [e1.id])).toThrow(/validation/);
    expect(() => reorderEntries(db, gb.id, [e1.id, e1.id])).toThrow(/validation/);
  });
});

describe('removeEntry', () => {
  test('drops the row but never the source', async () => {
    const project = createProject(db, { name: 'P', slug: 'p' });
    const docId = seedDoc(project.id, project.slug);
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'g' });
    const entry = await addEntry(db, gb.id, { docId });
    removeEntry(db, entry.id);
    expect(getEntryById(db, entry.id)).toBeUndefined();
    const doc = (db
      .prepare<[string], { c: number }>('SELECT COUNT(*) AS c FROM docs WHERE id = ?')
      .get(docId))!.c;
    expect(doc).toBe(1);
  });
});
