import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, validationError } from '../errors.js';
import {
  checkPassword,
  createSession,
  isPasswordSet,
  revokeAllSessions,
  revokeSession,
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  sessionTokenFromCookie,
  setStoredPassword,
  validateSession,
} from '../services/auth.js';

const cookieOpts = (secure: boolean) => ({
  httpOnly: true,
  secure,
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS * 1000,
});

export const authRouter = (db: DB): Router => {
  const r = Router();

  // Whether auth is on, and whether this request is already in.
  r.get(
    '/status',
    asyncHandler(async (req, res) => {
      const authRequired = isPasswordSet(db);
      const token = sessionTokenFromCookie(req.headers.cookie);
      const authenticated = !authRequired || validateSession(db, token);
      res.json({ authRequired, authenticated });
    }),
  );

  r.post(
    '/login',
    asyncHandler(async (req, res) => {
      if (!isPasswordSet(db)) {
        // No password configured — auth is disabled; nothing to log into.
        res.status(400).json({ error: 'auth_disabled' });
        return;
      }
      const password = req.body?.password;
      if (typeof password !== 'string' || !checkPassword(db, password)) {
        res.status(401).json({ error: 'bad_password' });
        return;
      }
      const token = createSession(db);
      res.cookie(SESSION_COOKIE, token, cookieOpts(req.secure));
      res.json({ ok: true });
    }),
  );

  r.post(
    '/logout',
    asyncHandler(async (req, res) => {
      const token = sessionTokenFromCookie(req.headers.cookie);
      if (token) revokeSession(db, token);
      res.clearCookie(SESSION_COOKIE, { path: '/' });
      res.json({ ok: true });
    }),
  );

  // Change the shared password. Requires the current password; rotates
  // the hash and revokes every other session.
  r.post(
    '/change-password',
    asyncHandler(async (req, res) => {
      const current = req.body?.currentPassword;
      const next = req.body?.newPassword;
      if (isPasswordSet(db)) {
        if (typeof current !== 'string' || !checkPassword(db, current)) {
          throw validationError({ currentPassword: 'incorrect' });
        }
      }
      if (typeof next !== 'string' || next.length < 8) {
        throw validationError({ newPassword: 'min_8_chars' });
      }
      setStoredPassword(db, next);
      const token = sessionTokenFromCookie(req.headers.cookie);
      revokeAllSessions(db, token); // keep the caller signed in
      res.json({ ok: true });
    }),
  );

  return r;
};
