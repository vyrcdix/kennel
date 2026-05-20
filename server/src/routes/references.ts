import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { createReference } from '../services/reference.js';

export const referencesRouter = (db: DB): Router => {
  const r = Router();
  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      res.status(201).json(
        createReference(db, {
          projectSlug: body.projectSlug,
          type: body.type,
          label: body.label,
          url: body.url,
          notes: body.notes,
          description: body.description,
        }, 'craig'),
      );
    }),
  );
  return r;
};
