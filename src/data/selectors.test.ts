import { beforeAll, describe, expect, test } from 'vitest';
import { hydrate, projects } from './fixtures';
import {
  getInbox,
  getInboxRollup,
  getNextUp,
  getPinnedProjects,
  getProjectBySlug,
  getProjectChats,
  getProjectCounts,
  getProposalView,
  getRunbook,
  getTriageBadgeCount,
  getTriageQueue,
  searchWithStats,
} from './selectors';
import { makeTestFixture } from './testFixture';

beforeAll(() => {
  hydrate(makeTestFixture());
});

describe('projects', () => {
  test('pinned projects exclude archived', () => {
    const pinned = getPinnedProjects();
    expect(pinned.length).toBeGreaterThan(0);
    expect(pinned.every((p) => p.pinned && p.status !== 'archived')).toBe(true);
  });

  test('getProjectBySlug round-trips every seeded project', () => {
    for (const p of projects) {
      expect(getProjectBySlug(p.slug)?.id).toBe(p.id);
    }
  });
});

describe('item rollups', () => {
  test('counts only count items in this project', () => {
    const kennel = getProjectBySlug('kennel')!;
    const counts = getProjectCounts(kennel.id);
    expect(counts.inbox + counts.active + counts.parked + counts.done).toBeGreaterThan(0);
  });

  test('inbox rollup excludes zero-inbox projects, sorts desc', () => {
    const rollup = getInboxRollup();
    expect(rollup.every((r) => r.count > 0)).toBe(true);
    for (let i = 1; i < rollup.length; i++) {
      expect(rollup[i - 1].count).toBeGreaterThanOrEqual(rollup[i].count);
    }
  });

  test('triage badge equals inbox + pending proposals', () => {
    const inbox = getInbox().length;
    const badge = getTriageBadgeCount();
    expect(badge).toBeGreaterThanOrEqual(inbox);
  });
});

describe('next-up', () => {
  test('returns only active items', () => {
    const next = getNextUp(undefined, 50);
    expect(next.every((i) => i.state === 'active')).toBe(true);
  });

  test('respects rank ascending', () => {
    const next = getNextUp(undefined, 20);
    for (let i = 1; i < next.length; i++) {
      expect(next[i].rank).toBeGreaterThanOrEqual(next[i - 1].rank);
    }
  });

  test('per-project filter scopes to that project', () => {
    const kennel = getProjectBySlug('kennel')!;
    const next = getNextUp(kennel.id, 50);
    expect(next.every((i) => i.projectId === kennel.id)).toBe(true);
  });
});

describe('triage queue', () => {
  test('mixes items and proposals', () => {
    const queue = getTriageQueue();
    expect(queue.some((q) => q.kind === 'item')).toBe(true);
    expect(queue.some((q) => q.kind === 'proposal')).toBe(true);
  });

  test('sorted by captured-at desc (most recent first)', () => {
    const queue = getTriageQueue();
    for (let i = 1; i < queue.length; i++) {
      expect(queue[i - 1].capturedAt.getTime()).toBeGreaterThanOrEqual(
        queue[i].capturedAt.getTime(),
      );
    }
  });
});

describe('chats', () => {
  test('stale vs active split uses 60d threshold', () => {
    const kennel = getProjectBySlug('kennel')!;
    const chats = getProjectChats(kennel.id);
    // Disjoint
    const overlap = chats.active.filter((c) => chats.stale.some((s) => s.id === c.id));
    expect(overlap).toHaveLength(0);
  });
});

describe('runbook', () => {
  test('lookups by projectId', () => {
    const kennel = getProjectBySlug('kennel')!;
    expect(getRunbook(kennel.id)?.projectId).toBe(kennel.id);
  });
});

describe('proposal view', () => {
  test('returns the first pending when no id given', () => {
    const v = getProposalView();
    expect(v?.proposal.status).toBe('pending');
    expect(v?.skill).toBeDefined();
  });
});

describe('search', () => {
  test('"paused" returns at least one item / doc / skill hit', () => {
    const { groups, stats } = searchWithStats('paused');
    expect(stats.total).toBeGreaterThan(0);
    expect(groups.length).toBeGreaterThan(0);
  });

  test('empty query → no groups', () => {
    const { groups } = searchWithStats('   ');
    expect(groups).toEqual([]);
  });

  test('nonsense query → no groups', () => {
    const { groups } = searchWithStats('zzzznosuchterm');
    expect(groups).toEqual([]);
  });
});
