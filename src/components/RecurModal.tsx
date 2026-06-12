// "Make it recur" (C5) — the R·Recur popover. Creates a recurring action: a
// rhythm + a declared commitment, optionally a resource and an attachment to
// what it serves. An invitation, never a deadline. Both skins (token-driven).
import { useEffect, useState } from 'react';
import { CommitMeter } from './CommitMeter';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { SegBtn } from './SegBtn';
import {
  captureItem,
  createReference,
  recurItem,
} from '../data/actions';
import {
  getCrystallizations,
  getItemById,
  getProjectById,
  getProjectItems,
} from '../data/selectors';
import { COMMIT } from '../lib/cadence';
import { showToast } from '../lib/toast';
import type { RecurSeed } from '../lib/modals';
import type { Cadence, Commitment } from '../data/types';

const RHYTHMS: { value: Cadence; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];
const LEVELS: Commitment[] = ['trying', 'committed', 'core'];

export const RecurModal = ({
  open,
  seed,
  onClose,
}: {
  open: boolean;
  seed: RecurSeed;
  onClose: () => void;
}) => {
  const seededItem = seed.itemId ? getItemById(seed.itemId) : undefined;
  const projectId = seededItem?.projectId ?? seed.projectId;
  const project = projectId ? getProjectById(projectId) : undefined;

  const [cadence, setCadence] = useState<Cadence>('weekly');
  const [commitment, setCommitment] = useState<Commitment>('trying'); // §11.3 low-pressure default
  const [text, setText] = useState('');
  const [resource, setResource] = useState('');
  const [servesId, setServesId] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCadence('weekly');
    setCommitment('trying');
    setText(seededItem?.title ?? seed.text ?? '');
    setResource('');
    setServesId(seed.servesId ?? '');
    setBusy(false);
  }, [open, seed.itemId, seed.servesId]);

  if (!open) return null;

  // Candidate anchors to attach to (crystals + ideas/questions in the thread).
  const anchors = projectId
    ? [
        ...getCrystallizations(projectId),
        ...getProjectItems(projectId, 'active').filter(
          (i) => i.kind === 'idea' || i.kind === 'question',
        ),
      ]
    : [];

  const isLink = (s: string) => /^https?:\/\//i.test(s.trim());
  const canSave = (seededItem != null || text.trim().length > 0) && project != null && !busy;

  const submit = async () => {
    if (!canSave || !project) return;
    setBusy(true);
    try {
      const itemId =
        seededItem?.id ??
        (await captureItem({ projectId: project.id, kind: 'action', title: text.trim() })).id;
      let resourceRefId: string | undefined;
      if (resource.trim()) {
        const label = resource.trim();
        const ref = await createReference({
          projectSlug: project.slug,
          label,
          url: isLink(label) ? label : undefined,
        });
        resourceRefId = ref.id;
      }
      await recurItem(itemId, {
        cadence,
        commitment,
        resourceRefId,
        servesId: servesId || null,
      });
      showToast(`On your ${cadence} rhythm — it'll wash in when the window opens. Never due.`, {
        kind: 'focus',
      });
      onClose();
    } catch {
      setBusy(false);
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'color-mix(in srgb, var(--scrim) 32%, transparent)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 72,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="km-card km-toast"
        style={{ width: 540, maxWidth: '92vw', padding: '20px 22px', boxShadow: 'var(--shadow-lift)' }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 9,
              flex: '0 0 auto',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--action-soft)',
              color: 'var(--action-ink)',
            }}
          >
            <Icons.repeat size={16} />
          </span>
          <div style={{ flex: 1 }}>
            <div className="km-display-md" style={{ fontSize: 18 }}>Make it recur</div>
            <Mono dim>a repeating nudge, attached to what it serves · never a deadline</Mono>
          </div>
        </div>

        {/* the action — locked when recurring a bench item, editable from a crystal */}
        {seededItem ? (
          <div style={{ padding: '10px 12px', marginBottom: 16, borderRadius: 'var(--r-ctrl)', background: 'var(--sunk)' }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{seededItem.title}</span>
          </div>
        ) : (
          <input
            className="km-input"
            placeholder="What's the recurring action?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            style={{ marginBottom: 16, borderRadius: 'var(--r-ctrl)' }}
          />
        )}

        {/* rhythm */}
        <div className="km-display-sm" style={{ marginBottom: 7 }}>Rhythm</div>
        <div style={{ display: 'inline-flex', marginBottom: 16 }}>
          {RHYTHMS.map((r) => (
            <SegBtn key={r.value} label={r.label} active={cadence === r.value} onClick={() => setCadence(r.value)} />
          ))}
        </div>

        {/* commitment */}
        <div className="km-display-sm" style={{ marginBottom: 7 }}>Commitment</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {LEVELS.map((lvl) => {
            const on = commitment === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setCommitment(lvl)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 11,
                  textAlign: 'left',
                  padding: '9px 12px',
                  borderRadius: 'var(--r-ctrl)',
                  cursor: 'pointer',
                  border: on ? '1.5px solid var(--action)' : '1px solid var(--line)',
                  background: on ? 'var(--action-soft)' : 'transparent',
                }}
              >
                <CommitMeter level={lvl} showLabel={false} />
                <span style={{ fontSize: 13.5, fontWeight: 600 }}>{COMMIT[lvl].label}</span>
                <span style={{ flex: 1 }} />
                <Mono dim style={{ fontSize: 11 }}>{COMMIT[lvl].blurb}</Mono>
              </button>
            );
          })}
        </div>

        {/* resource (optional) */}
        <div className="km-display-sm" style={{ marginBottom: 7 }}>Resource <span style={{ color: 'var(--fg-faint)' }}>· optional</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Icons.link size={14} stroke="var(--action-ink)" />
          <input
            className="km-input"
            placeholder="Paste a link, or name what to do the contact with…"
            value={resource}
            onChange={(e) => setResource(e.target.value)}
            style={{ borderRadius: 'var(--r-ctrl)' }}
          />
        </div>

        {/* attach to (optional) */}
        {anchors.length > 0 && (
          <>
            <div className="km-display-sm" style={{ marginBottom: 7 }}>Attach to <span style={{ color: 'var(--fg-faint)' }}>· what does this serve?</span></div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
              {anchors.slice(0, 8).map((a) => {
                const on = servesId === a.id;
                return (
                  <button
                    key={a.id}
                    onClick={() => setServesId(on ? '' : a.id)}
                    className="km-body-sm"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px',
                      borderRadius: 999,
                      cursor: 'pointer',
                      border: on ? '1px solid var(--action)' : '1px solid var(--line-strong)',
                      background: on ? 'var(--action-soft)' : 'transparent',
                      color: on ? 'var(--action-ink)' : 'var(--fg-muted)',
                    }}
                  >
                    {a.ctype || a.kind === 'crystallization' ? <Icons.gem size={11} stroke="var(--sacred-ink)" /> : <Icons.bulb size={11} />}
                    {a.title.length > 36 ? a.title.slice(0, 36) + '…' : a.title}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* footer */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
          {project && <ProjectTag slug={project.slug} />}
          <Mono dim style={{ fontSize: 11 }}>It can only be done, or roll. It can't be late.</Mono>
          <span style={{ flex: 1 }} />
          <button className="km-btn km-btn-ghost" onClick={onClose}>Cancel</button>
          <button className="km-btn km-btn-primary" disabled={!canSave} style={{ opacity: canSave ? 1 : 0.5 }} onClick={() => void submit()}>
            <Icons.repeat size={14} /> Start the rhythm
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecurModal;
