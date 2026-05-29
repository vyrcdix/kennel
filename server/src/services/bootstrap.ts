import type { DB } from '../db.js';
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
  Runbook,
  Settings,
  Skill,
  SkillProposal,
  Tag,
} from '../../../shared/types.js';
import { listActivity } from './activity.js';
import { listChats } from './chat.js';
import { listComments } from './comment.js';
import { listDocs } from './doc.js';
import { listFieldNotes } from './fieldNotes.js';
import { listGuidebooks } from './guidebook.js';
import { listAllEntries } from './guidebookEntry.js';
import { listItems } from './item.js';
import { listProjects } from './project.js';
import { listProposals } from './proposal.js';
import { listRefs } from './reference.js';
import { listRunbooks } from './runbook.js';
import { getSettings } from './settings.js';
import { listSkills } from './skill.js';
import { listTags } from './tag.js';

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

export const bootstrap = (db: DB): BootstrapPayload => ({
  projects: listProjects(db),
  items: listItems(db),
  docs: listDocs(db),
  references: listRefs(db),
  runbooks: listRunbooks(db),
  fieldNotes: listFieldNotes(db),
  chats: listChats(db),
  skills: listSkills(db),
  skillProposals: listProposals(db),
  comments: listComments(db),
  activity: listActivity(db),
  tags: listTags(db),
  guidebooks: listGuidebooks(db),
  guidebookEntries: listAllEntries(db),
  settings: getSettings(db),
});
