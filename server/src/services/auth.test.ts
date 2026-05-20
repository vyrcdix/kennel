import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb } from '../test-helpers.js';
import {
  checkPassword,
  createSession,
  hashPassword,
  isPasswordSet,
  revokeAllSessions,
  revokeSession,
  setStoredPassword,
  sessionTokenFromCookie,
  sweepExpiredSessions,
  validateSession,
  verifyPassword,
} from './auth.js';
import type { DB } from '../db.js';

let db: DB;
beforeEach(() => {
  db = makeTestDb();
});
afterEach(() => {
  db.close();
});

describe('password hashing', () => {
  test('hash + verify round-trip', () => {
    const { hash, salt } = hashPassword('correct horse battery staple');
    expect(verifyPassword('correct horse battery staple', hash, salt)).toBe(true);
  });

  test('verify rejects the wrong password', () => {
    const { hash, salt } = hashPassword('right');
    expect(verifyPassword('wrong', hash, salt)).toBe(false);
  });

  test('two hashes of the same password differ (random salt)', () => {
    const a = hashPassword('same');
    const b = hashPassword('same');
    expect(a.hash).not.toBe(b.hash);
    expect(a.salt).not.toBe(b.salt);
  });
});

describe('stored password', () => {
  test('isPasswordSet is false until set, true after', () => {
    expect(isPasswordSet(db)).toBe(false);
    setStoredPassword(db, 'hunter2hunter2');
    expect(isPasswordSet(db)).toBe(true);
  });

  test('checkPassword validates against the stored hash', () => {
    setStoredPassword(db, 'hunter2hunter2');
    expect(checkPassword(db, 'hunter2hunter2')).toBe(true);
    expect(checkPassword(db, 'nope')).toBe(false);
  });

  test('checkPassword is false when no password is set', () => {
    expect(checkPassword(db, 'anything')).toBe(false);
  });
});

describe('sessions', () => {
  test('createSession then validateSession', () => {
    const token = createSession(db);
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(validateSession(db, token)).toBe(true);
  });

  test('validateSession rejects unknown / undefined tokens', () => {
    expect(validateSession(db, 'not-a-real-token')).toBe(false);
    expect(validateSession(db, undefined)).toBe(false);
  });

  test('an expired session fails validation and is purged', () => {
    const past = new Date(Date.now() - 1000).toISOString();
    db.prepare(
      'INSERT INTO sessions (token, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?)',
    ).run('stale', past, past, past);
    expect(validateSession(db, 'stale')).toBe(false);
    const row = db.prepare('SELECT token FROM sessions WHERE token = ?').get('stale');
    expect(row).toBeUndefined();
  });

  test('revokeSession invalidates a live session', () => {
    const token = createSession(db);
    revokeSession(db, token);
    expect(validateSession(db, token)).toBe(false);
  });

  test('revokeAllSessions(except) keeps one session alive', () => {
    const keep = createSession(db);
    const drop1 = createSession(db);
    const drop2 = createSession(db);
    revokeAllSessions(db, keep);
    expect(validateSession(db, keep)).toBe(true);
    expect(validateSession(db, drop1)).toBe(false);
    expect(validateSession(db, drop2)).toBe(false);
  });

  test('sweepExpiredSessions removes only expired rows', () => {
    const live = createSession(db);
    const past = new Date(Date.now() - 1000).toISOString();
    db.prepare(
      'INSERT INTO sessions (token, created_at, expires_at, last_seen_at) VALUES (?, ?, ?, ?)',
    ).run('stale', past, past, past);
    sweepExpiredSessions(db);
    expect(validateSession(db, live)).toBe(true);
    expect(
      db.prepare('SELECT token FROM sessions WHERE token = ?').get('stale'),
    ).toBeUndefined();
  });
});

describe('sessionTokenFromCookie', () => {
  test('extracts the steep_session value', () => {
    expect(sessionTokenFromCookie('steep_session=abc123')).toBe('abc123');
    expect(
      sessionTokenFromCookie('other=x; steep_session=abc123; more=y'),
    ).toBe('abc123');
  });

  test('returns undefined when absent or no header', () => {
    expect(sessionTokenFromCookie('other=x')).toBeUndefined();
    expect(sessionTokenFromCookie(undefined)).toBeUndefined();
  });
});
