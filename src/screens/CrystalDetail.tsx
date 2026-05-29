// v0.5 — Crystal detail (the hub). Left pane: the crystal itself with
// blaze wash + body + "Distilled into" sub-artefacts. Right pane: the
// "Built on" doorways into the supporting structures (field notes,
// guidebook, runbook) — that lineage UI is the phase 8 scope; this
// screen renders a skeleton with the sources we can resolve today
// (from item.sourcesFrom) and leaves the per-table attachments empty
// behind a "phase 8" placeholder strip.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { SegBtn } from '../components/SegBtn';
import {
  getDocById,
  getItemById,
  getProjectById,
  getReferenceById,
} from '../data/selectors';
import { resurfaceCrystal, setItemCtype, ValidationError } from '../data/actions';
import { useStoreVersion } from '../data/store';
import { formatRelative } from '../data/time';
import type { CrystalType, Item } from '../data/types';

const CTYPES: { value: CrystalType; label: string }[] = [
  { value: 'principle', label: 'Principle' },
  { value: 'quote', label: 'Quote' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'hint', label: 'Hint' },
  { value: 'memory', label: 'Memory' },
];

const NotFoundFor = ({ id }: { id: string }) => (
  <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
    <ChromeBar />
    <div style={{ flex: 1, display: 'flex' }}>
      <NavRail active="crystals" />
      <main style={{ flex: 1, padding: '40px 32px' }}>
        <div className="vd" style={{ fontFamily: 'var(--ff-display)', fontSize: 28 }}>
          No crystal with id "{id}".
        </div>
        <Mono dim>maybe it was let go</Mono>
      </main>
    </div>
  </div>
);

const CtypePicker = ({ item }: { item: Item }) => {
  const [error, setError] = useState<string | null>(null);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <Mono dim>type:</Mono>
      <div style={{ display: 'flex' }}>
        <SegBtn
          label="none"
          active={!item.ctype}
          onClick={async () => {
            try {
              await setItemCtype(item.id, null);
              setError(null);
            } catch (err) {
              setError(
                err instanceof ValidationError
                  ? Object.values(err.fields).join(', ')
                  : (err as Error).message,
              );
            }
          }}
        />
        {CTYPES.map((t) => (
          <SegBtn
            key={t.value}
            label={t.label}
            active={item.ctype === t.value}
            onClick={async () => {
              try {
                await setItemCtype(item.id, t.value);
                setError(null);
              } catch (err) {
                setError(
                  err instanceof ValidationError
                    ? Object.values(err.fields).join(', ')
                    : (err as Error).message,
                );
              }
            }}
          />
        ))}
      </div>
      {error && <Mono style={{ color: 'var(--v-ember-dk)' }}>{error}</Mono>}
    </div>
  );
};

type ResolvedSource =
  | { kind: 'item'; item: Item }
  | { kind: 'doc'; doc: NonNullable<ReturnType<typeof getDocById>> }
  | { kind: 'reference'; ref: NonNullable<ReturnType<typeof getReferenceById>> };

/** Look at item.sourcesFrom and try to resolve each id as an item, doc,
 *  or reference — whichever the id belongs to. Ids that don't resolve
 *  are silently dropped. */
const resolveSources = (item: Item): ResolvedSource[] => {
  if (!item.sourcesFrom) return [];
  const out: ResolvedSource[] = [];
  for (const sid of item.sourcesFrom) {
    const i = getItemById(sid);
    if (i) {
      out.push({ kind: 'item', item: i });
      continue;
    }
    const d = getDocById(sid);
    if (d) {
      out.push({ kind: 'doc', doc: d });
      continue;
    }
    const r = getReferenceById(sid);
    if (r) {
      out.push({ kind: 'reference', ref: r });
      continue;
    }
  }
  return out;
};

