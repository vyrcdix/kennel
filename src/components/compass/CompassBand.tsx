// CompassBand — the quiet dawn band on the dashboard (above Worth revisiting).
// Surfaces ONE bearing at a time, rotating so it can't calcify. Ambient
// context, never a KPI. Reads the bearings + today's promise from selectors;
// the dashboard (P5) mounts it. See docs/compass-build-plan.md P3.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icon';
import { Mono } from '../Mono';
import { useSkin } from '../../lib/skin';
import { copy } from '../../lib/copy';
import { getBearings, getHorizon } from '../../lib/compass';
import { CompassStars, BearingGlyph, CompassEyebrow } from './atoms';

export const CompassBand = () => {
  useSkin(); // re-render copy on skin toggle
  const navigate = useNavigate();
  const bearings = getBearings();
  const [i, setI] = useState(0);

  if (bearings.length === 0) return null;
  const idx = Math.min(i, bearings.length - 1);
  const o = bearings[idx];
  const h = getHorizon(o);

  return (
    <section
      className="cmp-sky"
      style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-panel)' }}
    >
      <CompassStars />
      <div
        style={{
          position: 'relative',
          padding: '15px 20px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <BearingGlyph projectId={o.projectId} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <CompassEyebrow icon={<Icons.star4 size={11} />} style={{ marginBottom: 4 }}>
            What you’re about
          </CompassEyebrow>
          <div
            className="km-display-md"
            style={{
              fontSize: 19,
              fontWeight: 700,
              letterSpacing: '-.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {o.title}
          </div>
        </div>
        {h && (
          <Mono dim style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
            day {h.day} · {h.ahead} ahead
          </Mono>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {bearings.map((b, k) => (
            <button
              key={b.id}
              aria-label={`bearing ${k + 1}`}
              onClick={() => setI(k)}
              className={'cmp-rot' + (k === idx ? ' on' : '')}
              style={{ border: 0, padding: 0, cursor: 'pointer' }}
            />
          ))}
        </div>
        <button className="cmp-anchor" onClick={() => navigate('/compass')}>
          {`Open ${copy('compass.lens')}`} <Icons.arrowR size={13} />
        </button>
      </div>
    </section>
  );
};

export default CompassBand;
