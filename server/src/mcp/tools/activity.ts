import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { listActivity, listActivitySince } from '../../services/activity.js';
import { errorResult, jsonResult } from '../result.js';

export const registerActivityTools = (server: McpServer, db: DB) => {
  server.tool(
    'recent_activity',
    'Recent activity log entries across all projects. Use this to answer "what did I do recently?" or "what changed since X?".',
    {
      since: z.string().datetime().optional()
        .describe('ISO timestamp lower bound. Omit for last 200 entries overall.'),
      limit: z.number().int().min(1).max(500).optional().default(50),
    },
    async ({ since, limit }) => {
      try {
        const out = since ? listActivitySince(db, since) : listActivity(db, limit);
        return jsonResult(out);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
