import type { DB } from '../db.js';
import type { ItemKind } from '../../../shared/types.js';

export type SearchHit = {
  kind: ItemKind | 'chat';
  slug: string;
  title: string;
  snippet: string;
  updated: string;
};

export type SearchGroup = {
  group: 'Items' | 'Docs' | 'References' | 'Runbooks' | 'Skills' | 'Chats';
  count: number;
  rows: SearchHit[];
};

// Naïve case-insensitive substring search across the user-typed fields of each
// entity. Future: swap to FTS5 MATCH once we stabilise the query grammar
// (`kind:doc tag:#x "phrase"`). For now this is plenty.
const lc = (s: string | null | undefined) => (s ?? '').toLowerCase();
const truncate = (s: string, around: string, span = 120) => {
  const i = s.toLowerCase().indexOf(around.toLowerCase());
  if (i < 0) return s.slice(0, span);
  const start = Math.max(0, i - 40);
  const end = Math.min(s.length, i + around.length + span - 40);
  return `${start > 0 ? '…' : ''}${s.slice(start, end)}${end < s.length ? '…' : ''}`;
};

type ItemHit = { kind: ItemKind; slug: string; title: string; body: string | null; updated_at: string };
type DocHit = { slug: string; title: string; body_preview: string | null; revision: number };
type RefHit = { kind: 'ref'; slug: string; label: string; url: string | null; notes: string | null; updated_at: string };
type RunbookHit = { project_name: string; slug: string; revision: number };
type SkillHit = { slug: string | null; name: string; body: string; revision: number; project_id: string | null; id: string };
type ChatHit = { slug: string; tagline: string; last_seen_at: string };

export const search = (db: DB, query: string): SearchGroup[] => {
  const q = query.trim();
  if (!q) return [];
  const like = `%${q.replace(/[%_]/g, '\\$&')}%`;

  const items = db
    .prepare<[string, string], ItemHit>(
      `SELECT i.kind, p.slug, i.title, i.body, i.updated_at
       FROM items i JOIN projects p ON p.id = i.project_id
       WHERE LOWER(i.title) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(i.body,'')) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like, like);

  const docs = db
    .prepare<[string, string], DocHit>(
      `SELECT p.slug, d.title, d.body_preview, d.revision
       FROM docs d JOIN projects p ON p.id = d.project_id
       WHERE LOWER(d.title) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(d.body_preview,'')) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like, like);

  const refs = db
    .prepare<[string, string], RefHit>(
      `SELECT 'ref' as kind, p.slug, r.label, r.url, r.notes, r.updated_at
       FROM refs r JOIN projects p ON p.id = r.project_id
       WHERE LOWER(r.label) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(r.notes,'')) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like, like);

  const runbooks = db
    .prepare<[string, string, string, string, string, string], RunbookHit>(
      `SELECT p.name as project_name, p.slug, rb.revision
       FROM runbooks rb JOIN projects p ON p.id = rb.project_id
       WHERE LOWER(IFNULL(rb.prerequisites,'')) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(rb.setup,'')) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(rb.run,'')) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(rb.deploy,'')) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(rb.troubleshoot,'')) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(IFNULL(rb.notes,'')) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like, like, like, like, like, like);

  const skills = db
    .prepare<[string, string], SkillHit>(
      `SELECT s.id, p.slug, s.name, s.body, s.revision, s.project_id
       FROM skills s LEFT JOIN projects p ON p.id = s.project_id
       WHERE LOWER(s.name) LIKE LOWER(?) ESCAPE '\\'
          OR LOWER(s.body) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like, like);

  const pendingSkillIds = new Set(
    db
      .prepare<[], { skill_id: string }>(
        `SELECT skill_id FROM skill_proposals WHERE status = 'pending'`,
      )
      .all()
      .map((r) => r.skill_id),
  );

  const chats = db
    .prepare<[string], ChatHit>(
      `SELECT p.slug, c.tagline, c.last_seen_at
       FROM chats c JOIN projects p ON p.id = c.project_id
       WHERE LOWER(c.tagline) LIKE LOWER(?) ESCAPE '\\'`,
    )
    .all(like);

  const fmtRel = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const hour = 3600_000;
    const day = 24 * hour;
    if (diff < 60_000) return 'just now';
    if (diff < hour) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < day) return `${Math.floor(diff / hour)}h ago`;
    return `${Math.floor(diff / day)}d ago`;
  };

  const groups: SearchGroup[] = [
    {
      group: 'Items',
      count: items.length,
      rows: items.slice(0, 4).map((r) => ({
        kind: r.kind,
        slug: r.slug,
        title: r.title,
        snippet: r.body ? truncate(r.body, q) : r.title,
        updated: fmtRel(r.updated_at),
      })),
    },
    {
      group: 'Docs',
      count: docs.length,
      rows: docs.slice(0, 4).map((r) => ({
        kind: 'doc' as ItemKind,
        slug: r.slug,
        title: r.title,
        snippet: r.body_preview ? truncate(r.body_preview, q) : r.title,
        updated: `rev ${r.revision}`,
      })),
    },
    {
      group: 'References',
      count: refs.length,
      rows: refs.slice(0, 4).map((r) => ({
        kind: 'ref' as ItemKind,
        slug: r.slug,
        title: r.label,
        snippet: r.url ?? r.notes ?? '',
        updated: fmtRel(r.updated_at),
      })),
    },
    {
      group: 'Runbooks',
      count: runbooks.length,
      rows: runbooks.slice(0, 4).map((r) => ({
        kind: 'doc' as ItemKind,
        slug: r.slug,
        title: `${r.project_name} — runbook`,
        snippet: '…matched in runbook sections…',
        updated: `rev ${r.revision}`,
      })),
    },
    {
      group: 'Skills',
      count: skills.length,
      rows: skills.slice(0, 4).map((r) => ({
        kind: 'doc' as ItemKind,
        slug: r.slug ?? 'global',
        title: r.name,
        snippet: truncate(r.body, q),
        updated: pendingSkillIds.has(r.id)
          ? `rev ${r.revision + 1} pending`
          : `rev ${r.revision}`,
      })),
    },
    {
      group: 'Chats',
      count: chats.length,
      rows: chats.slice(0, 4).map((r) => ({
        kind: 'chat' as const,
        slug: r.slug,
        title: r.tagline,
        snippet: r.tagline,
        updated: fmtRel(r.last_seen_at),
      })),
    },
  ];

  void lc;
  return groups.filter((g) => g.count > 0);
};
