import type { NextFunction, Request, Response } from 'express';

/** Bearer-token middleware for the MCP endpoint. Off by default — set
 *  KENNEL_MCP_TOKEN in the environment to require it. Returns a JSON-RPC
 *  error response on a bad/missing token so MCP clients get a structured
 *  failure rather than a vanilla 401 body. */
export const mcpAuth = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.KENNEL_MCP_TOKEN;
  if (!expected) {
    next();
    return;
  }
  const header = req.headers.authorization;
  const provided = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
  if (provided && provided === expected) {
    next();
    return;
  }
  res.status(401).json({
    jsonrpc: '2.0',
    error: { code: -32001, message: 'Unauthorized' },
    id: null,
  });
};
