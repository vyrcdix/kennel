// Do-this-week cadence card (C3, Treatment C: rhythm trace + soft warmth tint).
// Presentational: takes the cadence item + resolved context + handlers; the
// surface (C4) wires the loop to the engine endpoints. Reads only tokens, so
// it dresses in either skin. An invitation — never due, never red.
import { useRef, type ReactNode } from 'react';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { Icons } from './Icon';
import { CommitMeter } from './CommitMeter';
import { RhythmTrace } from './RhythmTrace';
import {
  CADENCE_LABEL,
  VITALITY_COLOR,
  WINDOW_LABEL,
  cadenceVitality,
  vitalityLabel,
} from '../lib/cadence';
import type { Item, Project } from '../data/types';

export type CadenceResource = { label: string; url?: string };

export type CadenceCardProps = {
  item: Item;
  /** Owning thread — the pill. */
  project?: Project;
  /** Title of the attached parent it serves; absent → "a practice of its own". */
  servesLabel?: string;
  resource?: CadenceResource;
  /** Recent windows (1 kept / 0 skipped, newest last) — computed by the surface. */
  trace: number[];
  onDid: () => void;
  onSkip: () => void;
  onSnooze: () => void;
  onRecommit: () => void;
  onEaseOff: () => void;
  onLetGo: () => void;
  onCrystallize?: () => void;
  onOpenThread?: () => void;
  onNote?: () => void;
  noteActive?: boolean;
  /** C6 memo slot (MemoChip / MemoComposer) rendered above the loop. */
  memoSlot?: ReactNode;
};

const WARM = new Set(['fresh', 'active']);
const stop = (e: React.MouseEvent) => e.stopPropagation();
const SACRED_BTN = {
  background: 'var(--sacred)',
  borderColor: 'var(--sacred)',
  color: '#2A1B08',
  fontWeight: 600,
} as const;

