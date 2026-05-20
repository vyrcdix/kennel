import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { fromIso, nowIso } from '../time.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { getProjectBySlug } from './project.js';
import type { Chat } from '../../../shared/types.js';

type ChatRow = {
  id: string;
  project_id: string;
  claude_url: string | null;
  tagline: string;
  status: 'active' | 'archived';
  started_at: string;
  last_seen_at: string;
  created_at: string;
  updated_at: string;
};

export const rowToChat = (r: ChatRow): Chat => ({
  id: r.id,
  projectId: r.project_id,
  claudeUrl: r.claude_url ?? undefined,
  tagline: r.tagline,
  status: r.status,
  startedAt: fromIso(r.started_at)!,
  lastSeenAt: fromIso(r.last_seen_at)!,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const listChats = (db: DB): Chat[] =>
  db
    .prepare<[], ChatRow>('SELECT * FROM chats ORDER BY last_seen_at DESC')
    .all()
    .map(rowToChat);

export type RegisterChatInput = {
  projectSlug: string;
  tagline: string;
  claudeUrl?: string;
  startedAt?: string;
};

const TAGLINE_MAX = 140;

export const registerChat = (
  db: DB,
  input: RegisterChatInput,
  actor: 'craig' | 'claude' | 'cli' = 'claude',
): Chat => {
  const tagline = input.tagline?.trim() ?? '';
  if (!tagline) throw validationError({ tagline: 'required' });
  if (tagline.length > TAGLINE_MAX) throw validationError({ tagline: 'too_long' });
  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  const id = newId();
  const now = nowIso();
  const started = input.startedAt ?? now;
  db.prepare(
    `INSERT INTO chats
     (id, project_id, claude_url, tagline, status, started_at, last_seen_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
  ).run(id, project.id, input.claudeUrl ?? null, tagline, started, now, now, now);

  logActivity(db, {
    projectId: project.id,
    verb: 'REGISTERED',
    target: `chat / ${tagline.slice(0, 60)}`,
    payload: input.claudeUrl,
    actor,
    occurredAt: now,
  });
  const row = db.prepare<[string], ChatRow>('SELECT * FROM chats WHERE id = ?').get(id)!;
  return rowToChat(row);
};

export const touchChat = (db: DB, id: string): Chat => {
  const row = db.prepare<[string], ChatRow>('SELECT * FROM chats WHERE id = ?').get(id);
  if (!row) throw notFound('chat', id);
  const now = nowIso();
  db.prepare('UPDATE chats SET last_seen_at = ?, updated_at = ? WHERE id = ?').run(now, now, id);
  return rowToChat({ ...row, last_seen_at: now, updated_at: now });
};

export const setChatUrl = (
  db: DB,
  id: string,
  claudeUrl: string | null,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Chat => {
  const trimmed = claudeUrl?.trim() || null;
  if (trimmed && !/^https?:\/\//.test(trimmed)) {
    throw validationError({ claudeUrl: 'must_be_http_url' });
  }
  const row = db.prepare<[string], ChatRow>('SELECT * FROM chats WHERE id = ?').get(id);
  if (!row) throw notFound('chat', id);
  const now = nowIso();
  db.prepare('UPDATE chats SET claude_url = ?, updated_at = ? WHERE id = ?').run(
    trimmed, now, id,
  );
  logActivity(db, {
    projectId: row.project_id,
    verb: trimmed ? 'LINKED' : 'UNLINKED',
    target: `chat / ${row.tagline.slice(0, 60)}`,
    payload: trimmed ?? undefined,
    actor,
    occurredAt: now,
  });
  return rowToChat({ ...row, claude_url: trimmed, updated_at: now });
};

export const updateChatTagline = (
  db: DB,
  id: string,
  tagline: string,
  actor: 'craig' | 'claude' | 'cli' = 'claude',
): Chat => {
  const trimmed = tagline?.trim() ?? '';
  if (!trimmed) throw validationError({ tagline: 'required' });
  if (trimmed.length > TAGLINE_MAX) throw validationError({ tagline: 'too_long' });
  const row = db.prepare<[string], ChatRow>('SELECT * FROM chats WHERE id = ?').get(id);
  if (!row) throw notFound('chat', id);
  if (row.tagline === trimmed) return rowToChat(row);
  const now = nowIso();
  db.prepare('UPDATE chats SET tagline = ?, last_seen_at = ?, updated_at = ? WHERE id = ?').run(
    trimmed, now, now, id,
  );
  logActivity(db, {
    projectId: row.project_id,
    verb: 'RETAGGED',
    target: `chat / ${trimmed.slice(0, 60)}`,
    actor,
    occurredAt: now,
  });
  return rowToChat({ ...row, tagline: trimmed, last_seen_at: now, updated_at: now });
};
