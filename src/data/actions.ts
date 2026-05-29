// Mutation actions — every action POSTs/PATCHes the server, then updates the
// local cache + notifies. When the call fails with a structured server error,
// translate it into the domain exceptions screens already handle.

import {
  chats,
  comments,
  docs,
  fieldNotes,
  guidebookEntries,
  guidebooks,
  items,
  projects,
  references,
  runbooks,
  settings,
  skillProposals,
  skills,
} from './fixtures';
import { notify } from './store';
import { api, ApiError, materializeDates } from './api';
import type {
  Chat,
  Doc,
  EntityComment,
  EntityType,
  FieldNotes,
  FieldNotesMode,
  Guidebook,
  GuidebookEntry,
  Item,
  ItemKind,
  ItemState,
  Project,
  ProjectColor,
  ProjectStatus,
  Reference,
  Runbook,
  RunbookUrl,
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
  notify();
  return updated;
};

export const fileItem = async (id: string): Promise<Item> => {
  const updated = await wrap(() => api.post<Item>(`/api/items/${id}/file`));
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
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
  notify();
  return created;
};

export type UpdateItemPatch = {
  title?: string;
  body?: string | null;
};

/** Title / body edit on an existing item — distinct from state
 *  transitions (touchItem, fileItem, crystallizeItem) which own their
 *  own routes. */
export const updateItem = async (
  id: string,
  patch: UpdateItemPatch,
): Promise<Item> => {
  const updated = await wrap(() => api.patch<Item>(`/api/items/${id}`, patch));
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items[idx] = updated;
  notify();
  return updated;
};

export const deleteItem = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/items/${id}`));
  const idx = items.findIndex((i) => i.id === id);
  if (idx >= 0) items.splice(idx, 1);
  notify();
};

// ─── References ──────────────────────────────────────────────────────────

export type CreateReferenceInput = {
  projectSlug: string;
  label: string;
  url?: string;
  notes?: string;
};

export const createReference = async (
  input: CreateReferenceInput,
): Promise<Reference> => {
  const created = await wrap(() => api.post<Reference>('/api/references', input));
  references.unshift(created);
  notify();
  return created;
};

export const deleteReference = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/references/${id}`));
  const idx = references.findIndex((r) => r.id === id);
  if (idx >= 0) references.splice(idx, 1);
  for (const it of items) {
    if (it.referenceId === id) it.referenceId = undefined;
  }
  notify();
};

// ─── Docs ────────────────────────────────────────────────────────────────

export const saveDoc = async (id: string, body: string): Promise<void> => {
  const doc = docs.find((d) => d.id === id);
  if (doc && doc.body === body) return;
  const updated = await wrap(() => api.put(`/api/docs/${id}`, { body }));
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) docs[idx] = updated as typeof docs[number];
  notify();
};

export const setDocPinned = async (id: string, pinned: boolean): Promise<void> => {
  const updated = await wrap(() =>
    api.patch(`/api/docs/${id}/pin`, { pinned }),
  );
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) docs[idx] = updated as typeof docs[number];
  notify();
};

export type UploadDocInput = {
  projectSlug: string;
  filename: string;
  kind: 'md' | 'docx';
  /** Base64-encoded file body. The server decodes via Buffer.from(..., 'base64'). */
  bodyBase64: string;
  title?: string;
};

/** Create a new Doc from an uploaded file (.md or .docx). Wraps the
 *  server's createDocFromUpload, which converts .docx via mammoth and
 *  populates the provenance columns. */
