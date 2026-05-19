import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { bootstrap } from '../services/bootstrap.js';

export const bootstrapRouter = (db: DB): Router => {
  const r = Router();
  r.get('/', asyncHandler(async (_req, res) => res.json(bootstrap(db))));
  return r;
};
