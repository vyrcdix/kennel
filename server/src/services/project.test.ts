import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { HttpError } from '../errors.js';
import {
  createProject,
  dismissNextSteps,
  getProjectBySlug,
  listProjects,
  togglePin,
} from './project.js';
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

describe('createProject', () => {
  test('happy path', () => {
    const p = createProject(db, { name: 'Smoke Test', description: 'made in a test' });
    expect(p.slug).toBe('smoke-test');
    expect(p.status).toBe('active');
    expect(p.pinned).toBe(false);
    expect(listProjects(db)).toHaveLength(1);
  });

  test('honours explicit slug + color + pinned', () => {
    const p = createProject(db, {
      name: 'Custom Slug',
      slug: 'custom-x',
      color: 'moss',
      pinned: true,
    });
    expect(p.slug).toBe('custom-x');
    expect(p.color).toBe('moss');
    expect(p.pinned).toBe(true);
  });

  test('400 validation_error on empty name', () => {
    try {
      createProject(db, { name: '' });
      expect.unreachable('should throw');
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(400);
      expect((err as HttpError).body).toMatchObject({
        error: 'validation_error',
        fields: { name: 'required' },
      });
    }
  });

  test('400 on bad slug format', () => {
    try {
      createProject(db, { name: 'X', slug: 'NOT VALID' });
      expect.unreachable('should throw');
    } catch (err) {
      expect((err as HttpError).body).toMatchObject({
        error: 'validation_error',
        fields: { slug: 'format_invalid' },
      });
    }
  });

  test('409 slug_conflict on collision', () => {
    createProject(db, { name: 'First' });
    try {
      createProject(db, { name: 'Second', slug: 'first' });
      expect.unreachable('should throw');
    } catch (err) {
      expect((err as HttpError).status).toBe(409);
      expect((err as HttpError).body.error).toBe('slug_conflict');
    }
  });
});

describe('getProjectBySlug', () => {
  test('returns the row', () => {
    createProject(db, { name: 'Lookup' });
    expect(getProjectBySlug(db, 'lookup')?.name).toBe('Lookup');
  });
  test('undefined on miss', () => {
    expect(getProjectBySlug(db, 'nope')).toBeUndefined();
  });
});

describe('togglePin / dismissNextSteps', () => {
  test('togglePin flips the flag', () => {
    const p = createProject(db, { name: 'T' });
    expect(togglePin(db, p.id).pinned).toBe(true);
    expect(togglePin(db, p.id).pinned).toBe(false);
  });
  test('dismissNextSteps is idempotent', () => {
    const p = createProject(db, { name: 'T' });
    const a = dismissNextSteps(db, p.id);
    const b = dismissNextSteps(db, p.id);
    expect(a.nextStepsDismissed).toBe(true);
    expect(b.nextStepsDismissed).toBe(true);
  });
});
