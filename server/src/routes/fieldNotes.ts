import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  getFieldNotesByProject,
  setFieldNoteSectionSupportsCrystal,
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
  r.patch(
    '/projects/:slug/field-notes/sections/:section/supports-crystal',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const raw = (req.body ?? {}).crystalItemId;
      if (raw !== null && typeof raw !== 'string') {
        throw validationError({ crystalItemId: 'must_be_string_or_null' });
      }
      res.json(
        setFieldNoteSectionSupportsCrystal(
          db,
          project.id,
          req.params.section,
          raw,
        ),
      );
    }),
  );
  return r;
};
