// Read-only selectors over the fixture store. Pure functions; future-friendly
// for a real API layer where they become async `fetch`s.

import {
  activity,
  chats,
  comments,
  docs,
  guidebookEntries,
  guidebooks,
  items,
  projects,
  references,
  runbooks,
  skillProposals,
  skills,
} from './fixtures';
import { NOW, daysAgo, isStale } from './time';
import type {
  ActivityEntry,
  Chat,
  EntityComment,
  Guidebook,
  GuidebookEntry,
  Item,
  ItemKind,
  Project,
  Reference,
  Runbook,
  Skill,
  SkillProposal,
} from './types';

// ─── Projects ───────────────────────────────────────────────────────────────

export const getProjects = () =>
  [...projects].sort((a, b) => a.rank - b.rank);

export const getPinnedProjects = () =>
  getProjects().filter((p) => p.pinned && p.status !== 'archived');

export const getProjectById = (id: string) => projects.find((p) => p.id === id);

export const getProjectBySlug = (slug: string) =>
  projects.find((p) => p.slug === slug);

export type ProjectCounts = {
  inbox: number;
  active: number;
  reflecting: number;
  crystallized: number;
};

const empty = (): ProjectCounts => ({ inbox: 0, active: 0, reflecting: 0, crystallized: 0 });

const COUNTED_STATES: ReadonlySet<string> = new Set([
  'inbox', 'active', 'reflecting', 'crystallized',
]);

/** Single pass over items[] producing per-project counts for every project.
 *  Callers iterating projects (NavRail, Dashboard, inbox rollup) should use
 *  this and look up by id instead of calling getProjectCounts() per project. */
export const getAllProjectCounts = (): Map<string, ProjectCounts> => {
  const map = new Map<string, ProjectCounts>();
  for (const p of projects) map.set(p.id, empty());
  for (const it of items) {
    const counts = map.get(it.projectId);
    if (!counts || !COUNTED_STATES.has(it.state)) continue;
    counts[it.state as keyof ProjectCounts]++;
  }
  return map;
};

export const getProjectCounts = (projectId: string): ProjectCounts =>
  getAllProjectCounts().get(projectId) ?? empty();

// ─── Items ─────────────────────────────────────────────────────────────────

/** v0.3: rank by recency of touch, then manual rank. */
const touchCmp = (a: Item, b: Item) => {
  const at = (a.lastTouchedAt ?? a.updatedAt).getTime();
  const bt = (b.lastTouchedAt ?? b.updatedAt).getTime();
  if (at !== bt) return bt - at;
  return a.rank - b.rank;
};

export const getNextUp = (projectId?: string, limit = 20) => {
  const candidates = items.filter(
    (it) => it.state === 'active' && (!projectId || it.projectId === projectId),
  );
  return candidates.sort(touchCmp).slice(0, limit);
};

/** Items past the aging threshold (state not in {filed, dismissed, inbox}). */
export const getAgingItems = (thresholdDays: number, projectId?: string) => {
  const cutoff = Date.now() - thresholdDays * 86400_000;
  return items
    .filter(
      (it) =>
        it.state !== 'filed' &&
        it.state !== 'dismissed' &&
        it.state !== 'inbox' &&
        (!projectId || it.projectId === projectId) &&
        (it.lastTouchedAt ?? it.updatedAt).getTime() < cutoff,
    )
    .sort(
      (a, b) =>
        (a.lastTouchedAt ?? a.updatedAt).getTime() -
        (b.lastTouchedAt ?? b.updatedAt).getTime(),
    );
};

/** Items that are crystallizations (kind or state). */
export const getCrystallizations = (projectId?: string) =>
  items
    .filter(
      (it) =>
        (it.kind === 'crystallization' || it.state === 'crystallized') &&
        (!projectId || it.projectId === projectId),
    )
    .sort((a, b) => (b.doneAt ?? b.updatedAt).getTime() - (a.doneAt ?? a.updatedAt).getTime());

/** Items that crystallized in the last 7 days. */
export const getCrystallizedThisWeek = () => {
  const cutoff = Date.now() - 7 * 86400_000;
  return getCrystallizations().filter(
    (it) => (it.doneAt ?? it.updatedAt).getTime() >= cutoff,
  );
};

