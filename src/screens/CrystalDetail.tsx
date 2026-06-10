// v0.5 — Crystal detail (the hub). Left pane: the crystal itself with
// blaze wash + body + inbound connections (actions serving it, crystals
// built on it). Right pane: the "Built on" doorways into the supporting
// structures (field notes, guidebook, runbook, docs) with an attach
// picker scoped to the crystal's own thread (the server rejects
// cross-topic attachment), plus the item lineage from sources_from.

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChromeBar } from '../components/ChromeBar';
import { ConnectionsPanel } from '../components/ConnectionsPanel';
import { Icons } from '../components/Icon';
import { KindIcon } from '../components/KindIcon';
import { Label } from '../components/Label';
import { Mono } from '../components/Mono';
import { NavRail } from '../components/NavRail';
import { ProjectTag } from '../components/ProjectTag';
import { SegBtn } from '../components/SegBtn';
import {
  getCrystalsBuiltFrom,
  getDocById,
  getDocsForCrystal,
  getFieldNotes,
  getFieldNoteSectionsForCrystal,
  getGuidebooksForCrystal,
  getItemById,
  getItemsServing,
  getProjectById,
  getProjectDocs,
  getProjectGuidebooks,
  getReferenceById,
  getRunbook,
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
import type { CrystalType, FieldNotesSectionKey, Item } from '../data/types';

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

const PickerGroup = ({
  label,
  accent,
  children,
}: {
  label: string;
  accent: string;
  children: React.ReactNode;
}) => (
  <div style={{ marginBottom: 12 }}>
    <div
      className="km-mono-sm"
      style={{ color: accent, letterSpacing: '.1em', marginBottom: 6 }}
    >
      {label}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{children}</div>
  </div>
);

const PickerRow = ({
  icon,
  label,
  sub,
  onAttach,
}: {
  icon: React.ReactNode;
  label: string;
  sub?: string;
  onAttach: () => void;
}) => (
  <div
    onClick={onAttach}
    className="km-row"
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 9px',
      borderRadius: 4,
      cursor: 'pointer',
    }}
    title="Attach to this crystal"
  >
    <span style={{ display: 'inline-flex' }}>{icon}</span>
    <span
      style={{
        flex: 1,
        fontSize: 13,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}
    >
      {label}
    </span>
    {sub && <Mono dim>{sub}</Mono>}
    <Icons.plus size={11} stroke="var(--v-soft)" />
  </div>
);

