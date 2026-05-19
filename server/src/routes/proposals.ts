import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler } from '../errors.js';
import { listProposals, reviewProposal, type ProposalDecision } from '../services/proposal.js';

export const proposalsRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/',
    asyncHandler(async (_req, res) => {
      res.json(listProposals(db));
    }),
  );

  r.post(
    '/:id/review',
    asyncHandler(async (req, res) => {
      const decision = req.body?.decision as ProposalDecision;
      const note = typeof req.body?.note === 'string' ? req.body.note : undefined;
      const bodyOverride =
        typeof req.body?.bodyOverride === 'string' ? req.body.bodyOverride : undefined;
      res.json(reviewProposal(db, req.params.id, decision, { note, bodyOverride }));
    }),
  );

  return r;
};
