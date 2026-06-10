// v0.5 Smart Routing — Recently sorted strip. Lives on the thread
// landing below the Worth-revisiting slot. Renders the last week of
// routings for the thread, with a one-click Undo that reverses the
// dispatch (delete item / doc / guidebook entry, restore the runbook
// or field-notes section). Phase 2 will add Re-route alongside Undo
// and turn this into a soft-reject log.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icons } from './Icon';
import { Label } from './Label';
import { Mono } from './Mono';
import {
  ClassifierUnavailableError,
  undoRouting,
} from '../data/actions';
import {
  getDocById,
  getGuidebookById,
  getGuidebookEntryById,
  getItemById,
  getProjectById,
} from '../data/selectors';
import { showToast } from '../lib/toast';
import { formatRelative } from '../data/time';
import type { Routing, RoutingAction } from '../data/types';

export type RecentlySortedStripProps = {
  routings: Routing[];
  /** Max rows shown. Defaults to 8 (FRD §A). */
  limit?: number;
};

const ACTION_LABEL: Record<RoutingAction, string> = {
  bench: 'captured to bench',
  doc: 'routed to a new doc',
  guidebook: 'added to guidebook',
  runbook: 'appended to runbook',
  'field-notes': 'appended to field notes',
};

/** Friendly label for the artefact-side resolution. */
const resolveArtefactSummary = (
  routing: Routing,
): { label: string; href?: string } => {
  const { artefact, dispatch, classifier } = routing;
  if (artefact.kind === 'item') {
    const item = getItemById(artefact.id);
    return {
      label: item?.title ?? '(item gone)',
      href: '/triage',
    };
  }
  if (artefact.kind === 'doc') {
    const doc = getDocById(artefact.id);
    return {
      label: doc?.title ?? '(doc gone)',
      href: doc ? `/doc/${doc.id}` : undefined,
    };
  }
  if (artefact.kind === 'guidebook_entry') {
    const entry = getGuidebookEntryById(artefact.id);
    const guidebook = entry ? getGuidebookById(entry.guidebookId) : undefined;
    const project = getProjectById(routing.projectId);
    return {
      label: entry?.name ?? 'guidebook entry',
      href:
        project && guidebook
          ? `/project/${project.slug}/guidebook/${guidebook.id}`
          : project
            ? `/project/${project.slug}`
            : undefined,
    };
  }
  if (artefact.kind === 'runbook') {
    const project = getProjectById(routing.projectId);
    const section =
      dispatch?.kind === 'runbook' ? `· ${dispatch.section}` : '';
    return {
      label: `runbook ${section}`.trim(),
      href: project ? `/runbook/${project.slug}` : undefined,
    };
  }
  if (artefact.kind === 'field_notes') {
    const project = getProjectById(routing.projectId);
    const section =
      dispatch?.kind === 'field-notes' ? `· ${dispatch.section}` : '';
    return {
      label: `field notes ${section}`.trim(),
      href: project ? `/project/${project.slug}/field-notes` : undefined,
    };
  }
  return {
    label: classifier.explanation?.slice(0, 60) ?? 'routed',
  };
};

const Row = ({ routing }: { routing: Routing }) => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const summary = resolveArtefactSummary(routing);
  const actionLabel = ACTION_LABEL[routing.classifier.action];
  const sourceChip =
    routing.sourceKind === 'email'
      ? `email · ${routing.sourceMeta?.sender ?? 'unknown'}`
      : 'pasted';
  const explanation = routing.classifier.explanation;

  const onUndo = async () => {
    if (busy) return;
    if (
      !window.confirm(
        `Undo this routing? The artefact will be removed (or the section restored). The original paste is not retained.`,
      )
    ) {
      return;
    }
    setBusy(true);
    try {
      await undoRouting(routing.id);
      showToast(`Undone · ${actionLabel}`);
    } catch (err) {
      if (err instanceof ClassifierUnavailableError) {
        showToast('Server unavailable', { kind: 'error' });
      } else {
        showToast('Could not undo', {
          kind: 'error',
          detail: (err as Error).message,
        });
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '14px 1fr auto auto auto',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        borderBottom: '1px solid var(--line)',
      }}
    >
      <span style={{ color: 'var(--fg-faint)' }}>
        <Icons.bulb size={11} />
      </span>
      <div style={{ minWidth: 0 }}>
        <div
          onClick={() => summary.href && navigate(summary.href)}
          style={{
            fontSize: 13.5,
            fontWeight: 500,
            cursor: summary.href ? 'pointer' : 'default',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={summary.label}
        >
          {summary.label}
        </div>
        <Mono dim>
          {actionLabel}
          {explanation ? ` · ${explanation}` : ''}
        </Mono>
      </div>
      <Mono dim>{sourceChip}</Mono>
      <Mono dim>{formatRelative(routing.createdAt)}</Mono>
      <button
        className="km-btn km-btn-ghost"
        onClick={() => void onUndo()}
        disabled={busy}
        title="Undo this routing"
        style={{ color: 'var(--ember-deep)', padding: '3px 9px', fontSize: 12 }}
      >
        Undo
      </button>
    </div>
  );
};

export const RecentlySortedStrip = ({
  routings,
  limit = 8,
}: RecentlySortedStripProps) => {
  if (routings.length === 0) return null;
  const shown = routings.slice(0, limit);
  return (
    <section
      className="km-card"
      style={{
        padding: 0,
        background: 'color-mix(in srgb, var(--sacred) 5%, transparent)',
        borderColor: 'color-mix(in srgb, var(--sacred-ink) 22%, transparent)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <Icons.bulb size={13} stroke="var(--sacred-ink)" />
        <Label>Recently sorted</Label>
        <Mono dim>
          last 7 days · {routings.length}
          {routings.length > limit ? ` (showing ${limit})` : ''}
        </Mono>
        <span style={{ flex: 1 }} />
        <Mono dim>Smart Routing</Mono>
      </div>
      {shown.map((r) => (
        <Row key={r.id} routing={r} />
      ))}
    </section>
  );
};

export default RecentlySortedStrip;