export const deleteDoc = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/docs/${id}`));
  const idx = docs.findIndex((d) => d.id === id);
  if (idx >= 0) docs.splice(idx, 1);
  // Clear items.docId so any item that pointed at it loses the link
  // immediately rather than waiting for the next bootstrap.
  for (const it of items) {
    if (it.docId === id) it.docId = undefined;
  }
  notify();
};

export const uploadDoc = async (input: UploadDocInput): Promise<Doc> => {
  const created = await wrap(() =>
    api.post<Doc>('/api/docs/upload', {
      projectSlug: input.projectSlug,
      filename: input.filename,
      kind: input.kind,
      body: input.bodyBase64,
      title: input.title,
    }),
  );
  docs.push(created);
  notify();
  return created;
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
  notify();
  return created;
};

// ─── Skill proposals ─────────────────────────────────────────────────────

export type ProposalDecision = 'accept' | 'accept_write' | 'reject';

export type ReviewProposalOpts = {
  note?: string;
  bodyOverride?: string;
};

export const reviewProposal = async (
  id: string,
  decision: ProposalDecision,
  opts: ReviewProposalOpts = {},
): Promise<void> => {
  const updated = await wrap(() =>
    api.post<SkillProposal>(`/api/skill-proposals/${id}/review`, {
      decision,
      note: opts.note,
      bodyOverride: opts.bodyOverride,
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
  notify();
  return created;
};

export const setChatUrl = async (id: string, claudeUrl: string | null): Promise<Chat> => {
  const updated = await wrap(() =>
    api.patch<Chat>(`/api/chats/${id}/url`, { claudeUrl }),
  );
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) chats[idx] = updated;
  notify();
  return updated;
};

export const touchChat = async (id: string): Promise<void> => {
  const updated = await wrap(() => api.post(`/api/chats/${id}/touch`));
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) chats[idx] = updated as typeof chats[number];
  notify();
};

export const deleteChat = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/chats/${id}`));
  const idx = chats.findIndex((c) => c.id === id);
  if (idx >= 0) chats.splice(idx, 1);
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
  status?: ProjectStatus;
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
  notify();
  return updated;
};

// ─── Runbooks ────────────────────────────────────────────────────────────

/** Replace the cached runbook for a project, or append it if this is the
 *  first time one exists (upsertRunbook creates server-side). */
const cacheRunbook = (projectId: string, updated: Runbook): void => {
  const idx = runbooks.findIndex((r) => r.projectId === projectId);
  if (idx >= 0) runbooks[idx] = updated;
  else runbooks.push(updated);
};

export const updateRunbookUrls = async (
  projectId: string,
  urls: RunbookUrl[],
): Promise<void> => {
  const project = projects.find((p) => p.id === projectId);
  if (!project) return;
  const updated = await wrap(() =>
    api.patch<Runbook>(`/api/projects/${project.slug}/runbook`, { urls }),
  );
  cacheRunbook(projectId, updated);
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
  cacheRunbook(projectId, updated);
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
  notify();
  return updated;
};

