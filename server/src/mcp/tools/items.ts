import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import {
  createItem,
  listNextUp,
  listQueue,
  transitionItem,
} from '../../services/item.js';
import { listProposals } from '../../services/proposal.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

const KIND = z.enum(['idea', 'note', 'action', 'doc', 'ref']);
const STATE = z.enum(['inbox', 'active', 'parked', 'done', 'archived', 'dismissed']);

const resolveProjectId = (db: DB, opts: { projectId?: string; projectSlug?: string }): string | undefined => {
  if (opts.projectId) return opts.projectId;
  if (opts.projectSlug) {
    const p = getProjectBySlug(db, opts.projectSlug);
    if (!p) throw notFound('project', opts.projectSlug);
    return p.id;
  }
  return undefined;
};

export const registerItemTools = (server: McpServer, db: DB) => {
  server.tool(
    'create_item',
    'Capture an item into a project\'s inbox. Title required; body optional markdown; kind controls how it renders and what fields apply.',
    {
      projectSlug: z.string().describe('Project slug to capture into.'),
      kind: KIND,
      title: z.string().min(1).describe('Short title — what would this look like in a list?'),
      body: z.string().optional().describe('Optional markdown body. Only for ideas/notes; docs live separately.'),
      dueAt: z.string().datetime().optional().describe('ISO-8601 timestamp. Mostly for action items.'),
    },
    async (input) => {
      try {
        const projectId = resolveProjectId(db, { projectSlug: input.projectSlug })!;
        const item = createItem(
          db,
          {
            projectId,
            kind: input.kind,
            title: input.title,
            body: input.body,
            dueAt: input.dueAt,
          },
          'claude',
        );
        return jsonResult(item);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'transition_item',
    'Move an item between states: inbox / active / parked / done / archived / dismissed. Enforces legal transitions and logs activity.',
    {
      itemId: z.string().describe('The item id.'),
      to: STATE,
    },
    async ({ itemId, to }) => {
      try {
        return jsonResult(transitionItem(db, itemId, to));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'list_queue',
    'Inbox items + pending skill proposals awaiting triage. Optional project filter.',
    {
      projectSlug: z.string().optional(),
    },
    async ({ projectSlug }) => {
      try {
        const projectId = resolveProjectId(db, { projectSlug });
        const items = listQueue(db, projectId);
        const proposals = listProposals(db).filter((p) => p.status === 'pending');
        return jsonResult({ items, proposals });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'list_next_up',
    'Active items ranked for attention. Use this to answer "what should I be working on?".',
    {
      projectSlug: z.string().optional(),
      limit: z.number().int().min(1).max(50).optional().default(10),
    },
    async ({ projectSlug, limit }) => {
      try {
        const projectId = resolveProjectId(db, { projectSlug });
        return jsonResult(listNextUp(db, projectId, limit));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
