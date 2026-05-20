// MCP resources — expose Kennel's markdown content (docs, field notes,
// runbooks) as a browsable resource tree so Claude clients can read it
// without an explicit tool call. Tools still own all writes; resources
// are read-only.

import {
  McpServer,
  ResourceTemplate,
} from '@modelcontextprotocol/sdk/server/mcp.js';
import type { DB } from '../db.js';
import { notFound } from '../errors.js';
import { getDocById, listDocs } from '../services/doc.js';
import {
  composeFieldNotesMarkdown,
  getFieldNotesByProject,
  listFieldNotes,
} from '../services/fieldNotes.js';
import { getProjectBySlug, listProjects } from '../services/project.js';
import { getRunbookByProject, listRunbooks } from '../services/runbook.js';
import type { Runbook } from '../../../shared/types.js';

/** A URI-template variable arrives as string | string[]; take the first. */
const one = (v: string | string[]): string => (Array.isArray(v) ? v[0] : v);

const composeRunbookMarkdown = (rb: Runbook, projectName: string): string => {
  const lines: string[] = [`# ${projectName} — Runbook`, ''];
  if (rb.urls.length) {
    lines.push('## URLs', '');
    for (const u of rb.urls) lines.push(`- **${u.label}** — ${u.url}`);
    lines.push('');
  }
  const sections: [string, string | undefined][] = [
    ['Prerequisites', rb.prerequisites],
    ['Setup', rb.setup],
    ['Run', rb.run],
    ['Deploy', rb.deploy],
    ['Troubleshoot', rb.troubleshoot],
    ['Notes', rb.notes],
  ];
  for (const [label, body] of sections) {
    if (body && body.trim()) lines.push(`## ${label}`, '', body, '');
  }
  return lines.join('\n');
};

export const registerResources = (server: McpServer, db: DB) => {
  server.registerResource(
    'doc',
    new ResourceTemplate('kennel:///doc/{docId}', {
      list: () => ({
        resources: listDocs(db).map((d) => ({
          uri: `kennel:///doc/${d.id}`,
          name: d.title,
          description: d.description,
          mimeType: 'text/markdown',
        })),
      }),
    }),
    {
      title: 'Docs',
      description:
        'Project docs — full markdown bodies, readable without a tool call.',
      mimeType: 'text/markdown',
    },
    async (uri, { docId }) => {
      const id = one(docId);
      const doc = getDocById(db, id);
      if (!doc) throw notFound('doc', id);
      return {
        contents: [{ uri: uri.href, mimeType: 'text/markdown', text: doc.body }],
      };
    },
  );

  server.registerResource(
    'field-notes',
    new ResourceTemplate('kennel:///field-notes/{slug}', {
      list: () => {
        const byId = new Map(listProjects(db).map((p) => [p.id, p]));
        return {
          resources: listFieldNotes(db).flatMap((fn) => {
            const p = byId.get(fn.projectId);
            return p
              ? [
                  {
                    uri: `kennel:///field-notes/${p.slug}`,
                    name: `${p.name} — Field notes`,
                    mimeType: 'text/markdown',
                  },
                ]
              : [];
          }),
        };
      },
    }),
    {
      title: 'Field notes',
      description:
        'Per-thread sense-making notes — premise, what I know, open questions, sources.',
      mimeType: 'text/markdown',
    },
    async (uri, { slug }) => {
      const s = one(slug);
      const project = getProjectBySlug(db, s);
      if (!project) throw notFound('project', s);
      const fn = getFieldNotesByProject(db, project.id);
      if (!fn) throw notFound('field notes', s);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: composeFieldNotesMarkdown(fn),
          },
        ],
      };
    },
  );

  server.registerResource(
    'runbook',
    new ResourceTemplate('kennel:///runbook/{slug}', {
      list: () => {
        const byId = new Map(listProjects(db).map((p) => [p.id, p]));
        return {
          resources: listRunbooks(db).flatMap((rb) => {
            const p = byId.get(rb.projectId);
            return p
              ? [
                  {
                    uri: `kennel:///runbook/${p.slug}`,
                    name: `${p.name} — Runbook`,
                    mimeType: 'text/markdown',
                  },
                ]
              : [];
          }),
        };
      },
    }),
    {
      title: 'Runbooks',
      description:
        'Per-thread operational runbook — URLs, setup, run, deploy, troubleshoot.',
      mimeType: 'text/markdown',
    },
    async (uri, { slug }) => {
      const s = one(slug);
      const project = getProjectBySlug(db, s);
      if (!project) throw notFound('project', s);
      const rb = getRunbookByProject(db, project.id);
      if (!rb) throw notFound('runbook', s);
      return {
        contents: [
          {
            uri: uri.href,
            mimeType: 'text/markdown',
            text: composeRunbookMarkdown(rb, project.name),
          },
        ],
      };
    },
  );
};
