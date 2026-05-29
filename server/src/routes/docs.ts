import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import {
  createDocFromUpload,
  deleteDoc,
  getDocById,
  setDocPinned,
  setDocSupportsCrystal,
  updateDocBody,
} from '../services/doc.js';

/** Decode a base64-encoded upload body. Same shape the Guidebook entry
 *  upload route uses — keeps the wire format identical across endpoints. */
const decodeUploadBody = (raw: unknown): Buffer => {
  if (typeof raw !== 'string') {
    throw validationError({ body: 'must_be_base64_string' });
  }
  const buf = Buffer.from(raw, 'base64');
  if (buf.length === 0) throw validationError({ body: 'empty' });
  return buf;
};

export const docsRouter = (db: DB): Router => {
  const r = Router();

  // Upload-create a Doc directly (Capture > Doc kind, or any "+ Doc" CTA
  // that wants to land a file rather than a typed body). Returns the
  // created Doc — the client picks up its id and routes to the editor.
  r.post(
    '/upload',
    asyncHandler(async (req, res) => {
      const body = (req.body ?? {}) as Record<string, unknown>;
      const projectSlug = body.projectSlug;
      if (typeof projectSlug !== 'string' || !projectSlug.trim()) {
        throw validationError({ projectSlug: 'required' });
      }
      const filename = body.filename;
      if (typeof filename !== 'string' || !filename.trim()) {
        throw validationError({ filename: 'required' });
      }
      if (body.kind !== 'md' && body.kind !== 'docx') {
        throw validationError({ kind: 'must_be_md_or_docx' });
      }
      const doc = await createDocFromUpload(db, {
        projectSlug,
        filename,
        kind: body.kind,
        body: decodeUploadBody(body.body),
        title: typeof body.title === 'string' ? body.title : undefined,
        pinned: typeof body.pinned === 'boolean' ? body.pinned : undefined,
      });
      res.status(201).json(doc);
    }),
  );

  r.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const doc = getDocById(db, req.params.id);
      if (!doc) throw notFound('doc', req.params.id);
      res.json(doc);
    }),
  );

  r.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const body = req.body?.body;
      if (typeof body !== 'string') throw validationError({ body: 'required' });
      res.json(updateDocBody(db, req.params.id, body));
    }),
  );

  r.patch(
    '/:id/pin',
    asyncHandler(async (req, res) => {
      const pinned = req.body?.pinned;
      if (typeof pinned !== 'boolean') throw validationError({ pinned: 'required' });
      res.json(setDocPinned(db, req.params.id, pinned));
    }),
  );

  r.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteDoc(db, req.params.id);
      res.status(204).end();
    }),
  );

  r.patch(
    '/:id/supports-crystal',
    asyncHandler(async (req, res) => {
      const raw = (req.body ?? {}).crystalItemId;
      if (raw !== null && typeof raw !== 'string') {
        throw validationError({ crystalItemId: 'must_be_string_or_null' });
      }
      setDocSupportsCrystal(db, req.params.id, raw);
      res.json(getDocById(db, req.params.id));
    }),
  );

  return r;
};
