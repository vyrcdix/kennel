// Memo composer (C6) — jot what came of a contact; it files into the served
// thread's field notes, in a Claude-suggested section. Optional, always
// secondary, never blocks the loop. Text-only in v1; voice behind a flag.
import { useEffect, useRef, useState } from 'react';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import {
  DEFAULT_SECTION,
  MEMO_SECTIONS,
  VOICE_MEMO_ENABLED,
} from '../lib/cadenceMemo';
import type { FieldNotesSectionKey, Item, Project } from '../data/types';

export type Memo = { text: string; section: FieldNotesSectionKey };

export const MemoComposer = ({
  item,
  project,
  initial,
  onSave,
  onCancel,
}: {
  item: Item;
  project?: Project;
  initial?: Memo;
  onSave: (memo: Memo) => void;
  onCancel: () => void;
}) => {
  const [text, setText] = useState(initial?.text ?? '');
  const [section, setSection] = useState<FieldNotesSectionKey>(
    initial?.section ?? item.noteDefaultSection ?? DEFAULT_SECTION,
  );
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const canSave = text.trim().length > 0;

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{ padding: '13px 14px', borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)', border: '1px solid var(--line)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
        <Icons.mic size={12} stroke="var(--action-ink)" />
        <Mono style={{ fontSize: 11, color: 'var(--action-ink)' }}>jot what came of it</Mono>
        <Mono dim style={{ fontSize: 11 }}>— optional, lands in the thread&apos;s field notes</Mono>
      </div>
      <textarea
        ref={ref}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="A line on what you read, thought, or want to do next…"
        style={{
          width: '100%',
          minHeight: 64,
          border: '1px solid var(--line)',
          borderRadius: 'var(--r-ctrl)',
          background: 'var(--card-2)',
          padding: '10px 12px',
          fontFamily: 'var(--ff-sans)',
          fontSize: 13.5,
          lineHeight: 1.5,
          color: 'var(--ink)',
          resize: 'vertical',
          outline: 'none',
        }}
      />

      {VOICE_MEMO_ENABLED && (
        <div style={{ marginTop: 10 }}>
          <button className="km-btn km-btn-ghost km-btn-sm">
            <Icons.mic size={14} /> Record a memo
          </button>
        </div>
      )}

      {/* destination — the served thread's field notes; Claude suggests the section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 13, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
        <Mono dim style={{ fontSize: 11 }}>files into</Mono>
        {project && <ProjectTag slug={project.slug} />}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--ink-muted)' }}>
          <Icons.note size={12} /><Mono style={{ fontSize: 11, color: 'inherit' }}>field notes</Mono>
        </span>
        <Icons.arrowR size={13} stroke="var(--ink-faint)" />
        {MEMO_SECTIONS.map((s) => {
          const on = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className="km-body-sm"
              style={{
                fontSize: 11.5,
                padding: '4px 10px',
                borderRadius: 999,
                cursor: 'pointer',
                border: on ? '1px solid var(--action)' : '1px solid var(--line-strong)',
                background: on ? 'var(--action-soft)' : 'transparent',
                color: on ? 'var(--action-ink)' : 'var(--fg-muted)',
              }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="km-btn km-btn-ghost km-btn-sm" onClick={onCancel}>Cancel</button>
        <button
          className="km-btn km-btn-primary km-btn-sm"
          disabled={!canSave}
          style={{ opacity: canSave ? 1 : 0.5 }}
          onClick={() => canSave && onSave({ text: text.trim(), section })}
        >
          Save to field notes
        </button>
      </div>
    </div>
  );
};

export default MemoComposer;
