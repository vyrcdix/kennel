import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { getFieldNotesByProject, upsertFieldNotes } from '../../services/fieldNotes.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

export const registerFieldNotesTools = (server: McpServer, db: DB) => {
  server.tool(
    'read_field_notes',
    'Read a project\'s field notes. Sense-making sibling to the runbook — five sections: Premise, What I know, Open questions, Sources, Crystallizations.',
    { projectSlug: z.string() },
    async ({ projectSlug }) => {
      try {
        const project = getProjectBySlug(db, projectSlug);
        if (!project) throw notFound('project', projectSlug);
        const fn = getFieldNotesByProject(db, project.id);
        return jsonResult(fn ?? null);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'write_field_notes',
    'Upsert a project\'s field notes. Any section omitted is left unchanged; pass null to clear. Bumps revision and writes content/<slug>/field-notes.md atomically.',
    {
      projectSlug: z.string(),
      premise: z.string().nullable().optional()
        .describe('The working hypothesis for the thread.'),
      whatIKnow: z.string().nullable().optional()
        .describe('Observations, evidence, findings to date.'),
      openQuestions: z.string().nullable().optional()
        .describe('What you\'re trying to figure out. Lines beginning with "? " render as callouts.'),
      sources: z.string().nullable().optional()
        .describe('Items, docs, refs, chats this is built on.'),
      crystallizations: z.string().nullable().optional()
        .describe('Links to durable outcomes that have emerged.'),
    },
    async ({ projectSlug, ...sections }) => {
      try {
        return jsonResult(upsertFieldNotes(db, projectSlug, sections, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
