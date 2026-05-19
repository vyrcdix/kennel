import Database from 'better-sqlite3';
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { nowIso } from './time.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = resolve(__dirname, '..', 'migrations');

export type DB = Database.Database;

export const dbPath = (): string => {
  const env = process.env.KENNEL_DB;
  if (env) return env;
  return resolve(__dirname, '..', 'kennel.db');
};

export const openDb = (path: string = dbPath()): DB => {
  const dir = dirname(path);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');
  return db;
};

const ensureMigrationsTable = (db: DB) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name       TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);
};

export const applyMigrations = (db: DB) => {
  ensureMigrationsTable(db);
  const applied = new Set(
    db.prepare('SELECT name FROM migrations').all().map((r: any) => r.name),
  );
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();
  const insertApplied = db.prepare(
    'INSERT INTO migrations (name, applied_at) VALUES (?, ?)',
  );
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf8');
    const tx = db.transaction(() => {
      db.exec(sql);
      insertApplied.run(file, nowIso());
    });
    tx();
    console.log(`[db] applied migration: ${file}`);
  }
};
