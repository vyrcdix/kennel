import { Icons } from './Icon';
import { Mono } from './Mono';
import { dismissNextSteps } from '../data/actions';
import { getProjectItems, getRunbook } from '../data/selectors';
import type { Project } from '../data/types';

export type NextStepsStripProps = {
  project: Project;
  onCapture: () => void;
  onAddDescription: () => void;
  onAddContext: () => void;
  onOpenRunbook: () => void;
};

const StepButton = ({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) => (
  <button
    className="km-btn km-btn-ghost"
    onClick={onClick}
    style={{
      padding: 0,
      color: 'var(--fg)',
      textDecoration: 'underline',
      textDecorationColor: 'var(--ember-dark)',
      textUnderlineOffset: 3,
      fontSize: 13,
    }}
  >
    {icon} {label}
  </button>
);

export const NextStepsStrip = ({
  project,
  onCapture,
  onAddDescription,
  onAddContext,
  onOpenRunbook,
}: NextStepsStripProps) => {
  if (project.nextStepsDismissed) return null;

  const steps: { key: string; show: boolean; node: React.ReactNode }[] = [
    {
      key: 'capture',
      show: getProjectItems(project.id).length === 0,
      node: <StepButton icon={<Icons.plus size={12} />} label="Capture an item" onClick={onCapture} />,
    },
    {
      key: 'description',
      show: !project.description?.trim(),
      node: <StepButton icon={<Icons.note size={12} />} label="Add a description" onClick={onAddDescription} />,
    },
    {
      key: 'context',
      show: !project.context?.trim(),
      node: <StepButton icon={<Icons.bulb size={12} />} label="Add context for Claude" onClick={onAddContext} />,
    },
    {
      key: 'runbook',
      show: !getRunbook(project.id),
      node: (
        <StepButton
          icon={<Icons.runbook size={12} />}
          label="Set up a runbook when you're ready"
          onClick={onOpenRunbook}
        />
      ),
    },
  ];

  const visible = steps.filter((s) => s.show);
  if (visible.length === 0) return null;

  return (
    <div
      style={{
        padding: '12px 20px',
        background: 'color-mix(in srgb, var(--dust) 25%, transparent)',
        borderBottom: '1px solid color-mix(in srgb, var(--dust) 45%, transparent)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        flexWrap: 'wrap',
      }}
    >
      <span className="km-display-sm" style={{ color: 'var(--ember-deep)', fontSize: 11 }}>
        NEXT STEPS
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, flex: 1, flexWrap: 'wrap' }}>
        {visible.map((s, i) => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: 18 }}>
            {s.node}
            {i < visible.length - 1 && (
              <span className="km-mono-sm" style={{ color: 'var(--fg-faint)' }}>·</span>
            )}
          </span>
        ))}
      </div>
      <Mono dim>dismissed per-thread · persists</Mono>
      <button
        className="km-btn km-btn-ghost"
        onClick={() => dismissNextSteps(project.id)}
        style={{ padding: '4px 6px', color: 'var(--fg-muted)' }}
        title="Dismiss"
      >
        <Icons.x size={13} />
      </button>
    </div>
  );
};

export default NextStepsStrip;
