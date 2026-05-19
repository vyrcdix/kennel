import { Icons } from './Icon';
import { Mono } from './Mono';

export type ChatRowProps = {
  tagline: string;
  since: string;
  stale?: boolean;
  claudeUrl?: boolean;
};

export const ChatRow = ({ tagline, since, stale, claudeUrl = true }: ChatRowProps) => (
  <div
    className="km-row"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '7px 10px',
      borderRadius: 3,
      opacity: stale ? 0.6 : 1,
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
    {claudeUrl && (
      <span style={{ color: 'var(--fg-faint)' }}>
        <Icons.ext size={12} />
      </span>
    )}
  </div>
);

export default ChatRow;
