import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { DB } from '../../db.js';
import { getSkillById, listSkills, syncSkill } from '../../services/skill.js';
import { getProjectBySlug } from '../../services/project.js';
import { notFound } from '../../errors.js';
import { errorResult, jsonResult } from '../result.js';

export const registerSkillTools = (server: McpServer, db: DB) => {
  server.tool(
    'list_skills',
    'List skills applicable to a project (project-scoped + global skills, which have no projectId). Use this to discover what skills exist before proposing updates.',
    {
      projectSlug: z.string().optional()
        .describe('Filter to skills attached to this project (plus global skills). Omit to list everything.'),
    },
    async ({ projectSlug }) => {
      try {
        const projectId = projectSlug
          ? (() => {
              const p = getProjectBySlug(db, projectSlug);
              if (!p) throw notFound('project', projectSlug);
              return p.id;
            })()
          : undefined;
        const all = listSkills(db);
        const filtered = projectId
          ? all.filter((s) => s.projectId === projectId || s.projectId === undefined)
          : all;
        return jsonResult(filtered);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'get_skill',
    'Read a skill\'s full body and metadata.',
    {
      skillId: z.string(),
    },
    async ({ skillId }) => {
      try {
        const skill = getSkillById(db, skillId);
        if (!skill) throw notFound('skill', skillId);
        return jsonResult(skill);
      } catch (err) {
        return errorResult(err);
      }
    },
  );

  server.tool(
    'sync_skill',
    'Re-read a skill\'s source file from disk and replace the cached body. Only valid for skills with source="local_path". Bumps revision when the body actually changes.',
    {
      skillId: z.string(),
    },
    async ({ skillId }) => {
      try {
        return jsonResult(syncSkill(db, skillId, 'claude'));
      } catch (err) {
        return errorResult(err);
      }
    },
  );
};
