import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  getFieldNotesByProject,
  setFieldNotesMode,
  upsertFieldNotes,
} from '../services/fieldNotes.js';
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
  r.patch(
    '/projects/:slug/field-notes/mode',
    asyncHandler(async (req, res) => {
      const mode = req.body?.mode;
      if (mode !== 'scratchpad' && mode !== 'managed') {
        throw validationError({ mode: 'must_be_scratchpad_or_managed' });
      }
      res.json(setFieldNotesMode(db, req.params.slug, mode));
    }),
  );
  return r;
};
