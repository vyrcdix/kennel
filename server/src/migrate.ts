import { applyMigrations, openDb } from './db.js';

const db = openDb();
applyMigrations(db);
db.close();
console.log('[migrate] done');
