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
import { listGuidebooksByProject } from './guidebook.js';
import { addEntry } from './guidebookEntry.js';
import { createDoc } from './doc.js';
import { createItem } from './item.js';
import { getProjectBySlug } from './project.js';
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

export type DispatchResult = {
  /** What was actually shipped. May differ from the requested action
   *  when the dispatcher downgrades (e.g. to bench). */
  action: RoutingAction;
  artefactKind: RoutingArtefactKind;
  artefactId: string;
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
    return { action, artefactKind: 'item', artefactId: item.id };
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
    return { action, artefactKind: 'doc', artefactId: doc.id };
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
    return { action, artefactKind: 'guidebook_entry', artefactId: entry.id };
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
    const previous = (existing?.[p.section] as string | undefined) ?? '';
    const merged = previous + dateDivider(now) + (p.body?.trim() ?? rawContent.trim());
    const rb = upsertRunbook(db, projectId, { [p.section]: merged });
    return { action, artefactKind: 'runbook', artefactId: rb.id };
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
    const previous = (existing?.[p.section] as string | undefined) ?? '';
    const merged = previous + dateDivider(now) + (p.body?.trim() ?? rawContent.trim());
    const fn = upsertFieldNotes(db, projectRow.slug, { [p.section]: merged });
    return { action, artefactKind: 'field_notes', artefactId: fn.id };
  }

  throw validationError({ action: 'unknown' });
};
