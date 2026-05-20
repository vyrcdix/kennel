// Field notes: per-project sense-making sibling to Runbook. Same shape +
// atomic file+DB writes; different sections.

import { join } from 'node:path';
import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import {
  commitDocWrite,
  contentRoot,
  ensureProjectDirs,
  writeDocAtomic,
} from '../content.js';
import { notFound } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import type { FieldNotes, FieldNotesMode } from '../../../shared/types.js';
import { validationError } from '../errors.js';

type FieldNotesRow = {
  id: string;
  project_id: string;
  mode: string;
  premise: string | null;
  what_i_know: string | null;
  open_questions: string | null;
  sources: string | null;
  crystallizations: string | null;
  revision: number;
  created_at: string;
  updated_at: string;
};

export const rowToFieldNotes = (r: FieldNotesRow): FieldNotes => ({
  id: r.id,
  projectId: r.project_id,
  mode: r.mode === 'managed' ? 'managed' : 'scratchpad',
  premise: r.premise ?? undefined,
  whatIKnow: r.what_i_know ?? undefined,
  openQuestions: r.open_questions ?? undefined,
  sources: r.sources ?? undefined,
  crystallizations: r.crystallizations ?? undefined,
  revision: r.revision,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listFieldNotes = (db: DB): FieldNotes[] =>
  db
    .prepare<[], FieldNotesRow>('SELECT * FROM field_notes')
    .all()
    .map(rowToFieldNotes);

export const getFieldNotesByProject = (db: DB, projectId: string): FieldNotes | undefined => {
  const row = db
    .prepare<[string], FieldNotesRow>('SELECT * FROM field_notes WHERE project_id = ?')
    .get(projectId);
  return row ? rowToFieldNotes(row) : undefined;
};

export type FieldNotesSections = Partial<{
  premise: string | null;
  whatIKnow: string | null;
  openQuestions: string | null;
  sources: string | null;
  crystallizations: string | null;
}>;

const composeMarkdown = (n: FieldNotes): string =>
  [
    `# Field notes`,
    ``,
    `## Premise`,
    n.premise ?? '',
    ``,
    `## What I know`,
    n.whatIKnow ?? '',
    ``,
    `## Open questions`,
    n.openQuestions ?? '',
    ``,
    `## Sources`,
    n.sources ?? '',
    ``,
    `## Crystallizations`,
    n.crystallizations ?? '',
    ``,
  ].join('\n');

export const upsertFieldNotes = (
  db: DB,
  projectSlug: string,
  sections: FieldNotesSections,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): FieldNotes => {
  const project = db
    .prepare<[string], { id: string; slug: string }>(
      'SELECT id, slug FROM projects WHERE slug = ?',
    )
    .get(projectSlug);
  if (!project) throw notFound('project', projectSlug);

  ensureProjectDirs(project.slug);
  const filePath = `${project.slug}/field-notes.md`;
  const abs = join(contentRoot(), filePath);

  const existing = getFieldNotesByProject(db, project.id);
  const now = nowIso();
  const merged: FieldNotes = {
    id: existing?.id ?? newId(),
    projectId: project.id,
    mode: existing?.mode ?? 'scratchpad',
    premise: sections.premise !== undefined
      ? (sections.premise ?? undefined)
      : existing?.premise,
    whatIKnow: sections.whatIKnow !== undefined
      ? (sections.whatIKnow ?? undefined)
      : existing?.whatIKnow,
    openQuestions: sections.openQuestions !== undefined
      ? (sections.openQuestions ?? undefined)
      : existing?.openQuestions,
    sources: sections.sources !== undefined
      ? (sections.sources ?? undefined)
      : existing?.sources,
    crystallizations: sections.crystallizations !== undefined
      ? (sections.crystallizations ?? undefined)
      : existing?.crystallizations,
    revision: existing ? existing.revision + 1 : 1,
    createdAt: existing?.createdAt ?? new Date(now),
    updatedAt: new Date(now),
  };

  const fsHandle = writeDocAtomic(abs, composeMarkdown(merged));
  try {
    const tx = db.transaction(() => {
      if (existing) {
        db.prepare(
          `UPDATE field_notes
           SET premise = ?, what_i_know = ?, open_questions = ?, sources = ?,
               crystallizations = ?, revision = ?, updated_at = ?
           WHERE project_id = ?`,
        ).run(
          merged.premise ?? null,
          merged.whatIKnow ?? null,
          merged.openQuestions ?? null,
          merged.sources ?? null,
          merged.crystallizations ?? null,
          merged.revision,
          now,
          project.id,
        );
      } else {
        db.prepare(
          `INSERT INTO field_notes
           (id, project_id, premise, what_i_know, open_questions, sources,
            crystallizations, revision, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
        ).run(
          merged.id,
          project.id,
          merged.premise ?? null,
          merged.whatIKnow ?? null,
          merged.openQuestions ?? null,
          merged.sources ?? null,
          merged.crystallizations ?? null,
          now,
          now,
        );
      }
      logActivity(db, {
        projectId: project.id,
        entityType: 'runbook', // closest entity type; runbook serves the
                               // operational sibling — field-notes uses the
                               // same activity surfacing for now.
        entityId: merged.id,
        verb: existing ? 'EDITED' : 'CREATED',
        target: 'field notes',
        payload: existing
          ? `rev ${existing.revision} → rev ${merged.revision}`
          : undefined,
        actor,
        occurredAt: now,
      });
    });
    tx();
    commitDocWrite(abs);
  } catch (err) {
    fsHandle.rollback();
    throw err;
  }

  return merged;
};

/** Flip a thread's Field Notes between scratchpad and managed mode.
 *  Pure view switch — no data migration; blobs and entities both
 *  persist, only one representation renders per mode. Creates the
 *  field_notes row if the thread has none yet. */
export const setFieldNotesMode = (
  db: DB,
  projectSlug: string,
  mode: FieldNotesMode,
): FieldNotes => {
  if (mode !== 'scratchpad' && mode !== 'managed') {
    throw validationError({ mode: 'invalid' });
  }
  const project = db
    .prepare<[string], { id: string }>('SELECT id FROM projects WHERE slug = ?')
    .get(projectSlug);
  if (!project) throw notFound('project', projectSlug);

  const existing = getFieldNotesByProject(db, project.id);
  const now = nowIso();
  if (existing) {
    db.prepare(
      'UPDATE field_notes SET mode = ?, updated_at = ? WHERE project_id = ?',
    ).run(mode, now, project.id);
  } else {
    db.prepare(
      `INSERT INTO field_notes (id, project_id, mode, revision, created_at, updated_at)
       VALUES (?, ?, ?, 1, ?, ?)`,
    ).run(newId(), project.id, mode, now, now);
  }
  return getFieldNotesByProject(db, project.id)!;
};
