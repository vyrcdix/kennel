// Compass — the lens (a new Mood you return to). A sky header (the one place
// the layer shows its altitude), then the few bearings as cards, then the
// deliberately high-friction "Set a new bearing". Route: /compass.
// See docs/compass-build-plan.md P4.
import { useState } from 'react';
import { ChromeBar } from '../components/ChromeBar';
import { NavRail } from '../components/NavRail';
import { Mono } from '../components/Mono';
import { Icons } from '../components/Icon';
import { useStoreVersion } from '../data/store';
import { useSkin } from '../lib/skin';
import { copy } from '../lib/copy';
import { getBearings } from '../lib/compass';
import { getProjects, getNextUp } from '../data/selectors';
import {
  captureItem,
  rewordBearing,
  setBearing,
  setItemCtype,
  setProjectBearing,
  updateItem,
} from '../data/actions';
import { CompassStars, CompassEyebrow } from '../components/compass/atoms';
import { BearingCard } from '../components/compass/BearingCard';
import { SetBearingSheet, type SetBearingDraft } from '../components/compass/SetBearingSheet';

export const CompassLens = () => {
  useStoreVersion();
  useSkin();
  const [sheetOpen, setSheetOpen] = useState(false);
  const bearings = getBearings();
  const projects = getProjects();
  // candidates for "what already flows toward this?" — current focus items.
  const focusCandidates = getNextUp(undefined, 20);

  const handleSubmit = async (d: SetBearingDraft) => {
    // A bearing isn't owned by a thread — project_id is just storage. Use the
    // picked current as the home if given, else the first thread.
    const homeId = d.projectId || projects[0]?.id;
    if (!homeId) return;
    const created = await captureItem({ projectId: homeId, kind: 'idea', title: d.title });
    if (d.asDraft) {
      await setItemCtype(created.id, 'orientation');
      if (d.description) await updateItem(created.id, { body: d.description });
      return;
    }
    await setBearing(created.id, {
      horizonStartAt: d.horizonStartAt ?? null,
      horizonTargetAt: d.horizonTargetAt ?? null,
      attach: d.attach,
      persona: null,
    });
    if (d.description) await rewordBearing(created.id, { description: d.description });
    // If a current was picked, relate it to the new bearing (from-creation
    // shortcut for the normal from-within-the-thread assignment).
    if (d.projectId) await setProjectBearing(d.projectId, created.id);
  };

  return (
    <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="compass" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '30px 40px 48px' }}>
          <div style={{ maxWidth: 880, margin: '0 auto' }}>
            {/* sky header — the one place the layer shows its altitude */}
            <section
              className="cmp-sky"
              style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-panel)', marginBottom: 22 }}
            >
              <CompassStars />
              <div style={{ position: 'relative', padding: '26px 26px 24px' }}>
                <CompassEyebrow icon={<Icons.compass size={13} />} style={{ marginBottom: 10 }}>
                  {copy('compass.lens')}
                </CompassEyebrow>
                <h1
                  className="km-display-lg"
                  style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '-.02em' }}
                >
                  What you’re about.
                </h1>
                <p style={{ margin: '8px 0 0', fontSize: 14.5, color: 'var(--ink-muted)', maxWidth: 560 }}>
                  The handful of things the rest is for. Steered by, not tracked — rarely changed, and
                  slow to add.
                </p>
              </div>
            </section>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {bearings.map((b) => (
                <BearingCard key={b.id} bearing={b} />
              ))}
              {/* add a bearing — deliberately high-friction (the inverse of capture) */}
              <button
                className="km-card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 9,
                  padding: 14,
                  border: '1px dashed var(--line-strong)',
                  background: 'transparent',
                  color: 'var(--ink-faint)',
                  cursor: 'pointer',
                  fontFamily: 'var(--ff-sans)',
                  fontSize: 13.5,
                  fontWeight: 600,
                }}
                onClick={() => setSheetOpen(true)}
              >
                <Icons.plus size={15} /> {copy('compass.setBearing')}
              </button>
            </div>

            <p style={{ textAlign: 'center', margin: '22px 0 0' }}>
              <Mono dim>
                Few by design. A bearing is hard to add and rarely changed — that constraint is the
                point.
              </Mono>
            </p>
          </div>
        </main>
      </div>

      <SetBearingSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleSubmit}
        projects={projects}
        bearingCount={bearings.length}
        attachCandidates={focusCandidates}
      />
    </div>
  );
};

export default CompassLens;
