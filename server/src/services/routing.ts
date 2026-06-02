// Smart Routing — persistence + read selectors. The write path
// (createPasteRouting / the email equivalent) lands in slice 2 with
// the classifier + dispatcher; slice 1 ships the row shape, the row
// mapper, and the two read selectors that drive the Recently sorted
// strip and individual routing lookups.

import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { fromIso, nowIso } from '../time.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { classifyPaste, type ClassifierVerdict } from './routingClassifier.js';
import { dispatch, type DispatchPayloads } from './routingDispatcher.js';
import { getProjectBySlug } from './project.js';
import type {
  Routing,
  RoutingAction,
  RoutingArtefactKind,
  RoutingSourceKind,
} from '../../../shared/types.js';

type RoutingRow = {
  id: string;
  project_id: string;
  source_kind: RoutingSourceKind;
  source_meta: string | null;
  raw_content: string;
  hint: RoutingAction | null;
  classifier_action: RoutingAction;
  classifier_confidence: number | null;
  classifier_explanation: string | null;
  over_ai_budget: number;
  artefact_kind: RoutingArtefactKind;
  artefact_id: string;
  rejected_at: string | null;
  created_at: string;
};

/** Defensive parse for source_meta — corrupt JSON yields undefined
 *  rather than crashing the strip. */
const parseSourceMeta = (raw: string | null): Routing['sourceMeta'] => {
  if (!raw) return undefined;
  try {
    const v = JSON.parse(raw);
    if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
    const sender =
      typeof (v as { sender?: unknown }).sender === 'string'
        ? ((v as { sender: string }).sender as string)
        : undefined;
    if (!sender) return undefined;
    return { sender };
  } catch {
    return undefined;
  }
};

export const rowToRouting = (r: RoutingRow): Routing => ({
  id: r.id,
  projectId: r.project_id,
  sourceKind: r.source_kind,
  sourceMeta: parseSourceMeta(r.source_meta),
  rawContent: r.raw_content,
  hint: r.hint ?? undefined,
  classifier: {
    action: r.classifier_action,
    confidence: r.classifier_confidence ?? undefined,
    explanation: r.classifier_explanation ?? undefined,
    overAiBudget: r.over_ai_budget === 1,
  },
  artefact: {
    kind: r.artefact_kind,
    id: r.artefact_id,
  },
  rejectedAt: fromIso(r.rejected_at),
  createdAt: fromIso(r.created_at)!,
});

export const getRoutingById = (db: DB, id: string): Routing | undefined => {
  const row = db
    .prepare<[string], RoutingRow>('SELECT * FROM routings WHERE id = ?')
    .get(id);
  return row ? rowToRouting(row) : undefined;
};

export const getRoutingByIdOrThrow = (db: DB, id: string): Routing => {
  const r = getRoutingById(db, id);
  if (!r) throw notFound('routing', id);
  return r;
};

/** Recently sorted strip data: last N days of routings for one project,
 *  newest first. Rejected routings (Phase 2) are still included so the
 *  strip can show a struck-through entry; the UI decides what to
 *  render. */
export const listRecentRoutingsByProject = (
  db: DB,
  projectId: string,
  days = 7,
): Routing[] => {
  const cutoff = new Date(Date.now() - days * 86400_000).toISOString();
  return db
    .prepare<[string, string], RoutingRow>(
      `SELECT * FROM routings
        WHERE project_id = ? AND created_at >= ?
        ORDER BY created_at DESC`,
    )
    .all(projectId, cutoff)
    .map(rowToRouting);
};

/** All routings created today across every project. Slice 2's
 *  classifier checks this against settings.routingDailyCap before
 *  calling Anthropic. */
export const countRoutingsToday = (db: DB): number => {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const row = db
    .prepare<[string], { c: number }>(
      'SELECT COUNT(*) AS c FROM routings WHERE created_at >= ?',
    )
    .get(startOfDay.toISOString());
  return row?.c ?? 0;
};

export class ClassifierUnavailableError extends Error {
  constructor() {
    super('classifier_unavailable');
    this.name = 'ClassifierUnavailableError';
  }
}

const HINTS: RoutingAction[] = [
  'bench',
  'doc',
  'guidebook',
  'runbook',
  'field-notes',
];

const MAX_RAW_CONTENT_BYTES = 200_000;

export type CreatePasteRoutingInput = {
  projectSlug: string;
  body: string;
  hint?: string;
};

/** Phase 0 end-to-end: validate, classify, dispatch, persist, log.
 *  Returns the Routing row that just landed so the route can ship it
 *  back to the modal for the success toast. */
export const createPasteRouting = async (
  db: DB,
  input: CreatePasteRoutingInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Promise<Routing> => {
  const fields: Record<string, string> = {};
  if (!input.projectSlug?.trim()) fields.projectSlug = 'required';
  const body = (input.body ?? '').trim();
  if (!body) fields.body = 'required';
  else if (Buffer.byteLength(body, 'utf8') > MAX_RAW_CONTENT_BYTES) {
    fields.body = 'too_large';
  }
  let hint: RoutingAction | undefined;
  if (input.hint !== undefined && input.hint !== null && input.hint !== '') {
    if (typeof input.hint !== 'string' || !HINTS.includes(input.hint as RoutingAction)) {
      fields.hint = 'invalid';
    } else {
      hint = input.hint as RoutingAction;
    }
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const project = getProjectBySlug(db, input.projectSlug);
  if (!project) throw notFound('project', input.projectSlug);

  const verdict: ClassifierVerdict = await classifyPaste(db, {
    projectId: project.id,
    body,
    hint,
  });
  if (verdict.kind === 'unavailable') throw new ClassifierUnavailableError();

  // Over-budget routings still dispatch — to bench, with a marker.
  const overBudget = verdict.kind === 'over_budget';
  const action: RoutingAction =
    verdict.kind === 'ok' ? verdict.action : 'bench';
  const confidence: number | null =
    verdict.kind === 'ok' ? verdict.confidence : null;
  let explanation =
    verdict.kind === 'ok'
      ? verdict.explanation
      : 'over daily AI budget — captured to bench';
  const payload = verdict.kind === 'ok' ? verdict.payload : { body };

  const dispatched = await dispatch(db, {
    projectId: project.id,
    rawContent: body,
    action,
    payload: payload as DispatchPayloads[typeof action],
  });

  if (dispatched.downgrade) {
    explanation =
      `${explanation} · downgraded from ${dispatched.downgrade.originalAction} → bench (${dispatched.downgrade.reason})`.trim();
  }

  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO routings
       (id, project_id, source_kind, source_meta, raw_content, hint,
        classifier_action, classifier_confidence, classifier_explanation,
        over_ai_budget, artefact_kind, artefact_id, rejected_at, created_at)
     VALUES (?, ?, 'paste', NULL, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
  ).run(
    id,
    project.id,
    body,
    hint ?? null,
    dispatched.action,
    confidence,
    explanation || null,
    overBudget ? 1 : 0,
    dispatched.artefactKind,
    dispatched.artefactId,
    now,
  );

  logActivity(db, {
    projectId: project.id,
    entityType: 'routing',
    entityId: id,
    verb: 'ROUTED',
    target: `${dispatched.action} / ${dispatched.artefactKind}`,
    payload: explanation || undefined,
    actor,
    occurredAt: now,
  });

  return getRoutingByIdOrThrow(db, id);
};

