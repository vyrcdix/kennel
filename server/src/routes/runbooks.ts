import { Router } from 'express';
import type { DB } from '../db.js';
import { asyncHandler, notFound, validationError } from '../errors.js';
import { getProjectBySlug } from '../services/project.js';
import {
  getRunbookByProject,
  type RunbookSections,
  upsertRunbook,
} from '../services/runbook.js';
import type { RunbookUrl } from '../../../shared/types.js';

const TEXT_SECTION_KEYS = [
  'prerequisites',
  'setup',
  'run',
  'deploy',
  'troubleshoot',
  'notes',
] as const;

/** Coerce a raw `urls` body field into RunbookUrl[] — rejects bad shapes. */
const parseUrlsField = (raw: unknown): RunbookUrl[] => {
  if (!Array.isArray(raw)) throw validationError({ urls: 'must_be_array' });
  return raw.map((e) => {
    if (
      !e ||
      typeof (e as RunbookUrl).label !== 'string' ||
      typeof (e as RunbookUrl).url !== 'string'
    ) {
      throw validationError({ urls: 'entries_need_label_and_url' });
    }
    return { label: (e as RunbookUrl).label, url: (e as RunbookUrl).url };
  });
};

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
      const sections: RunbookSections = {};
      if (body.urls !== undefined) {
        sections.urls = parseUrlsField(body.urls);
      }
      for (const key of TEXT_SECTION_KEYS) {
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
