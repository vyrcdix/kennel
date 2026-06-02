// Smart Routing — action dispatcher. Takes a classifier verdict
// (action + payload) and runs the matching existing CRUD service.
// Each handler returns the new artefact identity so the caller can
// persist a routings row that points back at what shipped.
//
// "Downgrades" are how the dispatcher copes with classifier picks
// that can't actually be served — e.g. action='guidebook' on a thread
// that has no guidebooks. In that case the action is rewritten to
// 'bench' and the caller records the original action in the
// routings row's explanation field so the user sees what was
// attempted.

import type { DB } from '../db.js';
import { notFound, validationError } from '../errors.js';
import { nowIso } from '../time.js';
import { listGuidebooksByProject } from './guidebook.js';
import { addEntry } from './guidebookEntry.js';
import { createDoc } from './doc.js';
import { createItem } from './item.js';
import { getRunbookByProject, upsertRunbook } from './runbook.js';
import {
  getFieldNotesByProject,
  upsertFieldNotes,
} from './fieldNotes.js';
import type {
  RoutingAction,
  RoutingArtefactKind,
} from '../../../shared/types.js';

/** Sections the runbook can append to. Anything else is a payload
 *  validation error from the classifier; the dispatcher rejects it
 *  rather than guess. */
const RUNBOOK_SECTIONS = [
  'prerequisites',
  'setup',
  'run',
  'deploy',
  'troubleshoot',
  'notes',
] as const;
type RunbookSection = (typeof RUNBOOK_SECTIONS)[number];

const FIELD_NOTES_SECTIONS = [
  'premise',
  'whatIKnow',
  'openQuestions',
  'sources',
  'crystallizations',
] as const;
type FieldNotesSection = (typeof FIELD_NOTES_SECTIONS)[number];

export type DispatchPayloads = {
  bench: { title?: string; body?: string };
  doc: { title: string; body: string };
  guidebook: {
    /** If supplied and valid for the project, use this guidebook. */
    guidebookId?: string;
    /** Spine title for the new entry. Defaults to a derivation from
     *  the body if omitted. */
    name?: string;
    description?: string;
    tags?: string[];
  };
  runbook: { section: RunbookSection; body: string };
  'field-notes': { section: FieldNotesSection; body: string };
};

/** Discriminated record of everything undo needs to reverse a
 *  routing dispatch. Stored in routings.dispatch_snapshot as JSON.
 *  Bench + doc carry no extra data — the artefact_id is enough. */
export type DispatchSnapshot =
  | { kind: 'bench' }
  | { kind: 'doc' }
  | {
      kind: 'guidebook';
      /** The doc the guidebook entry points at — created on the fly
       *  by addEntry's upload variant. Undo also deletes this so
       *  the entry removal doesn't orphan it. */
      docId: string;
    }
  | {
      kind: 'runbook';
      section: string;
      /** Snapshot of the section's content BEFORE the append, so
       *  undo can restore it verbatim (rather than try to subtract
       *  the appended block from the current value). null marks a
       *  previously-empty section. */
      previousValue: string | null;
    }
  | {
      kind: 'field-notes';
      section: string;
      previousValue: string | null;
    };

export type DispatchResult = {
  /** What was actually shipped. May differ from the requested action
   *  when the dispatcher downgrades (e.g. to bench). */
  action: RoutingAction;
  artefactKind: RoutingArtefactKind;
  artefactId: string;
  /** Per-action data captured for undo. */
  snapshot: DispatchSnapshot;
  /** Set when the dispatcher couldn't honour the requested action
   *  verbatim. Recorded in the routings row's explanation. */
  downgrade?: {
    originalAction: RoutingAction;
    reason: string;
  };
};

export type DispatchInput<A extends RoutingAction = RoutingAction> = {
  projectId: string;
  rawContent: string;
  action: A;
  payload: DispatchPayloads[A];
  /** Override for tests; defaults to now. */
  now?: Date;
};

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

/** The marker prepended to any append into a runbook section or
 *  field-notes column, so a future reader can spot machine-added
 *  content at a glance. */
export const dateDivider = (now: Date): string =>
  `\n\n---\n*Routed ${isoDay(now)}*\n\n`;

/** Derive a short title from the raw paste body — first non-empty
 *  line, stripped to ~80 chars. Used as a fallback when the
 *  classifier didn't supply a title. */
