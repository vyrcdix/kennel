import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import {
  closeOutProject,
  createProject,
  getProjectBySlug,
  listProjects,
  updateProject,
} from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

/** v0.5 §A label palette — see also shared/types.ts ProjectColor. */
const COLOR = z.enum(['stone', 'sage', 'dusk', 'plum', 'slate', 'teal']);

export const registerProjectTools = (server: McpServer, db: DB) => {
  server.tool(
    'list_projects',
    'List all projects in Kennel with slug, name, description, status, pinned, and timestamps.',
    {},
    async () => jsonResult(listProjects(db)),
  );

  server.tool(
    'get_project',
    'Fetch a single project by its slug, including its description and context paragraph.',
    {
      slug: z.string().describe('The project slug (e.g. "kennel", "picnic-engage").'),
    },
    async ({ slug }) => {
      try {
        const project = getProjectBySlug(db, slug);
        if (!project) throw notFound('project', slug);
        return jsonResult(project);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'create_project',
    'Create a new project. Slug auto-derives from name if omitted. Returns the created project.',
    {
      name: z.string().min(1).max(80).describe('Display name. Required.'),
      slug: z.string().min(1).max(40).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/).optional()
        .describe('URL-safe slug. Auto-derived from name if omitted.'),
      description: z.string().max(140).optional()
        .describe('Short one-line description for compact UI placements.'),
      context: z.string().max(8000).optional()
        .describe('Longer markdown context surfaced to Claude on read. Worth populating well — Claude sees it whenever it opens this project.'),
      color: COLOR.optional()
        .describe('Card border tint: moss, ember, dust, blaze, or slate.'),
      pinned: z.boolean().optional()
        .describe('Pin to the dashboard rail. Default false.'),
    },
    async (input) => {
      try {
        const project = createProject(db, input, 'claude');
        return jsonResult(project);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'update_project',
    'Patch any subset of a project\'s fields (name, description, context, color, pinned, status). Use this to populate context after creation.',
    {
      slug: z.string().describe('The project slug to update.'),
      name: z.string().min(1).max(80).optional(),
      description: z.string().max(140).optional(),
      context: z.string().max(8000).nullable().optional()
        .describe('Pass null to clear; pass a markdown string to set.'),
      color: COLOR.nullable().optional(),
      pinned: z.boolean().optional(),
      status: z.enum(['active', 'paused', 'archived']).optional(),
    },
    async ({ slug, ...patch }) => {
      try {
        const project = updateProject(db, slug, patch, 'claude');
        return jsonResult(project);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'close_out_project',
    'Archive a project — sets status to "archived" and archives any items still in `done` state in one transaction. Use this when wrapping up work; the project stays searchable but hides from default lists.',
    {
      slug: z.string(),
    },
    async ({ slug }) => {
      try {
        return jsonResult(closeOutProject(db, slug, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
