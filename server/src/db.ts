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

/** Migrations that include the SQLite "12-step" table-rebuild dance
 *  need foreign_keys OFF for the duration, which can't be toggled
 *  inside a transaction. They opt in via a `-- @rebuild` marker in the
 *  first few lines of the file; the runner then disables FK checks
 *  for that migration only, runs PRAGMA foreign_key_check inside the
 *  transaction, and re-enables FK afterwards. */
const REBUILD_MARKER = /^[\s-]*@rebuild\b/m;

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
    const isRebuild = REBUILD_MARKER.test(sql.slice(0, 400));
    if (isRebuild) db.pragma('foreign_keys = OFF');
    try {
      const tx = db.transaction(() => {
        db.exec(sql);
        if (isRebuild) {
          // Rebuilds defer FK checks; verify before commit.
          const violations = db.prepare('PRAGMA foreign_key_check').all();
          if (violations.length > 0) {
            throw new Error(
              `[db] migration ${file} broke foreign keys: ${JSON.stringify(violations)}`,
            );
          }
        }
        insertApplied.run(file, nowIso());
      });
      tx();
    } finally {
      if (isRebuild) db.pragma('foreign_keys = ON');
    }
    console.log(`[db] applied migration: ${file}`);
  }
};