export const setFieldNotesMode = async (
  projectSlug: string,
  mode: FieldNotesMode,
): Promise<FieldNotes> => {
  const updated = await wrap(() =>
    api.patch<FieldNotes>(`/api/projects/${projectSlug}/field-notes/mode`, { mode }),
  );
  const idx = fieldNotes.findIndex((f) => f.projectId === updated.projectId);
  if (idx >= 0) fieldNotes[idx] = updated;
  else fieldNotes.push(updated);
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

// ─── Guidebooks ──────────────────────────────────────────────────────────

export type CreateGuidebookInput = {
  projectSlug: string;
  name: string;
  description?: string;
  pinned?: boolean;
};

export const createGuidebook = async (
  input: CreateGuidebookInput,
): Promise<Guidebook> => {
  const created = await wrap(() =>
    api.post<Guidebook>(`/api/projects/${input.projectSlug}/guidebooks`, {
      name: input.name,
      description: input.description,
      pinned: input.pinned,
    }),
  );
  guidebooks.push(created);
  notify();
  return created;
};

export type UpdateGuidebookPatch = {
  name?: string;
  description?: string | null;
  pinned?: boolean;
};

export const updateGuidebook = async (
  id: string,
  patch: UpdateGuidebookPatch,
): Promise<Guidebook> => {
  const updated = await wrap(() =>
    api.patch<Guidebook>(`/api/guidebooks/${id}`, patch),
  );
  const idx = guidebooks.findIndex((g) => g.id === id);
  if (idx >= 0) guidebooks[idx] = updated;
  notify();
  return updated;
};

/** Convenience wrapper — most pin toggles bypass the full update form. */
export const setGuidebookPinned = (id: string, pinned: boolean) =>
  updateGuidebook(id, { pinned });

export const reorderGuidebooks = async (
  projectSlug: string,
  orderedIds: string[],
): Promise<Guidebook[]> => {
  const updated = await wrap(() =>
    api.patch<Guidebook[]>(
      `/api/projects/${projectSlug}/guidebooks/reorder`,
      { orderedIds },
    ),
  );
  // Replace ranks in-place. Server returns the topic's full guidebook list.
  for (const g of updated) {
    const idx = guidebooks.findIndex((x) => x.id === g.id);
    if (idx >= 0) guidebooks[idx] = g;
  }
  notify();
  return updated;
};

export const deleteGuidebook = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/guidebooks/${id}`));
  const gbIdx = guidebooks.findIndex((g) => g.id === id);
  if (gbIdx >= 0) guidebooks.splice(gbIdx, 1);
  // Cascade-evict cached entries; server already deleted them in the same tx.
  for (let i = guidebookEntries.length - 1; i >= 0; i--) {
    if (guidebookEntries[i].guidebookId === id) guidebookEntries.splice(i, 1);
  }
  notify();
};

// ─── Guidebook entries ───────────────────────────────────────────────────

/** Discriminated input matching the server's addEntry shapes. The four
 *  variants — pick-existing doc/ref, upload a file, or paste a link —
 *  all funnel through the same `POST /api/guidebooks/:id/entries`
 *  endpoint with the source field varying. */
export type AddEntryInput =
  | {
      kind: 'existingDoc';
      docId: string;
      name?: string;
      description?: string;
      tags?: string[];
    }
  | {
      kind: 'existingRef';
      referenceId: string;
      name?: string;
      description?: string;
      tags?: string[];
    }
  | {
      kind: 'upload';
      filename: string;
      sourceKind: 'md' | 'docx';
      /** Base64-encoded contents; the server decodes it. */
      bodyBase64: string;
      name?: string;
      description?: string;
      tags?: string[];
    }
  | {
      kind: 'link';
      url: string;
      label: string;
      name?: string;
      description?: string;
      tags?: string[];
    };

const toServerEntryBody = (input: AddEntryInput): Record<string, unknown> => {
  if (input.kind === 'existingDoc') {
    return {
      docId: input.docId,
      name: input.name,
      description: input.description,
      tags: input.tags,
    };
  }
  if (input.kind === 'existingRef') {
    return {
      referenceId: input.referenceId,
      name: input.name,
      description: input.description,
      tags: input.tags,
    };
  }
  if (input.kind === 'upload') {
    return {
      upload: {
        filename: input.filename,
        kind: input.sourceKind,
        body: input.bodyBase64,
      },
      name: input.name,
      description: input.description,
      tags: input.tags,
    };
  }
  return {
    link: { url: input.url, label: input.label },
    name: input.name,
    description: input.description,
    tags: input.tags,
  };
};

export const addEntry = async (
  guidebookId: string,
  input: AddEntryInput,
): Promise<GuidebookEntry> => {
  const created = await wrap(() =>
    api.post<GuidebookEntry>(
      `/api/guidebooks/${guidebookId}/entries`,
      toServerEntryBody(input),
    ),
  );
  guidebookEntries.push(created);
  notify();
  return created;
};

export type UpdateEntryPatch = {
  name?: string;
  description?: string | null;
  tags?: string[];
};

export const updateEntry = async (
  id: string,
  patch: UpdateEntryPatch,
): Promise<GuidebookEntry> => {
  const updated = await wrap(() =>
    api.patch<GuidebookEntry>(`/api/guidebook-entries/${id}`, patch),
  );
  const idx = guidebookEntries.findIndex((e) => e.id === id);
  if (idx >= 0) guidebookEntries[idx] = updated;
  notify();
  return updated;
};

export const reorderEntries = async (
  guidebookId: string,
  orderedIds: string[],
): Promise<GuidebookEntry[]> => {
  const updated = await wrap(() =>
    api.patch<GuidebookEntry[]>(
      `/api/guidebooks/${guidebookId}/entries/reorder`,
      { orderedIds },
    ),
  );
  for (const e of updated) {
    const idx = guidebookEntries.findIndex((x) => x.id === e.id);
    if (idx >= 0) guidebookEntries[idx] = e;
  }
  notify();
  return updated;
};

export const removeEntry = async (id: string): Promise<void> => {
  await wrap(() => api.del(`/api/guidebook-entries/${id}`));
  const idx = guidebookEntries.findIndex((e) => e.id === id);
  if (idx >= 0) guidebookEntries.splice(idx, 1);
  notify();
};

// Re-export materializeDates for test convenience
export { materializeDates };