/** Crystals across all themes — newest first. v0.5 §5 dashboard +
 *  /crystals gallery. */
export const getAllCrystals = () => getCrystallizations();

// ─── v0.5 §D · Three doorways · attached doorways for a crystal ────

/** Docs attached to this crystal via `docs.supports_crystal`. */
export const getDocsForCrystal = (crystalItemId: string) =>
  docs.filter((d) => d.supportsCrystal === crystalItemId);

/** Guidebooks attached via `guidebooks.supports_crystal_item_id`. */
export const getGuidebooksForCrystal = (crystalItemId: string) =>
  guidebooks.filter((g) => g.supportsCrystalItemId === crystalItemId);

/** Project runbooks that point at this crystal. Returns at most one
 *  per project since runbooks are 1:1 with projects today. */
export const getRunbooksForCrystal = (crystalItemId: string) =>
  runbooks.filter((rb) => rb.supportsCrystalItemId === crystalItemId);

/** Field-note sections that attach to this crystal — represented as
 *  `{ projectId, sectionKey }` pairs derived from each per-project
 *  field_notes.supports_crystals JSON map. */
export const getFieldNoteSectionsForCrystal = (crystalItemId: string) => {
  type Edge = {
    projectId: string;
    sectionKey: string;
  };
  const out: Edge[] = [];
  for (const fn of fieldNotes) {
    if (!fn.supportsCrystals) continue;
    for (const [section, id] of Object.entries(fn.supportsCrystals)) {
      if (id === crystalItemId) {
        out.push({ projectId: fn.projectId, sectionKey: section });
      }
    }
  }
  return out;
};

/** Crystals "due to resurface" per v0.5 §B. Compares
 *  `now - lastSurfacedAt` against the user's `resurfaceIntervalDays`
 *  setting (default 30). Crystals without a lastSurfacedAt fall through
 *  to their createdAt (legacy data that the 0010 migration backfilled).
 *  Project filter optional — Dashboard takes everything, theme landing
 *  filters to its own thread. Newest-due first so the dashboard slot
 *  reads as "the next 3 that want a look." */
export const getDueCrystals = (projectId?: string) => {
  const settings = getSettings();
  const intervalMs = (settings.resurfaceIntervalDays ?? 30) * 86400_000;
  const cutoff = Date.now() - intervalMs;
  return getCrystallizations(projectId).filter((c) => {
    const since = (c.lastSurfacedAt ?? c.createdAt).getTime();
    return since <= cutoff;
  });
};

/** Lineage source items for a crystal. Looks up the ids in
 *  item.sourcesFrom and returns whichever ones we can resolve. */
export const getCrystalSources = (crystal: Item) => {
  if (!crystal.sourcesFrom) return [];
  return crystal.sourcesFrom
    .map((sid) => items.find((i) => i.id === sid))
    .filter((i): i is Item => !!i);
};


import { fieldNotes, settings } from './fixtures';
import type { FieldNotes } from './types';

export const getFieldNotes = (projectId: string): FieldNotes | undefined =>
  fieldNotes.find((f) => f.projectId === projectId);

export const getSettings = () => settings.current;

export const getInbox = (projectId?: string) =>
  items
    .filter((it) => it.state === 'inbox' && (!projectId || it.projectId === projectId))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export type InboxRollupRow = { project: Project; count: number };

export const getInboxRollup = (): InboxRollupRow[] => {
  const counts = getAllProjectCounts();
  return getProjects()
    .map((project) => ({ project, count: counts.get(project.id)?.inbox ?? 0 }))
    .filter((r) => r.count > 0)
    .sort((a, b) => b.count - a.count);
};

export const getTotalInboxCount = () => getInbox().length;

export const getItemById = (id: string) => items.find((it) => it.id === id);

export const getProjectItems = (projectId: string, state?: Item['state']) =>
  items
    .filter((it) => it.projectId === projectId && (!state || it.state === state))
    .sort(touchCmp);

/** Latest moment anything in this thread was touched (project update or
 *  any item's lastTouchedAt). Powers the "last touched X ago" header. */
export const getProjectLastTouched = (projectId: string): Date => {
  const project = getProjectById(projectId);
  let max = project?.updatedAt ?? new Date(0);
  for (const it of items) {
    if (it.projectId !== projectId) continue;
    const t = it.lastTouchedAt ?? it.updatedAt;
    if (t.getTime() > max.getTime()) max = t;
  }
  return max;
};

