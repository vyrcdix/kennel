// "Do this week" (C4) — the dashboard cadence slot, below the hearth, in both
// skins. Recurring actions whose window is open, surfaced as invitations. The
// loop (Did it / Skip / Snooze / divergence) wires to the C1 engine; nothing
// is ever due or overdue. Renders nothing when there are no open cadences.
import { useNavigate } from 'react-router-dom';
import { CadenceCard } from './CadenceCard';
import { Icons } from './Icon';
import { Mono } from './Mono';
import {
  crystallizeItem,
  didCadence,
  recommitCadence,
  setCadenceCommitment,
  skipCadence,
  snoozeCadence,
  transitionItem,
} from '../data/actions';
import {
  getCadencesDueThisWeek,
  getItemById,
  getProjectById,
  getReferenceById,
} from '../data/selectors';
import { deriveTrace } from '../lib/cadence';
import { copy } from '../lib/copy';
import { removeItem } from '../lib/permanence';
import { showToast } from '../lib/toast';
import type { Item } from '../data/types';

const rowEl = (id: string) =>
  typeof document !== 'undefined'
    ? document.querySelector<HTMLElement>(`[data-cadence-id="${id}"]`)
    : null;

export const DoThisWeek = ({ projectId }: { projectId?: string }) => {
  const navigate = useNavigate();
  const cadences = getCadencesDueThisWeek(projectId);
  if (cadences.length === 0) return null;

  const resolveResource = (item: Item) => {
    if (!item.resourceRefId) return undefined;
    const ref = getReferenceById(item.resourceRefId);
    return ref ? { label: ref.label, url: ref.url } : undefined;
  };

  return (
    <section style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3 }}>
        <span style={{ color: 'var(--action-ink)', display: 'inline-flex' }}>
          <Icons.repeat size={17} />
        </span>
        <div className="km-display-md" style={{ fontSize: 21 }}>{copy('cadence.doThisWeek')}</div>
        <span style={{ flex: 1 }} />
        <Mono dim>invitations, never due · {cadences.length} open</Mono>
      </div>
      <div className="km-body" style={{ margin: '0 0 14px 27px', color: 'var(--fg-muted)', fontSize: 13.5 }}>
        {copy('cadence.doThisWeek.sub')}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 13 }}>
        {cadences.map((item) => {
          const project = getProjectById(item.projectId);
          const serves = item.servesId ? getItemById(item.servesId) : undefined;
          return (
            <div key={item.id} data-cadence-id={item.id}>
              <CadenceCard
                item={item}
                project={project}
                servesLabel={serves?.title}
                resource={resolveResource(item)}
                trace={deriveTrace(item.keptCount ?? 0)}
                onDid={() => {
                  void didCadence(item.id);
                  showToast("Kept up — it'll wash back in next window.", { kind: 'crystal' });
                }}
                onSkip={() => {
                  void skipCadence(item.id);
                  showToast('Skipped, no harm. Rolls to the next window.', { kind: 'release' });
                }}
                onSnooze={() => {
                  void snoozeCadence(item.id);
                  showToast('Snoozed a few days — still inside this window.', { kind: 'focus' });
                }}
                onRecommit={() => {
                  void recommitCadence(item.id);
                  showToast('Re-committed — warm again.', { kind: 'crystal' });
                }}
                onEaseOff={() => {
                  void setCadenceCommitment(item.id, 'trying');
                  showToast('Eased off to "trying it".', { kind: 'focus' });
                }}
                onLetGo={() =>
                  void removeItem({
                    action: 'letGo',
                    el: rowEl(item.id),
                    mutate: () => transitionItem(item.id, 'dismissed'),
                    undo: () => transitionItem(item.id, 'active'),
                  })
                }
                onCrystallize={() => {
                  void crystallizeItem(item.id, { promoteKind: true });
                  showToast('Crystallized — a kept thing.', { kind: 'crystal' });
                }}
                onOpenThread={() => project && navigate(`/project/${project.slug}`)}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default DoThisWeek;
