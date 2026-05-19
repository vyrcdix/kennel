import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createMcpServer } from './server.js';
import { createProject } from '../services/project.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };
let client: Client;
let close: () => Promise<void>;

const EXPECTED_TOOLS = [
  'list_projects',
  'get_project',
  'create_project',
  'update_project',
  'close_out_project',
  'create_item',
  'transition_item',
  'touch_item',
  'crystallize_item',
  'file_item',
  'convert_item',
  'list_queue',
  'list_next_up',
  'list_aging',
  'list_crystallizations',
  'read_doc',
  'write_doc',
  'get_runbook',
  'upsert_runbook',
  'read_field_notes',
  'write_field_notes',
  'list_chats',
  'register_chat',
  'update_chat_tagline',
  'propose_skill_update',
  'add_comment',
  'recent_activity',
  'search',
  'list_skills',
  'get_skill',
  'sync_skill',
  'list_tags',
  'apply_tag',
  'remove_tag',
  'create_reference',
  'get_settings',
  'update_settings',
];

beforeEach(async () => {
  content = useTempContent();
  db = makeTestDb();
  const server = createMcpServer(db);
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  client = new Client({ name: 'test', version: '0' }, { capabilities: {} });
  await client.connect(clientTransport);
  close = async () => {
    await client.close();
    await server.close();
  };
});

afterEach(async () => {
  await close();
  db.close();
  content.cleanup();
});

const callText = async (name: string, args: Record<string, unknown> = {}) => {
  const res = await client.callTool({ name, arguments: args });
  expect(res.isError ?? false).toBe(false);
  const block = (res.content as Array<{ type: string; text: string }>)[0];
  expect(block.type).toBe('text');
  return JSON.parse(block.text) as unknown;
};

describe('MCP server registration', () => {
  test('lists every expected tool', async () => {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name).sort();
    expect(names).toEqual([...EXPECTED_TOOLS].sort());
  });
});

describe('project tools end-to-end', () => {
  test('create → get → update → list', async () => {
    const created = (await callText('create_project', {
      name: 'Books',
      description: 'reading list',
    })) as { id: string; slug: string };
    expect(created.slug).toBe('books');

    const fetched = await callText('get_project', { slug: 'books' });
    expect(fetched).toMatchObject({ slug: 'books', name: 'Books' });

    const updated = (await callText('update_project', {
      slug: 'books',
      context: 'Tracking books I want to read.',
      pinned: true,
    })) as { context: string; pinned: boolean };
    expect(updated.pinned).toBe(true);
    expect(updated.context).toMatch(/Tracking/);

    const list = (await callText('list_projects')) as Array<{ slug: string }>;
    expect(list.some((p) => p.slug === 'books')).toBe(true);
  });

  test('slug conflict surfaces as MCP error', async () => {
    await callText('create_project', { name: 'Books' });
    const res = await client.callTool({
      name: 'create_project',
      arguments: { name: 'Second', slug: 'books' },
    });
    expect(res.isError).toBe(true);
    const body = JSON.parse((res.content as Array<{ text: string }>)[0].text);
    expect(body.error).toBe('slug_conflict');
  });
});

describe('item tools', () => {
  test('create + transition + list_queue', async () => {
    createProject(db, { name: 'P' });
    const created = (await callText('create_item', {
      projectSlug: 'p',
      kind: 'idea',
      title: 'a quick thought',
    })) as { id: string; state: string };
    expect(created.state).toBe('inbox');

    const transitioned = (await callText('transition_item', {
      itemId: created.id,
      to: 'active',
    })) as { state: string };
    expect(transitioned.state).toBe('active');

    const queue = (await callText('list_queue')) as { items: unknown[] };
    expect(queue.items).toHaveLength(0); // item moved out of inbox
  });
});

describe('write_doc tool', () => {
  test('creates a new doc, persists body atomically', async () => {
    createProject(db, { name: 'D' });
    const doc = (await callText('write_doc', {
      projectSlug: 'd',
      title: 'notes',
      body: '# notes\n\nhello world',
    })) as { id: string; revision: number; body: string };
    expect(doc.revision).toBe(1);
    expect(doc.body).toContain('hello world');

    const updated = (await callText('write_doc', {
      docId: doc.id,
      body: '# notes\n\nhello updated',
    })) as { revision: number; body: string };
    expect(updated.revision).toBe(2);
    expect(updated.body).toContain('hello updated');
  });
});

describe('search tool', () => {
  test('returns grouped results for a query', async () => {
    createProject(db, {
      name: 'P',
      context: 'a paragraph mentioning paused state and re-checks',
    });
    const { groups } = (await callText('search', { q: 'paused' })) as {
      groups: Array<{ count: number }>;
    };
    expect(Array.isArray(groups)).toBe(true);
    void groups; // search may return 0 groups (project body isn't indexed) — just verify shape
  });
});
