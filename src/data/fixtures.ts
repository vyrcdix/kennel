// Local mirror of server state. Populated once at boot via hydrate() from
// /api/bootstrap and kept in sync by actions that POST to the server then
// update the cache. Selectors read from these arrays synchronously.

import { notify } from './store';
import type {
  ActivityEntry,
  Chat,
  Doc,
  EntityComment,
  FieldNotes,
  Guidebook,
  GuidebookEntry,
  Item,
  Project,
  Reference,
  Routing,
  Runbook,
  Settings,
  Skill,
  SkillProposal,
  Tag,
} from './types';

export const projects: Project[] = [];
export const items: Item[] = [];
export const docs: Doc[] = [];
export const references: Reference[] = [];
export const runbooks: Runbook[] = [];
export const fieldNotes: FieldNotes[] = [];
export const chats: Chat[] = [];
export const skills: Skill[] = [];
export const skillProposals: SkillProposal[] = [];
export const comments: EntityComment[] = [];
export const activity: ActivityEntry[] = [];
export const tags: Tag[] = [];
export const guidebooks: Guidebook[] = [];
export const guidebookEntries: GuidebookEntry[] = [];
export const routings: Routing[] = [];

const DEFAULT_SETTINGS: Settings = {
  agingThresholdDays: 21,
  filingPromptDays: 0,
  dormantThresholdDays: 60,
  showTemperature: true,
  resurfaceIntervalDays: 30,
  routingDailyCap: 200,
  routingConfidenceThreshold: 0.55,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

// Settings is a single object rather than an array. The store keeps one
// mutable holder so selectors can read settings.current synchronously.
export const settings: { current: Settings } = { current: DEFAULT_SETTINGS };

export type BootstrapPayload = {
  projects: Project[];
  items: Item[];
  docs: Doc[];
  references: Reference[];
  runbooks: Runbook[];
  fieldNotes: FieldNotes[];
  chats: Chat[];
  skills: Skill[];
  skillProposals: SkillProposal[];
  comments: EntityComment[];
  activity: ActivityEntry[];
  tags: Tag[];
  guidebooks: Guidebook[];
  guidebookEntries: GuidebookEntry[];
  settings: Settings;
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
  replace(fieldNotes, payload.fieldNotes ?? []);
  replace(chats, payload.chats);
  replace(skills, payload.skills);
  replace(skillProposals, payload.skillProposals);
  replace(comments, payload.comments);
  replace(activity, payload.activity);
  replace(tags, payload.tags);
  replace(guidebooks, payload.guidebooks ?? []);
  replace(guidebookEntries, payload.guidebookEntries ?? []);
  settings.current = payload.settings ?? DEFAULT_SETTINGS;
  notify();
};