export const deriveTitle = (body: string): string => {
  const firstLine =
    body
      .split('\n')
      .map((l) => l.replace(/^[#>\s*\-]+/, '').trim())
      .find((l) => l.length > 0) ?? 'Untitled';
  return firstLine.length > 80
    ? firstLine.slice(0, 77).trimEnd() + '…'
    : firstLine;
};

/** Pick the guidebook a routing should attach to. Caller passes
 *  payload.guidebookId or null; the resolver checks validity and
 *  falls back to most-recently-touched, returning undefined when the
 *  project has no guidebooks at all. */
const resolveGuidebook = (
  db: DB,
  projectId: string,
  preferredId: string | undefined,
): { id: string } | undefined => {
  // We use slug-based selector here because the existing
  // listGuidebooksByProject takes a slug, not an id. Cheaper to
  // lookup the slug than to add a new selector for this one caller.
  const projectRow = db
    .prepare<[string], { slug: string }>('SELECT slug FROM projects WHERE id = ?')
    .get(projectId);
  if (!projectRow) return undefined;
  const gbs = listGuidebooksByProject(db, projectRow.slug);
  if (gbs.length === 0) return undefined;
  if (preferredId) {
    const hit = gbs.find((g) => g.id === preferredId);
    if (hit) return { id: hit.id };
  }
  // listGuidebooksByProject already returns rank-ordered; for "most
  // recently touched" we sort by updatedAt descending.
  const sorted = [...gbs].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  return { id: sorted[0].id };
};

/** Run the matching service for an action. Pure orchestration —
 *  the per-service input shaping is the only meaningful work here. */
export const dispatch = async (
  db: DB,
  input: DispatchInput,
): Promise<DispatchResult> => {
  const { projectId, rawContent, action, payload } = input;
  const now = input.now ?? new Date();

  if (action === 'bench') {
    const p = payload as DispatchPayloads['bench'];
    const title = (p.title?.trim() || deriveTitle(rawContent)).trim();
    const item = createItem(db, {
      projectId,
      kind: 'note',
      title,
      body: p.body?.trim() || rawContent.trim(),
    });
    return {
      action,
      artefactKind: 'item',
      artefactId: item.id,
      snapshot: { kind: 'bench' },
    };
  }

  if (action === 'doc') {
    const p = payload as DispatchPayloads['doc'];
    const projectRow = db
      .prepare<[string], { slug: string }>('SELECT slug FROM projects WHERE id = ?')
      .get(projectId);
    if (!projectRow) throw notFound('project', projectId);
    const title = p.title?.trim() || deriveTitle(rawContent);
    const doc = createDoc(db, {
      projectSlug: projectRow.slug,
      title,
      body: p.body?.trim() || rawContent.trim(),
      pinned: false,
    });
    return {
      action,
      artefactKind: 'doc',
      artefactId: doc.id,
      snapshot: { kind: 'doc' },
    };
  }

  if (action === 'guidebook') {
    const p = payload as DispatchPayloads['guidebook'];
    const target = resolveGuidebook(db, projectId, p.guidebookId);
    if (!target) {
      // Downgrade — no guidebook exists in this thread. Stamp the
      // routing as bench with the original action recorded.
      const downgradedTitle = (p.name?.trim() || deriveTitle(rawContent)).trim();
      const item = createItem(db, {
        projectId,
        kind: 'note',
        title: downgradedTitle,
        body: rawContent.trim(),
      });
      return {
        action: 'bench',
        artefactKind: 'item',
        artefactId: item.id,
        snapshot: { kind: 'bench' },
        downgrade: {
          originalAction: 'guidebook',
          reason: 'no_guidebook_in_thread',
        },
      };
    }
    const entry = await addEntry(db, target.id, {
      upload: {
        filename: `${p.name?.trim() || deriveTitle(rawContent)}.md`,
        kind: 'md',
        body: Buffer.from(rawContent, 'utf8'),
      },
      name: p.name?.trim() || undefined,
      description: p.description?.trim() || undefined,
      tags: Array.isArray(p.tags) ? p.tags : undefined,
    });
    // The entry's source is the freshly-created doc; pull its id out
    // of the discriminated source pointer so undo can also delete it.
    const docId = entry.source.kind === 'doc' ? entry.source.docId : '';
    return {
      action,
      artefactKind: 'guidebook_entry',
      artefactId: entry.id,
      snapshot: { kind: 'guidebook', docId },
    };
  }

  if (action === 'runbook') {
    const p = payload as DispatchPayloads['runbook'];
    if (!RUNBOOK_SECTIONS.includes(p.section)) {
      throw validationError({ section: 'invalid' });
    }
    const projectRow = db
      .prepare<[string], { slug: string }>('SELECT slug FROM projects WHERE id = ?')
      .get(projectId);
    if (!projectRow) throw notFound('project', projectId);
    const existing = getRunbookByProject(db, projectId);
    const previousValue = (existing?.[p.section] as string | undefined) ?? null;
    const merged = (previousValue ?? '') + dateDivider(now) + (p.body?.trim() ?? rawContent.trim());
    const rb = upsertRunbook(db, projectId, { [p.section]: merged });
    return {
      action,
      artefactKind: 'runbook',
      artefactId: rb.id,
      snapshot: { kind: 'runbook', section: p.section, previousValue },
    };
  }

  if (action === 'field-notes') {
    const p = payload as DispatchPayloads['field-notes'];
    if (!FIELD_NOTES_SECTIONS.includes(p.section)) {
      throw validationError({ section: 'invalid' });
    }
    const projectRow = db
      .prepare<[string], { slug: string }>('SELECT slug FROM projects WHERE id = ?')
      .get(projectId);
    if (!projectRow) throw notFound('project', projectId);
    const existing = getFieldNotesByProject(db, projectId);
    const previousValue = (existing?.[p.section] as string | undefined) ?? null;
    const merged = (previousValue ?? '') + dateDivider(now) + (p.body?.trim() ?? rawContent.trim());
    const fn = upsertFieldNotes(db, projectRow.slug, { [p.section]: merged });
    return {
      action,
      artefactKind: 'field_notes',
      artefactId: fn.id,
      snapshot: { kind: 'field-notes', section: p.section, previousValue },
    };
  }

  throw validationError({ action: 'unknown' });
};

/** Reverse a dispatched routing. Idempotent — calls into existing
 *  delete / upsert services and silently no-ops when the artefact
 *  has already been deleted out from under us. */
export const revertDispatch = (
  db: DB,
  args: {
    artefactKind: RoutingArtefactKind;
    artefactId: string;
    snapshot: DispatchSnapshot | null;
    projectId: string;
  },
): void => {
  const { artefactKind, artefactId, snapshot, projectId } = args;

  if (artefactKind === 'item') {
    // Lazy import to avoid the circular shape with item.ts (which
    // imports activity which sometimes touches routing services).
    const itemRow = db
      .prepare<[string], { id: string }>('SELECT id FROM items WHERE id = ?')
      .get(artefactId);
    if (!itemRow) return;
    db.prepare('DELETE FROM items WHERE id = ?').run(artefactId);
    return;
  }

  if (artefactKind === 'doc') {
    const row = db
      .prepare<[string], { id: string }>('SELECT id FROM docs WHERE id = ?')
      .get(artefactId);
    if (!row) return;
    db.prepare(
      'UPDATE items SET doc_id = NULL, updated_at = ? WHERE doc_id = ?',
    ).run(nowIso(), artefactId);
    db.prepare('DELETE FROM docs WHERE id = ?').run(artefactId);
    return;
  }

  if (artefactKind === 'guidebook_entry') {
    // Drop the entry; if the snapshot tells us which doc it was
    // pointing at, drop that too so the routing leaves nothing
    // behind. (The doc was always created by the routing itself,
    // never pre-existing, so this is safe.)
    db.prepare('DELETE FROM guidebook_entries WHERE id = ?').run(artefactId);
    if (snapshot?.kind === 'guidebook' && snapshot.docId) {
      const row = db
        .prepare<[string], { id: string }>('SELECT id FROM docs WHERE id = ?')
        .get(snapshot.docId);
      if (row) {
        // Same NULL-out + delete dance as deleteDoc, hand-rolled to
        // avoid the no-op import cycle.
        db.prepare(
          'UPDATE items SET doc_id = NULL, updated_at = ? WHERE doc_id = ?',
        ).run(nowIso(), snapshot.docId);
        db.prepare('DELETE FROM docs WHERE id = ?').run(snapshot.docId);
      }
    }
    return;
  }

  if (artefactKind === 'runbook') {
    if (snapshot?.kind !== 'runbook') return;
    upsertRunbook(db, projectId, {
      [snapshot.section]: snapshot.previousValue,
    } as Record<string, string | null>);
    return;
  }

  if (artefactKind === 'field_notes') {
    if (snapshot?.kind !== 'field-notes') return;
    const projectRow = db
      .prepare<[string], { slug: string }>('SELECT slug FROM projects WHERE id = ?')
      .get(projectId);
    if (!projectRow) return;
    upsertFieldNotes(db, projectRow.slug, {
      [snapshot.section]: snapshot.previousValue,
    } as Record<string, string | null>);
    return;
  }
};
