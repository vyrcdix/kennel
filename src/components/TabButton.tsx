export type TabButtonProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

/** Underlined Display-sm tab pill used for runbook tabs, all-items tabs, etc. */
export const TabButton = ({ label, active, onClick }: TabButtonProps) => (
  <button
    onClick={onClick}
    style={{
      border: 0,
      background: 'transparent',
      fontFamily: 'var(--ff-display)',
      fontWeight: 500,
      fontSize: 12,
      letterSpacing: '.18em',
      textTransform: 'uppercase',
      color: active ? 'var(--ember-deep)' : 'var(--fg-muted)',
      padding: '8px 0',
      borderBottom: active ? '2px solid var(--ember)' : '2px solid transparent',
      cursor: 'pointer',
    }}
  >
    {label}
  </button>
);

export default TabButton;
