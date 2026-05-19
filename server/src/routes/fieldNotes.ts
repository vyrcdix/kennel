import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound } from '../errors.js';
import { getFieldNotesByProject, upsertFieldNotes } from '../services/fieldNotes.js';
import { getProjectBySlug } from '../services/project.js';

export const fieldNotesRouter = (db: DB): Router => {
  const r = Router();
  r.get(
    '/projects/:slug/field-notes',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const fn = getFieldNotesByProject(db, project.id);
      res.json(fn ?? null);
    }),
  );
  r.put(
    '/projects/:slug/field-notes',
    asyncHandler(async (req, res) => {
      res.json(upsertFieldNotes(db, req.params.slug, req.body ?? {}));
    }),
  );
  return r;
};
