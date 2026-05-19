import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { applyTag, listTags, removeTag } from '../../services/tag.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

const ENTITY = z.enum(['item', 'doc', 'reference', 'runbook']);

export const registerTagTools = (server: McpServer, db: DB) => {
  server.tool(
    'list_tags',
    'List all tag definitions (project-scoped + global).',
    {},
    async () => jsonResult(listTags(db)),
  );

  server.tool(
    'apply_tag',
    'Attach a free-form tag to an item / doc / reference / runbook. Tag is created if it doesn\'t exist. Tag names are lowercased; leading "#" is stripped.',
    {
      entityType: ENTITY,
      entityId: z.string(),
      name: z.string().min(1).describe('Tag name, e.g. "outreach" or "#draft".'),
      projectSlug: z.string().optional()
        .describe('Scope the tag to this project. Omit for a global tag.'),
    },
    async ({ entityType, entityId, name, projectSlug }) => {
      try {
        const projectId = projectSlug
          ? (() => {
              const p = getProjectBySlug(db, projectSlug);
              if (!p) throw notFound('project', projectSlug);
              return p.id;
            })()
          : null;
        return jsonResult(applyTag(db, entityType, entityId, name, projectId));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'remove_tag',
    'Remove a tag from an entity. Does not delete the tag definition itself.',
    {
      entityType: ENTITY,
      entityId: z.string(),
      tagId: z.string(),
    },
    async ({ entityType, entityId, tagId }) => {
      try {
        removeTag(db, entityType, entityId, tagId);
        return jsonResult({ ok: true });
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
