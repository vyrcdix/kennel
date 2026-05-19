import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import {
  createItem,
  crystallizeItem,
  fileItem,
  getItemById,
  listItems,
  touchItem,
  transitionItem,
} from '../services/item.js';

export const itemsRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json(listItems(db));
    }),
  );

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const item = createItem(db, req.body);
      res.status(201).json(item);
    }),
  );

  r.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const item = getItemById(db, req.params.id);
      if (!item) throw validationError({ id: 'not_found' });
      res.json(item);
    }),
  );

  r.post(
    '/:id/transition',
    asyncHandler(async (req, res) => {
      const to = req.body?.to;
      if (typeof to !== 'string') throw validationError({ to: 'required' });
      res.json(transitionItem(db, req.params.id, to));
    }),
  );

  r.post(
    '/:id/touch',
    asyncHandler(async (req, res) => {
      touchItem(db, req.params.id);
      res.status(204).end();
    }),
  );

  r.post(
    '/:id/crystallize',
    asyncHandler(async (req, res) => {
      const promoteKind = req.body?.promoteKind === true;
      const sourcesFrom = Array.isArray(req.body?.sourcesFrom)
        ? req.body.sourcesFrom
        : undefined;
      res.json(crystallizeItem(db, req.params.id, { promoteKind, sourcesFrom }));
    }),
  );

  r.post(
    '/:id/file',
    asyncHandler(async (req, res) => {
      res.json(fileItem(db, req.params.id));
    }),
  );

  return r;
};
