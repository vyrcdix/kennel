import type { ReactNode } from 'react';

/** Inline tokenizer: handles `code` and **bold**. */
export const renderInline = (s: string): ReactNode => {
  const parts: ReactNode[] = [];
  let i = 0;
  let key = 0;
  while (i < s.length) {
    const code = s.indexOf('`', i);
    const bold = s.indexOf('**', i);
    const next = [code, bold].filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? -1;
    if (next < 0) {
      parts.push(s.slice(i));
      break;
    }
    if (next > i) parts.push(s.slice(i, next));
    if (next === code) {
      const end = s.indexOf('`', code + 1);
      if (end < 0) {
        parts.push(s.slice(code));
        break;
      }
      parts.push(<code key={key++} className="km-code-inline">{s.slice(code + 1, end)}</code>);
      i = end + 1;
    } else {
      const end = s.indexOf('**', bold + 2);
      if (end < 0) {
        parts.push(s.slice(bold));
        break;
      }
      parts.push(<b key={key++}>{s.slice(bold + 2, end)}</b>);
      i = end + 2;
    }
  }
  return parts;
};

/** Block-level renderer handling all flavours used in the app: headings, blockquote,
 *  bullet / numbered lists, fenced code, paragraphs. */
export const renderBlocks = (body: string): ReactNode => {
  if (!body) return null;
  const blocks = body.split(/\n\n+/);
  return blocks.map((block, idx) => {
    if (block.startsWith('```')) {
      const lines = block.split('\n');
      const inner = lines.slice(1, lines[lines.length - 1].startsWith('```') ? -1 : undefined).join('\n');
      return <pre key={idx} className="km-code-block">{inner}</pre>;
    }
    if (block.startsWith('# ')) {
      return (
        <h1 key={idx} className="km-display-lg" style={{ fontSize: 24, margin: '0 0 10px' }}>
          {block.slice(2).trim()}
        </h1>
      );
    }
    if (block.startsWith('## ')) {
      return (
        <div key={idx} className="km-display-sm" style={{ margin: '18px 0 8px' }}>
          {block.slice(3).trim()}
        </div>
      );
    }
    if (block.startsWith('> ')) {
      const text = block.split('\n').map((l) => l.replace(/^> ?/, '')).join(' ');
      return (
        <div
          key={idx}
          style={{
            margin: '14px 0',
            padding: '8px 14px',
            borderLeft: '2px solid var(--moss)',
            background: 'rgba(92,122,62,.06)',
          }}
        >
          <p className="km-body" style={{ margin: 0, fontStyle: 'italic' }}>
            {renderInline(text)}
          </p>
        </div>
      );
    }
    if (block.startsWith('- ') || block.startsWith('* ')) {
      const items = block.split('\n').map((l) => l.replace(/^[-*]\s+/, ''));
      return (
        <ul key={idx} className="km-body" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          {items.map((t, i) => <li key={i}>{renderInline(t)}</li>)}
        </ul>
      );
    }
    if (/^\d+\.\s/.test(block)) {
      const items = block.split('\n').map((l) => l.replace(/^\d+\.\s+/, ''));
      return (
        <ol key={idx} className="km-body" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
          {items.map((t, i) => <li key={i}>{renderInline(t)}</li>)}
        </ol>
      );
    }
    return (
      <p key={idx} className="km-body" style={{ margin: '0 0 14px' }}>
        {renderInline(block)}
      </p>
    );
  });
};

/** Pull body out of a fenced code block. Used when displaying just the code from
 *  a section that's wrapped in ``` fences. */
export const stripFence = (md: string | undefined): string => {
  if (!md) return '';
  return md.replace(/^[^`]*```\n?/, '').replace(/```[\s\S]*$/, '').trim() || md;
};
