// v0.5 — All crystals gallery. The salient layer across every thread.
// Cards are typed via item.ctype (principle gets hero size). Cards
// click through to CrystalDetail. Empty state is reached when no
// crystal exists anywhere — "Capture, then sort" copy mirrors the
// theme-landing empty state from v0.5 §G.

import { useMemo, useState } from 'react';
import { ChromeBar } from '../components/ChromeBar';
import { CrystalCard } from '../components/CrystalCard';
import { Icons } from '../components/Icon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { SegBtn } from '../components/SegBtn';
import {
  getAllCrystals,
  getCrystalSources,
  getProjectById,
  getProjects,
} from '../data/selectors';
import { useStoreVersion } from '../data/store';
import type { CrystalType } from '../data/types';

const CTYPE_FILTERS: { value: CrystalType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'principle', label: 'Principles' },
  { value: 'quote', label: 'Quotes' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'hint', label: 'Hints' },
  { value: 'memory', label: 'Memories' },
];

export const CrystalsGallery = () => {
  useStoreVersion();
  const [ctypeFilter, setCtypeFilter] = useState<CrystalType | 'all'>('all');
  const [threadFilter, setThreadFilter] = useState<string | null>(null);

  const crystals = getAllCrystals();
  const projects = useMemo(() => getProjects(), []);
  const visible = useMemo(
    () =>
      crystals.filter(
        (c) =>
          (ctypeFilter === 'all' || c.ctype === ctypeFilter) &&
          (!threadFilter || c.projectId === threadFilter),
      ),
    [crystals, ctypeFilter, threadFilter],
  );

  const counts = useMemo(() => {
    const out: Record<string, number> = { all: crystals.length };
    for (const c of crystals) {
      if (c.ctype) out[c.ctype] = (out[c.ctype] ?? 0) + 1;
    }
    return out;
  }, [crystals]);

  return (
    <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavRail active="crystals" />
        <main className="km-scroll" style={{ flex: 1, overflow: 'auto', padding: '24px 36px 40px' }}>
          {/* Header */}
          <div style={{ marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
              <Icons.gem size={20} stroke="var(--v-blaze-dk)" />
              <span
                className="vlab"
                style={{ color: 'var(--v-blaze-dk)' }}
              >
                The salient layer · across every thread
              </span>
            </div>
            <div
              className="vd"
              style={{
                fontFamily: 'var(--ff-display)',
                fontSize: 30,
                fontWeight: 600,
                lineHeight: 1.1,
              }}
            >
              All crystals
            </div>
            <div style={{ marginTop: 6 }}>
              <Mono dim>{crystals.length} kept fresh · drill any card to see its lineage</Mono>
            </div>
          </div>

          {crystals.length === 0 ? (
            <div
              className="km-card km-v4"
              style={{
                padding: '40px 28px',
                background: 'var(--v-card)',
                border: '1px solid var(--v-line)',
                borderRadius: 8,
                textAlign: 'center',
                color: 'var(--v-soft)',
              }}
            >
              <Icons.gem size={26} stroke="var(--v-blaze-dk)" />
              <div
                className="vd"
                style={{ marginTop: 10, fontSize: 22, color: 'var(--v-ink)' }}
              >
                Nothing's crystallized yet.
              </div>
              <Mono dim>capture, then sort — crystallisations rise out of the bench</Mono>
            </div>
          ) : (
            <>
              {/* Filters */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  padding: '10px 0 14px',
                  marginBottom: 16,
                  borderBottom: '1px solid var(--v-line)',
                }}
              >
                <Label>filter</Label>
                <div style={{ display: 'flex' }}>
                  {CTYPE_FILTERS.map((f) => (
                    <SegBtn
                      key={f.value}
                      label={
                        f.value === 'all'
                          ? `${f.label} · ${counts.all ?? 0}`
                          : `${f.label} · ${counts[f.value] ?? 0}`
                      }
                      active={ctypeFilter === f.value}
                      onClick={() => setCtypeFilter(f.value)}
                    />
                  ))}
                </div>
                <span style={{ width: 18 }} />
                <Label>thread</Label>
                <div style={{ display: 'flex' }}>
                  <SegBtn
                    label="any"
                    active={!threadFilter}
                    onClick={() => setThreadFilter(null)}
                  />
                  {projects.slice(0, 6).map((p) => (
                    <SegBtn
                      key={p.slug}
                      label={p.slug}
                      active={threadFilter === p.id}
                      onClick={() => setThreadFilter(p.id)}
                    />
                  ))}
                </div>
              </div>

              {visible.length === 0 ? (
                <Mono dim>no crystals match the current filter</Mono>
              ) : (
                <div style={{ columnCount: 3, columnGap: 12 }}>
                  {visible.map((crystal) => {
                    const sources = getCrystalSources(crystal).map((s) => s.kind);
                    const project = getProjectById(crystal.projectId);
                    return (
                      <div key={crystal.id} style={{ position: 'relative' }}>
                        <CrystalCard
                          item={crystal}
                          sourceKinds={sources.length > 0 ? sources : undefined}
                        />
                        {project && (
                          <div
                            style={{
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              pointerEvents: 'none',
                            }}
                          >
                            <span className={`km-proj km-proj-${project.color ?? ''}`}>
                              {project.slug}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default CrystalsGallery;
