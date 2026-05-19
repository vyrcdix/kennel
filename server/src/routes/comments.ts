import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import { addComment } from '../services/comment.js';
import type { EntityType } from '../../../shared/types.js';

const TYPES: EntityType[] = ['item', 'doc', 'reference', 'runbook'];

export const commentsRouter = (db: DB): Router => {
  const r = Router({ mergeParams: true });

  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const { type, id } = req.params as { type: string; id: string };
      if (!TYPES.includes(type as EntityType)) {
        throw validationError({ entityType: 'invalid' });
      }
      const body = req.body?.body as string;
      const author = (req.body?.author as 'craig' | 'claude') ?? 'craig';
      res.status(201).json(addComment(db, type as EntityType, id, body, author));
    }),
  );

  return r;
};
