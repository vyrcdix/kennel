import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import {
  convertItem,
  convertItemToDoc,
  convertItemToReference,
  createItem,
  crystallizeItem,
  deleteItem,
  fileItem,
  getItemById,
  listItems,
  resurfaceCrystal,
  setItemCtype,
  touchItem,
  transitionItem,
  updateItem,
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

  r.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const patch: { title?: string; body?: string | null } = {};
      if (body.title !== undefined) {
        if (typeof body.title !== 'string') {
          throw validationError({ title: 'must_be_string' });
        }
        patch.title = body.title;
      }
      if (body.body !== undefined) {
        if (body.body !== null && typeof body.body !== 'string') {
          throw validationError({ body: 'must_be_string_or_null' });
        }
        patch.body = body.body as string | null;
      }
      if (Object.keys(patch).length === 0) {
        throw validationError({ body: 'no_fields' });
      }
      res.json(updateItem(db, req.params.id, patch));
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

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteItem(db, req.params.id);
      res.status(204).end();
    }),
  );

  r.patch(
    '/:id/ctype',
    asyncHandler(async (req, res) => {
      const raw = (req.body ?? {}).ctype;
      if (raw !== null && typeof raw !== 'string') {
        throw validationError({ ctype: 'must_be_string_or_null' });
      }
      res.json(setItemCtype(db, req.params.id, raw));
    }),
  );

  r.post(
    '/:id/resurface',
    asyncHandler(async (req, res) => {
      const ack = (req.body ?? {}).ack === true;
      res.json(resurfaceCrystal(db, req.params.id, { ack }));
    }),
  );

  r.post(
    '/:id/convert',
    asyncHandler(async (req, res) => {
      const target = req.body?.target;
      if (typeof target !== 'string') throw validationError({ target: 'required' });
      const itemId = req.params.id;
      if (target === 'doc') {
        res.json(convertItemToDoc(db, itemId));
        return;
      }
      if (target === 'reference') {
        res.json(convertItemToReference(db, itemId));
        return;
      }
      res.json(convertItem(db, itemId, target as never));
    }),
  );

  return r;
};
