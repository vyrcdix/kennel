import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { getSettings, updateSettings } from '../services/settings.js';

export const settingsRouter = (db: DB): Router => {
  const r = Router();
  r.get('/', asyncHandler(async (_req, res) => res.json(getSettings(db))));
  r.patch(
    '/',
    asyncHandler(async (req, res) => {
      res.json(updateSettings(db, req.body ?? {}));
    }),
  );
  return r;
};
