import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { HttpError } from '../errors.js';
import { createProject } from './project.js';
import { createItem, transitionItem } from './item.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };
let projectId: string;

beforeEach(() => {
  content = useTempContent();
  db = makeTestDb();
  projectId = createProject(db, { name: 'Test' }).id;
});
afterEach(() => {
  db.close();
  content.cleanup();
});

describe('createItem', () => {
  test('captures an item into inbox', () => {
    const it = createItem(db, { projectId, kind: 'idea', title: 'hello' });
    expect(it.state).toBe('inbox');
    expect(it.title).toBe('hello');
    const activity = db.prepare('SELECT count(*) as c FROM activity').get() as { c: number };
    expect(activity.c).toBeGreaterThan(1); // project create + item capture
  });

  test('400 on missing fields', () => {
    expect(() => createItem(db, { projectId, kind: 'idea', title: '' })).toThrow(HttpError);
  });

  test('404 on unknown project', () => {
    try {
      createItem(db, { projectId: 'nope', kind: 'idea', title: 'x' });
      expect.unreachable();
    } catch (err) {
      expect((err as HttpError).status).toBe(404);
    }
  });
});

describe('transitionItem', () => {
  test('moves state and sets done_at on done', () => {
    const it = createItem(db, { projectId, kind: 'action', title: 'do thing' });
    const active = transitionItem(db, it.id, 'active');
    expect(active.state).toBe('active');
    const done = transitionItem(db, it.id, 'done');
    expect(done.state).toBe('done');
    expect(done.doneAt).toBeInstanceOf(Date);
  });

  test('no-op when state unchanged (no extra activity)', () => {
    const it = createItem(db, { projectId, kind: 'idea', title: 't' });
    const before = (db.prepare('SELECT count(*) as c FROM activity').get() as { c: number }).c;
    transitionItem(db, it.id, 'inbox');
    const after = (db.prepare('SELECT count(*) as c FROM activity').get() as { c: number }).c;
    expect(after).toBe(before);
  });
});
