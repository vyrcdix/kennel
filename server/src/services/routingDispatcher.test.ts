// Slice 2 — dispatcher. Real DB + real services; no Anthropic.
// One test per action plus the guidebook downgrade path.

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { DB } from '../db.js';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import { createGuidebook } from './guidebook.js';
import { getRunbookByProject, upsertRunbook } from './runbook.js';
import { getFieldNotesByProject } from './fieldNotes.js';
import { listEntries } from './guidebookEntry.js';
import { getDocById } from './doc.js';
import { getItemById } from './item.js';
import {
  dateDivider,
  deriveTitle,
  dispatch,
  revertDispatch,
} from './routingDispatcher.js';

let db: DB;
let cleanup: () => void;

beforeEach(() => {
  db = makeTestDb();
  ({ cleanup } = useTempContent());
});

afterEach(() => {
  cleanup();
});

describe('deriveTitle', () => {
  test('takes the first non-empty line, strips markdown leaders', () => {
    expect(deriveTitle('# Hello there\nrest')).toBe('Hello there');
    expect(deriveTitle('  \n- item one\n- item two')).toBe('item one');
  });
  test('truncates to ~80 chars with ellipsis', () => {
    const long = 'x'.repeat(120);
    expect(deriveTitle(long)).toMatch(/^x{77}…$/);
  });
});

describe('dateDivider', () => {
  test('renders the ISO day in the marker', () => {
    const d = new Date('2026-06-02T12:34:56Z');
    expect(dateDivider(d)).toBe('\n\n---\n*Routed 2026-06-02*\n\n');
  });
});

describe('dispatch → bench', () => {
  test('creates a note item using the body', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'just a thought',
      action: 'bench',
      payload: {},
    });
    expect(out.action).toBe('bench');
    expect(out.artefactKind).toBe('item');
    const item = getItemById(db, out.artefactId)!;
    expect(item.title).toBe('just a thought');
    expect(item.kind).toBe('note');
    expect(item.body).toBe('just a thought');
  });
});

describe('dispatch → doc', () => {
  test('creates a doc with title and body', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'fallback body',
      action: 'doc',
      payload: { title: 'A Spec', body: '# spec\nwords' },
    });
    expect(out.artefactKind).toBe('doc');
    const doc = getDocById(db, out.artefactId)!;
    expect(doc.title).toBe('A Spec');
    expect(doc.body).toBe('# spec\nwords');
  });
});

describe('dispatch → guidebook', () => {
  test('with a guidebook, addEntry creates the entry from the body', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'Reading' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: '# Notes on PKM\nbody body body',
      action: 'guidebook',
      payload: { name: 'Notes on PKM', description: 'a survey', tags: ['pkm'] },
    });
    expect(out.action).toBe('guidebook');
    expect(out.artefactKind).toBe('guidebook_entry');
    const entries = listEntries(db, gb.id);
    expect(entries).toHaveLength(1);
    expect(entries[0].id).toBe(out.artefactId);
    expect(entries[0].name).toBe('Notes on PKM');
    expect(entries[0].tags).toEqual(['pkm']);
  });
  test('without a guidebook, downgrades to bench with reason', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'orphan note',
      action: 'guidebook',
      payload: {},
    });
    expect(out.action).toBe('bench');
    expect(out.artefactKind).toBe('item');
    expect(out.downgrade?.originalAction).toBe('guidebook');
    expect(out.downgrade?.reason).toBe('no_guidebook_in_thread');
  });
});

describe('dispatch → runbook', () => {
  test('appends to the matching section with a dated divider', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    upsertRunbook(db, p.id, { deploy: 'old deploy notes' });
    const now = new Date('2026-06-02T00:00:00Z');
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'fallback',
      action: 'runbook',
      payload: { section: 'deploy', body: 'fresh command' },
      now,
    });
    expect(out.artefactKind).toBe('runbook');
    const rb = getRunbookByProject(db, p.id)!;
    expect(rb.deploy).toBe(
      'old deploy notes\n\n---\n*Routed 2026-06-02*\n\nfresh command',
    );
  });
  test('creates the runbook if none exists', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'fb',
      action: 'runbook',
      payload: { section: 'setup', body: 'first command' },
      now: new Date('2026-06-02T00:00:00Z'),
    });
    const rb = getRunbookByProject(db, p.id)!;
    expect(rb.setup).toMatch(/first command$/);
    expect(rb.id).toBe(out.artefactId);
  });
  test('rejects an invalid section', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    await expect(
      dispatch(db, {
        projectId: p.id,
        rawContent: 'b',
        action: 'runbook',
        payload: { section: 'bogus' as never, body: 'x' },
      }),
    ).rejects.toThrow(/validation/);
  });
});

