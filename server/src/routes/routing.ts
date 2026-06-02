// Smart Routing — REST surface. Slice 1 ships the read endpoint
// only; slice 2 lands `POST /api/routing/paste` with the classifier
// + dispatcher wired through.

import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import { getProjectBySlug } from '../services/project.js';
import {
  ClassifierUnavailableError,
  createPasteRouting,
  listRecentRoutingsByProject,
} from '../services/routing.js';

export const routingRouter = (db: DB): Router => {
  const r = Router();

  // Recent routings for one thread — feeds the Recently sorted strip
  // on the project landing.
  r.get(
    '/projects/:slug/routings',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const daysRaw = req.query.days;
      const days =
        typeof daysRaw === 'string' && /^\d+$/.test(daysRaw)
          ? Math.min(Math.max(Number(daysRaw), 1), 90)
          : 7;
      res.json(listRecentRoutingsByProject(db, project.id, days));
    }),
  );

  // POST a pasted chunk → classify → dispatch → persist. The route
  // is thin; everything happens in createPasteRouting.
  r.post(
    '/routing/paste',
    asyncHandler(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const projectSlug = typeof body.projectSlug === 'string' ? body.projectSlug : '';
      const pasteBody = typeof body.body === 'string' ? body.body : '';
      const hint = typeof body.hint === 'string' ? body.hint : undefined;
      if (!projectSlug) throw validationError({ projectSlug: 'required' });
      if (!pasteBody) throw validationError({ body: 'required' });
      try {
        const routing = await createPasteRouting(db, {
          projectSlug,
          body: pasteBody,
          hint,
        });
        res.status(201).json(routing);
      } catch (err) {
        if (err instanceof ClassifierUnavailableError) {
          res
            .status(503)
            .json({ error: 'classifier_unavailable', message: err.message });
          return;
        }
        throw err;
      }
    }),
  );

  return r;
};
