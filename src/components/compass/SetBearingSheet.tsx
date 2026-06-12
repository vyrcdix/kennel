// SetBearingSheet — the deliberate, high-friction creation flow (the inverse of
// one-tap capture). Two beats: COMPOSE (statement as a direction + owning thread
// + optional finish line + "what flows toward this?") and SIT WITH IT (a confirm
// beat that restates the bearing and offers draft vs set). Both entry points
// land here — "Set a new bearing" and crystallize-as-orientation (pre-filled via
// seedTitle). With `editBearing` it becomes the Reword flow. Presentational:
// onSubmit is wired to the bearing actions by the surface (P4).
// See docs/compass-build-plan.md P3/P4 + the rev-2 prototype's SetBearingSheet.
import { useEffect, useState } from 'react';
import { Icons } from '../Icon';
import { Label } from '../Label';
import { Mono } from '../Mono';
import { useSkin } from '../../lib/skin';
import { OrientationType } from './atoms';
import type { Item, Project } from '../../data/types';

const STARTERS = ['Run', 'See', 'Stay close to', 'Grow at', 'Build', 'Keep'];

export type SetBearingDraft = {
  projectId: string;
  title: string;
  description?: string;
  horizonStartAt?: string;
  horizonTargetAt?: string;
  attach: string[];
  asDraft: boolean;
};

export type SetBearingSheetProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: SetBearingDraft) => void | Promise<void>;
  /** Owning-thread options (a bearing is one crystal in one thread). */
  projects?: Project[];
  /** Pre-fill the statement (crystallize-as-orientation entry point). */
  seedTitle?: string;
  /** Reword mode — seeds every field from the bearing; no draft / counter. */
  editBearing?: Item;
  /** Existing bearing count — drives the "N of ~6 · few by design" counter. */
  bearingCount?: number;
  /** Optional items to attach ("what already flows toward this?"). */
  attachCandidates?: Item[];
};

const todayISODate = () => new Date().toISOString().slice(0, 10);
const toISODate = (d?: Date) => (d ? d.toISOString().slice(0, 10) : '');