export const CadenceCard = ({
  item,
  project,
  servesLabel,
  resource,
  trace,
  onDid,
  onSkip,
  onSnooze,
  onRecommit,
  onEaseOff,
  onLetGo,
  onCrystallize,
  onOpenThread,
  onNote,
  noteActive,
  memoSlot,
}: CadenceCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  if (!item.cadence || !item.commitment) return null;
  const cadence = item.cadence;
  const vitality = cadenceVitality(item);
  const warm = WARM.has(vitality);
  const soft = cadence === 'daily'; // daily surfaces softer (§11.5)
  const diverged = item.commitment === 'core' && vitality === 'dormant';
  const col = VITALITY_COLOR[vitality];
  const periodWord = cadence === 'daily' ? 'day' : cadence === 'monthly' ? 'month' : 'week';

  // "Did it" warm pulse — replay the cadKept flash (no-op in Workshop / reduced
  // motion, where --motion-scale is 0).
  const flashAndDo = () => {
    const el = cardRef.current;
    if (el) {
      el.classList.remove('cad-kept');
      void el.offsetWidth;
      el.classList.add('cad-kept');
    }
    onDid();
  };

  return (
    <div
      ref={cardRef}
      className="cad-card km-card"
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: soft ? '14px 16px' : '16px 18px',
        borderColor: warm ? 'color-mix(in srgb, var(--sacred) 26%, var(--line))' : 'var(--line)',
        background: warm
          ? 'radial-gradient(120% 130% at 100% 0%, color-mix(in srgb, var(--sacred) 9%, transparent), transparent 60%), var(--card)'
          : 'var(--card)',
        boxShadow: 'var(--shadow-panel)',
        opacity: soft && !diverged ? 0.96 : 1,
      }}
    >
      {/* vitality edge — warmth runs down the left as a thin tide line */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, ${col}, color-mix(in srgb, ${col} 30%, transparent))`,
          opacity: warm ? 0.9 : 0.4,
        }}
      />

      {/* top line: rhythm + window chip, commitment on the right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--ink-muted)' }}>
          <Icons.repeat size={13} />
          <Mono style={{ fontSize: 11, color: 'inherit' }}>{CADENCE_LABEL[cadence]}</Mono>
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '2px 9px',
            borderRadius: 999,
            background: 'var(--action-soft)',
            color: 'var(--action-ink)',
          }}
        >
          <Mono style={{ fontSize: 10.5, color: 'inherit', letterSpacing: '.02em' }}>
            {WINDOW_LABEL[cadence]}
          </Mono>
        </span>
        {soft && <Mono dim style={{ fontSize: 10.5 }}>· softly</Mono>}
        <span style={{ flex: 1 }} />
        <CommitMeter level={item.commitment} />
      </div>

      {/* the action */}
      <div
        className="km-display-md"
        style={{
          margin: '0 0 10px',
          fontSize: soft ? 16 : 17.5,
          fontWeight: 600,
          lineHeight: 1.32,
          letterSpacing: '-.01em',
          textTransform: 'none',
          color: 'var(--ink)',
        }}
      >
        {item.title}
      </div>

      {/* what it serves + thread */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          marginBottom: resource ? 11 : 13,
          flexWrap: 'wrap',
        }}
      >
        {servesLabel ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icons.gem size={12} stroke="var(--sacred-ink)" />
            <Mono dim style={{ fontSize: 11.5 }}>keeps warm</Mono>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{servesLabel}</span>
          </span>
        ) : (
          <Mono dim style={{ fontSize: 11.5 }}>a practice of its own</Mono>
        )}
        {project && (
          <span onClick={(e) => { stop(e); onOpenThread?.(); }} style={{ cursor: onOpenThread ? 'pointer' : 'default' }}>
            <ProjectTag slug={project.slug} />
          </span>
        )}
      </div>

      {/* the resource — ON the card, one click to act (§7, hard requirement) */}
      {resource && (
        <button
          onClick={(e) => {
            stop(e);
            if (resource.url) window.open(resource.url, '_blank', 'noopener');
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
            padding: '9px 12px',
            marginBottom: 13,
            borderRadius: 'var(--r-ctrl)',
            border: '1px solid var(--line)',
            background: 'var(--card-2)',
            color: 'var(--ink)',
            fontFamily: 'var(--ff-sans)',
          }}
        >
          <Icons.link size={14} stroke="var(--action-ink)" />
          <span style={{ flex: 1, fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {resource.label}
          </span>
          <Icons.arrowR size={14} stroke="var(--ink-faint)" />
        </button>
      )}

      {/* vitality + streak */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: diverged ? 12 : 14 }}>
        <RhythmTrace trace={trace} vitality={vitality} keptCount={item.keptCount ?? 0} cadence={cadence} />
        <span style={{ flex: 1 }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 7, height: 7, borderRadius: 999, background: col }} />
          <Mono dim style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            {vitalityLabel(vitality)}
          </Mono>
        </span>
      </div>

      {/* divergence — declared core, gone cold. A question, never a scold (§4.3) */}
      {diverged && (
        <div
          style={{
            display: 'flex',
            gap: 11,
            padding: '12px 14px',
            marginBottom: 14,
            borderRadius: 'var(--r-ctrl)',
            background: 'var(--sunk)',
            border: '1px solid var(--line)',
          }}
        >
          <span style={{ color: 'var(--ink-faint)', flex: '0 0 auto', marginTop: 1 }}>
            <Icons.repeat size={15} />
          </span>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'var(--ink-muted)' }}>
              You call this a <strong style={{ color: 'var(--ink)' }}>core practice</strong>, but it&apos;s
              gone quiet. No harm done — is it still true?
            </p>
            <div style={{ display: 'flex', gap: 7, marginTop: 10, flexWrap: 'wrap' }}>
              <button className="km-btn km-btn-sm" style={SACRED_BTN} onClick={(e) => { stop(e); onRecommit(); }}>
                Re-commit
              </button>
              <button className="km-btn km-btn-ghost" onClick={(e) => { stop(e); onEaseOff(); }}>
                Ease off to &ldquo;trying it&rdquo;
              </button>
              {onCrystallize && (
                <button className="km-btn km-btn-ghost" style={{ color: 'var(--sacred-ink)' }} onClick={(e) => { stop(e); onCrystallize(); }}>
                  <Icons.gem size={13} /> Crystallize the lesson
                </button>
              )}
              <button className="km-btn km-btn-ghost" style={{ color: 'var(--ink-faint)' }} onClick={(e) => { stop(e); onLetGo(); }}>
                Let it go
              </button>
            </div>
          </div>
        </div>
      )}

      {memoSlot && <div style={{ marginBottom: 12 }}>{memoSlot}</div>}

      {/* the loop — Did it / Skip / Snooze. Never "done" (done would delete it). */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <button className="km-btn km-btn-sm" style={SACRED_BTN} onClick={(e) => { stop(e); flashAndDo(); }}>
          <Icons.check size={14} stroke="#2A1B08" /> Did it
        </button>
        <button className="km-btn km-btn-soft" onClick={(e) => { stop(e); onSkip(); }}>
          Skip this {periodWord}
        </button>
        <button className="km-btn km-btn-ghost" onClick={(e) => { stop(e); onSnooze(); }}>
          <Icons.park size={13} /> Snooze
        </button>
        <span style={{ flex: 1 }} />
        {onNote && (
          <button
            className="km-btn km-btn-ghost"
            style={noteActive ? { color: 'var(--action-ink)' } : undefined}
            onClick={(e) => { stop(e); onNote(); }}
          >
            <Icons.mic size={13} /> {memoSlot ? 'Edit note' : 'Note'}
          </button>
        )}
      </div>
    </div>
  );
};

export default CadenceCard;
