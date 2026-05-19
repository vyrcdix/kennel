import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { getSettings, updateSettings } from '../../services/settings.js';
import { errorResult, jsonResult } from '../result.js';

export const registerSettingsTools = (server: McpServer, db: DB) => {
  server.tool(
    'get_settings',
    'Read Kennel server settings: aging + dormant thresholds, filing prompt cadence, panel temperature toggle.',
    {},
    async () => {
      try {
        return jsonResult(getSettings(db));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'update_settings',
    'Patch Kennel server settings.',
    {
      agingThresholdDays: z.number().int().min(7).max(180).optional()
        .describe('Days of no-touch before an item shows on the Aging surface. Default 21.'),
      filingPromptDays: z.union([z.literal(0), z.literal(90), z.literal(180)]).optional()
        .describe('When the Aging board nudges to file old items. 0 = never. Default 0.'),
      dormantThresholdDays: z.number().int().min(30).max(365).optional()
        .describe('Days of no-touch before a panel reads as "dormant" in the temperature system. Default 60.'),
      showTemperature: z.boolean().optional()
        .describe('Whether panels show the temperature signal (fresh/aging/dormant). Default true.'),
    },
    async (input) => {
      try {
        return jsonResult(updateSettings(db, input));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
