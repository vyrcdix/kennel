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
  setItemServes,
  touchItem,
  transitionItem,
  updateItem,
} from '../services/item.js';
import {
  didCadence,
  recommitCadence,
  recurItem,
  setCommitment,
  skipCadence,
  snoozeCadence,
} from '../services/cadence.js';

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

  r.patch(
    '/:id/serves',
    asyncHandler(async (req, res) => {
      const raw = (req.body ?? {}).servesId;
      if (raw !== null && typeof raw !== 'string') {
        throw validationError({ servesId: 'must_be_string_or_null' });
      }
      res.json(setItemServes(db, req.params.id, raw));
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

  // ── Cadence (recurring actions) ──────────────────────────────────────
  r.post(
    '/:id/recur',
    asyncHandler(async (req, res) => {
      const b = req.body ?? {};
      if (typeof b.cadence !== 'string') throw validationError({ cadence: 'required' });
      if (typeof b.commitment !== 'string') throw validationError({ commitment: 'required' });
      res.json(
        recurItem(db, req.params.id, {
          cadence: b.cadence,
          commitment: b.commitment,
          resourceRefId: typeof b.resourceRefId === 'string' ? b.resourceRefId : null,
          servesId: typeof b.servesId === 'string' ? b.servesId : null,
          noteDefaultSection:
            typeof b.noteDefaultSection === 'string' ? b.noteDefaultSection : null,
        }),
      );
    }),
  );
  r.post(
    '/:id/did',
    asyncHandler(async (req, res) => {
      res.json(didCadence(db, req.params.id));
    }),
  );
  r.post(
    '/:id/skip',
    asyncHandler(async (req, res) => {
      res.json(skipCadence(db, req.params.id));
    }),
  );
  r.post(
    '/:id/snooze',
    asyncHandler(async (req, res) => {
      res.json(snoozeCadence(db, req.params.id));
    }),
  );
  r.post(
    '/:id/recommit',
    asyncHandler(async (req, res) => {
      res.json(recommitCadence(db, req.params.id));
    }),
  );
  r.patch(
    '/:id/commitment',
    asyncHandler(async (req, res) => {
      const commitment = (req.body ?? {}).commitment;
      if (typeof commitment !== 'string') throw validationError({ commitment: 'required' });
      res.json(setCommitment(db, req.params.id, commitment));
    }),
  );

  return r;
};
