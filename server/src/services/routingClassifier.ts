// Smart Routing — the brain. Builds a per-thread context block,
// pushes the pasted content through Anthropic with a tool-use
// structured output schema, and returns the verdict.
//
// Three escape hatches before any API call:
//   1. ANTHROPIC_API_KEY unset → `{kind: 'unavailable'}` so the
//      route returns 503 cleanly.
//   2. Over the per-day cap → `{kind: 'over_budget'}` so the caller
//      can still dispatch to bench.
//   3. After the call: low confidence → rewrite action to 'bench'
//      with the original action preserved in `explanation`.

import type { DB } from '../db.js';
import {
  ANTHROPIC_MODEL,
  DEFAULT_MAX_TOKENS,
  getAnthropicClient,
  isAnthropicConfigured,
} from './anthropic.js';
import { listGuidebooksByProject } from './guidebook.js';
import { getRunbookByProject } from './runbook.js';
import { getFieldNotesByProject } from './fieldNotes.js';
import { getProjectById } from './project.js';
import { countRoutingsToday } from './routing.js';
import { getSettings } from './settings.js';
import type {
  RoutingAction,
} from '../../../shared/types.js';

const VALID_ACTIONS: RoutingAction[] = [
  'bench',
  'doc',
  'guidebook',
  'runbook',
  'field-notes',
];

const RUNBOOK_SECTIONS = [
  'prerequisites',
  'setup',
  'run',
  'deploy',
  'troubleshoot',
  'notes',
];

const FIELD_NOTES_SECTIONS = [
  'premise',
  'whatIKnow',
  'openQuestions',
  'sources',
  'crystallizations',
];

const ROUTING_TOOL_NAME = 'route_content';

const ROUTING_TOOL_SCHEMA = {
  type: 'object' as const,
  required: ['action', 'confidence', 'explanation', 'payload'] as const,
  properties: {
    action: {
      type: 'string' as const,
      enum: VALID_ACTIONS,
      description: 'Where this content should land in Steep.',
    },
    confidence: {
      type: 'number' as const,
      minimum: 0,
      maximum: 1,
      description:
        'Your confidence in the chosen action. Drop below 0.55 and the user will sort manually instead.',
    },
    explanation: {
      type: 'string' as const,
      maxLength: 240,
      description:
        'A one-sentence rationale that surfaces on the Recently sorted strip.',
    },
    payload: {
      type: 'object' as const,
      description:
        'Action-specific input. See the system prompt for the shape per action.',
    },
  },
} as const;

const SYSTEM_PROMPT = `You are Steep's content router. A user has pasted a chunk of
material into a thread; pick where it should land based on the thread's
context. Always call the route_content tool; never reply with prose.

Actions and their payload shapes:

- "bench" — context-free thought, todo, or fragment.
  payload: { title?: string, body?: string }
  Default when uncertain.

- "doc" — long-form prose worth its own document.
  payload: { title: string, body: string }
  Title is short (<= 80 chars). Body is the full markdown content.

- "guidebook" — a recommended reading or annotated link for this topic.
  payload: { guidebookId?: string, name?: string, description?: string, tags?: string[] }
  Pick from the guidebook list below if a match is obvious; omit to use
  the most recently touched. Name is the spine title (default: the
  content's title).

- "runbook" — operational notes, commands, deploy steps, troubleshooting.
  payload: { section: "prerequisites"|"setup"|"run"|"deploy"|"troubleshoot"|"notes", body: string }
  Pick the section the content best fits. Body is the markdown to
  append (no divider — the dispatcher adds a dated divider above).

- "field-notes" — first-person observation, hunch, or open question.
  payload: { section: "premise"|"whatIKnow"|"openQuestions"|"sources"|"crystallizations", body: string }
  Same body rules as runbook.

Confidence guidance:
- 0.85+ — strong fit on action AND payload shape.
- 0.60–0.85 — confident on action; some uncertainty in payload.
- 0.40–0.60 — could be two things; pick the better one but score honestly.
- below 0.40 — bench it.

When the user provides a hint, treat it as a strong prior. Override
only with high confidence and explain why in the explanation field.`;

export type ClassifierVerdict =
  | { kind: 'ok'; action: RoutingAction; confidence: number; explanation: string; payload: unknown }
  | { kind: 'over_budget' }
  | { kind: 'unavailable' };

const composeThreadContext = (db: DB, projectId: string): string => {
  const project = getProjectById(db, projectId);
  if (!project) return 'Thread context unavailable.';

  const guidebooks = listGuidebooksByProject(db, project.slug);
  const runbook = getRunbookByProject(db, project.id);
  const fieldNotes = getFieldNotesByProject(db, project.id);

  const guidebookLines = guidebooks.length
    ? guidebooks
        .map(
          (g) =>
            `  - ${g.id} · "${g.name}"${g.description ? ` — ${g.description.slice(0, 120)}` : ''}`,
        )
        .join('\n')
    : '  (none)';

  const runbookSections = runbook
    ? RUNBOOK_SECTIONS.filter(
        (s) => typeof (runbook as Record<string, unknown>)[s] === 'string' && ((runbook as Record<string, string | null>)[s] ?? '').trim(),
      )
    : [];
  const runbookSummary = runbook
    ? runbookSections.length
      ? `present · sections with content: ${runbookSections.join(', ')}`
      : 'present · empty'
    : 'none';

  const fieldNotesSections = fieldNotes
    ? FIELD_NOTES_SECTIONS.filter(
        (s) => typeof (fieldNotes as Record<string, unknown>)[s] === 'string' && ((fieldNotes as Record<string, string | null>)[s] ?? '').trim(),
      )
    : [];
  const fieldNotesSummary = fieldNotes
    ? `mode=${fieldNotes.mode}; sections with content: ${fieldNotesSections.length ? fieldNotesSections.join(', ') : '(none)'}`
    : 'none';

  return [
    `Thread: ${project.slug} — ${project.name}`,
    project.description ? `Description: ${project.description}` : null,
    project.context ? `Context: ${project.context.slice(0, 800)}` : null,
    ``,
    `Guidebooks (id · name — description):`,
    guidebookLines,
    ``,
    `Runbook: ${runbookSummary}`,
    `Field notes: ${fieldNotesSummary}`,
  ]
    .filter(Boolean)
    .join('\n');
};

