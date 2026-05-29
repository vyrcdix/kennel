import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  createGuidebook,
  deleteGuidebook,
  getGuidebookById,
  listGuidebooksByProject,
  reorderGuidebooks,
  updateGuidebook,
} from '../services/guidebook.js';
import {
  addEntry,
  listEntries,
  removeEntry,
  reorderEntries,
  updateEntry,
  type AddEntryInput,
} from '../services/guidebookEntry.js';

/** Decode the upload variant's body field — accepts a base64 string in
 *  JSON. We deviated from a multipart upload to keep the single
 *  composite endpoint shape; see docs/guidebook-plan.md (Slice 2). */
const decodeUploadBody = (raw: unknown): Buffer => {
  if (typeof raw !== 'string') {
    throw validationError({ 'upload.body': 'must_be_base64_string' });
  }
  try {
    const buf = Buffer.from(raw, 'base64');
    if (buf.length === 0) {
      throw validationError({ 'upload.body': 'empty' });
    }
    return buf;
  } catch {
    throw validationError({ 'upload.body': 'invalid_base64' });
  }
};

/** Discriminate between the four addEntry input shapes coming in via
 *  JSON. Each shape's source-identifying field is mutually exclusive
 *  with the others — fail loud if more than one is set. */
const parseAddEntryBody = (raw: unknown): AddEntryInput => {
  if (!raw || typeof raw !== 'object') throw validationError({ body: 'required' });
  const body = raw as Record<string, unknown>;
  const sources = [
    body.docId !== undefined,
    body.referenceId !== undefined,
    body.upload !== undefined,
    body.link !== undefined,
  ].filter(Boolean).length;
  if (sources === 0) throw validationError({ source: 'required' });
  if (sources > 1) throw validationError({ source: 'multiple_specified' });

  const name = typeof body.name === 'string' ? body.name : undefined;
  const description =
    typeof body.description === 'string' ? body.description : undefined;
  const tags = body.tags;

  if (typeof body.docId === 'string') {
    return { docId: body.docId, name, description, tags };
  }
  if (typeof body.referenceId === 'string') {
    return { referenceId: body.referenceId, name, description, tags };
  }
  if (body.upload && typeof body.upload === 'object') {
    const u = body.upload as Record<string, unknown>;
    if (typeof u.filename !== 'string' || !u.filename.trim()) {
      throw validationError({ 'upload.filename': 'required' });
    }
    if (u.kind !== 'md' && u.kind !== 'docx') {
      throw validationError({ 'upload.kind': 'must_be_md_or_docx' });
    }
    return {
      upload: {
        filename: u.filename,
        kind: u.kind,
        body: decodeUploadBody(u.body),
      },
      name,
      description,
      tags,
    };
  }
  if (body.link && typeof body.link === 'object') {
    const l = body.link as Record<string, unknown>;
    if (typeof l.url !== 'string' || !l.url.trim()) {
      throw validationError({ 'link.url': 'required' });
    }
    const label = typeof l.label === 'string' ? l.label : '';
    return { link: { url: l.url, label }, name, description, tags };
  }
  throw validationError({ source: 'malformed' });
};

const parseUpdateGuidebookBody = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') throw validationError({ body: 'required' });
  const body = raw as Record<string, unknown>;
  const patch: { name?: string; description?: string | null; pinned?: boolean } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') throw validationError({ name: 'must_be_string' });
    patch.name = body.name;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      throw validationError({ description: 'must_be_string_or_null' });
    }
    patch.description = body.description as string | null;
  }
  if (body.pinned !== undefined) {
    if (typeof body.pinned !== 'boolean') {
      throw validationError({ pinned: 'must_be_boolean' });
    }
    patch.pinned = body.pinned;
  }
  if (Object.keys(patch).length === 0) {
    throw validationError({ body: 'no_fields' });
  }
  return patch;
};

