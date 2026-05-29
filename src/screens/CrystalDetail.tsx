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
  getDocsForCrystal,
  getFieldNoteSectionsForCrystal,
  getGuidebooksForCrystal,
  getItemById,
  getProjectById,
  getReferenceById,
  getRunbooksForCrystal,
} from '../data/selectors';
import {
  attachDocToCrystal,
  attachFieldNoteSectionToCrystal,
  attachGuidebookToCrystal,
  attachRunbookToCrystal,
  resurfaceCrystal,
  setItemCtype,
  ValidationError,
} from '../data/actions';
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

/** v0.5 §D "Built on" — render the four doorways for a crystal:
 *  Field notes (clay) / Guidebook (moss) / Runbook (ember-dk) /
 *  plain Docs (neutral), plus the item lineage from sources_from. */
const FIELD_SECTION_LABEL: Record<string, string> = {
  premise: 'Premise',
  whatIKnow: 'What I know',
  openQuestions: 'Open questions',
  sources: 'Sources',
  crystallizations: 'Crystallizations',
};

const BuiltOnPanel = ({
  crystalId,
  lineage,
}: {
  crystalId: string;
  lineage: ResolvedSource[];
}) => {
  const navigate = useNavigate();
  const guidebooks = getGuidebooksForCrystal(crystalId);
  const runbooks = getRunbooksForCrystal(crystalId);
  const docs = getDocsForCrystal(crystalId);
  const fieldSections = getFieldNoteSectionsForCrystal(crystalId);

  const totalAttachments =
    guidebooks.length + runbooks.length + docs.length + fieldSections.length;

  const onDetachGuidebook = async (id: string) => {
    try {
      await attachGuidebookToCrystal(id, null);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };
  const onDetachRunbook = async (slug: string) => {
    try {
      await attachRunbookToCrystal(slug, null);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };
  const onDetachDoc = async (id: string) => {
    try {
      await attachDocToCrystal(id, null);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };
  const onDetachFieldSection = async (slug: string, sectionKey: string) => {
    try {
      await attachFieldNoteSectionToCrystal(slug, sectionKey, null);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

  const Group = ({
    label,
    accent,
    children,
  }: {
    label: string;
    accent: string;
    children: React.ReactNode;
  }) => (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          marginBottom: 8,
        }}
      >
        <span
          className="km-mono-sm"
          style={{ color: accent, letterSpacing: '.1em' }}
        >
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {children}
      </div>
    </div>
  );

  const AttachRow = ({
    icon,
    accent,
    label,
    sub,
    onOpen,
    onDetach,
  }: {
    icon: React.ReactNode;
    accent: string;
    label: string;
    sub?: string;
    onOpen?: () => void;
    /** Omitted on lineage rows — those edges live in sources_from and
     *  can't be detached from this surface. */
    onDetach?: () => Promise<void>;
  }) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '9px 11px',
        background: 'var(--v-card)',
        border: '1px solid var(--v-line)',
        borderRadius: 6,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      <span>{icon}</span>
      <span
        onClick={onOpen}
        style={{
          flex: 1,
          fontSize: 13.5,
          cursor: onOpen ? 'pointer' : 'default',
        }}
      >
        {label}
      </span>
      {sub && <Mono dim>{sub}</Mono>}
      {onDetach && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            void onDetach();
          }}
          title="Detach from this crystal"
          style={{
            border: 0,
            background: 'transparent',
            padding: '2px 4px',
            cursor: 'pointer',
            color: 'var(--v-ember-dk)',
          }}
        >
          <Icons.trash size={12} stroke="var(--v-ember-dk)" />
        </button>
      )}
    </div>
  );

  return (
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
          {totalAttachments === 0 && lineage.length === 0
            ? 'no doorways attached yet'
            : `${totalAttachments} doorway${totalAttachments === 1 ? '' : 's'} · ${lineage.length} lineage source${lineage.length === 1 ? '' : 's'}`}
        </Mono>
      </div>

      {fieldSections.length > 0 && (
        <Group label="FIELD NOTES · mine" accent="var(--v-clay)">
          {fieldSections.map((fs, i) => {
            const proj = getProjectById(fs.projectId);
            return (
              <AttachRow
                key={i}
                icon={<Icons.note size={13} stroke="var(--v-clay)" />}
                accent="var(--v-clay)"
                label={FIELD_SECTION_LABEL[fs.sectionKey] ?? fs.sectionKey}
                sub={proj?.slug}
                onOpen={() =>
                  proj
                    ? navigate(`/project/${proj.slug}/field-notes`)
                    : undefined
                }
                onDetach={() =>
                  proj
                    ? onDetachFieldSection(proj.slug, fs.sectionKey)
                    : Promise.resolve()
                }
              />
            );
          })}
        </Group>
      )}

      {guidebooks.length > 0 && (
        <Group label="GUIDEBOOK · others'" accent="var(--v-moss)">
          {guidebooks.map((g) => {
            const proj = getProjectById(g.projectId);
            return (
              <AttachRow
                key={g.id}
                icon={<Icons.doc size={13} stroke="var(--v-moss)" />}
                accent="var(--v-moss)"
                label={g.name}
                sub={proj?.slug}
                onOpen={() =>
                  proj
                    ? navigate(`/project/${proj.slug}/guidebook/${g.id}`)
                    : undefined
                }
                onDetach={() => onDetachGuidebook(g.id)}
              />
            );
          })}
        </Group>
      )}

      {runbooks.length > 0 && (
        <Group label="RUNBOOK · how-to" accent="var(--v-ember-dk)">
          {runbooks.map((rb) => {
            const proj = getProjectById(rb.projectId);
            return (
              <AttachRow
                key={rb.id}
                icon={<Icons.runbook size={13} stroke="var(--v-ember-dk)" />}
                accent="var(--v-ember-dk)"
                label={`${proj?.name ?? '(no project)'} · runbook`}
                sub={`rev ${rb.revision}`}
                onOpen={() => (proj ? navigate(`/runbook/${proj.slug}`) : undefined)}
                onDetach={() =>
                  proj ? onDetachRunbook(proj.slug) : Promise.resolve()
                }
              />
            );
          })}
        </Group>
      )}

      {docs.length > 0 && (
        <Group label="DOCS" accent="var(--v-soft)">
          {docs.map((d) => (
            <AttachRow
              key={d.id}
              icon={<Icons.doc size={13} stroke="var(--v-soft)" />}
              accent="var(--v-line2)"
              label={d.title}
              sub={`rev ${d.revision}`}
              onOpen={() => navigate(`/doc/${d.id}`)}
              onDetach={() => onDetachDoc(d.id)}
            />
          ))}
        </Group>
      )}

      {lineage.length > 0 && (
        <Group label="LINEAGE · sources_from" accent="var(--v-faint)">
          {lineage.map((s, i) => {
            if (s.kind === 'item') {
              return (
                <AttachRow
                  key={i}
                  icon={<KindIcon kind={s.item.kind} size={13} muted />}
                  accent="var(--v-line2)"
                  label={s.item.title}
                  sub={s.item.kind}
                  onOpen={() =>
                    s.item.docId
                      ? navigate(`/doc/${s.item.docId}`)
                      : navigate(`/crystal/${s.item.id}`)
                  }
                />
              );
            }
            if (s.kind === 'doc') {
              return (
                <AttachRow
                  key={i}
                  icon={<Icons.doc size={13} stroke="var(--v-soft)" />}
                  accent="var(--v-line2)"
                  label={s.doc.title}
                  sub={`rev ${s.doc.revision}`}
                  onOpen={() => navigate(`/doc/${s.doc.id}`)}
                />
              );
            }
            return (
              <AttachRow
                key={i}
                icon={<Icons.link size={13} stroke="var(--v-soft)" />}
                accent="var(--v-line2)"
                label={s.ref.label}
                sub={s.ref.url ? 'web' : undefined}
                onOpen={() =>
                  s.ref.url
                    ? window.open(s.ref.url, '_blank', 'noopener,noreferrer')
                    : undefined
                }
              />
            );
          })}
        </Group>
      )}

      {totalAttachments === 0 && lineage.length === 0 && (
        <div
          style={{
            padding: '14px 16px',
            border: '1px dashed var(--v-line2)',
            borderRadius: 6,
            color: 'var(--v-soft)',
          }}
        >
          <Mono dim>
            Attach a guidebook, runbook, doc, or field-notes section from its own
            screen by setting "Supports crystal" — the attach picker UI ships
            in a follow-up slice.
          </Mono>
        </div>
      )}
    </div>
  );
};

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

        {/* Right: Built on — three doorways + item lineage (v0.5 §D) */}
        <BuiltOnPanel crystalId={crystal.id} lineage={sources} />

      </div>
    </div>
  );
};

export default CrystalDetail;
