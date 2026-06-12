// The orientation page — a bearing's detail. A forward-pointed crystal with the
// horizon, the wake (hero), the "what's built toward this" roll-up, today's
// small promise, and the "still about?" block (the emotional peak). Route:
// /orientation/:id. See docs/compass-build-plan.md P4.
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { Mono } from '../components/Mono';
import { Icons } from '../components/Icon';
import { ProjectTag } from '../components/ProjectTag';
import { useStoreVersion } from '../data/store';
import { useSkin } from '../lib/skin';
import { copy } from '../lib/copy';
import { windowOpen } from '../lib/cadence';
import { getBearingPromise } from '../lib/compass';
import { getItemById, getProjectById } from '../data/selectors';
import {
  didCadence,
  letGoBearing,
  resurfaceCrystal,
  rewordBearing,
  setBearingHorizon,
} from '../data/actions';
import { OrientationType } from '../components/compass/atoms';
import {
  BearingBuilt,
  BearingHorizon,
  BearingPromise,
  BearingStillAbout,
  BearingWake,
} from '../components/compass/OrientationAtoms';
import { SetBearingSheet, type SetBearingDraft } from '../components/compass/SetBearingSheet';

export const OrientationPage = () => {
  useStoreVersion();
  useSkin();
  const navigate = useNavigate();
  const { id } = useParams();
  const [editOpen, setEditOpen] = useState(false);

  const bearing = id ? getItemById(id) : undefined;

  const backToCompass = (
    <button
      className="km-btn km-btn-ghost"
      onClick={() => navigate('/compass')}
      style={{ marginBottom: 14 }}
    >
      <Icons.arrowR size={14} style={{ transform: 'rotate(180deg)' }} /> {copy('compass.lens')}
    </button>
  );

  if (!bearing || bearing.ctype !== 'orientation') {
    return (
      <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
        <ChromeBar />
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <NavRail active="compass" />
          <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 48px' }}>
            <div style={{ maxWidth: 680, margin: '0 auto' }}>
              {backToCompass}
              <Mono dim>This bearing isn’t here — it may have been let go.</Mono>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const project = getProjectById(bearing.projectId);
  const promise = getBearingPromise(bearing.id);
  const promiseKept = promise ? !windowOpen(promise) : false;

  const onKeep = () => {
    if (promise) void didCadence(promise.id);
  };
  const onStillTrue = () => void resurfaceCrystal(bearing.id, { ack: true });
  const onLetGo = () => {
    if (
      window.confirm(
        'Let this bearing set? It leaves Compass (kept in search); its promises become free-standing practices.',
      )
    ) {
      void letGoBearing(bearing.id).then(() => navigate('/compass'));
    }
  };
  const onRewordSubmit = async (d: SetBearingDraft) => {
    await rewordBearing(bearing.id, { title: d.title, description: d.description ?? null });
    await setBearingHorizon(bearing.id, d.horizonStartAt ?? null, d.horizonTargetAt ?? null);
  };

  return (
    <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="compass" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 48px' }}>
          <div style={{ maxWidth: 680, margin: '0 auto' }}>
            {backToCompass}

            <div className="km-card cmp-resori" style={{ padding: '24px 26px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                <OrientationType>orientation</OrientationType>
                {project && <ProjectTag slug={project.slug} />}
                <span style={{ flex: 1 }} />
                <Icons.compass size={17} style={{ color: 'var(--sacred-ink)', opacity: 0.8 }} />
              </div>

              <h1
                className="km-display-lg"
                style={{
                  margin: '0 0 4px',
                  fontSize: 30,
                  fontWeight: 700,
                  letterSpacing: '-.025em',
                  lineHeight: 1.08,
                }}
              >
                {bearing.title}
              </h1>
              {bearing.description && (
                <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-muted)', fontStyle: 'italic' }}>
                  {bearing.description}
                </p>
              )}

              <BearingHorizon bearing={bearing} />
              <BearingWake bearing={bearing} />
              <BearingBuilt bearing={bearing} />
              <BearingPromise promise={promise} kept={promiseKept} onKeep={onKeep} />
              <BearingStillAbout
                bearing={bearing}
                onStillTrue={onStillTrue}
                onReword={() => setEditOpen(true)}
                onLetGo={onLetGo}
              />
            </div>
          </div>
        </main>
      </div>

      <SetBearingSheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSubmit={onRewordSubmit}
        editBearing={bearing}
        projects={project ? [project] : []}
      />
    </div>
  );
};

export default OrientationPage;
