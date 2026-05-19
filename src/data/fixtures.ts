// Local mirror of server state. Populated once at boot via hydrate() from
// /api/bootstrap and kept in sync by actions that POST to the server then
// update the cache. Selectors read from these arrays synchronously.

import { notify } from './store';
import type {
  ActivityEntry,
  Chat,
  Doc,
  EntityComment,
  Item,
  Project,
  Reference,
  Runbook,
  Skill,
  SkillProposal,
  Tag,
} from './types';

export const projects: Project[] = [];
export const items: Item[] = [];
export const docs: Doc[] = [];
export const references: Reference[] = [];
export const runbooks: Runbook[] = [];
export const chats: Chat[] = [];
export const skills: Skill[] = [];
export const skillProposals: SkillProposal[] = [];
export const comments: EntityComment[] = [];
export const activity: ActivityEntry[] = [];
export const tags: Tag[] = [];

export type BootstrapPayload = {
  projects: Project[];
  items: Item[];
  docs: Doc[];
  references: Reference[];
  runbooks: Runbook[];
  chats: Chat[];
  skills: Skill[];
  skillProposals: SkillProposal[];
  comments: EntityComment[];
  activity: ActivityEntry[];
  tags: Tag[];
};

const replace = <T>(target: T[], source: T[]) => {
  target.splice(0, target.length, ...source);
};

/** Populate the local mirror from a bootstrap response. Called once on app
 *  boot before <App /> renders. Dates are already materialized by api.ts. */
export const hydrate = (payload: BootstrapPayload) => {
  replace(projects, payload.projects);
  replace(items, payload.items);
  replace(docs, payload.docs);
  replace(references, payload.references);
  replace(runbooks, payload.runbooks);
  replace(chats, payload.chats);
  replace(skills, payload.skills);
  replace(skillProposals, payload.skillProposals);
  replace(comments, payload.comments);
  replace(activity, payload.activity);
  replace(tags, payload.tags);
  notify();
};
