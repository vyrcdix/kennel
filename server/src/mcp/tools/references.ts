import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { createReference } from '../../services/reference.js';
import { errorResult, jsonResult } from '../result.js';

export const registerReferenceTools = (server: McpServer, db: DB) => {
  server.tool(
    'create_reference',
    'Add a typed external reference (link, deploy_link, demo_link) to a project. Use this when something lives outside Kennel (a URL, a docs page, a deploy) that you want Claude to be able to recall later.',
    {
      projectSlug: z.string(),
      label: z.string().min(1).max(200)
        .describe('Display name. E.g. "Stripe billing tiers" or "Picnic staging".'),
      url: z.string().url().optional(),
      type: z.string().optional()
        .describe('Reference type: "link" (default), "deploy_link", or "demo_link".'),
      notes: z.string().optional()
        .describe('Free-form notes. E.g. "use staging URL only" or "demo for B2B audience".'),
      description: z.string().optional(),
    },
    async (input) => {
      try {
        return jsonResult(createReference(db, input, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
