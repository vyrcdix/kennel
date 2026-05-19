import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { makeTestDb, useTempContent } from '../test-helpers.js';
import { createProject } from './project.js';
import { reviewProposal } from './proposal.js';
import { getSkillById } from './skill.js';
import { newId } from '../ids.js';
import { nowIso } from '../time.js';
import type { DB } from '../db.js';

let db: DB;
let content: { cleanup: () => void };

beforeEach(() => {
  content = useTempContent();
  db = makeTestDb();
});
afterEach(() => {
  db.close();
  content.cleanup();
});

const seedSkillProposal = () => {
  const project = createProject(db, { name: 'P' });
  const skillId = newId();
  const proposalId = newId();
  db.prepare(
    `INSERT INTO skills (id, project_id, name, slug, source, source_path, body, revision, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 'local_path', ?, ?, 4, 'active', ?, ?)`,
  ).run(skillId, project.id, 's', 's', '~/s.md', 'original body', nowIso(), nowIso());
  db.prepare(
    `INSERT INTO skill_proposals (id, skill_id, proposed_body, rationale, status, created_at)
     VALUES (?, ?, 'new body', 'because', 'pending', ?)`,
  ).run(proposalId, skillId, nowIso());
  return { skillId, proposalId };
};

describe('reviewProposal', () => {
  test('accept replaces skill body, bumps revision, marks accepted', () => {
    const { skillId, proposalId } = seedSkillProposal();
    const after = reviewProposal(db, proposalId, 'accept');
    expect(after.status).toBe('accepted');
    const skill = getSkillById(db, skillId)!;
    expect(skill.body).toBe('new body');
    expect(skill.revision).toBe(5);
  });

  test('reject leaves skill body alone', () => {
    const { skillId, proposalId } = seedSkillProposal();
    const after = reviewProposal(db, proposalId, 'reject', { note: 'not this round' });
    expect(after.status).toBe('rejected');
    expect(after.decisionNote).toBe('not this round');
    const skill = getSkillById(db, skillId)!;
    expect(skill.body).toBe('original body');
    expect(skill.revision).toBe(4);
  });
});
