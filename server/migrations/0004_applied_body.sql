-- 0004 · preserve original proposed_body
--
-- The reviewProposal flow used to UPDATE proposed_body when the reviewer
-- edited the body before accepting, destroying what Claude originally
-- proposed. From now on:
--   - proposed_body is immutable after creation
--   - applied_body records what was actually written to the skill (NULL
--     when no edit happened — original proposed_body was applied verbatim)

ALTER TABLE skill_proposals ADD COLUMN applied_body TEXT;
