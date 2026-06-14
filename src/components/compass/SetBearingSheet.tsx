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

const STARTERS = ['Be', 'Run', 'See', 'Stay close to', 'Grow at', 'Build', 'Keep'];
const DAY = 86_400_000;
const DEFAULT_DAYS = 1000;

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
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [attach, setAttach] = useState<string[]>([]);
  const [attachPickerOpen, setAttachPickerOpen] = useState(false);
  const [attachQuery, setAttachQuery] = useState('');
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
    setDays(
      hasH
        ? Math.max(
            1,
            Math.round(
              (editBearing!.horizonTargetAt!.getTime() -
                editBearing!.horizonStartAt!.getTime()) /
                DAY,
            ),
          )
        : DEFAULT_DAYS,
    );
    setAttach([]);
    setAttachPickerOpen(false);
    setAttachQuery('');
    setSaving(false);
  }, [open, seedTitle, editBearing, projects]);

  if (!open) return null;

  const statement = `${starter ? starter + ' ' : ''}${text}`.trim();
  const canCompose = statement.length > 0 && (!hasHorizon || days > 0);

  const submit = async (asDraft: boolean) => {
    if (saving || !statement) return;
    setSaving(true);
    // Horizon as a duration: N days from when it was set (the start holds on
    // edit; new bearings start today). Room-remaining is derived downstream.
    const startISO = editBearing?.horizonStartAt
      ? editBearing.horizonStartAt.toISOString()
      : `${todayISODate()}T00:00:00Z`;
    const targetISO = new Date(new Date(startISO).getTime() + days * DAY).toISOString();
    try {
      await onSubmit({
        projectId,
        title: statement,
        description: note.trim() || undefined,
        horizonStartAt: hasHorizon ? startISO : undefined,
        horizonTargetAt: hasHorizon ? targetISO : undefined,
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
                      ? { background: 'var(--sacred-soft)', color: 'var(--cmp-ink)', borderColor: 'var(--sacred)' }
                      : {}),
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {starter && (
                <span className="km-display-md" style={{ fontSize: 16, color: 'var(--cmp-ink)', whiteSpace: 'nowrap' }}>
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

            {/* related current — optional. A bearing isn't owned by a thread;
                this just relates one current at creation (you relate more from
                within each current). On edit it's fixed (the storage home). */}
            {projects.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Mono dim>current</Mono>
                <select
                  className="km-input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  disabled={editing}
                  style={{ fontSize: 13, flex: 1, maxWidth: 260 }}
                >
                  <option value="">— none (relate later) —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* optional finish line — default off (intangible, no clock). A
                duration: N days from when it's set, framed as room remaining. */}
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
                    type="number"
                    min={1}
                    className="km-input"
                    value={days}
                    onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 0))}
                    style={{ fontSize: 13, width: 90 }}
                  />
                  <Mono dim>days from {editing ? 'when set' : 'today'}</Mono>
                </>
              )}
            </div>

            {/* what already flows toward this? — a deliberate selector. Nothing
                is related until you pick it; no auto-suggested list. Seeds the
                roll-up. */}
            {!editing && attachCandidates.length > 0 && (
              <div>
                <Mono dim style={{ display: 'block', marginBottom: 6 }}>
                  What already flows toward this?
                </Mono>
                {/* chosen — removable chips */}
                {attach.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                    {attachCandidates
                      .filter((it) => attach.includes(it.id))
                      .map((it) => (
                        <button
                          key={it.id}
                          className="km-btn"
                          onClick={() => toggleAttach(it.id)}
                          title="remove"
                          style={{
                            fontSize: 12,
                            padding: '4px 10px',
                            background: 'var(--sacred-soft)',
                            color: 'var(--cmp-ink)',
                            borderColor: 'var(--sacred)',
                          }}
                        >
                          {it.title} ×
                        </button>
                      ))}
                  </div>
                )}
                {attachPickerOpen ? (
                  <div
                    className="km-card"
                    style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}
                  >
                    <input
                      className="km-input"
                      autoFocus
                      placeholder="filter what flows toward this…"
                      value={attachQuery}
                      onChange={(e) => setAttachQuery(e.target.value)}
                      style={{ fontSize: 12.5 }}
                    />
                    <div
                      style={{
                        maxHeight: 150,
                        overflow: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {(() => {
                        const q = attachQuery.trim().toLowerCase();
                        const opts = attachCandidates.filter(
                          (it) =>
                            !attach.includes(it.id) &&
                            (!q || it.title.toLowerCase().includes(q)),
                        );
                        if (opts.length === 0)
                          return <Mono dim style={{ padding: '4px 8px' }}>nothing to relate</Mono>;
                        return opts.map((it) => (
                          <button
                            key={it.id}
                            className="km-btn km-btn-ghost"
                            onClick={() => {
                              toggleAttach(it.id);
                              setAttachQuery('');
                            }}
                            style={{
                              fontSize: 12,
                              padding: '5px 8px',
                              justifyContent: 'flex-start',
                              textAlign: 'left',
                            }}
                          >
                            {it.title}
                          </button>
                        ));
                      })()}
                    </div>
                    <div style={{ display: 'flex' }}>
                      <span style={{ flex: 1 }} />
                      <button
                        className="km-btn km-btn-ghost"
                        onClick={() => setAttachPickerOpen(false)}
                        style={{ fontSize: 12 }}
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="km-btn km-btn-ghost"
                    onClick={() => setAttachPickerOpen(true)}
                    style={{ fontSize: 12, padding: '4px 10px' }}
                  >
                    <Icons.plus size={12} /> Relate something
                  </button>
                )}
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
                {hasHorizon
                  ? `${days} days of room — a finish line`
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
