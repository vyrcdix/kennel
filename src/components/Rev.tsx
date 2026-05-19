export type RevProps = { n: number };

export const Rev = ({ n }: RevProps) => (
  <span className="km-mono-sm" style={{ whiteSpace: 'nowrap' }}>rev {n}</span>
);

export default Rev;
