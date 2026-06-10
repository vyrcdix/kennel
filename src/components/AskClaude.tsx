import { useState, type CSSProperties } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';

export type AskClaudeProps = {
  /** Ready-made prompt copied to the clipboard. Tailor it per page so the
   *  pasted prompt points Claude at the right Steep resource. */
  prompt: string;
  style?: CSSProperties;
};

/** Copies a ready-made prompt to paste into a Claude chat connected to the
 *  Steep MCP server. It deliberately does NOT talk to Claude itself — the ⓘ
 *  popover spells that out, since the older button read as a live connection
 *  that doesn't exist. See docs/mcp-setup.md for the connection steps. */
export const AskClaude = ({ prompt, style }: AskClaudeProps) => {
  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);

  const copy = () => {
    void navigator.clipboard?.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  };

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        ...style,
      }}
    >
      <button
        className="km-btn km-btn-ghost"
        onClick={copy}
        title="Copy a ready-made prompt to paste into a Steep-connected Claude chat"
        style={{ fontSize: 11.5 }}
      >
        <Icons.copy size={12} />{' '}
        {copied ? 'Prompt copied — paste into Claude' : 'Ask Claude'}
      </button>
      <button
        className="km-btn km-btn-ghost"
        onClick={() => setInfoOpen((o) => !o)}
        title="What does Ask Claude do?"
        aria-label="About Ask Claude"
        style={{ padding: '2px 4px', color: 'var(--fg-muted)' }}
      >
        <Icons.info size={13} />
      </button>
      {infoOpen && (
        <>
          {/* Click-away catcher. */}
          <div
            onClick={() => setInfoOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 200 }}
          />
          <div
            className="km-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: 6,
              width: 320,
              zIndex: 201,
              background: 'var(--surface-0)',
              border: '1px solid var(--line-strong)',
              borderRadius: 6,
              padding: '12px 14px',
              boxShadow: '0 6px 24px color-mix(in srgb, var(--scrim) 18%, transparent)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              cursor: 'default',
              textAlign: 'left',
              whiteSpace: 'normal',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icons.chat size={14} />
              <span className="km-display-sm" style={{ fontSize: 11 }}>
                STEEP + CLAUDE
              </span>
            </div>
            <div
              className="km-body-sm"
              style={{ lineHeight: 1.5, color: 'var(--fg)' }}
            >
              Steep runs an MCP server. Connect it once to Claude Desktop, Code,
              or Mobile and Claude can read and write your threads, docs, field
              notes, and runbooks directly.
            </div>
            <div
              className="km-body-sm"
              style={{ lineHeight: 1.5, color: 'var(--fg-muted)' }}
            >
              <strong>This button doesn't chat with Claude</strong> — it copies a
              ready-made prompt. Paste it into your Steep-connected Claude chat and
              Claude does the work using the Steep tools.
            </div>
            <Mono dim>
              Not connected yet? See docs/mcp-setup.md — add the MCP URL
              http://127.0.0.1:8421/mcp to your Claude client.
            </Mono>
          </div>
        </>
      )}
    </span>
  );
};

export default AskClaude;
