import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { Router } from 'express';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import type { DB } from '../db.js';
import { createMcpServer } from './server.js';

/** Streamable HTTP transport for MCP. Sessions are keyed by the
 *  mcp-session-id header so subsequent requests reuse the same transport
 *  (and thus the same in-flight tool calls / notifications). */
export const mcpRouter = (db: DB) => {
  const r = Router();
  const transports = new Map<string, StreamableHTTPServerTransport>();

  const handle = async (req: Request, res: Response) => {
    try {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        if (req.method === 'POST' && isInitializeRequest(req.body)) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sid) => {
            transports.set(sid, transport!);
          },
          });
          transport.onclose = () => {
            if (transport!.sessionId) transports.delete(transport!.sessionId);
          };
          const server = createMcpServer(db);
          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'No active session for this id.' },
            id: null,
          });
          return;
        }
      }

      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[mcp] handler error', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Internal error' },
          id: null,
        });
      }
    }
  };

  r.post('/', handle);
  r.get('/', handle);
  r.delete('/', handle);
  return r;
};
