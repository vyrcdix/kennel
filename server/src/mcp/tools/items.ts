import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import {
  convertItem,
  convertItemToDoc,
  convertItemToReference,
  createItem,
  crystallizeItem,
  fileItem,
  listNextUp,
  listQueue,
  touchItem,
  transitionItem,
} from '../../services/item.js';
import { listProposals } from '../../services/proposal.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

const KIND = z.enum(['idea', 'note', 'action', 'doc', 'ref', 'question', 'crystallization']);
// Accept the v0.3 vocabulary plus the old v0.1 aliases ('parked'/'done'/'archived');
// the service normalises before applying. Tool descriptions advertise only v0.3.
const STATE = z.enum([
  'inbox', 'active', 'reflecting', 'crystallized', 'filed', 'dismissed',
  'parked', 'done', 'archived',
]);

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
    'Capture an item onto the bench for a project (state=inbox in storage; "the bench" is the user-facing label). Title required; body optional markdown; kind controls how it renders and what fields apply.',
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
    'Move an item between states: inbox ("the bench") / active ("in focus") / reflecting / crystallized / filed / dismissed ("let go"). User-facing copy uses the parenthesised labels; storage uses the bare values. (Old aliases parked/done/archived also accepted, normalised to v0.3.) Logs activity.',
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
    'Items currently on the bench (state=inbox) + pending skill proposals awaiting sort. Optional project filter.',
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
    'Active items ranked for attention, ordered by recency of touch then manual rank. Use this to answer "what have I been thinking about lately?".',
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

  server.tool(
    'touch_item',
    'Bump an item\'s last_touched_at without changing its state. Use to "pick up" something on the Aging board without a full state transition.',
    { itemId: z.string() },
    async ({ itemId }) => {
      try {
        touchItem(db, itemId);
        return jsonResult({ ok: true });
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'crystallize_item',
    'Promote an item to a durable Crystallization. Sets state=crystallized; pass promoteKind=true to also flip kind→crystallization (the item starts rendering with the DURABLE stamp and moss border). Optional sourcesFrom records the lineage.',
    {
      itemId: z.string(),
      promoteKind: z.boolean().optional()
        .describe('If true, the item\'s kind becomes "crystallization". Defaults false (only state changes).'),
      sourcesFrom: z.array(z.string()).optional()
        .describe('IDs of items / docs / chats that fed this crystallization. Surfaced as "from N items, M chats".'),
    },
    async ({ itemId, promoteKind, sourcesFrom }) => {
      try {
        return jsonResult(
          crystallizeItem(db, itemId, { promoteKind, sourcesFrom }, 'claude'),
        );
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'file_item',
    'Soft-archive an item. Sets state=filed; the item drops from default surfaces but stays searchable.',
    { itemId: z.string() },
    async ({ itemId }) => {
      try {
        return jsonResult(fileItem(db, itemId, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'convert_item',
    'Convert an item into another shape. Targets idea/note/action/ref/question change the item\'s kind in place (and move it off the bench into active). Targets doc/reference create a new entity, link it from the source item, and let go of the source.',
    {
      itemId: z.string(),
      target: z.enum(['idea', 'note', 'action', 'ref', 'question', 'doc', 'reference']),
    },
    async ({ itemId, target }) => {
      try {
        if (target === 'doc') return jsonResult(convertItemToDoc(db, itemId, 'claude'));
        if (target === 'reference')
          return jsonResult(convertItemToReference(db, itemId, 'claude'));
        return jsonResult(convertItem(db, itemId, target, {}, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