/** Single-pass version that builds the map for every project at once.
 *  O(N items) total instead of O(N) per project. Skips items in dismissed
 *  or filed state — a thread doesn't get warmed by its own retired items.
 *  Threads with no active items get no entry (callers should treat that
 *  as "no signal," not "ancient"). */
export const getAllProjectLastTouched = (): Map<string, Date> => {
  const map = new Map<string, Date>();
  for (const it of items) {
    if (it.state === 'dismissed' || it.state === 'filed') continue;
    const t = it.lastTouchedAt ?? it.updatedAt;
    const current = map.get(it.projectId);
    if (!current || t.getTime() > current.getTime()) map.set(it.projectId, t);
  }
  return map;
};

// ─── Activity ──────────────────────────────────────────────────────────────

export const getActivitySince = (since: Date): ActivityEntry[] =>
  activity
    .filter((a) => a.occurredAt >= since)
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

export const getYesterdayActivity = (limit = 4) =>
  getActivitySince(daysAgo(2)).slice(0, limit);

export const getProjectActivity = (projectId: string, since?: Date) =>
  activity
    .filter((a) => a.projectId === projectId && (!since || a.occurredAt >= since))
    .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());

// ─── Docs ──────────────────────────────────────────────────────────────────

export const getProjectDocs = (projectId: string) =>
  docs.filter((d) => d.projectId === projectId);

export const getPinnedDocs = (projectId: string) =>
  getProjectDocs(projectId).filter((d) => d.pinned);

export const getDocById = (id: string) => docs.find((d) => d.id === id);

/** Default doc for the unparameterised /doc route. */
export const getDefaultDoc = () => docs.find((d) => d.id === 'd-triage-keyboard') ?? docs[0];

export const getDocComments = (docId: string): EntityComment[] =>
  comments
    .filter((c) => c.entityType === 'doc' && c.entityId === docId)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

// ─── References ────────────────────────────────────────────────────────────

export const getReferenceById = (id: string): Reference | undefined =>
  references.find((r) => r.id === id);

export const getProjectReferences = (projectId: string): Reference[] =>
  references
    .filter((r) => r.projectId === projectId)
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

/** Question-kind items for a thread — the entity list behind Field Notes'
 *  managed-mode Open Questions section. Unresolved (not filed/dismissed)
 *  first, then by recency of touch. */
export const getProjectQuestions = (projectId: string): Item[] =>
  items
    .filter((it) => it.projectId === projectId && it.kind === 'question')
    .sort((a, b) => {
      const aOpen = a.state !== 'filed' && a.state !== 'dismissed';
      const bOpen = b.state !== 'filed' && b.state !== 'dismissed';
      if (aOpen !== bOpen) return aOpen ? -1 : 1;
      return touchCmp(a, b);
    });

// ─── Runbooks ──────────────────────────────────────────────────────────────

export const getRunbook = (projectId: string): Runbook | undefined =>
  runbooks.find((r) => r.projectId === projectId);

// ─── Guidebooks ────────────────────────────────────────────────────────────

/** Guidebooks within a topic, ordered by user-defined rank. */
export const getProjectGuidebooks = (projectId: string): Guidebook[] =>
  guidebooks
    .filter((g) => g.projectId === projectId)
    .sort((a, b) => a.rank - b.rank);

/** Pinned subset for the ProjectLanding "Pinned guidebooks" section. */
export const getPinnedGuidebooks = (projectId: string): Guidebook[] =>
  getProjectGuidebooks(projectId).filter((g) => g.pinned);

export const getGuidebookById = (id: string): Guidebook | undefined =>
  guidebooks.find((g) => g.id === id);

/** Entries within one guidebook, in user-defined drag order. */
export const getGuidebookEntries = (guidebookId: string): GuidebookEntry[] =>
  guidebookEntries
    .filter((e) => e.guidebookId === guidebookId)
    .sort((a, b) => a.rank - b.rank);

export const getGuidebookEntryCount = (guidebookId: string): number =>
  guidebookEntries.reduce((n, e) => (e.guidebookId === guidebookId ? n + 1 : n), 0);

// ─── Chats ─────────────────────────────────────────────────────────────────

