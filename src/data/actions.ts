// Mutation actions — every action POSTs/PATCHes the server, then updates the
// local cache + notifies. When the call fails with a structured server error,
// translate it into the domain exceptions screens already handle.

import {
  activity,
  chats,
  comments,
  docs,
  fieldNotes,
  items,
  projects,
  runbooks,
  settings,
  skillProposals,
  skills,
} from './fixtures';
import { notify } from './store';
import { api, ApiError, materializeDates } from './api';
import type {
  Chat,
  EntityComment,
  EntityType,
  FieldNotes,
  Item,
  ItemKind,
  ItemState,
  Project,
  ProjectColor,
  Runbook,
  Settings,
  Skill,
  SkillProposal,
} from './types';

// ─── Error classes (signature preserved for UI handlers) ─────────────────

export class SlugConflictError extends Error {
  readonly conflictingProject: { id: string; name: string };
  constructor(conflict: { id: string; name: string }) {
    super(`Slug already used by ${conflict.name}`);
    this.name = 'SlugConflictError';
    this.conflictingProject = conflict;
  }
}

export class ValidationError extends Error {
  readonly fields: Record<string, string>;
  constructor(fields: Record<string, string>) {
    super(`validation_error: ${Object.keys(fields).join(', ')}`);
    this.name = 'ValidationError';
    this.fields = fields;
  }
}

const translateApiError = (err: unknown): never => {
  if (err instanceof ApiError) {
    if (err.body.error === 'slug_conflict') {
      throw new SlugConflictError(err.body.conflicting_project);
    }
    if (err.body.error === 'validation_error') {
      throw new ValidationError(err.body.fields);
    }
  }
  throw err;
};

const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    return translateApiError(err);
  }
};

// ─── Items ───────────────────────────────────────────────────────────────

export const transitionItem = async (id: string, to: ItemState): Promise<Item> => {
  const updated = await wrap(() =>
    api.post<Item>(`/api/items/${id}/transition`, { to }),
  );
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
  refreshRecentActivity();
  notify();
  return updated;
};

export const touchItem = async (id: string): Promise<void> => {
  await wrap(() => api.post(`/api/items/${id}/touch`));
  const item = items.find((i) => i.id === id);
  if (item) item.lastTouchedAt = new Date();
  notify();
};

export type CrystallizeOpts = { promoteKind?: boolean; sourcesFrom?: string[] };

export const crystallizeItem = async (
  id: string,
  opts: CrystallizeOpts = {},
): Promise<Item> => {
  const updated = await wrap(() =>
    api.post<Item>(`/api/items/${id}/crystallize`, opts),
  );
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
  refreshRecentActivity();
  notify();
  return updated;
};

export type ConvertTarget =
  | 'idea'
  | 'note'
  | 'action'
  | 'ref'
  | 'question'
  | 'doc'
  | 'reference';

export const convertItem = async (
  id: string,
  target: ConvertTarget,
): Promise<Item> => {
  const updated = await wrap(() =>
    api.post<Item>(`/api/items/${id}/convert`, { target }),
  );
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
  // Side-effects (new doc / ref) reach us on the next SSE refetch.
  refreshRecentActivity();
  notify();
  return updated;
};

export const fileItem = async (id: string): Promise<Item> => {
  const updated = await wrap(() => api.post<Item>(`/api/items/${id}/file`));
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
  refreshRecentActivity();
  notify();
  return updated;
};

export type CaptureInput = {
  projectId: string;
  kind: ItemKind;
  title: string;
  body?: string;
};

export const captureItem = async (input: CaptureInput): Promise<Item> => {
  const created = await wrap(() => api.post<Item>('/api/items', input));
  items.unshift(created);
  refreshRecentActivity();
  notify();
  return created;
};

// ─── Docs ────────────────────────────────────────────────────────────────

