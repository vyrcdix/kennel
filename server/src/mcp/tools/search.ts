import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { search } from '../../services/search.js';
import { errorResult, jsonResult } from '../result.js';

export const registerSearchTools = (server: McpServer, db: DB) => {
  server.tool(
    'search',
    'Full-text search across items, docs, references, runbooks, skills, and chats. Returns grouped results with snippets.',
    {
      q: z.string().min(1).describe('Search query.'),
    },
    async ({ q }) => {
      try {
        return jsonResult({ groups: search(db, q) });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
