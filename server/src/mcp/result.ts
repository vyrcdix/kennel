import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { HttpError } from '../errors.js';

/** Wrap a service-layer return value as an MCP tool result. JSON-stringified
 *  text is the simplest output; richer content types (images, etc.) can be
 *  added per-tool if needed. */
export const jsonResult = (value: unknown): CallToolResult => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify(value, null, 2),
    },
  ],
});

/** Translate a service HttpError into an MCP tool error result so the client
 *  sees the structured server error rather than a raw 5xx. */
export const errorResult = (err: unknown): CallToolResult => {
  if (err instanceof HttpError) {
    return {
      isError: true,
      content: [
        {
          type: 'text',
          text: JSON.stringify(err.body, null, 2),
        },
      ],
    };
  }
  const message = err instanceof Error ? err.message : 'unknown error';
  return {
    isError: true,
    content: [{ type: 'text', text: `error: ${message}` }],
  };
};
