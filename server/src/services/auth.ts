// App-level auth: single shared password (scrypt) + server-side
// sessions. The password hash lives on the settings row but is NEVER
// mapped into the client-facing Settings type — only this module
// touches it. /mcp keeps its own KENNEL_MCP_TOKEN bearer auth.

import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import type { DB } from '../db.js';
import { nowIso } from '../time.js';

const SCRYPT_KEYLEN = 64;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const SESSION_COOKIE = 'steep_session';

// ─── Password hashing ───────────────────────────────────────────────────

export const hashPassword = (
  password: string,
): { hash: string; salt: string } => {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN).toString('hex');
  return { hash, salt };
};

export const verifyPassword = (
  password: string,
  hash: string,
  salt: string,
): boolean => {
  const candidate = scryptSync(password, salt, SCRYPT_KEYLEN);
  const stored = Buffer.from(hash, 'hex');
  if (candidate.length !== stored.length) return false;
  return timingSafeEqual(candidate, stored);
};

// ─── Stored password (settings row) ─────────────────────────────────────

type PwRow = {
  auth_password_hash: string | null;
  auth_password_salt: string | null;
};

const getStoredPassword = (db: DB): { hash: string; salt: string } | null => {
  const row = db
    .prepare<[], PwRow>(
      'SELECT auth_password_hash, auth_password_salt FROM settings WHERE id = 1',
    )
    .get();
  if (!row?.auth_password_hash || !row.auth_password_salt) return null;
  return { hash: row.auth_password_hash, salt: row.auth_password_salt };
};

export const isPasswordSet = (db: DB): boolean => getStoredPassword(db) !== null;

export const setStoredPassword = (db: DB, password: string): void => {
  const { hash, salt } = hashPassword(password);
  db.prepare(
    'UPDATE settings SET auth_password_hash = ?, auth_password_salt = ?, updated_at = ? WHERE id = 1',
  ).run(hash, salt, nowIso());
};

export const checkPassword = (db: DB, password: string): boolean => {
  const stored = getStoredPassword(db);
  if (!stored) return false;
  return verifyPassword(password, stored.hash, stored.salt);
};

/** First-boot: if no password is set, seed it from KENNEL_INITIAL_PASSWORD.
 *  Without that env var auth is simply disabled (dev default) — the
 *  middleware lets everything through, mirroring KENNEL_MCP_TOKEN. */
export const seedInitialPassword = (db: DB): void => {
  if (isPasswordSet(db)) return;
  const initial = process.env.KENNEL_INITIAL_PASSWORD;
  if (initial && initial.trim()) {
    setStoredPassword(db, initial.trim());
    console.log('[auth] initial password set from KENNEL_INITIAL_PASSWORD');
  } else {
    console.log('[auth] no password set — auth disabled (set KENNEL_INITIAL_PASSWORD to enable)');
  }
};

// ─── Sessions ───────────────────────────────────────────────────────────

export const createSession = (db: DB): string => {
  const token = randomBytes(32).toString('hex');
  const now = Date.now();
  db.prepare(
    'INSERT INTO sessions (token, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?)',
  ).run(
    token,
    new Date(now).toISOString(),
    new Date(now + SESSION_TTL_MS).toISOString(),
    new Date(now).toISOString(),
  );
  return token;
};

export const validateSession = (db: DB, token: string | undefined): boolean => {
  if (!token) return false;
  const row = db
    .prepare<[string], { expires_at: string }>(
      'SELECT expires_at FROM sessions WHERE token = ?',
    )
    .get(token);
  if (!row) return false;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return false;
  }
  db.prepare('UPDATE sessions SET last_seen_at = ? WHERE token = ?').run(
    nowIso(),
    token,
  );
  return true;
};

export const revokeSession = (db: DB, token: string): void => {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
};

export const revokeAllSessions = (db: DB, except?: string): void => {
  if (except) {
    db.prepare('DELETE FROM sessions WHERE token != ?').run(except);
  } else {
    db.prepare('DELETE FROM sessions').run();
  }
};

export const sweepExpiredSessions = (db: DB): void => {
  db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(nowIso());
};

export const SESSION_TTL_SECONDS = SESSION_TTL_MS / 1000;

/** Pull the session token out of a raw Cookie header — no cookie-parser
 *  dependency, the parse is trivial. */
export const sessionTokenFromCookie = (
  cookieHeader: string | undefined,
): string | undefined => {
  if (!cookieHeader) return undefined;
  for (const part of cookieHeader.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === SESSION_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
};
