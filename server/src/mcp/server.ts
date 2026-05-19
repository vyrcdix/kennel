import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DB } from '../db.js';
import { registerActivityTools } from './tools/activity.js';
import { registerChatTools } from './tools/chats.js';
import { registerCommentTools } from './tools/comments.js';
import { registerDocTools } from './tools/docs.js';
import { registerItemTools } from './tools/items.js';
import { registerProjectTools } from './tools/projects.js';
import { registerProposalTools } from './tools/proposals.js';
import { registerRunbookTools } from './tools/runbooks.js';
import { registerSearchTools } from './tools/search.js';
import { registerSkillTools } from './tools/skills.js';
import { registerTagTools } from './tools/tags.js';
import { registerReferenceTools } from './tools/references.js';

/** Build a fresh McpServer with all Kennel tools registered. Called per
 *  session — the SDK requires each transport to bind to its own server
 *  instance so notifications don't cross sessions. */
export const createMcpServer = (db: DB): McpServer => {
  const server = new McpServer({
    name: 'kennel',
    version: '0.1.0',
  });

  registerProjectTools(server, db);
  registerItemTools(server, db);
  registerDocTools(server, db);
  registerRunbookTools(server, db);
  registerChatTools(server, db);
  registerProposalTools(server, db);
  registerCommentTools(server, db);
  registerActivityTools(server, db);
  registerSearchTools(server, db);
  registerSkillTools(server, db);
  registerTagTools(server, db);
  registerReferenceTools(server, db);

  return server;
};
