import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { search } from '../services/search.js';

export const searchRouter = (db: DB): Router => {
  const r = Router();
  r.get(
    '/',
    asyncHandler(async (req, res) => {
      const q = String(req.query.q ?? '');
      const t = performance.now();
      const groups = search(db, q);
      const elapsedMs = Math.max(1, Math.round(performance.now() - t));
      const total = groups.reduce((s, g) => s + g.count, 0);
      res.json({ groups, stats: { total, elapsedMs } });
    }),
  );
  return r;
};
