// Runtime UI-copy overrides (Option 3). Each instance may carry a copy.json that
// overrides the app's built-in strings per-field; it's read here and shipped in
// the bootstrap payload so editing the file + reloading re-applies copy without
// a rebuild. Default location: <content dir>/copy.json (override with
// KENNEL_COPY_FILE). Missing or malformed → no overrides (safe). See docs/copy.md.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { contentRoot } from '../content.js';

export type CopyOverrides = Record<string, { workshop?: string; life?: string }>;

const copyFilePath = (): string =>
  process.env.KENNEL_COPY_FILE ?? join(contentRoot(), 'copy.json');

export const readCopyOverrides = (): CopyOverrides => {
  const path = copyFilePath();
  if (!existsSync(path)) return {};
  try {
    const raw = JSON.parse(readFileSync(path, 'utf8')) as unknown;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
    const out: CopyOverrides = {};
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const v = value as Record<string, unknown>;
      const entry: { workshop?: string; life?: string } = {};
      if (typeof v.workshop === 'string') entry.workshop = v.workshop;
      if (typeof v.life === 'string') entry.life = v.life;
      if (entry.workshop !== undefined || entry.life !== undefined) out[key] = entry;
    }
    return out;
  } catch {
    return {};
  }
};
