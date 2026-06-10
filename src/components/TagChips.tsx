// Shared-tag chips for any taggable entity (item / doc / reference /
// runbook). Read-only by default; `editable` adds an inline add-input
// and per-chip remove. Tags are workspace-wide rows in `tags` +
// `entity_tags` — not the guidebook-entry-local free-text tags.

import { useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { applyTagTo, removeTagFrom, ValidationError } from '../data/actions';
import { getTagsFor } from '../data/selectors';
import type { EntityType } from '../data/types';

export const TagChips = ({
  entityType,
  entityId,
  editable = false,
}: {
  entityType: EntityType;
  entityId: string;
  editable?: boolean;
}) => {
  const applied = getTagsFor(entityType, entityId);
  const [draft, setDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (tagId: string) => {
    try {
      await removeTagFrom(entityType, entityId, tagId);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const add = async () => {
    const name = draft.trim().replace(/^#/, '').toLowerCase();
    if (!name || adding) return;
    setAdding(true);
    try {
      await applyTagTo(entityType, entityId, name);
      setDraft('');
      setError(null);
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? 'lowercase letters, digits, dashes · max 40'
          : (err as Error).message,
      );
    } finally {
      setAdding(false);
    }
  };

  if (!editable && applied.length === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      {applied.map((tag) => (
        <span
          key={tag.id}
          className="km-tag"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            background: 'rgba(201,168,124,.18)',
          }}
        >
          #{tag.name}
          {editable && (
            <span
              onClick={() => void remove(tag.id)}
              title="Remove tag"
              style={{ cursor: 'pointer', display: 'inline-flex', opacity: 0.7 }}
            >
              <Icons.x size={9} />
            </span>
          )}
        </span>
      ))}
      {editable && (
        <input
          className="km-input"
          value={draft}
          placeholder="+ tag"
          disabled={adding}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void add();
            }
          }}
          style={{
            width: 96,
            padding: '2px 8px',
            fontSize: 12,
            fontFamily: 'var(--ff-mono)',
          }}
        />
      )}
      {error && <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>}
    </div>
  );
};

export default TagChips;
