// Cadence memo routing (C6). A "did it" often produces a thought; this files
// it into the served thread's field notes, in a suggested section. Text-only in
// v1; the voice affordance ships behind VOICE_MEMO_ENABLED (B3).
//
// FLAG (B4 follow-up — handoff/cadence_eng_questions/FOLLOWUP-fieldnotes-
// sections.md, awaiting design confirm): the design's suggested sections
// (People / Resources / Scratch / What's working / Open questions) don't all
// map to our real FieldNotesSectionKey enum (premise / whatIKnow /
// openQuestions / sources / crystallizations). We ship the PROPOSED remap
// below; revise DEFAULT_SECTION / labels if design rules otherwise.

import { updateFieldNotes } from '../data/actions';
import { getFieldNotes } from '../data/selectors';
import type { FieldNotesSectionKey, Project } from '../data/types';

/** Voice memo (mic capture + storage + transcription) is a separate follow-on;
 *  the affordance stays in the UI but hidden until this flips. */
export const VOICE_MEMO_ENABLED = false;

/** The five real field-notes sections, in composer order. */
export const MEMO_SECTIONS: { key: FieldNotesSectionKey; label: string }[] = [
  { key: 'whatIKnow', label: 'What I know' },
  { key: 'openQuestions', label: 'Open questions' },
  { key: 'sources', label: 'Sources' },
  { key: 'premise', label: 'Premise' },
  { key: 'crystallizations', label: 'Crystallizations' },
];

export const sectionLabel = (key: FieldNotesSectionKey): string =>
  MEMO_SECTIONS.find((s) => s.key === key)?.label ?? key;

/** Proposed default when a cadence carries no noteDefaultSection: the neutral
 *  "what came of it" bucket (B4 remap fallback). */
export const DEFAULT_SECTION: FieldNotesSectionKey = 'whatIKnow';

/** Append a memo to the project's field-notes section. The field notes belong
 *  to the cadence's owning thread (its project). */
export const routeCadenceMemo = async (
  project: Project,
  section: FieldNotesSectionKey,
  text: string,
): Promise<void> => {
  const body = text.trim();
  if (!body) return;
  const prev = (getFieldNotes(project.id)?.[section] ?? '').trimEnd();
  const next = prev ? `${prev}\n\n${body}` : body;
  await updateFieldNotes(project.slug, { [section]: next });
};
