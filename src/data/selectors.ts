// Read-only selectors over the fixture store. Pure functions; future-friendly
// for a real API layer where they become async `fetch`s.

import {
  activity,
  chats,
  comments,
  docs,
  entityTags,
  guidebookEntries,
  guidebooks,
  items,
  projects,
  references,
  routings,
  runbooks,
  skillProposals,
  skills,
  tags,
} from './fixtures';
import { NOW, daysAgo, isStale } from './time';
import { cadenceSortCmp, isCadence, isCooled, windowOpen } from '../lib/cadence';
import type {
  ActivityEntry,
  Chat,
  EntityComment,
  EntityType,
  Guidebook,
  GuidebookEntry,
  Item,
  ItemKind,
  Project,
  Reference,
  Runbook,
  Skill,
  SkillProposal,
  Tag,
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
  // Cadences are suppressed from In-focus — they surface only in the
  // dashboard "Do this week" slot (B1 dedup rule).
  const candidates = items.filter(
    (it) =>
      it.state === 'active' &&
      !it.cadence &&
      (!projectId || it.projectId === projectId),
  );
  return candidates.sort(touchCmp).slice(0, limit);
};

// ── Cadence (recurring actions) ──────────────────────────────────────────
/** Active cadences whose window is open and which haven't cooled — the
 *  dashboard "Do this week" slot. Ordered by commitment then vitality. */
export const getCadencesDueThisWeek = (projectId?: string): Item[] => {
  const settings = getSettings();
  const now = new Date();
  return items
    .filter(
      (it) =>
        isCadence(it) &&
        it.state === 'active' &&
        (!projectId || it.projectId === projectId) &&
        windowOpen(it, now) &&
        !isCooled(it, settings, now),
    )
    .sort((a, b) => cadenceSortCmp(a, b, now));
};

/** Cadences past their cooling tolerance — the Aging "Cooled cadences" panel. */
export const getCooledCadences = (projectId?: string): Item[] => {
  const settings = getSettings();
  const now = new Date();
  return items.filter(
    (it) =>
      isCadence(it) &&
      (!projectId || it.projectId === projectId) &&
      isCooled(it, settings, now),
  );
};

/** Cadences attached to (serving) a crystal/idea — its "Kept warm by" panel. */
export const getCadencesServing = (itemId: string): Item[] =>
  items.filter((it) => isCadence(it) && it.servesId === itemId);

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

/** Items set aside into `reflecting`, longest-shelved first. The
 *  Reflecting lens lists these for deliberate re-triage — without it,
 *  set-aside items only resurface by accident (aging past threshold). */
export const getReflectingItems = (projectId?: string) =>
  items
    .filter(
      (it) =>
        it.state === 'reflecting' && (!projectId || it.projectId === projectId),
    )
    .sort(
      (a, b) =>
        (a.lastTouchedAt ?? a.updatedAt).getTime() -
        (b.lastTouchedAt ?? b.updatedAt).getTime(),
    );

export const getTotalReflectingCount = () => getReflectingItems().length;

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

// ─── v0.5 §F · Trace timeline ──────────────────────────────────────

export type TraceEntry =
  | { type: 'crystal'; occurredAt: Date; item: Item }
  | { type: 'discarded'; occurredAt: Date; item: Item }
  | { type: 'spark'; occurredAt: Date; item: Item }
  | { type: 'fork'; occurredAt: Date; parentId: string; branches: Item[] }
  | {
      type: 'cluster';
      occurredAt: Date;
      projectId: string;
      kind: ItemKind;
      items: Item[];
    }
  | { type: 'chat'; occurredAt: Date; chat: Chat };

const sameCalendarDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const calendarDayKey = (d: Date) =>
  `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

/** Build a thread's trace timeline per v0.5 §F. Derived entirely from
 *  the cached items + chats + sources_from edges; no separate Trace
 *  storage.
 *
 *  Categorisation rules:
 *  - `discarded` = items in state `dismissed` only. Filed items render
 *    as a regular spark with a small "filed" marker (handled by the
 *    view, not here).
 *  - `crystal`  = kind='crystallization' or state='crystallized'.
 *  - `cluster`  = items sharing project + same calendar day + same
 *    kind, with no crystallisation among them. Collapsed into one node.
 *  - `fork`     = two-or-more items whose `sourcesFrom` references the
 *    same parent item. The fork groups the children together.
 *  - `spark`    = anything else (kind='idea' is the canonical example). */
export const getProjectTrace = (projectId: string): TraceEntry[] => {
  const itemsHere = items.filter((it) => it.projectId === projectId);
  const chatsHere = chats.filter((c) => c.projectId === projectId);

  // 1. Crystals + discarded items: rendered individually, never clustered.
  const crystals: TraceEntry[] = itemsHere
    .filter(
      (it) => it.kind === 'crystallization' || it.state === 'crystallized',
    )
    .map((it) => ({
      type: 'crystal' as const,
      occurredAt: it.doneAt ?? it.lastSurfacedAt ?? it.createdAt,
      item: it,
    }));
  const discarded: TraceEntry[] = itemsHere
    .filter((it) => it.state === 'dismissed')
    .map((it) => ({
      type: 'discarded' as const,
      occurredAt: it.archivedAt ?? it.updatedAt,
      item: it,
    }));

  // 2. Fork detection — two-plus children of the same parent via
  //    sources_from. Children are anything in the thread that isn't
  //    already represented as a crystal/discarded entry above.
  const forkChildren = new Map<string, Item[]>();
  for (const it of itemsHere) {
    if (!it.sourcesFrom) continue;
    for (const parent of it.sourcesFrom) {
      const list = forkChildren.get(parent) ?? [];
      list.push(it);
      forkChildren.set(parent, list);
    }
  }
  const groupedIntoFork = new Set<string>();
  const forks: TraceEntry[] = [];
  for (const [parentId, children] of forkChildren) {
    if (children.length < 2) continue;
    for (const c of children) groupedIntoFork.add(c.id);
    const newest = children.reduce(
      (a, b) => (a.createdAt > b.createdAt ? a : b),
    );
    forks.push({
      type: 'fork',
      occurredAt: newest.createdAt,
      parentId,
      branches: children,
    });
  }

  // 3. Cluster / spark for everything that isn't a crystal, discard,
  //    or part of a fork. Cluster key = `${day}|${kind}`.
  const ungrouped = itemsHere.filter(
    (it) =>
      !(it.kind === 'crystallization' || it.state === 'crystallized') &&
      it.state !== 'dismissed' &&
      !groupedIntoFork.has(it.id),
  );
  const buckets = new Map<string, Item[]>();
  for (const it of ungrouped) {
    const key = `${calendarDayKey(it.createdAt)}|${it.kind}`;
    const list = buckets.get(key) ?? [];
    list.push(it);
    buckets.set(key, list);
  }
  const sparks: TraceEntry[] = [];
  const clusters: TraceEntry[] = [];
  for (const [, group] of buckets) {
    if (group.length === 1) {
      const it = group[0];
      sparks.push({
        type: 'spark',
        occurredAt: it.createdAt,
        item: it,
      });
    } else {
      const newest = group.reduce(
        (a, b) => (a.createdAt > b.createdAt ? a : b),
      );
      clusters.push({
        type: 'cluster',
        occurredAt: newest.createdAt,
        projectId,
        kind: group[0].kind,
        items: group,
      });
    }
  }

  // 4. Chats — every chat is its own entry, no clustering.
  const chatEntries: TraceEntry[] = chatsHere.map((c) => ({
    type: 'chat' as const,
    occurredAt: c.lastSeenAt ?? c.createdAt,
    chat: c,
  }));

  return [
    ...crystals,
    ...discarded,
    ...forks,
    ...sparks,
    ...clusters,
    ...chatEntries,
  ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
};

// Defensive use of sameCalendarDay for future extension; the current
// implementation uses calendarDayKey, but we keep the helper exposed
// so other selectors can opt into the same boundary.
export const _sameCalendarDay = sameCalendarDay;

// ─── Smart Routing (Phase 0 slice 4) ──────────────────────────────

/** Recently routed entries for one thread, newest first. The
 *  RecentlySortedStrip on ProjectLanding renders the top N. */
export const getProjectRoutings = (projectId: string, days = 7) => {
  const cutoff = Date.now() - days * 86400_000;
  return routings
    .filter(
      (r) => r.projectId === projectId && r.createdAt.getTime() >= cutoff,
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
};

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

// ─── Inbound edges (Connections) ───────────────────────────────────
// Every edge below already exists in the data; these selectors surface
// the reverse direction so entities can show what points AT them.

/** Actions/items attached to this crystal / idea via serves_id.
 *  Pass `'thread:<projectId>'` for thread-anchored actions. Retired
 *  items (filed/dismissed) drop out — they no longer serve anything. */
export const getItemsServing = (servesId: string) =>
  items
    .filter(
      (it) =>
        it.servesId === servesId &&
        it.state !== 'filed' &&
        it.state !== 'dismissed',
    )
    .sort(touchCmp);

/** Crystals whose sources_from lineage includes this entity (item, doc,
 *  or reference id) — i.e. "this fed these crystals." */
export const getCrystalsBuiltFrom = (sourceId: string) =>
  getCrystallizations().filter((c) => c.sourcesFrom?.includes(sourceId));

/** The item a doc backs (items.doc_id), if any. */
export const getItemBackedByDoc = (docId: string) =>
  items.find((it) => it.docId === docId);

/** Guidebook memberships for a doc — which spines include it. */
export const getGuidebooksContainingDoc = (docId: string) => {
  const out: { guidebook: Guidebook; entry: GuidebookEntry }[] = [];
  for (const e of guidebookEntries) {
    if (e.source.kind !== 'doc' || e.source.docId !== docId) continue;
    const guidebook = guidebooks.find((g) => g.id === e.guidebookId);
    if (guidebook) out.push({ guidebook, entry: e });
  }
  return out;
};

/** Guidebook memberships for a reference. */
export const getGuidebooksContainingReference = (referenceId: string) => {
  const out: { guidebook: Guidebook; entry: GuidebookEntry }[] = [];
  for (const e of guidebookEntries) {
    if (e.source.kind !== 'reference' || e.source.referenceId !== referenceId)
      continue;
    const guidebook = guidebooks.find((g) => g.id === e.guidebookId);
    if (guidebook) out.push({ guidebook, entry: e });
  }
  return out;
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

export const getGuidebookEntryById = (entryId: string) =>
  guidebookEntries.find((e) => e.id === entryId);

// ─── Shared tags ───────────────────────────────────────────────────────────

export const getAllTags = (): Tag[] =>
  [...tags].sort((a, b) => a.name.localeCompare(b.name));

export const getTagById = (id: string): Tag | undefined =>
  tags.find((t) => t.id === id);

/** Shared tags applied to one entity, alphabetical. */
export const getTagsFor = (entityType: EntityType, entityId: string): Tag[] =>
  entityTags
    .filter((et) => et.entityType === entityType && et.entityId === entityId)
    .map((et) => getTagById(et.tagId))
    .filter((t): t is Tag => !!t)
    .sort((a, b) => a.name.localeCompare(b.name));

/** Entity ids of one type carrying a given tag — for filtering lists. */
export const getEntityIdsWithTag = (
  entityType: EntityType,
  tagId: string,
): Set<string> => {
  const out = new Set<string>();
  for (const et of entityTags) {
    if (et.entityType === entityType && et.tagId === tagId) out.add(et.entityId);
  }
  return out;
};

/** Tags in use, with usage counts — drives filter chip rows. Pass an
 *  entityType to count only that type's assignments; a filter UI that
 *  matches items must not advertise doc-only tags. */
export const getTagUsage = (
  entityType?: EntityType,
): { tag: Tag; count: number }[] => {
  const counts = new Map<string, number>();
  for (const et of entityTags) {
    if (entityType && et.entityType !== entityType) continue;
    counts.set(et.tagId, (counts.get(et.tagId) ?? 0) + 1);
  }
  return getAllTags()
    .map((tag) => ({ tag, count: counts.get(tag.id) ?? 0 }))
    .filter((u) => u.count > 0);
};

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
  if (!query.trim()) return [];

  // `tag:#name` / `tag:name` filter — restricts taggable entities
  // (items, docs, references, runbooks) to those carrying the tag.
  // The rest of the query matches as before; a bare `tag:x` query
  // returns everything with that tag.
  const tagNames: string[] = [];
  const q = query
    .replace(/\btag:#?([a-z0-9-]+)/gi, (_m, name: string) => {
      tagNames.push(name.toLowerCase());
      return '';
    })
    .replace(/\s+/g, ' ') // collapse the gap a stripped token leaves
    .trim();
  const tagIds =
    tagNames.length > 0
      ? new Set(tags.filter((t) => tagNames.includes(t.name)).map((t) => t.id))
      : null;
  const taggedIds = (entityType: EntityType): Set<string> | null => {
    if (!tagIds) return null;
    const out = new Set<string>();
    for (const et of entityTags) {
      if (et.entityType === entityType && tagIds.has(et.tagId)) {
        out.add(et.entityId);
      }
    }
    return out;
  };
  const taggedItems = taggedIds('item');
  const taggedDocs = taggedIds('doc');
  const taggedRefs = taggedIds('reference');
  const taggedRunbooks = taggedIds('runbook');

  const slugById = buildProjectSlugMap();
  const slugOf = (id: string) => slugById.get(id) ?? '';

  const itemHits = items
    .filter((it) => !taggedItems || taggedItems.has(it.id))
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
    .filter((d) => !taggedDocs || taggedDocs.has(d.id))
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
    .filter((r) => !taggedRefs || taggedRefs.has(r.id))
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
    .filter((r) => !taggedRunbooks || taggedRunbooks.has(r.id))
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

  // Skills + chats aren't taggable; a tag-filtered search excludes them.
  const skillHits = (tagIds ? [] : skills)
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

  const chatHits = (tagIds ? [] : chats)
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
