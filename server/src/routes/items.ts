import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import {
  createItem,
  getItemById,
  listItems,
  transitionItem,
} from '../services/item.js';
import type { ItemState } from '../../../shared/types.js';

const STATES: ItemState[] = ['inbox', 'active', 'parked', 'done', 'archived', 'dismissed'];

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
      const to = req.body?.to as ItemState | undefined;
      if (!to || !STATES.includes(to)) throw validationError({ to: 'invalid' });
      res.json(transitionItem(db, req.params.id, to));
    }),
  );

  return r;
};
