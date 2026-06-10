export type SegBtnProps = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};

export const SegBtn = ({ label, active, onClick }: SegBtnProps) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 11px',
      fontFamily: 'var(--ff-sans)',
      fontSize: 12,
      border: '1px solid var(--line-strong)',
      background: active ? 'color-mix(in srgb, var(--action) 12%, transparent)' : 'transparent',
      color: active ? 'var(--ember-deep)' : 'var(--fg)',
      cursor: 'pointer',
      marginLeft: -1,
      lineHeight: 1.4,
    }}
  >
    {label}
  </button>
);

export default SegBtn;
