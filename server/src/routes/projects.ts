import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound } from '../errors.js';
import {
  closeOutProject,
  createProject,
  dismissNextSteps,
  getProjectBySlug,
  listProjects,
  togglePin,
  updateProject,
} from '../services/project.js';

export const projectsRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json(listProjects(db));
    }),
  );

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const project = createProject(db, req.body);
      res.status(201).json(project);
    }),
  );

  r.get(
    '/:slug',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      res.json(project);
    }),
  );

  r.patch(
    '/:slug',
    asyncHandler(async (req, res) => {
      res.json(updateProject(db, req.params.slug, req.body ?? {}));
    }),
  );

  r.post(
    '/:slug/dismiss-next-steps',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      res.json(dismissNextSteps(db, project.id));
    }),
  );

  r.post(
    '/:slug/toggle-pin',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      res.json(togglePin(db, project.id));
    }),
  );

  r.post(
    '/:slug/close-out',
    asyncHandler(async (req, res) => {
      res.json(closeOutProject(db, req.params.slug));
    }),
  );

  return r;
};
