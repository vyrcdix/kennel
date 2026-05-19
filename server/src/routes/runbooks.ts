import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import { getProjectBySlug } from '../services/project.js';
import {
  getRunbookByProject,
  type RunbookSections,
  updateRunbookUrl,
  upsertRunbook,
} from '../services/runbook.js';

const SECTION_KEYS = [
  'url',
  'prerequisites',
  'setup',
  'run',
  'deploy',
  'troubleshoot',
  'notes',
] as const;

export const runbooksRouter = (db: DB): Router => {
  const r = Router();

  r.get(
    '/projects/:slug/runbook',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const rb = getRunbookByProject(db, project.id);
      if (!rb) throw notFound('runbook', req.params.slug);
      res.json(rb);
    }),
  );

  r.patch(
    '/projects/:slug/runbook',
    asyncHandler(async (req, res) => {
      const project = getProjectBySlug(db, req.params.slug);
      if (!project) throw notFound('project', req.params.slug);
      const body = (req.body ?? {}) as Record<string, unknown>;
      // Back-compat: PATCH with only { url } is the original URL-update flow.
      if (
        typeof body.url === 'string' &&
        Object.keys(body).length === 1
      ) {
        res.json(updateRunbookUrl(db, project.id, body.url));
        return;
      }
      const sections: RunbookSections = {};
      for (const key of SECTION_KEYS) {
        if (body[key] === undefined) continue;
        const v = body[key];
        if (v !== null && typeof v !== 'string') {
          throw validationError({ [key]: 'must_be_string_or_null' });
        }
        sections[key] = (v as string | null) ?? null;
      }
      if (Object.keys(sections).length === 0) {
        throw validationError({ body: 'no_fields' });
      }
      res.json(upsertRunbook(db, project.id, sections));
    }),
  );

  return r;
};