export const saveDoc = async (id: string, body: string): Promise<void> => {
  const doc = docs.find((d) => d.id === id);
  if (doc && doc.body === body) return;
  const updated = await wrap(() => api.put(`/api/docs/${id}`, { body }));
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) docs[idx] = updated as typeof docs[number];
  refreshRecentActivity();
  notify();
};

export const setDocPinned = async (id: string, pinned: boolean): Promise<void> => {
  const updated = await wrap(() =>
    api.patch(`/api/docs/${id}/pin`, { pinned }),
  );
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) docs[idx] = updated as typeof docs[number];
  refreshRecentActivity();
  notify();
};

// ─── Comments ────────────────────────────────────────────────────────────

export const addComment = async (
  entityType: EntityType,
  entityId: string,
  body: string,
  author: 'craig' | 'claude' = 'craig',
): Promise<EntityComment | undefined> => {
  const trimmed = body.trim();
  if (!trimmed) return undefined;
  const created = await wrap(() =>
    api.post<EntityComment>(
      `/api/entities/${entityType}/${entityId}/comments`,
      { body: trimmed, author },
    ),
  );
  comments.push(created);
  refreshRecentActivity();
  notify();
  return created;
};

// ─── Skill proposals ─────────────────────────────────────────────────────

export type ProposalDecision = 'accept' | 'accept_write' | 'reject';

export const reviewProposal = async (
  id: string,
  decision: ProposalDecision,
  note?: string,
): Promise<void> => {
  const updated = await wrap(() =>
    api.post<SkillProposal>(`/api/skill-proposals/${id}/review`, {
      decision,
      note,
    }),
  );
  const pidx = skillProposals.findIndex((p) => p.id === id);
  if (pidx >= 0) skillProposals[pidx] = updated;

  // If accepted, the skill body + revision changed too. Refetch it cheaply.
  if (updated.status === 'accepted') {
    const skill = skills.find((s) => s.id === updated.skillId);
    if (skill) {
      try {
        const refreshed = await api.get<Skill>(`/api/bootstrap`);
        // Heavy but simple; replace skill from the bootstrap response.
        const next = (refreshed as unknown as { skills: Skill[] }).skills.find(
          (s) => s.id === skill.id,
        );
        if (next) Object.assign(skill, next);
      } catch {
        /* ignore — UI shows old body but proposal status is correct */
      }
    }
  }
  refreshRecentActivity();
  notify();
};

// ─── Chats ───────────────────────────────────────────────────────────────

export type RegisterChatInput = {
  projectSlug: string;
  tagline: string;
  claudeUrl?: string;
};

export const registerChat = async (input: RegisterChatInput): Promise<Chat> => {
  const created = await wrap(() => api.post<Chat>('/api/chats', input));
  chats.push(created);
  refreshRecentActivity();
  notify();
  return created;
};

export const touchChat = async (id: string): Promise<void> => {
  const updated = await wrap(() => api.post(`/api/chats/${id}/touch`));
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) chats[idx] = updated as typeof chats[number];
  notify();
};

// ─── Projects ────────────────────────────────────────────────────────────

export type CreateProjectInput = {
  name: string;
  slug?: string;
  description?: string;
  context?: string;
  color?: ProjectColor | null;
  pinned?: boolean;
};

export const createProject = async (input: CreateProjectInput): Promise<Project> => {
  const created = await wrap(() => api.post<Project>('/api/projects', input));
  projects.push(created);
  refreshRecentActivity();
  notify();
  return created;
};

export const dismissNextSteps = async (projectId: string): Promise<void> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const updated = await wrap(() =>
    api.post<Project>(`/api/projects/${project.slug}/dismiss-next-steps`),
  );
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) projects[idx] = updated;
  notify();
};

export const restoreNextSteps = async (projectId: string): Promise<void> => {
  // No dedicated endpoint yet — flip locally for now until backend lands.
  // (Spec says: clear projects.metadata.next_steps_dismissed = true.)
  const project = projects.find((p) => p.id === projectId);
  if (!project || !project.nextStepsDismissed) return;
  project.nextStepsDismissed = false;
  project.updatedAt = new Date();
  notify();
};

