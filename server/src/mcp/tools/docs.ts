import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import {
  createDoc,
  getDocById,
  updateDocBody,
} from '../../services/doc.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

export const registerDocTools = (server: McpServer, db: DB) => {
  server.tool(
    'read_doc',
    'Read a doc\'s full markdown body and metadata.',
    {
      docId: z.string().describe('The doc id.'),
    },
    async ({ docId }) => {
      try {
        const doc = getDocById(db, docId);
        if (!doc) throw notFound('doc', docId);
        return jsonResult(doc);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'write_doc',
    'Create a new doc, or update an existing one\'s body. To update, pass docId. To create, pass projectSlug + title.',
    {
      docId: z.string().optional().describe('Pass to update; omit to create.'),
      projectSlug: z.string().optional().describe('Required when creating.'),
      title: z.string().min(1).optional().describe('Required when creating.'),
      body: z.string().describe('Full markdown body.'),
      pinned: z.boolean().optional().describe('Pin to the project landing page (create only).'),
    },
    async (input) => {
      try {
        if (input.docId) {
          return jsonResult(updateDocBody(db, input.docId, input.body));
        }
        if (!input.projectSlug || !input.title) {
          throw new Error('projectSlug and title are required when docId is omitted');
        }
        const doc = createDoc(
          db,
          {
            projectSlug: input.projectSlug,
            title: input.title,
            body: input.body,
            pinned: input.pinned,
          },
          'claude',
        );
        return jsonResult(doc);
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
