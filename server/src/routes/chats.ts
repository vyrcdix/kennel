import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { listChats, touchChat } from '../services/chat.js';

export const chatsRouter = (db: DB): Router => {
  const r = Router();
  r.get('/', asyncHandler(async (_req, res) => res.json(listChats(db))));
  r.post('/:id/touch', asyncHandler(async (req, res) => res.json(touchChat(db, req.params.id))));
  return r;
};