export const togglePin = async (projectId: string): Promise<void> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const updated = await wrap(() =>
    api.post<Project>(`/api/projects/${project.slug}/toggle-pin`),
  );
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) projects[idx] = updated;
  notify();
};

export type UpdateProjectPatch = {
  name?: string;
  description?: string;
  context?: string | null;
  color?: ProjectColor | null;
  pinned?: boolean;
};

export const updateProject = async (
  projectId: string,
  patch: UpdateProjectPatch,
): Promise<Project | undefined> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return undefined;
  const updated = await wrap(() =>
    api.patch<Project>(`/api/projects/${project.slug}`, patch),
  );
  const idx = projects.findIndex((p) => p.id === projectId);
  if (idx >= 0) projects[idx] = updated;
  refreshRecentActivity();
  notify();
  return updated;
};

// ─── Runbooks ────────────────────────────────────────────────────────────

export const updateRunbookUrl = async (projectId: string, url: string): Promise<void> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const updated = await wrap(() =>
    api.patch<Runbook>(`/api/projects/${project.slug}/runbook`, { url }),
  );
  const idx = runbooks.findIndex((r) => r.projectId === projectId);
  if (idx >= 0) runbooks[idx] = updated;
  notify();
};

export type RunbookSection =
  | 'prerequisites'
  | 'setup'
  | 'run'
  | 'deploy'
  | 'troubleshoot'
  | 'notes';

export const updateRunbookSection = async (
  projectId: string,
  section: RunbookSection,
  value: string,
): Promise<void> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const updated = await wrap(() =>
    api.patch<Runbook>(`/api/projects/${project.slug}/runbook`, {
      [section]: value,
    }),
  );
  const idx = runbooks.findIndex((r) => r.projectId === projectId);
  if (idx >= 0) runbooks[idx] = updated;
  refreshRecentActivity();
  notify();
};

// ─── Field notes ─────────────────────────────────────────────────────────

export type FieldNotesPatch = {
  premise?: string | null;
  whatIKnow?: string | null;
  openQuestions?: string | null;
  sources?: string | null;
  crystallizations?: string | null;
};

export const updateFieldNotes = async (
  projectSlug: string,
  patch: FieldNotesPatch,
): Promise<FieldNotes> => {
  const updated = await wrap(() =>
    api.put<FieldNotes>(`/api/projects/${projectSlug}/field-notes`, patch),
  );
  const idx = fieldNotes.findIndex((f) => f.projectId === updated.projectId);
  if (idx >= 0) fieldNotes[idx] = updated;
  else fieldNotes.push(updated);
  refreshRecentActivity();
  notify();
  return updated;
};

// ─── Settings ────────────────────────────────────────────────────────────

export type SettingsPatch = {
  agingThresholdDays?: number;
  filingPromptDays?: 0 | 90 | 180;
  dormantThresholdDays?: number;
  showTemperature?: boolean;
};

export const updateSettings = async (patch: SettingsPatch): Promise<Settings> => {
  const updated = await wrap(() => api.patch<Settings>('/api/settings', patch));
  settings.current = updated;
  notify();
  return updated;
};

// ─── Helpers ─────────────────────────────────────────────────────────────

/** After a write, fetch the latest few activity entries so the dashboard
 *  reflects what the server logged. Cheap (~few rows). */
const refreshRecentActivity = async () => {
  try {
    const since = new Date(Date.now() - 24 * 3600_000).toISOString();
    const fresh = await api.get<typeof activity>(
      `/api/activity?since=${encodeURIComponent(since)}`,
    );
    const existing = new Set(activity.map((a) => a.id));
    const merged = [
      ...fresh.filter((a) => !existing.has(a.id)),
      ...activity,
    ].sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime());
    activity.splice(0, activity.length, ...merged);
  } catch {
    /* ignore — activity feed lags by one keystroke at worst */
  }
};

// Re-export materializeDates for test convenience
export { materializeDates };
