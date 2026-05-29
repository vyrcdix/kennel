import { useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';

export type ChatRowProps = {
  tagline: string;
  since: string;
  stale?: boolean;
  claudeUrl?: string | null;
  /** Row click — typically opens claudeUrl. Only used when a URL exists. */
  onClick?: () => void;
  /** When provided, a URL-less row shows an inline "add link" affordance
   *  that calls this with the pasted URL. */
  onSaveUrl?: (url: string) => void;
  /** When provided, the row shows a trash button that calls this. */
  onDelete?: () => void;
};

export const ChatRow = ({
  tagline,
  since,
  stale,
  claudeUrl,
  onClick,
  onSaveUrl,
  onDelete,
}: ChatRowProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const clickable = !!claudeUrl && !!onClick;

  const save = () => {
    const url = draft.trim();
    if (url) onSaveUrl?.(url);
    setEditing(false);
    setDraft('');
  };

  return (
    <div
      className="km-row"
      onClick={clickable ? onClick : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 10px',
        borderRadius: 3,
        opacity: stale ? 0.6 : 1,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <span style={{ color: 'var(--fg-faint)' }}>
        <Icons.chat size={13} />
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: 'var(--ff-sans)',
          fontStyle: 'italic',
          fontSize: 13,
          lineHeight: 1.4,
          color: 'var(--fg)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {tagline}
      </span>
      <Mono>{since}</Mono>
      {claudeUrl ? (
        <span style={{ color: 'var(--fg-faint)' }} title={claudeUrl}>
          <Icons.ext size={12} />
        </span>
      ) : editing ? (
        <span
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
        >
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') save();
              if (e.key === 'Escape') {
                setEditing(false);
                setDraft('');
              }
            }}
            placeholder="https://claude.ai/chat/…"
            style={{
              width: 200,
              padding: '2px 6px',
              fontFamily: 'var(--ff-mono)',
              fontSize: 11.5,
              background: 'var(--surface-0)',
              color: 'var(--fg)',
              border: '1px solid var(--line)',
              borderRadius: 3,
            }}
          />
          <button
            className="km-btn km-btn-ghost"
            onClick={save}
            style={{ padding: '2px 7px', fontSize: 11 }}
          >
            save
          </button>
        </span>
      ) : onSaveUrl ? (
        <button
          className="km-btn km-btn-ghost"
          onClick={(e) => {
            e.stopPropagation();
            setEditing(true);
          }}
          title="Paste the claude.ai URL so this chat can be opened"
          style={{ padding: '2px 7px', fontSize: 11, color: 'var(--ember-deep)' }}
        >
          + link
        </button>
      ) : null}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete this conversation"
          style={{
            border: 0,
            background: 'transparent',
            padding: '2px 4px',
            cursor: 'pointer',
            color: 'var(--ember-deep)',
            display: 'inline-flex',
            alignItems: 'center',
          }}
        >
          <Icons.trash size={11} />
        </button>
      )}
    </div>
  );
};

export default ChatRow;