export type ProjectChats = { active: Chat[]; stale: Chat[] };

export const getProjectChats = (projectId: string): ProjectChats => {
  const all = chats
    .filter((c) => c.projectId === projectId && c.status === 'active')
    .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime());
  return {
    active: all.filter((c) => !isStale(c.lastSeenAt)),
    stale: all.filter((c) => isStale(c.lastSeenAt)),
  };
};

/** Recent non-stale conversations across all projects, newest first. */
export const getRecentChats = (limit = 6): Chat[] =>
  chats
    .filter((c) => c.status === 'active' && !isStale(c.lastSeenAt))
    .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
    .slice(0, limit);

// ─── Skills & proposals ────────────────────────────────────────────────────

export const getSkillById = (id: string) => skills.find((s) => s.id === id);

export const getPendingProposals = () =>
  skillProposals
    .filter((p) => p.status === 'pending')
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

export type ProposalView = {
  proposal: SkillProposal;
  skill: Skill;
  project?: Project;
  chat?: Chat;
};

export const getProposalView = (id?: string): ProposalView | undefined => {
  const proposal = id
    ? skillProposals.find((p) => p.id === id)
    : getPendingProposals()[0];
  if (!proposal) return undefined;
  const skill = getSkillById(proposal.skillId);
  if (!skill) return undefined;
  const project = skill.projectId ? getProjectById(skill.projectId) : undefined;
  const chatId = proposal.triggeredBy?.chatId;
  const chat = chatId ? chats.find((c) => c.id === chatId) : undefined;
  return { proposal, skill, project, chat };
};

// ─── Triage queue (items + proposals interleaved) ──────────────────────────

export type TriageEntry =
  | { kind: 'item'; item: Item; project: Project; capturedAt: Date }
  | { kind: 'proposal'; proposal: SkillProposal; skill: Skill; project?: Project; capturedAt: Date };

export const getTriageQueue = (projectSlug?: string): TriageEntry[] => {
  const project = projectSlug ? getProjectBySlug(projectSlug) : undefined;
  const inboxItems: TriageEntry[] = getInbox(project?.id).map((item) => ({
    kind: 'item' as const,
    item,
    project: getProjectById(item.projectId)!,
    capturedAt: item.createdAt,
  }));
  const proposals: TriageEntry[] = getPendingProposals()
    .filter((p) => {
      if (!project) return true;
      const s = getSkillById(p.skillId);
      return s?.projectId === project.id;
    })
    .map((proposal) => {
      const skill = getSkillById(proposal.skillId)!;
      return {
        kind: 'proposal' as const,
        proposal,
        skill,
        project: skill.projectId ? getProjectById(skill.projectId) : undefined,
        capturedAt: proposal.createdAt,
      };
    });
  return [...inboxItems, ...proposals].sort(
    (a, b) => b.capturedAt.getTime() - a.capturedAt.getTime(),
  );
};

// ─── Workspace counters (NavRail) ──────────────────────────────────────────

export const getTriageBadgeCount = () =>
  getTotalInboxCount() + getPendingProposals().length;

// ─── Search ────────────────────────────────────────────────────────────────

export type SearchHit = {
  kind: ItemKind | 'chat';
  slug: string;
  title: string;
  snippet: string;
  updated: string;
  /** Route or absolute URL to open on Enter / row click. */
  target: string;
  /** True when target is an external claudeUrl. */
  external?: boolean;
};

export type SearchGroup = {
  group: 'Items' | 'Docs' | 'References' | 'Runbooks' | 'Skills' | 'Chats';
  count: number;
  rows: SearchHit[];
};

const haystack = (s: string | undefined) => (s ?? '').toLowerCase();
const matches = (s: string | undefined, q: string) =>
  haystack(s).includes(q.toLowerCase());

const buildProjectSlugMap = (): Map<string, string> =>
  new Map(projects.map((p) => [p.id, p.slug]));

const truncate = (s: string, around: string, span = 120) => {
  const lower = s.toLowerCase();
  const i = lower.indexOf(around.toLowerCase());
  if (i < 0) return s.slice(0, span);
  const start = Math.max(0, i - 40);
  const end = Math.min(s.length, i + around.length + span - 40);
  const left = start > 0 ? '…' : '';
  const right = end < s.length ? '…' : '';
  return `${left}${s.slice(start, end)}${right}`;
};

