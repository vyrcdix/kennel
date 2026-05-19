import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import { getProjectBySlug } from '../services/project.js';
import { getRunbookByProject, updateRunbookUrl } from '../services/runbook.js';

export const runbooksRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/projects/:slug/runbook',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const rb = getRunbookByProject(db, project.id);
      if (!rb) throw notFound('runbook', req.params.slug);
      res.json(rb);
    }),
  );

  r.patch(
    '/projects/:slug/runbook',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const url = req.body?.url;
      if (typeof url !== 'string') throw validationError({ url: 'required' });
      res.json(updateRunbookUrl(db, project.id, url));
    }),
  );

  return r;
};