export const CrystalDetail = () => {
  useStoreVersion();
  const navigate = useNavigate();
  const { id = '' } = useParams<{ id?: string }>();
  const crystal = getItemById(id);

  // v0.5 §B "touch on open": opening a crystal resets the resurface
  // timer (no ack — that's the explicit "Still true" button). Fire
  // once per id; subsequent re-renders are idle.
  const touchedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!crystal) return;
    if (touchedFor.current === crystal.id) return;
    touchedFor.current = crystal.id;
    void resurfaceCrystal(crystal.id, { ack: false }).catch(() => {});
  }, [crystal]);

  if (!crystal) return <NotFoundFor id={id} />;
  const project = getProjectById(crystal.projectId);
  const sources = resolveSources(crystal);

  return (
    <div className="km km-v4" style={{ display: 'flex', flexDirection: 'column' }}>
      <ChromeBar />
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1.3fr 1fr',
          overflow: 'hidden',
        }}
      >
        {/* Left: the crystal (blaze wash) */}
        <div
          className="km-scroll"
          style={{
            overflow: 'auto',
            padding: '30px 34px',
            background:
              'linear-gradient(180deg, rgba(232,181,71,.16), transparent)',
          }}
        >
          <button
            onClick={() => navigate('/crystals')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '2px 6px',
              border: 0,
              background: 'transparent',
              color: 'var(--v-soft)',
              cursor: 'pointer',
              fontFamily: 'var(--ff-mono)',
              fontSize: 11,
              marginBottom: 12,
            }}
          >
            <Icons.arrowR
              size={11}
              stroke="var(--v-soft)"
              style={{ transform: 'rotate(180deg)' }}
            />
            all crystals
          </button>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '3px 10px',
              background: 'rgba(232,181,71,.22)',
              borderRadius: 4,
              marginBottom: 14,
            }}
          >
            <Icons.gem size={12} stroke="var(--v-blaze-dk)" />
            <span
              style={{
                fontFamily: 'var(--ff-display)',
                fontSize: 9.5,
                letterSpacing: '.14em',
                fontWeight: 600,
                color: 'var(--v-blaze-dk)',
              }}
            >
              {crystal.ctype?.toUpperCase() ?? 'CRYSTAL'}
            </span>
            {project && <ProjectTag slug={project.slug} />}
          </div>

          <div
            className="vd"
            style={{
              fontFamily: 'var(--ff-display)',
              fontWeight: 600,
              fontSize: 34,
              lineHeight: 1.12,
              color: 'var(--v-ink)',
              marginBottom: 14,
            }}
          >
            {crystal.ctype === 'quote' ? `“${crystal.title}”` : crystal.title}
          </div>

          {crystal.body && (
            <div
              style={{
                fontSize: 15.5,
                lineHeight: 1.65,
                color: 'var(--v-ink)',
                marginBottom: 22,
                whiteSpace: 'pre-wrap',
              }}
            >
              {crystal.body}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <CtypePicker item={crystal} />
          </div>

          {crystal.lastSurfacedAt && (
            <Mono style={{ color: 'var(--v-blaze-dk)' }}>
              crystallized {formatRelative(crystal.doneAt ?? crystal.createdAt)}
              {crystal.surfaceCount > 0
                ? ` · re-surfaced ${crystal.surfaceCount}×`
                : ''}{' '}
              · kept fresh
            </Mono>
          )}
        </div>

        {/* Right: Built on — the doorways. Phase 8 will populate from the
            per-table supports_crystal_item_id edges; for now we show the
            sourcesFrom items so the lineage is at least readable. */}
        <div
          className="km-scroll"
          style={{
            overflow: 'auto',
            padding: '30px 28px',
            background: 'var(--v-sunk)',
            borderLeft: '1px solid var(--v-line)',
          }}
        >
          <Label>Built on</Label>
          <div style={{ marginTop: 4, marginBottom: 18 }}>
            <Mono dim>
              {sources.length === 0
                ? 'no resolved sources yet'
                : `${sources.length} ${sources.length === 1 ? 'source' : 'sources'}`}
            </Mono>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {sources.map((s, i) => {
              if (s.kind === 'item') {
                return (
                  <div
                    key={i}
                    onClick={() =>
                      s.item.docId
                        ? navigate(`/doc/${s.item.docId}`)
                        : navigate(`/crystal/${s.item.id}`)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 11px',
                      background: 'var(--v-card)',
                      border: '1px solid var(--v-line)',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    <KindIcon kind={s.item.kind} size={13} muted />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        color: 'var(--v-ink)',
                      }}
                    >
                      {s.item.title}
                    </span>
                    <Mono dim>{s.item.kind}</Mono>
                  </div>
                );
              }
              if (s.kind === 'doc') {
                return (
                  <div
                    key={i}
                    onClick={() => navigate(`/doc/${s.doc.id}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 11px',
                      background: 'var(--v-card)',
                      border: '1px solid var(--v-line)',
                      borderRadius: 6,
                      borderLeft: '3px solid var(--v-moss)',
                      cursor: 'pointer',
                    }}
                  >
                    <Icons.doc size={13} stroke="var(--v-moss)" />
                    <span style={{ flex: 1, fontSize: 13.5 }}>{s.doc.title}</span>
                    <Mono dim>rev {s.doc.revision}</Mono>
                  </div>
                );
              }
              return (
                <div
                  key={i}
                  onClick={() =>
                    s.ref.url
                      ? window.open(s.ref.url, '_blank', 'noopener,noreferrer')
                      : undefined
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 11px',
                    background: 'var(--v-card)',
                    border: '1px solid var(--v-line)',
                    borderRadius: 6,
                    borderLeft: '3px solid var(--v-moss)',
                    cursor: s.ref.url ? 'pointer' : 'default',
                  }}
                >
                  <Icons.link size={13} stroke="var(--v-moss)" />
                  <span style={{ flex: 1, fontSize: 13.5 }}>{s.ref.label}</span>
                  {s.ref.url && <Mono dim>web</Mono>}
                </div>
              );
            })}
          </div>

          <div
            style={{
              marginTop: 24,
              padding: '12px 14px',
              border: '1px dashed var(--v-line2)',
              borderRadius: 6,
              color: 'var(--v-soft)',
            }}
          >
            <Mono dim>
              the three doorways (field notes / guidebook / runbook) arrive in
              v0.5 phase 8 — this panel will group them then.
            </Mono>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrystalDetail;
