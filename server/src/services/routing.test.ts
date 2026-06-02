// Slice 1: schema + types + read selectors. The classifier and
// write path land in slice 2; this file covers the row shape, the
// row mapper, and the two read selectors.

import { describe, expect, test } from 'vitest';
import type { DB } from '../db.js';
import { makeTestDb } from '../test-helpers.js';
import { createProject } from './project.js';
import {
  countRoutingsToday,
  getRoutingById,
  listRecentRoutingsByProject,
} from './routing.js';

/** Insert a routing row by hand — slice 1 has no createRouting
 *  service. The classifier-driven write path arrives in slice 2;
 *  these tests just need the shape to round-trip. */
const insertRoutingRow = (
  db: DB,
  args: {
    id: string;
    projectId: string;
    createdAt?: string;
    sourceKind?: 'paste' | 'email';
    sourceMeta?: string | null;
    rawContent?: string;
    hint?: string | null;
    classifierAction?: string;
    classifierConfidence?: number | null;
    classifierExplanation?: string | null;
    overAiBudget?: number;
    artefactKind?: string;
    artefactId?: string;
    rejectedAt?: string | null;
  },
): void => {
  db.prepare(
    `INSERT INTO routings
       (id, project_id, source_kind, source_meta, raw_content, hint,
        classifier_action, classifier_confidence, classifier_explanation,
        over_ai_budget, artefact_kind, artefact_id, rejected_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    args.id,
    args.projectId,
    args.sourceKind ?? 'paste',
    args.sourceMeta ?? null,
    args.rawContent ?? 'body',
    args.hint ?? null,
    args.classifierAction ?? 'bench',
    args.classifierConfidence ?? null,
    args.classifierExplanation ?? null,
    args.overAiBudget ?? 0,
    args.artefactKind ?? 'item',
    args.artefactId ?? 'a-1',
    args.rejectedAt ?? null,
    args.createdAt ?? new Date().toISOString(),
  );
};

describe('rowToRouting', () => {
  test('round-trips a paste routing', () => {
    const db = makeTestDb();
    const project = createProject(db, { name: 'P', slug: 'p' });
    insertRoutingRow(db, {
      id: 'r-1',
      projectId: project.id,
      rawContent: 'hello world',
      classifierAction: 'doc',
      classifierConfidence: 0.91,
      classifierExplanation: 'long-form prose with structure',
      artefactKind: 'doc',
      artefactId: 'd-x',
    });
    const r = getRoutingById(db, 'r-1');
    expect(r).toBeDefined();
    expect(r!.sourceKind).toBe('paste');
    expect(r!.rawContent).toBe('hello world');
    expect(r!.hint).toBeUndefined();
    expect(r!.classifier.action).toBe('doc');
    expect(r!.classifier.confidence).toBe(0.91);
    expect(r!.classifier.explanation).toBe('long-form prose with structure');
    expect(r!.classifier.overAiBudget).toBe(false);
    expect(r!.artefact).toEqual({ kind: 'doc', id: 'd-x' });
    expect(r!.rejectedAt).toBeUndefined();
  });

  test('round-trips an email routing with sender', () => {
    const db = makeTestDb();
    const project = createProject(db, { name: 'P', slug: 'p' });
    insertRoutingRow(db, {
      id: 'r-2',
      projectId: project.id,
      sourceKind: 'email',
      sourceMeta: JSON.stringify({ sender: 'craig@example.com' }),
      hint: 'guidebook',
      classifierAction: 'guidebook',
      overAiBudget: 1,
      artefactKind: 'guidebook_entry',
      artefactId: 'ge-1',
    });
    const r = getRoutingById(db, 'r-2')!;
    expect(r.sourceKind).toBe('email');
    expect(r.sourceMeta?.sender).toBe('craig@example.com');
    expect(r.hint).toBe('guidebook');
    expect(r.classifier.overAiBudget).toBe(true);
    expect(r.classifier.confidence).toBeUndefined();
  });

  test('survives corrupt source_meta JSON', () => {
    const db = makeTestDb();
    const project = createProject(db, { name: 'P', slug: 'p' });
    insertRoutingRow(db, {
      id: 'r-3',
      projectId: project.id,
      sourceKind: 'email',
      sourceMeta: 'not-json',
    });
    expect(getRoutingById(db, 'r-3')!.sourceMeta).toBeUndefined();
  });
});

describe('listRecentRoutingsByProject', () => {
  test('returns only this thread, newest first, within the window', () => {
    const db = makeTestDb();
    const a = createProject(db, { name: 'A', slug: 'a' });
    const b = createProject(db, { name: 'B', slug: 'b' });
    const now = Date.now();
    const iso = (msAgo: number) => new Date(now - msAgo).toISOString();
    insertRoutingRow(db, { id: 'r-old', projectId: a.id, createdAt: iso(10 * 86400_000) });
    insertRoutingRow(db, { id: 'r-mid', projectId: a.id, createdAt: iso(3 * 86400_000) });
    insertRoutingRow(db, { id: 'r-new', projectId: a.id, createdAt: iso(60_000) });
    insertRoutingRow(db, { id: 'r-other', projectId: b.id, createdAt: iso(60_000) });

    const recent = listRecentRoutingsByProject(db, a.id, 7);
    expect(recent.map((r) => r.id)).toEqual(['r-new', 'r-mid']);
  });
});

describe('countRoutingsToday', () => {
  test('counts only entries since the start of the UTC day', () => {
    const db = makeTestDb();
    const p = createProject(db, { name: 'P', slug: 'p' });
    const yesterday = new Date();
    yesterday.setUTCHours(0, 0, 0, 0);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    insertRoutingRow(db, {
      id: 'r-y',
      projectId: p.id,
      createdAt: yesterday.toISOString(),
    });
    insertRoutingRow(db, { id: 'r-t', projectId: p.id });
    expect(countRoutingsToday(db)).toBe(1);
  });
});
