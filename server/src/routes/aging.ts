import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { listAging, listCrystallizations } from '../services/item.js';
import { getProjectBySlug } from '../services/project.js';
import { getSettings } from '../services/settings.js';

export const agingRouter = (db: DB): Router => {
  const r = Router();
  r.get(
    '/',
    asyncHandler(async (req, res) => {
      const settings = getSettings(db);
      const thresholdParam = req.query.threshold;
      const threshold = thresholdParam ? Number(thresholdParam) : settings.agingThresholdDays;
      const projectSlug = typeof req.query.projectSlug === 'string' ? req.query.projectSlug : undefined;
      const projectId = projectSlug ? getProjectBySlug(db, projectSlug)?.id : undefined;
      res.json(listAging(db, threshold, projectId));
    }),
  );
  return r;
};

export const crystallizationsRouter = (db: DB): Router => {
  const r = Router();
  r.get(
    '/',
    asyncHandler(async (req, res) => {
      const projectSlug = typeof req.query.projectSlug === 'string' ? req.query.projectSlug : undefined;
      const projectId = projectSlug ? getProjectBySlug(db, projectSlug)?.id : undefined;
      res.json(listCrystallizations(db, projectId));
    }),
  );
  return r;
};
