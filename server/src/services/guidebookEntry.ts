import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import { notFound, validationError } from '../errors.js';
import { createDocFromUpload } from './doc.js';
import { createReference } from './reference.js';
import { getGuidebookById } from './guidebook.js';
import type {
  GuidebookEntry,
  GuidebookEntrySource,
} from '../../../shared/types.js';

type GuidebookEntryRow = {
  id: string;
  guidebook_id: string;
  doc_id: string | null;
  reference_id: string | null;
  name: string;
  description: string | null;
  tags: string | null;
  rank: number | null;
  created_at: string;
  updated_at: string;
};

/** Parse the tags JSON column defensively — corrupt rows become []. */
const parseTags = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return [];
    return v.filter((t): t is string => typeof t === 'string');
  } catch {
    return [];
  }
};

/** Reconstruct the discriminated source pointer from the (doc_id,
 *  reference_id) XOR enforced by the table's CHECK constraint. */
const rowToSource = (r: GuidebookEntryRow): GuidebookEntrySource => {
  if (r.doc_id) return { kind: 'doc', docId: r.doc_id };
  if (r.reference_id) return { kind: 'reference', referenceId: r.reference_id };
  // The DB CHECK prevents this — but the type system can't see that, so we
  // make the contract loud rather than silently fabricating a default.
  throw new Error(`guidebook_entry ${r.id} has neither doc_id nor reference_id`);
};

