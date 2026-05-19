import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { getProjectBySlug } from '../../services/project.js';
import {
  getRunbookByProject,
  upsertRunbook,
} from '../../services/runbook.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

export const registerRunbookTools = (server: McpServer, db: DB) => {
  server.tool(
    'get_runbook',
    'Read a project\'s runbook: prerequisites, setup, run, deploy, troubleshoot, notes.',
    {
      projectSlug: z.string(),
    },
    async ({ projectSlug }) => {
      try {
        const project = getProjectBySlug(db, projectSlug);
        if (!project) throw notFound('project', projectSlug);
        const rb = getRunbookByProject(db, project.id);
        return jsonResult(rb ?? null);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'upsert_runbook',
    'Set or update a project\'s runbook sections. Any section omitted is left unchanged; pass null to clear. Bumps the revision and logs activity.',
    {
      projectSlug: z.string(),
      url: z.string().nullable().optional()
        .describe('Environment URL (dev server, staging, etc.).'),
      prerequisites: z.string().nullable().optional(),
      setup: z.string().nullable().optional(),
      run: z.string().nullable().optional(),
      deploy: z.string().nullable().optional(),
      troubleshoot: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    },
    async ({ projectSlug, ...sections }) => {
      try {
        const project = getProjectBySlug(db, projectSlug);
        if (!project) throw notFound('project', projectSlug);
        return jsonResult(upsertRunbook(db, project.id, sections, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
