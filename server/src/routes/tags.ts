import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import { applyTag, removeTag } from '../services/tag.js';
import type { EntityType } from '../../../shared/types.js';

const TYPES: EntityType[] = ['item', 'doc', 'reference', 'runbook'];

/** Mounted at /api/entities/:type/:id/tags — mirrors the comments
 *  router. POST applies (find-or-create by name); DELETE detaches. */
export const tagsRouter = (db: DB): Router => {
  const r = Router({ mergeParams: true });

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const { type, id } = req.params as { type: string; id: string };
      if (!TYPES.includes(type as EntityType)) {
        throw validationError({ entityType: 'invalid' });
      }
      const name = req.body?.name;
      if (typeof name !== 'string' || !name.trim()) {
        throw validationError({ name: 'required' });
      }
      const projectId = (req.body?.projectId as string | undefined) ?? null;
      res
        .status(201)
        .json(applyTag(db, type as EntityType, id, name, projectId));
    }),
  );

  r.delete(
    '/:tagId',
    asyncHandler(async (req, res) => {
      const { type, id, tagId } = req.params as {
        type: string;
        id: string;
        tagId: string;
      };
      if (!TYPES.includes(type as EntityType)) {
        throw validationError({ entityType: 'invalid' });
      }
      removeTag(db, type as EntityType, id, tagId);
      res.status(204).end();
    }),
  );

  return r;
};