export const rowToEntry = (r: GuidebookEntryRow): GuidebookEntry => ({
  id: r.id,
  guidebookId: r.guidebook_id,
  source: rowToSource(r),
  name: r.name,
  description: r.description ?? undefined,
  tags: parseTags(r.tags),
  rank: r.rank ?? 0,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

/** Entries within one guidebook, in user-defined drag order. */
export const listEntries = (db: DB, guidebookId: string): GuidebookEntry[] =>
  db
    .prepare<[string], GuidebookEntryRow>(
      'SELECT * FROM guidebook_entries WHERE guidebook_id = ? ORDER BY rank, created_at',
    )
    .all(guidebookId)
    .map(rowToEntry);

/** Every entry across every guidebook — used by bootstrap. The client
 *  shapes them per-guidebook via selectors. */
export const listAllEntries = (db: DB): GuidebookEntry[] =>
  db
    .prepare<[], GuidebookEntryRow>(
      'SELECT * FROM guidebook_entries ORDER BY guidebook_id, rank',
    )
    .all()
    .map(rowToEntry);

export const getEntryById = (
  db: DB,
  id: string,
): GuidebookEntry | undefined => {
  const row = db
    .prepare<[string], GuidebookEntryRow>(
      'SELECT * FROM guidebook_entries WHERE id = ?',
    )
    .get(id);
  return row ? rowToEntry(row) : undefined;
};

// ─── Validation ────────────────────────────────────────────────────
const NAME_MAX = 200;
const DESCRIPTION_MAX = 2000;
const TAG_MAX = 40;
const TAGS_MAX_COUNT = 20;

const validateTags = (tags: unknown, fields: Record<string, string>): string[] => {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) {
    fields.tags = 'must_be_array';
    return [];
  }
  if (tags.length > TAGS_MAX_COUNT) {
    fields.tags = 'too_many';
    return [];
  }
  const cleaned: string[] = [];
  for (const t of tags) {
    if (typeof t !== 'string') {
      fields.tags = 'must_be_strings';
      return [];
    }
    const trimmed = t.trim();
    if (!trimmed) continue;
    if (trimmed.length > TAG_MAX) {
      fields.tags = 'tag_too_long';
      return [];
    }
    if (!cleaned.includes(trimmed)) cleaned.push(trimmed);
  }
  return cleaned;
};

const validateNameAndDescription = (
  name: string,
  description: string,
): Record<string, string> => {
  const fields: Record<string, string> = {};
  if (!name) fields.name = 'required';
  else if (name.length > NAME_MAX) fields.name = 'too_long';
  if (description.length > DESCRIPTION_MAX) fields.description = 'too_long';
  return fields;
};

// ─── Append rank ───────────────────────────────────────────────────
const nextRankForGuidebook = (db: DB, guidebookId: string): number => {
  const row = db
    .prepare<[string], { max_rank: number | null }>(
      'SELECT COALESCE(MAX(rank), 0) AS max_rank FROM guidebook_entries WHERE guidebook_id = ?',
    )
    .get(guidebookId);
  return (row?.max_rank ?? 0) + 1;
};

// ─── Same-topic source guard ───────────────────────────────────────
/** A guidebook entry's source (Doc / Reference) must belong to the
 *  same topic as the guidebook itself. Cross-topic sharing is a
 *  separately tracked future change — see docs/guidebook-frd.md. */
const assertDocInSameTopic = (
  db: DB,
  docId: string,
  guidebookProjectId: string,
): { title: string } => {
  const row = db
    .prepare<[string], { project_id: string; title: string }>(
      'SELECT project_id, title FROM docs WHERE id = ?',
    )
    .get(docId);
  if (!row) throw notFound('doc', docId);
  if (row.project_id !== guidebookProjectId) {
    throw validationError({ docId: 'wrong_topic' });
  }
  return { title: row.title };
};

const assertReferenceInSameTopic = (
  db: DB,
  referenceId: string,
  guidebookProjectId: string,
): { label: string } => {
  const row = db
    .prepare<[string], { project_id: string; label: string }>(
      'SELECT project_id, label FROM refs WHERE id = ?',
    )
    .get(referenceId);
  if (!row) throw notFound('reference', referenceId);
  if (row.project_id !== guidebookProjectId) {
    throw validationError({ referenceId: 'wrong_topic' });
  }
  return { label: row.label };
};

// ─── Insert path ───────────────────────────────────────────────────
type InsertEntryInput = {
  guidebookId: string;
  projectId: string;
  docId: string | null;
  referenceId: string | null;
  name: string;
  description: string;
  tags: string[];
};

const insertEntry = (
  db: DB,
  input: InsertEntryInput,
  actor: 'craig' | 'claude' | 'cli',
): GuidebookEntry => {
  const id = newId();
  const now = nowIso();
  const rank = nextRankForGuidebook(db, input.guidebookId);

  db.prepare(
    `INSERT INTO guidebook_entries
     (id, guidebook_id, doc_id, reference_id, name, description, tags, rank, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.guidebookId,
    input.docId,
    input.referenceId,
    input.name,
    input.description || null,
    input.tags.length > 0 ? JSON.stringify(input.tags) : null,
    rank,
    now,
    now,
  );
  logActivity(db, {
    projectId: input.projectId,
    entityType: 'guidebook_entry',
    entityId: id,
    verb: 'CREATED',
    target: `guidebook entry / ${input.name}`,
    actor,
    occurredAt: now,
  });
  return getEntryById(db, id)!;
};

// ─── Add entry: four shapes ────────────────────────────────────────
export type AddEntryInput =
  | {
      docId: string;
      name?: string;
      description?: string;
      tags?: unknown;
    }
  | {
      referenceId: string;
      name?: string;
      description?: string;
      tags?: unknown;
    }
  | {
      upload: {
        filename: string;
        kind: 'md' | 'docx';
        /** Raw bytes — the route base64-decodes from JSON on the way in. */
        body: Buffer;
      };
      name?: string;
      description?: string;
      tags?: unknown;
    }
  | {
      link: { url: string; label: string };
      name?: string;
      description?: string;
      tags?: unknown;
    };

const isExistingDocInput = (
  input: AddEntryInput,
): input is Extract<AddEntryInput, { docId: string }> =>
  'docId' in input && typeof input.docId === 'string';

const isExistingRefInput = (
  input: AddEntryInput,
): input is Extract<AddEntryInput, { referenceId: string }> =>
  'referenceId' in input && typeof input.referenceId === 'string';

const isUploadInput = (
  input: AddEntryInput,
): input is Extract<AddEntryInput, { upload: any }> =>
  'upload' in input && !!input.upload;

const isLinkInput = (
  input: AddEntryInput,
): input is Extract<AddEntryInput, { link: any }> =>
  'link' in input && !!input.link;

export const addEntry = async (
  db: DB,
  guidebookId: string,
  input: AddEntryInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): Promise<GuidebookEntry> => {
  const guidebook = getGuidebookById(db, guidebookId);
  if (!guidebook) throw notFound('guidebook', guidebookId);

  // Look up the project slug once — uploads + link-creates need it.
  const projectSlug = db
    .prepare<[string], { slug: string }>(
      'SELECT slug FROM projects WHERE id = ?',
    )
    .get(guidebook.projectId)?.slug;
  if (!projectSlug) throw notFound('project', guidebook.projectId);

  // Resolve the source first — branching on the four shapes. Each
  // branch yields docId | referenceId + a default name (the source's
  // own title) used when the caller doesn't override.
  let docId: string | null = null;
  let referenceId: string | null = null;
  let defaultName = '';

  if (isExistingDocInput(input)) {
    const doc = assertDocInSameTopic(db, input.docId, guidebook.projectId);
    docId = input.docId;
    defaultName = doc.title;
  } else if (isExistingRefInput(input)) {
    const ref = assertReferenceInSameTopic(
      db,
      input.referenceId,
      guidebook.projectId,
    );
    referenceId = input.referenceId;
    defaultName = ref.label;
  } else if (isUploadInput(input)) {
    const doc = await createDocFromUpload(
      db,
      {
        projectSlug,
        filename: input.upload.filename,
        kind: input.upload.kind,
        body: input.upload.body,
      },
      actor,
    );
    docId = doc.id;
    defaultName = doc.title;
  } else if (isLinkInput(input)) {
    const label = input.link.label?.trim() || input.link.url;
    const ref = createReference(
      db,
      {
        projectSlug,
        type: 'link',
        label,
        url: input.link.url,
      },
      actor === 'cli' ? 'claude' : actor,
    );
    referenceId = ref.id;
    defaultName = ref.label;
  } else {
    throw validationError({ source: 'required' });
  }

  // Validate the per-membership metadata. Falls back to the source's
  // own title/label if the caller didn't supply a name.
  const name = (input.name?.trim() || defaultName).trim();
  const description = input.description?.trim() ?? '';
  const fields = validateNameAndDescription(name, description);
  const tags = validateTags(input.tags, fields);
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return insertEntry(
    db,
    {
      guidebookId,
      projectId: guidebook.projectId,
      docId,
      referenceId,
      name,
      description,
      tags,
    },
    actor,
  );
};

// ─── Update entry ──────────────────────────────────────────────────
export type UpdateEntryInput = Partial<{
  name: string;
  description: string | null;
  tags: unknown;
}>;

export const updateEntry = (
  db: DB,
  id: string,
  patch: UpdateEntryInput,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
): GuidebookEntry => {
  const existing = getEntryById(db, id);
  if (!existing) throw notFound('guidebook_entry', id);

  // Look up the guidebook's project id for activity logging.
  const guidebook = getGuidebookById(db, existing.guidebookId);
  if (!guidebook) throw notFound('guidebook', existing.guidebookId);

  let nextName = existing.name;
  let nextDescription: string | null = existing.description ?? null;
  let nextTags = existing.tags;

  if (patch.name !== undefined) nextName = patch.name.trim();
  if (patch.description !== undefined) {
    if (patch.description === null) {
      nextDescription = null;
    } else {
      const trimmed = patch.description.trim();
      nextDescription = trimmed || null;
    }
  }
  const fields = validateNameAndDescription(nextName, nextDescription ?? '');
  if (patch.tags !== undefined) {
    nextTags = validateTags(patch.tags, fields);
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  const changed: string[] = [];
  if (nextName !== existing.name) changed.push('name');
  if ((nextDescription ?? null) !== (existing.description ?? null)) {
    changed.push('description');
  }
  if (JSON.stringify(nextTags) !== JSON.stringify(existing.tags)) {
    changed.push('tags');
  }
  if (changed.length === 0) return existing;

  const now = nowIso();
  db.prepare(
    `UPDATE guidebook_entries
     SET name = ?, description = ?, tags = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    nextName,
    nextDescription,
    nextTags.length > 0 ? JSON.stringify(nextTags) : null,
    now,
    id,
  );
  logActivity(db, {
    projectId: guidebook.projectId,
    entityType: 'guidebook_entry',
    entityId: id,
    verb: 'EDITED',
    target: `guidebook entry / ${nextName}`,
    payload: changed.join(', '),
    actor,
    occurredAt: now,
  });
  return getEntryById(db, id)!;
};

// ─── Reorder entries ───────────────────────────────────────────────
export const reorderEntries = (
  db: DB,
  guidebookId: string,
  orderedIds: string[],
): GuidebookEntry[] => {
  const guidebook = getGuidebookById(db, guidebookId);
  if (!guidebook) throw notFound('guidebook', guidebookId);
  const current = listEntries(db, guidebookId);

  if (orderedIds.length !== current.length) {
    throw validationError({ orderedIds: 'must_include_every_entry' });
  }
  const currentIds = new Set(current.map((e) => e.id));
  const seen = new Set<string>();
  for (const id of orderedIds) {
    if (!currentIds.has(id)) throw validationError({ orderedIds: 'unknown_id' });
    if (seen.has(id)) throw validationError({ orderedIds: 'duplicate_id' });
    seen.add(id);
  }

  const now = nowIso();
  const update = db.prepare(
    'UPDATE guidebook_entries SET rank = ?, updated_at = ? WHERE id = ?',
  );
  const tx = db.transaction(() => {
    orderedIds.forEach((id, i) => {
      update.run(i + 1, now, id);
    });
  });
  tx();
  return listEntries(db, guidebookId);
};

// ─── Remove entry ──────────────────────────────────────────────────
/** Drops the membership row. Never touches the source Doc/Reference. */
export const removeEntry = (
  db: DB,
  id: string,
  actor: 'craig' | 'claude' | 'cli' = 'craig',
) => {
  const existing = getEntryById(db, id);
  if (!existing) throw notFound('guidebook_entry', id);
  const guidebook = getGuidebookById(db, existing.guidebookId);
  if (!guidebook) throw notFound('guidebook', existing.guidebookId);

  const now = nowIso();
  db.prepare('DELETE FROM guidebook_entries WHERE id = ?').run(id);
  logActivity(db, {
    projectId: guidebook.projectId,
    entityType: 'guidebook_entry',
    entityId: id,
    verb: 'REMOVED',
    target: `guidebook entry / ${existing.name}`,
    actor,
    occurredAt: now,
  });
};
