import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import {
  deleteChat,
  listChats,
  registerChat,
  setChatUrl,
  touchChat,
} from '../services/chat.js';

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
  r.patch(
    '/:id/url',
    asyncHandler(async (req, res) => {
      const url = req.body?.claudeUrl;
      if (url !== null && typeof url !== 'string') {
        throw validationError({ claudeUrl: 'string_or_null' });
      }
      res.json(setChatUrl(db, req.params.id, url));
    }),
  );
  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteChat(db, req.params.id);
      res.status(204).end();
    }),
  );
  return r;
};