const composeUserMessage = (
  body: string,
  hint?: RoutingAction,
): string => {
  const hintLine =
    hint != null
      ? `\nUser hint: "${hint}". Use this as a strong prior; only override with high confidence.\n`
      : '';
  return `${hintLine}\nPasted content:\n\n${body}`;
};

const safeParseAction = (raw: unknown): RoutingAction | null => {
  if (typeof raw !== 'string') return null;
  return (VALID_ACTIONS as string[]).includes(raw)
    ? (raw as RoutingAction)
    : null;
};

const safeParseConfidence = (raw: unknown): number => {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return 0;
  return Math.min(1, Math.max(0, raw));
};

/** Apply the confidence threshold from Settings. Under-threshold
 *  results get rewritten to 'bench' with the original action recorded
 *  in `explanation` ("low-confidence; would have routed to runbook"). */
const applyConfidenceFloor = (
  raw: { action: RoutingAction; confidence: number; explanation: string; payload: unknown },
  threshold: number,
): { action: RoutingAction; confidence: number; explanation: string; payload: unknown } => {
  if (raw.confidence >= threshold) return raw;
  return {
    action: 'bench',
    confidence: raw.confidence,
    explanation: `low-confidence (${raw.confidence.toFixed(2)} < ${threshold.toFixed(2)}); would have routed to ${raw.action}. ${raw.explanation}`.trim(),
    payload: { body: typeof (raw.payload as { body?: string })?.body === 'string' ? (raw.payload as { body: string }).body : undefined },
  };
};

/** Pull the first tool_use block out of the SDK response. */
const extractToolUse = (response: {
  content: Array<
    | { type: 'tool_use'; id: string; name: string; input: unknown }
    | { type: 'text'; text: string }
    | { type: string }
  >;
}): { input: unknown } | null => {
  for (const block of response.content) {
    if (block.type === 'tool_use' && (block as { name: string }).name === ROUTING_TOOL_NAME) {
      return { input: (block as { input: unknown }).input };
    }
  }
  return null;
};

export type ClassifyPasteInput = {
  projectId: string;
  body: string;
  hint?: RoutingAction;
};

export const classifyPaste = async (
  db: DB,
  input: ClassifyPasteInput,
): Promise<ClassifierVerdict> => {
  if (!isAnthropicConfigured()) return { kind: 'unavailable' };

  const settings = getSettings(db);
  if (countRoutingsToday(db) >= settings.routingDailyCap) {
    return { kind: 'over_budget' };
  }

  const cachedContext = composeThreadContext(db, input.projectId);
  const userMessage = composeUserMessage(input.body, input.hint);

  // The classifyRaw shim from anthropic.ts was built for non-tool
  // calls; here we hit messages.create directly because we need the
  // tools field. The shim stays available for future non-structured
  // calls.
  const client = getAnthropicClient();
  const response = (await client.messages.create({
    model: ANTHROPIC_MODEL,
    max_tokens: DEFAULT_MAX_TOKENS,
    system: [
      { type: 'text', text: SYSTEM_PROMPT },
      {
        type: 'text',
        text: cachedContext,
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [
      {
        name: ROUTING_TOOL_NAME,
        description: 'Decide where the pasted content lands.',
        input_schema: ROUTING_TOOL_SCHEMA,
      },
    ],
    tool_choice: { type: 'tool', name: ROUTING_TOOL_NAME },
    messages: [{ role: 'user', content: userMessage }],
  } as Parameters<typeof client.messages.create>[0])) as {
    content: Array<{ type: string }>;
  };

  const toolUse = extractToolUse(
    response as Parameters<typeof extractToolUse>[0],
  );
  if (!toolUse) {
    // Model didn't call the tool — treat as low-confidence bench.
    return {
      kind: 'ok',
      action: 'bench',
      confidence: 0,
      explanation: 'classifier returned no tool call; bench fallback',
      payload: { body: input.body },
    };
  }

  const result = toolUse.input as {
    action?: unknown;
    confidence?: unknown;
    explanation?: unknown;
    payload?: unknown;
  };

  const action = safeParseAction(result.action);
  if (!action) {
    return {
      kind: 'ok',
      action: 'bench',
      confidence: 0,
      explanation: 'classifier returned invalid action; bench fallback',
      payload: { body: input.body },
    };
  }
  const confidence = safeParseConfidence(result.confidence);
  const explanation =
    typeof result.explanation === 'string'
      ? result.explanation.slice(0, 240)
      : '';
  const payload = (result.payload ?? {}) as unknown;

  const final = applyConfidenceFloor(
    { action, confidence, explanation, payload },
    settings.routingConfidenceThreshold,
  );

  return {
    kind: 'ok',
    action: final.action,
    confidence: final.confidence,
    explanation: final.explanation,
    payload: final.payload,
  };
};
