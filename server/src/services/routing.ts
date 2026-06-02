// Smart Routing — persistence + read selectors. The write path
// (createPasteRouting / the email equivalent) lands in slice 2 with
// the classifier + dispatcher; slice 1 ships the row shape, the row
// mapper, and the two read selectors that drive the Recently sorted
// strip and individual routing lookups.

import type { DB } from '../db.js';
import { fromIso } from '../time.js';
import { notFound } from '../errors.js';
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
