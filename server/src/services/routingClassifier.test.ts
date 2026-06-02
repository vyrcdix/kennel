// Slice 2 — classifier. Mocks Anthropic at the SDK boundary so no
// real API calls happen in CI. Each test stubs the tool_use response
// and asserts the verdict surface, the confidence-floor downgrade,
// the over-budget short-circuit, and the unavailable-config bail.

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { DB } from '../db.js';
import { makeTestDb } from '../test-helpers.js';
import { createProject } from './project.js';
import { updateSettings } from './settings.js';

// Mock at the module boundary so the classifier sees our stubbed
// client + the original `isAnthropicConfigured` mostly intact (we
// override it per-test via env-var mutation).
const messagesCreate = vi.fn();
vi.mock('./anthropic.js', () => ({
  ANTHROPIC_MODEL: 'claude-sonnet-4-6',
  DEFAULT_MAX_TOKENS: 1024,
  isAnthropicConfigured: () =>
    typeof process.env.ANTHROPIC_API_KEY === 'string' &&
    process.env.ANTHROPIC_API_KEY.length > 0,
  getAnthropicClient: () => ({
    messages: { create: messagesCreate },
  }),
  classifyRaw: vi.fn(),
}));

import { classifyPaste } from './routingClassifier.js';

let db: DB;
const ORIG_KEY = process.env.ANTHROPIC_API_KEY;

beforeEach(() => {
  db = makeTestDb();
  messagesCreate.mockReset();
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
});

afterEach(() => {
  if (ORIG_KEY !== undefined) process.env.ANTHROPIC_API_KEY = ORIG_KEY;
  else delete process.env.ANTHROPIC_API_KEY;
});

const toolUseResponse = (input: unknown) => ({
  content: [
    {
      type: 'tool_use',
      id: 'tu_1',
      name: 'route_content',
      input,
    },
  ],
});

describe('classifyPaste', () => {
  test('returns the classifier verdict on a clean tool call', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    messagesCreate.mockResolvedValueOnce(
      toolUseResponse({
        action: 'doc',
        confidence: 0.91,
        explanation: 'long-form prose',
        payload: { title: 'Spec', body: '# spec\nx' },
      }),
    );
    const result = await classifyPaste(db, {
      projectId: p.id,
      body: '# spec\nx',
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.action).toBe('doc');
    expect(result.confidence).toBe(0.91);
    expect(result.payload).toEqual({ title: 'Spec', body: '# spec\nx' });
  });

  test('rewrites under-confidence picks to bench', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    messagesCreate.mockResolvedValueOnce(
      toolUseResponse({
        action: 'runbook',
        confidence: 0.4,
        explanation: 'maybe a deploy step',
        payload: { section: 'deploy', body: 'x' },
      }),
    );
    const result = await classifyPaste(db, {
      projectId: p.id,
      body: 'kubectl get pods',
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.action).toBe('bench');
    expect(result.explanation).toMatch(/low-confidence/);
    expect(result.explanation).toMatch(/runbook/);
  });

  test('returns over_budget without calling Anthropic when daily cap hit', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    updateSettings(db, { routingDailyCap: 1 });
    // Insert one routing row so countRoutingsToday returns 1.
    db.prepare(
      `INSERT INTO routings
         (id, project_id, source_kind, raw_content,
          classifier_action, over_ai_budget, artefact_kind, artefact_id, created_at)
       VALUES (?, ?, 'paste', 'x', 'bench', 0, 'item', 'i', ?)`,
    ).run('r-existing', p.id, new Date().toISOString());

    const result = await classifyPaste(db, {
      projectId: p.id,
      body: 'anything',
    });
    expect(result.kind).toBe('over_budget');
    expect(messagesCreate).not.toHaveBeenCalled();
  });

  test('returns unavailable when ANTHROPIC_API_KEY is unset', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    delete process.env.ANTHROPIC_API_KEY;
    const result = await classifyPaste(db, {
      projectId: p.id,
      body: 'x',
    });
    expect(result.kind).toBe('unavailable');
    expect(messagesCreate).not.toHaveBeenCalled();
  });

  test('falls back to bench when the response has no tool_use', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    messagesCreate.mockResolvedValueOnce({
      content: [{ type: 'text', text: 'hello' }],
    });
    const result = await classifyPaste(db, {
      projectId: p.id,
      body: 'x',
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.action).toBe('bench');
  });

  test('falls back to bench when action is unknown', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    messagesCreate.mockResolvedValueOnce(
      toolUseResponse({
        action: 'mystery',
        confidence: 0.99,
        explanation: 'shrug',
        payload: {},
      }),
    );
    const result = await classifyPaste(db, {
      projectId: p.id,
      body: 'x',
    });
    expect(result.kind).toBe('ok');
    if (result.kind !== 'ok') return;
    expect(result.action).toBe('bench');
  });

  test('passes the user hint through into the user message', async () => {
    const p = createProject(db, { name: 'P', slug: 'p' });
    messagesCreate.mockResolvedValueOnce(
      toolUseResponse({
        action: 'guidebook',
        confidence: 0.8,
        explanation: 'matches the hint',
        payload: { name: 'A' },
      }),
    );
    await classifyPaste(db, {
      projectId: p.id,
      body: 'check this link',
      hint: 'guidebook',
    });
    const args = messagesCreate.mock.calls[0][0] as {
      messages: { content: string }[];
    };
    expect(args.messages[0].content).toMatch(/hint: "guidebook"/);
  });
});