const BuiltOnPanel = ({
  crystal,
  lineage,
}: {
  crystal: Item;
  lineage: ResolvedSource[];
}) => {
  const navigate = useNavigate();
  const crystalId = crystal.id;
  const project = getProjectById(crystal.projectId);
  const guidebooks = getGuidebooksForCrystal(crystalId);
  const runbooks = getRunbooksForCrystal(crystalId);
  const docs = getDocsForCrystal(crystalId);
  const fieldSections = getFieldNoteSectionsForCrystal(crystalId);
  const [pickerOpen, setPickerOpen] = useState(false);

  const totalAttachments =
    guidebooks.length + runbooks.length + docs.length + fieldSections.length;

  // Attach candidates — the server rejects cross-topic attachment
  // (`wrong_topic`), so only this crystal's own thread is offered.
  const candidateDocs = project
    ? getProjectDocs(project.id).filter((d) => d.supportsCrystal !== crystalId)
    : [];
  const candidateGuidebooks = project
    ? getProjectGuidebooks(project.id).filter(
        (g) => g.supportsCrystalItemId !== crystalId,
      )
    : [];
  const projectRunbook = project ? getRunbook(project.id) : undefined;
  const candidateRunbook =
    projectRunbook && projectRunbook.supportsCrystalItemId !== crystalId
      ? projectRunbook
      : undefined;
  const projectFieldNotes = project ? getFieldNotes(project.id) : undefined;
  const candidateSections = projectFieldNotes
    ? (Object.keys(FIELD_SECTION_LABEL) as FieldNotesSectionKey[]).filter(
        (key) => projectFieldNotes.supportsCrystals?.[key] !== crystalId,
      )
    : [];

  const attach = async (fn: () => Promise<unknown>) => {
    try {
      await fn();
      setPickerOpen(false);
    } catch (err) {
      window.alert((err as Error).message);
    }
  };

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
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Label>Built on</Label>
        <span style={{ flex: 1 }} />
        <button
          className="km-btn km-btn-ghost"
          onClick={() => setPickerOpen((v) => !v)}
          title="Attach a doc, guidebook, runbook, or field-notes section from this thread"
          style={{
            padding: '3px 9px',
            fontSize: 11.5,
            color: pickerOpen ? 'var(--ember-deep)' : undefined,
          }}
        >
          <Icons.plus size={11} /> Attach
        </button>
      </div>
      <div style={{ marginTop: 4, marginBottom: 18 }}>
        <Mono dim>
          {totalAttachments === 0 && lineage.length === 0
            ? 'no doorways attached yet'
            : `${totalAttachments} doorway${totalAttachments === 1 ? '' : 's'} · ${lineage.length} lineage source${lineage.length === 1 ? '' : 's'}`}
        </Mono>
      </div>

      {pickerOpen && (
        <div
          style={{
            marginBottom: 18,
            padding: '12px 14px',
            background: 'var(--v-card)',
            border: '1px solid var(--v-line2)',
            borderRadius: 6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
            <Mono dim>
              attach from {project ? `"${project.slug}"` : 'this thread'} — a
              doorway supports one crystal; attaching moves it here
            </Mono>
          </div>

          {candidateSections.length > 0 && project && (
            <PickerGroup label="FIELD NOTES" accent="var(--v-clay)">
              {candidateSections.map((key) => (
                <PickerRow
                  key={key}
                  icon={<Icons.note size={12} stroke="var(--v-clay)" />}
                  label={FIELD_SECTION_LABEL[key]}
                  sub={
                    projectFieldNotes?.supportsCrystals?.[key]
                      ? 'supports another crystal'
                      : undefined
                  }
                  onAttach={() =>
                    attach(() =>
                      attachFieldNoteSectionToCrystal(project.slug, key, crystalId),
                    )
                  }
                />
              ))}
            </PickerGroup>
          )}

          {candidateGuidebooks.length > 0 && (
            <PickerGroup label="GUIDEBOOKS" accent="var(--v-moss)">
              {candidateGuidebooks.map((g) => (
                <PickerRow
                  key={g.id}
                  icon={<Icons.doc size={12} stroke="var(--v-moss)" />}
                  label={g.name}
                  sub={g.supportsCrystalItemId ? 'supports another crystal' : undefined}
                  onAttach={() => attach(() => attachGuidebookToCrystal(g.id, crystalId))}
                />
              ))}
            </PickerGroup>
          )}

          {candidateRunbook && project && (
            <PickerGroup label="RUNBOOK" accent="var(--v-ember-dk)">
              <PickerRow
                icon={<Icons.runbook size={12} stroke="var(--v-ember-dk)" />}
                label={`${project.name} · runbook`}
                sub={
                  candidateRunbook.supportsCrystalItemId
                    ? 'supports another crystal'
                    : `rev ${candidateRunbook.revision}`
                }
                onAttach={() => attach(() => attachRunbookToCrystal(project.slug, crystalId))}
              />
            </PickerGroup>
          )}

          {candidateDocs.length > 0 && (
            <PickerGroup label="DOCS" accent="var(--v-soft)">
              {candidateDocs.map((d) => (
                <PickerRow
                  key={d.id}
                  icon={<Icons.doc size={12} stroke="var(--v-soft)" />}
                  label={d.title}
                  sub={d.supportsCrystal ? 'supports another crystal' : `rev ${d.revision}`}
                  onAttach={() => attach(() => attachDocToCrystal(d.id, crystalId))}
                />
              ))}
            </PickerGroup>
          )}

          {candidateDocs.length === 0 &&
            candidateGuidebooks.length === 0 &&
            !candidateRunbook &&
            candidateSections.length === 0 && (
              <Mono dim>
                nothing left to attach — everything in this thread already
                supports this crystal
              </Mono>
            )}
        </div>
      )}

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

      {totalAttachments === 0 && lineage.length === 0 && !pickerOpen && (
        <div
          style={{
            padding: '14px 16px',
            border: '1px dashed var(--v-line2)',
            borderRadius: 6,
            color: 'var(--v-soft)',
          }}
        >
          <Mono dim>
            Nothing supports this crystal yet — use Attach above to link a
            guidebook, runbook, doc, or field-notes section from this thread.
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
  const serving = getItemsServing(crystal.id);
  const distilledInto = getCrystalsBuiltFrom(crystal.id);
  const backingDoc = crystal.docId ? getDocById(crystal.docId) : undefined;

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
          {project && (
            <button
              onClick={() => navigate(`/project/${project.slug}`)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '2px 6px',
                marginLeft: 8,
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
              {project.name}
            </button>
          )}

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

          {/* Inbound edges — what serves this crystal, and what it fed.
              The forward direction (sources, doorways) lives in the
              Built-on pane; this is the reverse. */}
          <div style={{ marginTop: 28 }}>
            <ConnectionsPanel
              groups={[
                {
                  label: 'BACKED BY DOC',
                  accent: 'var(--v-soft)',
                  rows: backingDoc
                    ? [
                        {
                          key: backingDoc.id,
                          icon: <Icons.doc size={13} stroke="var(--v-soft)" />,
                          label: backingDoc.title,
                          sub: `rev ${backingDoc.revision}`,
                          onOpen: () => navigate(`/doc/${backingDoc.id}`),
                        },
                      ]
                    : [],
                },
                {
                  label: 'IN SERVICE · actions serving this',
                  accent: 'var(--ember-deep)',
                  rows: serving.map((it) => ({
                    key: it.id,
                    icon: <KindIcon kind={it.kind} size={13} muted />,
                    label: it.title,
                    sub: it.state === 'active' ? 'in focus' : it.state,
                    onOpen: () => {
                      const p = getProjectById(it.projectId);
                      if (p) navigate(`/project/${p.slug}`);
                    },
                  })),
                },
                {
                  label: 'DISTILLED INTO · crystals built on this',
                  accent: 'var(--blaze)',
                  rows: distilledInto.map((c) => ({
                    key: c.id,
                    icon: <Icons.gem size={13} stroke="var(--v-blaze-dk)" />,
                    label: c.title,
                    sub: c.ctype,
                    onOpen: () => navigate(`/crystal/${c.id}`),
                  })),
                },
              ]}
            />
          </div>
        </div>

        {/* Right: Built on — three doorways + item lineage (v0.5 §D) */}
        <BuiltOnPanel crystal={crystal} lineage={sources} />

      </div>
    </div>
  );
};

export default CrystalDetail;