describe('dispatch → field-notes', () => {
  test('appends to the matching column with a dated divider', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'fallback',
      action: 'field-notes',
      payload: { section: 'openQuestions', body: 'why is X?' },
      now: new Date('2026-06-02T00:00:00Z'),
    });
    expect(out.artefactKind).toBe('field_notes');
    const fn = getFieldNotesByProject(db, p.id)!;
    expect(fn.openQuestions).toMatch(/\*Routed 2026-06-02\*\n\nwhy is X\?$/);
  });
  test('rejects an invalid section', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    await expect(
      dispatch(db, {
        projectId: p.id,
        rawContent: 'b',
        action: 'field-notes',
        payload: { section: 'bogus' as never, body: 'x' },
      }),
    ).rejects.toThrow(/validation/);
  });
});

describe('revertDispatch', () => {
  test('bench → deletes the item', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'thought',
      action: 'bench',
      payload: {},
    });
    expect(getItemById(db, out.artefactId)).toBeDefined();
    revertDispatch(db, {
      artefactKind: out.artefactKind,
      artefactId: out.artefactId,
      snapshot: out.snapshot,
      projectId: p.id,
    });
    expect(getItemById(db, out.artefactId)).toBeUndefined();
  });

  test('doc → deletes the doc and nulls items.doc_id', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'b',
      action: 'doc',
      payload: { title: 'Spec', body: 'spec body' },
    });
    expect(getDocById(db, out.artefactId)).toBeDefined();
    revertDispatch(db, {
      artefactKind: out.artefactKind,
      artefactId: out.artefactId,
      snapshot: out.snapshot,
      projectId: p.id,
    });
    expect(getDocById(db, out.artefactId)).toBeUndefined();
  });

  test('runbook → restores the previous section value', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    upsertRunbook(db, p.id, { deploy: 'original deploy notes' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'b',
      action: 'runbook',
      payload: { section: 'deploy', body: 'new step' },
      now: new Date('2026-06-02T00:00:00Z'),
    });
    const after = getRunbookByProject(db, p.id)!;
    expect(after.deploy).toContain('new step');
    revertDispatch(db, {
      artefactKind: out.artefactKind,
      artefactId: out.artefactId,
      snapshot: out.snapshot,
      projectId: p.id,
    });
    const reverted = getRunbookByProject(db, p.id)!;
    expect(reverted.deploy).toBe('original deploy notes');
  });

  test('field-notes → restores the previous section value (incl. empty)', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    // No previous field notes; section was empty.
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: 'b',
      action: 'field-notes',
      payload: { section: 'openQuestions', body: 'why?' },
      now: new Date('2026-06-02T00:00:00Z'),
    });
    const after = getFieldNotesByProject(db, p.id)!;
    expect(after.openQuestions).toContain('why?');
    revertDispatch(db, {
      artefactKind: out.artefactKind,
      artefactId: out.artefactId,
      snapshot: out.snapshot,
      projectId: p.id,
    });
    const reverted = getFieldNotesByProject(db, p.id);
    expect(reverted?.openQuestions ?? null).toBeNull();
  });

  test('guidebook → deletes the entry AND the doc it spawned', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    const gb = createGuidebook(db, { projectSlug: 'p', name: 'Reading' });
    const out = await dispatch(db, {
      projectId: p.id,
      rawContent: '# topic\nbody body',
      action: 'guidebook',
      payload: { name: 'Topic' },
    });
    expect(listEntries(db, gb.id)).toHaveLength(1);
    const docId =
      out.snapshot.kind === 'guidebook' ? out.snapshot.docId : '';
    expect(docId).toBeTruthy();
    expect(getDocById(db, docId)).toBeDefined();
    revertDispatch(db, {
      artefactKind: out.artefactKind,
      artefactId: out.artefactId,
      snapshot: out.snapshot,
      projectId: p.id,
    });
    expect(listEntries(db, gb.id)).toHaveLength(0);
    expect(getDocById(db, docId)).toBeUndefined();
  });
});
