import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import { getDocById, updateDocBody } from '../services/doc.js';

export const docsRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = getDocById(db, req.params.id);
      if (!doc) throw notFound('doc', req.params.id);
      res.json(doc);
    }),
  );

  r.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const body = req.body?.body;
      if (typeof body !== 'string') throw validationError({ body: 'required' });
      res.json(updateDocBody(db, req.params.id, body));
    }),
  );

  return r;
};
