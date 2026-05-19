import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { listChats, registerChat, touchChat } from '../services/chat.js';

export const chatsRouter = (db: DB): Router => {
  const r = Router();
  r.get('/', asyncHandler(async (_req, res) => res.json(listChats(db))));
  r.post(
    '/',
    asyncHandler(async (req, res) => {
      const body = req.body ?? {};
      res.status(201).json(
        registerChat(db, {
          projectSlug: body.projectSlug,
          tagline: body.tagline,
          claudeUrl: body.claudeUrl,
          startedAt: body.startedAt,
        }, 'craig'),
      );
    }),
  );
  r.post('/:id/touch', asyncHandler(async (req, res) => res.json(touchChat(db, req.params.id))));
  return r;
};
