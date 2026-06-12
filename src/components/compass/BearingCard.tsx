// BearingCard — one bearing in the Compass lens: glyph, statement, optional
// horizon chip (or "no clock"), what it keeps warm (cadences + a kept crystal),
// the owning thread, today's promise, and a count of what's under it. Reads its
// roll-up from the P2 selectors; the lens (P4) lists these. Opens the
// orientation page. See docs/compass-build-plan.md P3.
import { useNavigate } from 'react-router-dom';
import { Icons } from '../Icon';
import { Mono } from '../Mono';
import { ProjectTag } from '../ProjectTag';
import { useSkin } from '../../lib/skin';
import { copy } from '../../lib/copy';
import { isCadence, windowOpen } from '../../lib/cadence';
import {
  getBearingBuilt,
  getBearingPromise,
  getHorizon,
  getWake,
} from '../../lib/compass';
import { getProjectById } from '../../data/selectors';
import { BearingGlyph } from './atoms';
import type { Item } from '../../data/types';

export type BearingCardProps = { bearing: Item };

export const BearingCard = ({ bearing }: BearingCardProps) => {
  useSkin();
  const navigate = useNavigate();
  const built = getBearingBuilt(bearing.id);
  const cadences = built.filter(isCadence);
  const crystal = built.find((it) => it.kind === 'crystallization' || it.state === 'crystallized');
  const promise = getBearingPromise(bearing.id);
  const h = getHorizon(bearing);
  const wake = getWake(bearing.id);
  const project = getProjectById(bearing.projectId);
  const promiseKept = promise ? !windowOpen(promise) : false;

  return (
    <div
      className="km-card cmp-bearingcard"
      style={{ padding: '17px 18px' }}
      onClick={() => navigate(`/orientation/${bearing.id}`)}
    >
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <BearingGlyph projectId={bearing.projectId} size={34} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              className="km-display-md"
              style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-.01em' }}
            >
              {bearing.title}
            </span>
            <span style={{ flex: 1 }} />
            {h ? (
              <span className="cmp-horizonchip">
                day {h.day} / {h.total}
              </span>
            ) : (
              <span className="km-mono-sm" style={{ fontSize: 10.5, color: 'var(--ink-faint)' }}>
                {copy('compass.horizon.none')}
              </span>
            )}
          </div>
          {bearing.description && (
            <p style={{ margin: '5px 0 0', fontSize: 13, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
              {bearing.description}
            </p>
          )}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 11 }}
          >
            {cadences.slice(0, 2).map((c) => (
              <span key={c.id} className="cmp-warm">
                <Icons.repeat size={12} />
                {c.title}
              </span>
            ))}
            {crystal && (
              <span className="cmp-warm">
                <Icons.gem size={12} style={{ color: 'var(--sacred-ink)' }} /> a kept{' '}
                {crystal.ctype ?? 'crystal'}
              </span>
            )}
            {project && <ProjectTag slug={project.slug} />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 11 }}>
            <Icons.star4f
              size={11}
              style={{ color: promiseKept ? 'var(--sacred)' : 'var(--ink-faint)' }}
            />
            <Mono dim style={{ fontSize: 11.5 }}>
              {promise ? (
                <>
                  today’s promise — <span style={{ color: 'var(--ink)' }}>{promise.title}</span>
                  {promiseKept ? ' · kept' : ''}
                </>
              ) : (
                'no promise yet'
              )}
            </Mono>
            <span style={{ flex: 1 }} />
            <Mono dim style={{ fontSize: 11 }}>
              {built.length} under this · {wake.kept} kept
            </Mono>
            <Icons.arrowR size={15} style={{ color: 'var(--ink-faint)' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default BearingCard;
