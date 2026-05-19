import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  convertItem,
  createItem,
  crystallizeItem,
  fileItem,
  getItemById,
  listItems,
  touchItem,
  transitionItem,
} from '../services/item.js';
import { createDoc } from '../services/doc.js';
import { createReference } from '../services/reference.js';
import { getProjectById } from '../services/project.js';

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

  r.post(
    '/:id/convert',
    asyncHandler(async (req, res) => {
      const target = req.body?.target;
      if (typeof target !== 'string') throw validationError({ target: 'required' });
      const item = getItemById(db, req.params.id);
      if (!item) throw notFound('item', req.params.id);

      if (target === 'doc') {
        const project = getProjectById(db, item.projectId);
        if (!project) throw notFound('project', item.projectId);
        const doc = createDoc(db, {
          projectSlug: project.slug,
          title: item.title,
          body: item.body
            ? item.body
            : `# ${item.title}\n\nPromoted from item.\n`,
        });
        res.json(convertItem(db, req.params.id, 'doc', { linkedDocId: doc.id }));
        return;
      }
      if (target === 'reference') {
        const project = getProjectById(db, item.projectId);
        if (!project) throw notFound('project', item.projectId);
        const looksLikeUrl =
          item.body && /^https?:\/\//.test(item.body.trim().split(/\s/)[0]);
        const reference = createReference(db, {
          projectSlug: project.slug,
          label: item.title,
          url: looksLikeUrl ? item.body!.trim().split(/\s/)[0] : undefined,
          notes: looksLikeUrl ? undefined : item.body ?? undefined,
        });
        res.json(
          convertItem(db, req.params.id, 'reference', {
            linkedReferenceId: reference.id,
          }),
        );
        return;
      }
      res.json(convertItem(db, req.params.id, target as never));
    }),
  );

  return r;
};
