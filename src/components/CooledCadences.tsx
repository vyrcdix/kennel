// "Cooled cadences" (C4) — the Aging-board panel, above the shelf, both skins.
// Rhythms gone past their tolerance, asking honestly to be released. Sweeping
// the workshop, not confronting failures. Amnesty verbs parallel aging's:
// U keep it going · C crystallize the lesson · F file · X let it go.
import { CommitMeter } from './CommitMeter';
import { Icons } from './Icon';
import { Mono } from './Mono';
import { ProjectTag } from './ProjectTag';
import {
  crystallizeItem,
  fileItem,
  recommitCadence,
  transitionItem,
} from '../data/actions';
import { getCooledCadences, getProjectById } from '../data/selectors';
import { COMMIT, windowsBehind } from '../lib/cadence';
import { copy } from '../lib/copy';
import { removeItem } from '../lib/permanence';
import { showToast } from '../lib/toast';
import type { Item } from '../data/types';

const unitWord = (item: Item, n: number) => {
  const u = item.cadence === 'daily' ? 'day' : item.cadence === 'monthly' ? 'month' : 'week';
  return `${u}${n === 1 ? '' : 's'}`;
};

const rowEl = (id: string) =>
  typeof document !== 'undefined'
    ? document.querySelector<HTMLElement>(`[data-cadence-id="${id}"]`)
    : null;

export const CooledCadences = ({ projectId }: { projectId?: string }) => {
  const cooled = getCooledCadences(projectId);
  if (cooled.length === 0) return null;

  return (
    <section className="km-card" style={{ padding: 'var(--pad-panel, 22px)', marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 2 }}>
        <div className="km-display-md" style={{ fontSize: 18 }}>{copy('cadence.cooled')}</div>
        <span style={{ flex: 1 }} />
        <Mono dim>{cooled.length} cooled</Mono>
      </div>
      <Mono dim>{copy('cadence.cooled.sub')}</Mono>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
        {cooled.map((item) => {
          const project = getProjectById(item.projectId);
          const behind = windowsBehind(item);
          const commit = item.commitment ? COMMIT[item.commitment] : undefined;
          return (
            <div
              key={item.id}
              data-cadence-id={item.id}
              className="km-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--r-ctrl)',
                border: '1px solid var(--line)',
                background: 'var(--card-2)',
              }}
            >
              <span style={{ color: 'var(--ink-faint)', display: 'inline-flex', flex: '0 0 auto' }}>
                <Icons.repeat size={15} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, color: 'var(--ink-muted)' }}>{item.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 5, flexWrap: 'wrap' }}>
                  {project && <ProjectTag slug={project.slug} />}
                  {item.commitment && <CommitMeter level={item.commitment} showLabel={false} />}
                  <Mono dim>
                    quiet {behind} {unitWord(item, behind)}
                    {commit ? ` · you were "${commit.label}"` : ''}
                  </Mono>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 6, flex: '0 0 auto' }}>
                <button
                  className="km-btn km-btn-ghost km-btn-sm"
                  title="Keep it going (U)"
                  onClick={() => {
                    void recommitCadence(item.id);
                    showToast('Back on the rhythm.', { kind: 'focus' });
                  }}
                >
                  <Icons.arrowUp size={13} /> Keep going
                </button>
                <button
                  className="km-btn km-btn-ghost km-btn-sm"
                  style={{ color: 'var(--sacred-ink)' }}
                  title="Crystallize the lesson (C)"
                  onClick={() => {
                    void crystallizeItem(item.id, { promoteKind: true });
                    showToast('Crystallized — a kept thing.', { kind: 'crystal' });
                  }}
                >
                  <Icons.gem size={13} /> Crystallize
                </button>
                <button
                  className="km-btn km-btn-ghost km-btn-sm"
                  title="File (F)"
                  onClick={() => {
                    void fileItem(item.id);
                    showToast('Filed.', { kind: 'focus' });
                  }}
                >
                  <Icons.archive size={13} /> File
                </button>
                <button
                  className="km-btn km-btn-ghost km-btn-sm"
                  style={{ color: 'var(--ink-faint)' }}
                  title="Let it go (X)"
                  onClick={() =>
                    void removeItem({
                      action: 'letGo',
                      el: rowEl(item.id),
                      mutate: () => transitionItem(item.id, 'dismissed'),
                      undo: () => transitionItem(item.id, 'active'),
                    })
                  }
                >
                  <Icons.x size={13} /> Let go
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default CooledCadences;
