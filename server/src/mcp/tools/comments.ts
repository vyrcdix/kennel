import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { addComment } from '../../services/comment.js';
import { errorResult, jsonResult } from '../result.js';

export const registerCommentTools = (server: McpServer, db: DB) => {
  server.tool(
    'add_comment',
    'Attach a whole-entity comment to an item, doc, reference, or runbook. Comments thread via parent_id (v1 supports only top-level).',
    {
      entityType: z.enum(['item', 'doc', 'reference', 'runbook']),
      entityId: z.string(),
      body: z.string().min(1),
      author: z.enum(['craig', 'claude']).optional().default('claude'),
    },
    async (input) => {
      try {
        const comment = addComment(db, input.entityType, input.entityId, input.body, input.author);
        return jsonResult(comment);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