import { formatRelative } from './time';

export const search = (query: string): SearchGroup[] => {
  const q = query.trim();
  if (!q) return [];
  const slugById = buildProjectSlugMap();
  const slugOf = (id: string) => slugById.get(id) ?? '';

  const itemHits = items
    .filter((it) => matches(it.title, q) || matches(it.body, q))
    .map<SearchHit>((it) => ({
      kind: it.kind,
      slug: slugOf(it.projectId),
      title: it.title,
      snippet: it.body ? truncate(it.body, q) : it.title,
      updated: formatRelative(it.updatedAt),
      target: it.docId ? `/doc/${it.docId}` : `/project/${slugOf(it.projectId)}`,
    }));

  const docHits = docs
    .filter((d) => matches(d.title, q) || matches(d.body, q))
    .map<SearchHit>((d) => ({
      kind: 'doc',
      slug: slugOf(d.projectId),
      title: d.title,
      snippet: truncate(d.body, q),
      updated: `rev ${d.revision}`,
      target: `/doc/${d.id}`,
    }));

  const refHits = references
    .filter((r) => matches(r.label, q) || matches(r.notes, q))
    .map<SearchHit>((r) => ({
      kind: 'ref',
      slug: slugOf(r.projectId),
      title: r.label,
      snippet: r.url ?? '',
      updated: formatRelative(r.updatedAt),
      target: r.url ?? `/project/${slugOf(r.projectId)}`,
      external: !!r.url,
    }));

  const runbookHits = runbooks
    .filter((r) =>
      [r.prerequisites, r.setup, r.run, r.deploy, r.troubleshoot, r.notes].some(
        (s) => matches(s, q),
      ),
    )
    .map<SearchHit>((r) => ({
      kind: 'doc',
      slug: slugOf(r.projectId),
      title: `${getProjectById(r.projectId)?.name} — runbook`,
      snippet: '…matched in runbook sections…',
      updated: `rev ${r.revision}`,
      target: `/runbook/${slugOf(r.projectId)}`,
    }));

  const skillHits = skills
    .filter((s) => matches(s.name, q) || matches(s.body, q))
    .map<SearchHit>((s) => {
      const pending = skillProposals.find(
        (p) => p.skillId === s.id && p.status === 'pending',
      );
      return {
        kind: 'doc',
        slug: s.projectId ? slugOf(s.projectId) : 'global',
        title: s.name,
        snippet: truncate(s.body, q),
        updated: pending ? `rev ${s.revision + 1} pending` : `rev ${s.revision}`,
        target: pending
          ? `/proposal/${pending.id}`
          : s.projectId
            ? `/project/${slugOf(s.projectId)}`
            : '/',
      };
    });

  const chatHits = chats
    .filter((c) => matches(c.tagline, q))
    .map<SearchHit>((c) => ({
      kind: 'chat',
      slug: slugOf(c.projectId),
      title: c.tagline,
      snippet: c.tagline,
      updated: formatRelative(c.lastSeenAt),
      target: c.claudeUrl ?? `/project/${slugOf(c.projectId)}`,
      external: !!c.claudeUrl,
    }));

  const out: SearchGroup[] = [
    { group: 'Items', count: itemHits.length, rows: itemHits.slice(0, 4) },
    { group: 'Docs', count: docHits.length, rows: docHits.slice(0, 4) },
    { group: 'References', count: refHits.length, rows: refHits.slice(0, 4) },
    { group: 'Runbooks', count: runbookHits.length, rows: runbookHits.slice(0, 4) },
    { group: 'Skills', count: skillHits.length, rows: skillHits.slice(0, 4) },
    { group: 'Chats', count: chatHits.length, rows: chatHits.slice(0, 4) },
  ];
  return out.filter((g) => g.count > 0);
};

export type SearchStats = { total: number; elapsedMs: number };

export const searchWithStats = (
  query: string,
): { groups: SearchGroup[]; stats: SearchStats } => {
  const t = performance.now();
  const groups = search(query);
  const total = groups.reduce((sum, g) => sum + g.count, 0);
  return { groups, stats: { total, elapsedMs: Math.max(1, Math.round(performance.now() - t)) } };
};

// NOW re-exported so screens that just need it don't re-import time module.
export { NOW };
