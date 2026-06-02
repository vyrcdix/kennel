import cors from 'cors';
import express from 'express';
import { applyMigrations, openDb } from './db.js';
import { errorMiddleware } from './errors.js';
import { mcpAuth } from './mcp/auth.js';
import { mcpRouter } from './mcp/transport.js';
import { activityRouter } from './routes/activity.js';
import { agingRouter, crystallizationsRouter } from './routes/aging.js';
import { authRouter } from './routes/auth.js';
import {
  isPasswordSet,
  seedInitialPassword,
  sessionTokenFromCookie,
  sweepExpiredSessions,
  validateSession,
} from './services/auth.js';
import { bootstrapRouter } from './routes/bootstrap.js';
import { eventsRouter } from './routes/events.js';
import { chatsRouter } from './routes/chats.js';
import { commentsRouter } from './routes/comments.js';
import { docsRouter } from './routes/docs.js';
import { fieldNotesRouter } from './routes/fieldNotes.js';
import { guidebooksRouter } from './routes/guidebooks.js';
import { itemsRouter } from './routes/items.js';
import { projectsRouter } from './routes/projects.js';
import { proposalsRouter } from './routes/proposals.js';
import { referencesRouter } from './routes/references.js';
import { routingRouter } from './routes/routing.js';
import { runbooksRouter } from './routes/runbooks.js';
import { searchRouter } from './routes/search.js';
import { settingsRouter } from './routes/settings.js';
import { runSeedIfEmpty } from './seed.js';

const PORT = Number(process.env.PORT ?? 8421);
const HOST = process.env.HOST ?? '127.0.0.1';

const db = openDb();
applyMigrations(db);
runSeedIfEmpty(db);
seedInitialPassword(db);
sweepExpiredSessions(db);

const app = express();
// Behind Caddy in production — trust X-Forwarded-Proto so req.secure is
// accurate and the session cookie gets the Secure flag over HTTPS.
app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: true }));
// 10mb leaves headroom for base64-encoded .docx uploads on the
// guidebook entries endpoint (~33% inflation), while still bounding
// the JSON body size to something sensible.
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Session gate for /api/*. When no password is configured auth is
// disabled (dev default). /api/auth/* is always allowlisted; /mcp is a
// different path entirely and keeps its own bearer token.
app.use((req, res, next) => {
  if (!req.path.startsWith('/api/')) return next();
  if (req.path.startsWith('/api/auth/')) return next();
  if (req.path === '/api/health') return next();
  if (!isPasswordSet(db)) return next();
  const token = sessionTokenFromCookie(req.headers.cookie);
  if (validateSession(db, token)) return next();
  res.status(401).json({ error: 'unauthorized' });
});

app.use('/api/auth', authRouter(db));
app.use('/mcp', mcpAuth, mcpRouter(db));
app.use('/api/bootstrap', bootstrapRouter(db));
app.use('/api/projects', projectsRouter(db));
app.use('/api/items', itemsRouter(db));
app.use('/api/docs', docsRouter(db));
app.use('/api/chats', chatsRouter(db));
app.use('/api/references', referencesRouter(db));
app.use('/api/skill-proposals', proposalsRouter(db));
app.use('/api/entities/:type/:id/comments', commentsRouter(db));
app.use('/api', runbooksRouter(db));
app.use('/api', guidebooksRouter(db));
app.use('/api', routingRouter(db));
app.use('/api/activity', activityRouter(db));
app.use('/api/aging', agingRouter(db));
app.use('/api/crystallizations', crystallizationsRouter(db));
app.use('/api/events', eventsRouter());
app.use('/api/search', searchRouter(db));
app.use('/api/settings', settingsRouter(db));
app.use('/api', fieldNotesRouter(db));

app.use(errorMiddleware);

app.listen(PORT, HOST, () => {
  console.log(`[kennel] listening on http://${HOST}:${PORT}`);
});
