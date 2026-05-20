// Synthetic test fixture for selector tests. Mirrors the seeded server data
// shape but stays tiny and stable. Don't import from production code.

import type { BootstrapPayload } from './fixtures';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
const MIN = 60 * 1000;
const now = () => new Date();
const ago = (ms: number) => new Date(Date.now() - ms);

export const makeTestFixture = (): BootstrapPayload => {
  const projects = [
    {
      id: 'p-kennel',
      slug: 'kennel',
      name: 'Kennel',
      description: 'Personal command center.',
      context: 'context here',
      status: 'active' as const,
      pinned: true,
      rank: 1,
      color: 'moss' as const,
      createdAt: ago(74 * DAY),
      updatedAt: ago(7 * MIN),
    },
    {
      id: 'p-picnic',
      slug: 'picnic-engage',
      name: 'Picnic — Engagement',
      description: 'Q3 outreach.',
      status: 'active' as const,
      pinned: true,
      rank: 2,
      createdAt: ago(168 * DAY),
      updatedAt: ago(2 * HOUR),
    },
    {
      id: 'p-archived',
      slug: 'hardcourt',
      name: 'Hardcourt Passport',
      description: 'Retired.',
      status: 'archived' as const,
      pinned: false,
      rank: 9,
      createdAt: ago(700 * DAY),
      updatedAt: ago(120 * DAY),
    },
  ];

  const items = [
    {
      id: 'i-1',
      projectId: 'p-kennel',
      kind: 'action' as const,
      state: 'active' as const,
      title: 'paused branch wiring',
      rank: 1,
      createdAt: ago(3 * DAY),
      updatedAt: ago(2 * HOUR),
    },
    {
      id: 'i-2',
      projectId: 'p-kennel',
      kind: 'idea' as const,
      state: 'inbox' as const,
      title: 'an inbox thought',
      rank: 2,
      createdAt: ago(2 * HOUR),
      updatedAt: ago(2 * HOUR),
    },
    {
      id: 'i-3',
      projectId: 'p-picnic',
      kind: 'doc' as const,
      state: 'active' as const,
      title: 'Q3 outreach plan',
      rank: 1,
      createdAt: ago(20 * DAY),
      updatedAt: ago(2 * HOUR),
    },
    {
      id: 'i-4',
      projectId: 'p-picnic',
      kind: 'idea' as const,
      state: 'inbox' as const,
      title: 'paused cap at 3 attempts',
      rank: 2,
      createdAt: ago(20 * HOUR),
      updatedAt: ago(20 * HOUR),
    },
  ];

  return {
    projects,
    items,
    docs: [
      {
        id: 'd-1',
        projectId: 'p-picnic',
        title: 'Q3 outreach plan',
        filePath: 'picnic-engage/docs/q3.md',
        body: 'we expect 30% of contacts to enter the paused state',
        revision: 7,
        pinned: true,
        createdAt: ago(20 * DAY),
        updatedAt: ago(2 * HOUR),
      },
    ],
    references: [],
    runbooks: [
      {
        id: 'rb-1',
        projectId: 'p-kennel',
        urls: [],
        revision: 1,
        createdAt: ago(40 * DAY),
        updatedAt: ago(1 * DAY),
      },
    ],
    chats: [
      {
        id: 'c-1',
        projectId: 'p-kennel',
        tagline: 'recent chat',
        status: 'active' as const,
        startedAt: ago(1 * DAY),
        lastSeenAt: ago(2 * HOUR),
        createdAt: ago(1 * DAY),
        updatedAt: ago(2 * HOUR),
      },
      {
        id: 'c-2',
        projectId: 'p-kennel',
        tagline: 'stale chat',
        status: 'active' as const,
        startedAt: ago(80 * DAY),
        lastSeenAt: ago(80 * DAY),
        createdAt: ago(80 * DAY),
        updatedAt: ago(80 * DAY),
      },
    ],
    skills: [
      {
        id: 's-1',
        projectId: 'p-picnic',
        name: 'outreach-cadence',
        slug: 'outreach-cadence',
        source: 'local_path' as const,
        body: '# outreach cadence — paused branch handling',
        revision: 4,
        status: 'active' as const,
        createdAt: ago(45 * DAY),
        updatedAt: ago(6 * DAY),
      },
    ],
    skillProposals: [
      {
        id: 'sp-1',
        skillId: 's-1',
        proposedBody: '# proposed body',
        rationale: 'add paused fallback',
        status: 'pending' as const,
        createdAt: ago(30 * MIN),
      },
    ],
    comments: [],
    activity: [],
    tags: [],
    fieldNotes: [],
    settings: {
      agingThresholdDays: 21,
      filingPromptDays: 0,
      dormantThresholdDays: 60,
      showTemperature: true,
      createdAt: now(),
      updatedAt: now(),
    },
  };
};
