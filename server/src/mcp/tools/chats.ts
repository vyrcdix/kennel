import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { listChats, registerChat, updateChatTagline } from '../../services/chat.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

const STALE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export const registerChatTools = (server: McpServer, db: DB) => {
  server.tool(
    'list_chats',
    'List registered Claude chats. Optional filters: project (by slug) and status (active|stale|archived). Stale means lastSeenAt > 60 days ago.',
    {
      projectSlug: z.string().optional(),
      status: z.enum(['active', 'stale', 'archived']).optional(),
    },
    async ({ projectSlug, status }) => {
      try {
        const projectId = projectSlug
          ? (() => {
              const p = getProjectBySlug(db, projectSlug);
              if (!p) throw notFound('project', projectSlug);
              return p.id;
            })()
          : undefined;
        const all = listChats(db);
        const now = Date.now();
        const filtered = all
          .filter((c) => (projectId ? c.projectId === projectId : true))
          .filter((c) => {
            if (!status) return true;
            const stale = now - c.lastSeenAt.getTime() > STALE_DAYS * DAY_MS;
            if (status === 'archived') return c.status === 'archived';
            if (status === 'active') return c.status === 'active' && !stale;
            if (status === 'stale') return c.status === 'active' && stale;
            return true;
          });
        return jsonResult(filtered);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'register_chat',
    'Register a Claude chat against a project so its activity tracks in Kennel. Call this near the start of a chat — pass the chat URL if known and propose a 140-char tagline.',
    {
      projectSlug: z.string().describe('Project this chat belongs to.'),
      tagline: z.string().min(1).max(140)
        .describe('A short summary of what you\'re working on. ≤140 chars; gets displayed in italics in the chats panel.'),
      claudeUrl: z.string().url().optional()
        .describe('The chat URL if Claude knows it. Optional.'),
    },
    async (input) => {
      try {
        return jsonResult(registerChat(db, input, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'update_chat_tagline',
    'Revise the 140-char tagline on a registered chat. Use this when an existing conversation produces a new artifact and the tagline should reflect that. Example: "Working on graph-mode for Picnic. Produced graph-mode-spec.md."',
    {
      chatId: z.string(),
      tagline: z.string().min(1).max(140),
    },
    async ({ chatId, tagline }) => {
      try {
        return jsonResult(updateChatTagline(db, chatId, tagline, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
