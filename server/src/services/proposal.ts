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
  applied_body: string | null;
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
  appliedBody: r.applied_body ?? undefined,
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

export type ReviewProposalOpts = {
  note?: string;
  bodyOverride?: string;
};

export const reviewProposal = (
  db: DB,
  id: string,
  decision: ProposalDecision,
  opts: ReviewProposalOpts = {},
): SkillProposal => {
  if (!['accept', 'accept_write', 'reject'].includes(decision))
    throw validationError({ decision: 'invalid' });

  const { note, bodyOverride } = opts;
  const proposal = getProposalById(db, id);
  if (!proposal) throw notFound('skill_proposal', id);
  const skill = getSkillById(db, proposal.skillId);
  if (!skill) throw notFound('skill', proposal.skillId);

  const edited =
    typeof bodyOverride === 'string' && bodyOverride !== proposal.proposedBody;
  const bodyToApply = edited ? bodyOverride! : proposal.proposedBody;
  const now = nowIso();

  // Wrap the proposal status update + skill body write + activity log in a
  // single tx. updateSkillBody's filesystem write is atomic via temp+rename,
  // so a tx rollback leaves the file in a sound state.
  const apply = db.transaction(() => {
    if (decision === 'accept' || decision === 'accept_write') {
      db.prepare(
        `UPDATE skill_proposals
         SET status = 'accepted',
             decision_note = ?,
             reviewed_at = ?,
             applied_body = ?
         WHERE id = ?`,
      ).run(note ?? null, now, edited ? bodyOverride! : null, id);
      updateSkillBody(db, skill.id, bodyToApply, true);
      // Canonical verb for filtering; qualifiers in payload so downstream
      // consumers can read them without substring matching.
      const qualifiers = [
        edited && 'edited',
        decision === 'accept_write' && 'wrote to source',
      ].filter(Boolean) as string[];
      logActivity(db, {
        projectId: skill.projectId ?? proposal.skillId,
        verb: 'ACCEPTED',
        target: `skill / ${skill.name}`,
        payload: [
          `rev ${skill.revision + 1}`,
          ...(qualifiers.length ? [qualifiers.join(' + ')] : []),
          ...(decision === 'accept_write' && skill.sourcePath
            ? [skill.sourcePath]
            : []),
        ].join(' · '),
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
  });
  apply();
  return getProposalById(db, id)!;
};
