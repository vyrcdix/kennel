import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { listAging, listCrystallizations } from '../../services/item.js';
import { getProjectBySlug } from '../../services/project.js';
import { getSettings } from '../../services/settings.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

const resolveProjectId = (db: DB, projectSlug?: string): string | undefined => {
  if (!projectSlug) return undefined;
  const p = getProjectBySlug(db, projectSlug);
  if (!p) throw notFound('project', projectSlug);
  return p.id;
};

export const registerAgingTools = (server: McpServer, db: DB) => {
  server.tool(
    'list_aging',
    'Items that have gone cold — not touched in `thresholdDays`. Defaults to the configured aging threshold (21 days). Used to drive the let-go review.',
    {
      thresholdDays: z.number().int().min(1).max(365).optional(),
      projectSlug: z.string().optional(),
    },
    async ({ thresholdDays, projectSlug }) => {
      try {
        const threshold = thresholdDays ?? getSettings(db).agingThresholdDays;
        const projectId = resolveProjectId(db, projectSlug);
        return jsonResult(listAging(db, threshold, projectId));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'list_crystallizations',
    'Durable outcomes — items with kind=crystallization or state=crystallized. Optional project filter.',
    { projectSlug: z.string().optional() },
    async ({ projectSlug }) => {
      try {
        const projectId = resolveProjectId(db, projectSlug);
        return jsonResult(listCrystallizations(db, projectId));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
