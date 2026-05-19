import { Router } from 'express';
import { subscribe } from '../events.js';

/** Server-Sent Events feed of activity log entries. Clients subscribe once
 *  on boot and use events to invalidate their local cache. */
export const eventsRouter = (): Router => {
  const r = Router();
  r.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();
    // Tell the client to retry after 3s if the connection drops.
    res.write('retry: 3000\n\n');
    // First message: hello — helps EventSource confirm the stream is open.
    res.write(`event: hello\ndata: {"ts":"${new Date().toISOString()}"}\n\n`);

    const unsubscribe = subscribe((event) => {
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    });

    // Heartbeat every 25s so proxies don't time out the connection.
    const heartbeat = setInterval(() => {
      res.write(': ping\n\n');
    }, 25_000);

    req.on('close', () => {
      clearInterval(heartbeat);
      unsubscribe();
    });
  });
  return r;
};
