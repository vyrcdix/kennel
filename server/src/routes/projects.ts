import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  closeOutProject,
  createProject,
  dismissNextSteps,
  getProjectBySlug,
  listProjects,
  setProjectBearing,
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

  // Compass: point this current at a bearing (null clears).
  r.patch(
    '/:slug/bearing',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const raw = (req.body ?? {}).bearingId;
      if (raw !== null && typeof raw !== 'string') {
        throw validationError({ bearingId: 'must_be_string_or_null' });
      }
      res.json(setProjectBearing(db, project.id, raw));
    }),
  );

  return r;
};
