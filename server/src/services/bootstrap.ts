import type { DB } from '../db.js';
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
} from '../../../shared/types.js';
import { listActivity } from './activity.js';
import { listChats } from './chat.js';
import { listComments } from './comment.js';
import { listDocs } from './doc.js';
import { listItems } from './item.js';
import { listProjects } from './project.js';
import { listProposals } from './proposal.js';
import { listRefs } from './reference.js';
import { listRunbooks } from './runbook.js';
import { listSkills } from './skill.js';
import { listTags } from './tag.js';

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

export const bootstrap = (db: DB): BootstrapPayload => ({
  projects: listProjects(db),
  items: listItems(db),
  docs: listDocs(db),
  references: listRefs(db),
  runbooks: listRunbooks(db),
  chats: listChats(db),
  skills: listSkills(db),
  skillProposals: listProposals(db),
  comments: listComments(db),
  activity: listActivity(db),
  tags: listTags(db),
});
