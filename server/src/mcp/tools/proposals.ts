import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { createProposal } from '../../services/proposal.js';
import { errorResult, jsonResult } from '../result.js';

export const registerProposalTools = (server: McpServer, db: DB) => {
  server.tool(
    'propose_skill_update',
    'Propose a replacement body for an existing skill. Lands in Craig\'s review queue alongside inbox items. Use this when you notice a skill\'s instructions could be more accurate based on observed work.',
    {
      skillId: z.string().describe('The skill to propose changes to.'),
      proposedBody: z.string().min(1)
        .describe('Full replacement body for the skill (markdown).'),
      rationale: z.string().min(1)
        .describe('Why this change matters. Surfaced as Claude\'s reasoning in the review UI.'),
      triggeredBy: z
        .object({
          chatId: z.string().optional(),
          itemId: z.string().optional(),
          docId: z.string().optional(),
        })
        .optional()
        .describe('Optional: what conversation or artifact prompted this proposal.'),
    },
    async (input) => {
      try {
        return jsonResult(createProposal(db, input, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