const parseUpdateEntryBody = (raw: unknown) => {
  if (!raw || typeof raw !== 'object') throw validationError({ body: 'required' });
  const body = raw as Record<string, unknown>;
  const patch: { name?: string; description?: string | null; tags?: unknown } = {};
  if (body.name !== undefined) {
    if (typeof body.name !== 'string') throw validationError({ name: 'must_be_string' });
    patch.name = body.name;
  }
  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== 'string') {
      throw validationError({ description: 'must_be_string_or_null' });
    }
    patch.description = body.description as string | null;
  }
  if (body.tags !== undefined) patch.tags = body.tags;
  if (Object.keys(patch).length === 0) {
    throw validationError({ body: 'no_fields' });
  }
  return patch;
};

const parseOrderedIds = (raw: unknown): string[] => {
  if (!Array.isArray(raw)) throw validationError({ orderedIds: 'must_be_array' });
  return raw.map((id, i) => {
    if (typeof id !== 'string') {
      throw validationError({ [`orderedIds[${i}]`]: 'must_be_string' });
    }
    return id;
  });
};

export const guidebooksRouter = (db: DB): Router => {
  const r = Router();

  // ─── Topic-scoped routes ─────────────────────────────────────────
  r.get(
    '/projects/:slug/guidebooks',
    asyncHandler(async (req, res) => {
      res.json(listGuidebooksByProject(db, req.params.slug));
    }),
  );

  r.post(
    '/projects/:slug/guidebooks',
    asyncHandler(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const name = typeof body.name === 'string' ? body.name : '';
      const description =
        typeof body.description === 'string' ? body.description : undefined;
      const pinned = typeof body.pinned === 'boolean' ? body.pinned : undefined;
      const guidebook = createGuidebook(db, {
        projectSlug: req.params.slug,
        name,
        description,
        pinned,
      });
      res.status(201).json(guidebook);
    }),
  );

  r.patch(
    '/projects/:slug/guidebooks/reorder',
    asyncHandler(async (req, res) => {
      const orderedIds = parseOrderedIds((req.body ?? {}).orderedIds);
      res.json(reorderGuidebooks(db, req.params.slug, orderedIds));
    }),
  );

  // ─── Guidebook id-scoped routes ─────────────────────────────────
  r.get(
    '/guidebooks/:id',
    asyncHandler(async (req, res) => {
      const gb = getGuidebookById(db, req.params.id);
      if (!gb) throw notFound('guidebook', req.params.id);
      res.json(gb);
    }),
  );

  r.patch(
    '/guidebooks/:id',
    asyncHandler(async (req, res) => {
      const patch = parseUpdateGuidebookBody(req.body);
      res.json(updateGuidebook(db, req.params.id, patch));
    }),
  );

  r.delete(
    '/guidebooks/:id',
    asyncHandler(async (req, res) => {
      deleteGuidebook(db, req.params.id);
      res.status(204).end();
    }),
  );

  // ─── Entry routes ───────────────────────────────────────────────
  r.get(
    '/guidebooks/:id/entries',
    asyncHandler(async (req, res) => {
      const gb = getGuidebookById(db, req.params.id);
      if (!gb) throw notFound('guidebook', req.params.id);
      res.json(listEntries(db, req.params.id));
    }),
  );

  r.post(
    '/guidebooks/:id/entries',
    asyncHandler(async (req, res) => {
      const input = parseAddEntryBody(req.body);
      const entry = await addEntry(db, req.params.id, input);
      res.status(201).json(entry);
    }),
  );

  r.patch(
    '/guidebooks/:id/entries/reorder',
    asyncHandler(async (req, res) => {
      const orderedIds = parseOrderedIds((req.body ?? {}).orderedIds);
      res.json(reorderEntries(db, req.params.id, orderedIds));
    }),
  );

  r.patch(
    '/guidebook-entries/:id',
    asyncHandler(async (req, res) => {
      const patch = parseUpdateEntryBody(req.body);
      res.json(updateEntry(db, req.params.id, patch));
    }),
  );

  r.delete(
    '/guidebook-entries/:id',
    asyncHandler(async (req, res) => {
      removeEntry(db, req.params.id);
      res.status(204).end();
    }),
  );

  return r;
};