export const SetBearingSheet = ({
  open,
  onClose,
  onSubmit,
  projects = [],
  seedTitle,
  editBearing,
  bearingCount = 0,
  attachCandidates = [],
}: SetBearingSheetProps) => {
  useSkin();
  const editing = !!editBearing;
  const [beat, setBeat] = useState<'compose' | 'sit'>('compose');
  const [projectId, setProjectId] = useState('');
  const [starter, setStarter] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [note, setNote] = useState('');
  const [hasHorizon, setHasHorizon] = useState(false);
  const [startAt, setStartAt] = useState(todayISODate());
  const [targetAt, setTargetAt] = useState('');
  const [attach, setAttach] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setBeat('compose');
    setStarter(null);
    setText(editBearing?.title ?? seedTitle ?? '');
    setNote(editBearing?.description ?? '');
    setProjectId(editBearing?.projectId ?? projects[0]?.id ?? '');
    const hasH = !!(editBearing?.horizonStartAt && editBearing?.horizonTargetAt);
    setHasHorizon(hasH);
    setStartAt(hasH ? toISODate(editBearing?.horizonStartAt) : todayISODate());
    setTargetAt(hasH ? toISODate(editBearing?.horizonTargetAt) : '');
    setAttach([]);
    setSaving(false);
  }, [open, seedTitle, editBearing, projects]);

  if (!open) return null;

  const statement = `${starter ? starter + ' ' : ''}${text}`.trim();
  const canCompose = statement.length > 0 && !!projectId && (!hasHorizon || !!targetAt);

  const submit = async (asDraft: boolean) => {
    if (saving || !statement || !projectId) return;
    setSaving(true);
    try {
      await onSubmit({
        projectId,
        title: statement,
        description: note.trim() || undefined,
        horizonStartAt: hasHorizon ? `${startAt}T00:00:00Z` : undefined,
        horizonTargetAt: hasHorizon && targetAt ? `${targetAt}T00:00:00Z` : undefined,
        attach,
        asDraft,
      });
      onClose();
    } catch {
      setSaving(false);
    }
  };

  const toggleAttach = (id: string) =>
    setAttach((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'color-mix(in srgb, var(--scrim) 28%, transparent)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 80,
        zIndex: 100,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="km-card"
        style={{
          width: 620,
          maxWidth: '94%',
          background: 'var(--surface-0)',
          border: '1px solid var(--line-strong)',
          borderRadius: 8,
          padding: '20px 22px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <OrientationType>
            {editing ? 'reword' : beat === 'compose' ? 'new bearing' : 'sit with it'}
          </OrientationType>
          <Label style={{ textTransform: 'none', letterSpacing: 0 }}>
            {editing
              ? 'Reword this bearing'
              : beat === 'compose'
                ? 'What are you about?'
                : 'Set this bearing?'}
          </Label>
          <span style={{ flex: 1 }} />
          {!editing && <Mono dim>{bearingCount + 1} of ~6 · few by design</Mono>}
        </div>

        {beat === 'compose' ? (
          <>
            {/* the statement as a direction */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {STARTERS.map((s) => (
                <button
                  key={s}
                  className="km-btn km-btn-ghost"
                  onClick={() => setStarter((cur) => (cur === s ? null : s))}
                  style={{
                    fontSize: 12,
                    padding: '4px 10px',
                    ...(starter === s
                      ? { background: 'var(--sacred-soft)', color: 'var(--sacred-ink)', borderColor: 'var(--sacred)' }
                      : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {starter && (
                <span className="km-display-md" style={{ fontSize: 16, color: 'var(--sacred-ink)', whiteSpace: 'nowrap' }}>
                  {starter}
                </span>
              )}
              <input
                className="km-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="…the world, deliberately"
                autoFocus
                style={{ fontSize: 15, flex: 1 }}
              />
            </div>
            <textarea
              className="km-input"
              rows={2}
              placeholder="An optional note — why this matters, in your words."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ resize: 'vertical', fontSize: 13 }}
            />

            {/* owning thread */}
            {projects.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mono dim>thread</Mono>
                <select
                  className="km-input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={editing}
                  style={{ fontSize: 13, flex: 1, maxWidth: 260 }}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* optional finish line — default off (intangible, no clock) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                className={'cmp-keep' + (hasHorizon ? ' on' : '')}
                aria-label="toggle a finish line"
                onClick={() => setHasHorizon((v) => !v)}
                style={{ width: 26, height: 26 }}
              >
                <Icons.horizon size={14} />
              </button>
              <Mono dim>{hasHorizon ? 'a finish line' : 'no clock — an intangible bearing'}</Mono>
              {hasHorizon && (
                <>
                  <input
                    type="date"
                    className="km-input"
                    value={startAt}
                    onChange={(e) => setStartAt(e.target.value)}
                    style={{ fontSize: 12, width: 150 }}
                  />
                  <Mono dim>→</Mono>
                  <input
                    type="date"
                    className="km-input"
                    value={targetAt}
                    onChange={(e) => setTargetAt(e.target.value)}
                    style={{ fontSize: 12, width: 150 }}
                  />
                </>
              )}
            </div>

            {/* what already flows toward this? — seeds the roll-up */}
            {!editing && attachCandidates.length > 0 && (
              <div>
                <Mono dim style={{ display: 'block', marginBottom: 6 }}>
                  What already flows toward this?
                </Mono>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {attachCandidates.map((it) => (
                    <button
                      key={it.id}
                      className="km-btn km-btn-ghost"
                      onClick={() => toggleAttach(it.id)}
                      style={{
                        fontSize: 12,
                        padding: '4px 10px',
                        ...(attach.includes(it.id)
                          ? { background: 'var(--sacred-soft)', color: 'var(--sacred-ink)', borderColor: 'var(--sacred)' }
                          : {}),
                      }}
                    >
                      {it.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mono dim>A bearing is load-bearing and rarely changed.</Mono>
              <span style={{ flex: 1 }} />
              <button className="km-btn km-btn-ghost" onClick={onClose}>
                Cancel
              </button>
              {editing ? (
                <button
                  className="km-btn km-btn-primary"
                  disabled={!canCompose || saving}
                  onClick={() => void submit(false)}
                  style={{ opacity: canCompose ? 1 : 0.5 }}
                >
                  Save changes
                </button>
              ) : (
                <button
                  className="km-btn km-btn-primary"
                  disabled={!canCompose}
                  onClick={() => setBeat('sit')}
                  style={{ opacity: canCompose ? 1 : 0.5 }}
                >
                  Next <Icons.arrowR size={13} />
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* sit with it — restate large, name the weight, draft vs set */}
            <div
              className="km-card cmp-resori"
              style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 8 }}
            >
              <OrientationType>orientation</OrientationType>
              <h2
                className="km-display-lg"
                style={{ margin: 0, fontSize: 26, fontWeight: 700, letterSpacing: '-.02em', lineHeight: 1.1 }}
              >
                {statement}
              </h2>
              {note.trim() && (
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  {note.trim()}
                </p>
              )}
              <Mono dim style={{ marginTop: 4 }}>
                {hasHorizon && targetAt
                  ? `a finish line at ${targetAt}`
                  : 'no clock — steered by, not tracked'}
              </Mono>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-muted)' }}>
              The rest is for this. You’ll be steered by it — it’s slow to add and rarely changed.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="km-btn km-btn-ghost" onClick={() => setBeat('compose')}>
                <Icons.arrowR size={13} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
              <span style={{ flex: 1 }} />
              <button
                className="km-btn km-btn-ghost"
                disabled={saving}
                onClick={() => void submit(true)}
                title="lands in search, not yet in Compass"
              >
                Save as draft
              </button>
              <button className="km-btn km-btn-primary" disabled={saving} onClick={() => void submit(false)}>
                Set this bearing
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SetBearingSheet;
