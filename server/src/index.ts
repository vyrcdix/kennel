import cors from 'cors';
import express from 'express';
import { applyMigrations, openDb } from './db.js';
import { errorMiddleware } from './errors.js';
import { mcpAuth } from './mcp/auth.js';
import { mcpRouter } from './mcp/transport.js';
import { activityRouter } from './routes/activity.js';
import { bootstrapRouter } from './routes/bootstrap.js';
import { eventsRouter } from './routes/events.js';
import { chatsRouter } from './routes/chats.js';
import { commentsRouter } from './routes/comments.js';
import { docsRouter } from './routes/docs.js';
import { itemsRouter } from './routes/items.js';
import { projectsRouter } from './routes/projects.js';
import { proposalsRouter } from './routes/proposals.js';
import { runbooksRouter } from './routes/runbooks.js';
import { searchRouter } from './routes/search.js';
import { runSeedIfEmpty } from './seed.js';

const PORT = Number(process.env.PORT ?? 8421);
const HOST = process.env.HOST ?? '127.0.0.1';

const db = openDb();
applyMigrations(db);
runSeedIfEmpty(db);

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

app.use('/mcp', mcpAuth, mcpRouter(db));
app.use('/api/bootstrap', bootstrapRouter(db));
app.use('/api/projects', projectsRouter(db));
app.use('/api/items', itemsRouter(db));
app.use('/api/docs', docsRouter(db));
app.use('/api/chats', chatsRouter(db));
app.use('/api/skill-proposals', proposalsRouter(db));
app.use('/api/entities/:type/:id/comments', commentsRouter(db));
app.use('/api', runbooksRouter(db));
app.use('/api/activity', activityRouter(db));
app.use('/api/events', eventsRouter());
app.use('/api/search', searchRouter(db));

app.use(errorMiddleware);

app.listen(PORT, HOST, () => {
  console.log(`[kennel] listening on http://${HOST}:${PORT}`);
});
