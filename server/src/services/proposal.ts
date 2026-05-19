import type { DB } from '../db.js';
import { logActivity } from '../activity.js';
import { notFound, validationError } from '../errors.js';
import { newId } from '../ids.js';
import { fromIso, nowIso } from '../time.js';
import type { SkillProposal } from '../../../shared/types.js';
import { getSkillById, updateSkillBody } from './skill.js';

type ProposalRow = {
  id: string;
  skill_id: string;
  proposed_body: string;
  rationale: string;
  triggered_by: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'superseded';
  decision_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export const rowToProposal = (r: ProposalRow): SkillProposal => ({
  id: r.id,
  skillId: r.skill_id,
  proposedBody: r.proposed_body,
  rationale: r.rationale,
  triggeredBy: r.triggered_by ? JSON.parse(r.triggered_by) : undefined,
  status: r.status,
  decisionNote: r.decision_note ?? undefined,
  createdAt: fromIso(r.created_at)!,
  reviewedAt: fromIso(r.reviewed_at),
});

export const listProposals = (db: DB): SkillProposal[] =>
  db
    .prepare<[], ProposalRow>('SELECT * FROM skill_proposals ORDER BY created_at DESC')
    .all()
    .map(rowToProposal);

export const getProposalById = (db: DB, id: string): SkillProposal | undefined => {
  const row = db
    .prepare<[string], ProposalRow>('SELECT * FROM skill_proposals WHERE id = ?')
    .get(id);
  return row ? rowToProposal(row) : undefined;
};

export type CreateProposalInput = {
  skillId: string;
  proposedBody: string;
  rationale: string;
  triggeredBy?: { chatId?: string; itemId?: string; docId?: string };
};

export const createProposal = (
  db: DB,
  input: CreateProposalInput,
  actor: 'craig' | 'claude' | 'cli' = 'claude',
): SkillProposal => {
  if (!input.proposedBody?.trim()) throw validationError({ proposedBody: 'required' });
  if (!input.rationale?.trim()) throw validationError({ rationale: 'required' });
  const skill = getSkillById(db, input.skillId);
  if (!skill) throw notFound('skill', input.skillId);

  const id = newId();
  const now = nowIso();
  db.prepare(
    `INSERT INTO skill_proposals
     (id, skill_id, proposed_body, rationale, triggered_by, status, created_at)
     VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
  ).run(
    id,
    input.skillId,
    input.proposedBody,
    input.rationale,
    input.triggeredBy ? JSON.stringify(input.triggeredBy) : null,
    now,
  );
  logActivity(db, {
    projectId: skill.projectId ?? input.skillId,
    verb: 'PROPOSED',
    target: `skill / ${skill.name}`,
    payload: input.rationale.slice(0, 80),
    actor,
    occurredAt: now,
  });
  return getProposalById(db, id)!;
};

export type ProposalDecision = 'accept' | 'accept_write' | 'reject';

export const reviewProposal = (
  db: DB,
  id: string,
  decision: ProposalDecision,
  note?: string,
): SkillProposal => {
  if (!['accept', 'accept_write', 'reject'].includes(decision))
    throw validationError({ decision: 'invalid' });

  const proposal = getProposalById(db, id);
  if (!proposal) throw notFound('skill_proposal', id);
  const skill = getSkillById(db, proposal.skillId);
  if (!skill) throw notFound('skill', proposal.skillId);

  const now = nowIso();
  if (decision === 'accept' || decision === 'accept_write') {
    db.prepare(
      `UPDATE skill_proposals
       SET status = 'accepted', decision_note = ?, reviewed_at = ?
       WHERE id = ?`,
    ).run(note ?? null, now, id);
    updateSkillBody(db, skill.id, proposal.proposedBody, true);
    logActivity(db, {
      projectId: skill.projectId ?? proposal.skillId,
      verb: decision === 'accept_write' ? 'ACCEPTED · WROTE' : 'ACCEPTED',
      target: `skill / ${skill.name}`,
      payload:
        decision === 'accept_write'
          ? `rev ${skill.revision + 1} · ${skill.sourcePath ?? 'inline'}`
          : `rev ${skill.revision + 1}`,
      actor: 'craig',
      occurredAt: now,
    });
  } else {
    db.prepare(
      `UPDATE skill_proposals
       SET status = 'rejected', decision_note = ?, reviewed_at = ?
       WHERE id = ?`,
    ).run(note ?? null, now, id);
    logActivity(db, {
      projectId: skill.projectId ?? proposal.skillId,
      verb: 'REJECTED',
      target: `skill proposal / ${skill.name}`,
      payload: note?.trim() ? `"${note.trim().slice(0, 60)}"` : undefined,
      actor: 'craig',
      occurredAt: now,
    });
  }
  return getProposalById(db, id)!;
};
