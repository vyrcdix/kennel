import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export const contentRoot = (): string =>
  process.env.KENNEL_CONTENT_DIR
    ? resolve(process.env.KENNEL_CONTENT_DIR)
    : resolve(__dirname, '..', 'content');

export const projectDir = (slug: string): string => join(contentRoot(), slug);
export const docsDir = (slug: string): string => join(projectDir(slug), 'docs');

export const ensureProjectDirs = (slug: string) => {
  const dir = projectDir(slug);
  mkdirSync(join(dir, 'docs'), { recursive: true });
  mkdirSync(join(dir, 'attachments'), { recursive: true });
};

export const removeProjectDir = (slug: string) => {
  const dir = projectDir(slug);
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
};

/** Atomic-ish doc write: temp file + rename. Backup the existing file so an
 *  outer transaction can roll back the filesystem change. Returns a `rollback`
 *  closure that restores the prior content. */
export const writeDocAtomic = (
  filePath: string,
  body: string,
): { rollback: () => void } => {
  mkdirSync(dirname(filePath), { recursive: true });
  const tmpPath = `${filePath}.new`;
  const backupPath = `${filePath}.bak`;
  const hadPrevious = existsSync(filePath);
  writeFileSync(tmpPath, body, 'utf8');
  if (hadPrevious) renameSync(filePath, backupPath);
  renameSync(tmpPath, filePath);
  return {
    rollback: () => {
      if (hadPrevious && existsSync(backupPath)) {
        if (existsSync(filePath)) rmSync(filePath);
        renameSync(backupPath, filePath);
      } else if (existsSync(filePath)) {
        rmSync(filePath);
      }
    },
  };
};

export const commitDocWrite = (filePath: string) => {
  const backupPath = `${filePath}.bak`;
  if (existsSync(backupPath)) rmSync(backupPath);
};

export const readDoc = (filePath: string): string =>
  existsSync(filePath) ? readFileSync(filePath, 'utf8') : '';
