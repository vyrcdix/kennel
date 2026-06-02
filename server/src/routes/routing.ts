// Smart Routing — REST surface. Slice 1 ships the read endpoint
// only; slice 2 lands `POST /api/routing/paste` with the classifier
// + dispatcher wired through.

import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound } from '../errors.js';
import { getProjectBySlug } from '../services/project.js';
import { listRecentRoutingsByProject } from '../services/routing.js';

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

  return r;
};
