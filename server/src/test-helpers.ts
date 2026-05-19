import Database from 'better-sqlite3';
import { readFileSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import type { DB } from './db.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '..', 'migrations');

export const makeTestDb = (): DB => {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort()) {
    db.exec(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
  }
  return db;
};

export const useTempContent = (): { cleanup: () => void } => {
  const dir = mkdtempSync(join(tmpdir(), 'kennel-test-'));
  const prev = process.env.KENNEL_CONTENT_DIR;
  process.env.KENNEL_CONTENT_DIR = dir;
  return {
    cleanup: () => {
      if (prev) process.env.KENNEL_CONTENT_DIR = prev;
      else delete process.env.KENNEL_CONTENT_DIR;
      rmSync(dir, { recursive: true, force: true });
    },
  };
};
