import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { listActivity, listActivitySince } from '../services/activity.js';

export const activityRouter = (db: DB): Router => {
  const r = Router();
  r.get(
    '/',
    asyncHandler(async (req, res) => {
      const since = req.query.since;
      const out = typeof since === 'string' && since
        ? listActivitySince(db, since)
        : listActivity(db);
      res.json(out);
    }),
  );
  return r;
};
