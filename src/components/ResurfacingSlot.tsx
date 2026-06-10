// v0.5 §B "Resurfacing" / "Worth revisiting" slot. Shows up to 3 due
// crystals, each with three inline controls: Still true (ack + bump
// count), Revisit (navigate to detail; the open will touch), Retire
// (file the item — soft archive). Dust-toned with a blaze gem marker
// — reads as "the light asking to be looked at," not as an alert.
//
// Dashboard renders this cross-thread; theme landing renders it scoped
// to the thread (label changes; the contained UX is identical).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import { fileItem, resurfaceCrystal, ValidationError } from '../data/actions';
import { getProjectById } from '../data/selectors';
import type { Item } from '../data/types';

export type ResurfacingSlotProps = {
  label?: string;
  crystals: Item[];
  /** Max items shown. Defaults to 3 (v0.5 §B). */
  limit?: number;
};

const Row = ({ crystal }: { crystal: Item }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<'ack' | 'retire' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const project = getProjectById(crystal.projectId);

  const onAck = async () => {
    setBusy('ack');
    try {
      await resurfaceCrystal(crystal.id, { ack: true });
      setError(null);
    } catch (err) {
      setError(
        err instanceof ValidationError
          ? Object.values(err.fields).join(', ')
          : (err as Error).message,
      );
    } finally {
      setBusy(null);
    }
  };

  const onRetire = async () => {
    if (!window.confirm(`Retire "${crystal.title}"? It moves to filed (still searchable).`)) return;
    setBusy('retire');
    try {
      await fileItem(crystal.id);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 84px 1fr auto',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span style={{ color: 'var(--sacred-ink)' }}>
        <Icons.gem size={12} />
      </span>
      {project ? <ProjectTag slug={project.slug} /> : <span />}
      <span
        className="km-body"
        onClick={() => navigate(`/crystal/${crystal.id}`)}
        style={{
          fontWeight: 500,
          fontSize: 13.5,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title="open"
      >
        {crystal.title}
      </span>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => void onAck()}
          disabled={busy != null}
          title="Reset the resurface timer and bump the count"
          style={{ padding: '3px 9px', fontSize: 12, color: 'var(--sacred-ink)' }}
        >
          Still true
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => navigate(`/crystal/${crystal.id}`)}
          disabled={busy != null}
          style={{ padding: '3px 9px', fontSize: 12 }}
        >
          Revisit
        </button>
        <button
          className="km-btn km-btn-ghost"
          onClick={() => void onRetire()}
          disabled={busy != null}
          style={{ padding: '3px 9px', fontSize: 12, color: 'var(--ember-deep)' }}
        >
          Retire
        </button>
      </div>
      {error && (
        <div style={{ gridColumn: '3 / -1', paddingTop: 4 }}>
          <Mono style={{ color: 'var(--ember-deep)' }}>{error}</Mono>
        </div>
      )}
    </div>
  );
};

export const ResurfacingSlot = ({
  label = 'Resurfacing',
  crystals,
  limit = 3,
}: ResurfacingSlotProps) => {
  const [showAll, setShowAll] = useState(false);
  if (crystals.length === 0) return null;
  const overflow = crystals.length - limit;
  const shown = showAll ? crystals : crystals.slice(0, limit);
  return (
    <section
      className="km-card"
      style={{
        padding: 0,
        background: 'color-mix(in srgb, var(--sacred) 7%, transparent)',
        borderColor: 'color-mix(in srgb, var(--sacred-ink) 32%, transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
        }}
      >
        <Icons.gem size={13} stroke="var(--sacred-ink)" />
        <span className="km-display-sm" style={{ color: 'var(--sacred-ink)' }}>
          {label.toUpperCase()}
        </span>
        <Mono dim style={{ marginLeft: 6 }}>
          due to revisit · {crystals.length}
        </Mono>
        <span style={{ flex: 1 }} />
        {overflow > 0 && (
          <button
            className="km-btn km-btn-ghost"
            onClick={() => setShowAll((v) => !v)}
            style={{ padding: '3px 9px', fontSize: 11.5, color: 'var(--sacred-ink)' }}
          >
            {showAll ? 'Show fewer' : `${overflow} more due — show all`}
          </button>
        )}
      </div>
      <div className="km-rule" />
      {shown.map((c) => (
        <Row key={c.id} crystal={c} />
      ))}
    </section>
  );
};

export default ResurfacingSlot;
