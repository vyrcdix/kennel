import type { CSSProperties, ReactNode } from 'react';

export type IconProps = {
  size?: number;
  stroke?: string;
  sw?: number;
  fill?: string;
  extra?: ReactNode;
  style?: CSSProperties;
};

type IconBase = IconProps & { d: string | string[] };

const Icon = ({
  d,
  size = 14,
  stroke = 'currentColor',
  sw = 1.5,
  fill = 'none',
  extra,
  style,
}: IconBase) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={fill}
    stroke={stroke}
    strokeWidth={sw}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ flex: '0 0 auto', display: 'block', ...style }}
  >
    {extra}
    {Array.isArray(d) ? d.map((s, i) => <path key={i} d={s} />) : <path d={d} />}
  </svg>
);

type IconFn = (props?: IconProps) => JSX.Element;

const make = (d: string | string[], swDefault?: number): IconFn =>
  (p: IconProps = {}) => <Icon {...p} d={d} sw={p.sw ?? swDefault ?? 1.5} />;

export const Icons: Record<string, IconFn> = {
  search:    make(['M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z', 'm20 20-3.5-3.5']),
  plus:      make(['M12 5v14', 'M5 12h14']),
  menu:      make(['M4 7h16', 'M4 12h16', 'M4 17h16']),
  grip:      make(['M9 6h.01','M15 6h.01','M9 12h.01','M15 12h.01','M9 18h.01','M15 18h.01'], 2.5),
  pin:       make(['M12 17v5','M5 9h14l-2 8H7L5 9z','M9 9V4h6v5']),
  bulb:      make(['M9 18h6','M10 22h4','M8 14a4 4 0 1 1 8 0c0 2-2 3-2 4h-4c0-1-2-2-2-4z']),
  note:      make(['M4 5h16v14H4z','M8 9h8','M8 13h8','M8 17h5']),
  check:     make(['M4 5h16v14H4z','m8 12 3 3 5-6']),
  doc:       make(['M6 3h8l4 4v14H6z','M14 3v4h4','M9 13h6','M9 17h6','M9 9h2']),
  link:      make(['M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1','M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1']),
  chat:      make(['M4 6h16v10H8l-4 4z']),
  runbook:   make(['M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z','M5 18h14','M9 8h6','M9 12h4']),
  arrowR:    make(['M5 12h14','m13 6 6 6-6 6']),
  arrowDown: make('m6 9 6 6 6-6'),
  arrowUp:   make('m6 15 6-6 6 6'),
  archive:   make(['M3 5h18v4H3z','M5 9v11h14V9','M10 13h4']),
  trash:     make(['M4 7h16','M9 7V4h6v3','M6 7v13h12V7','M10 11v6','M14 11v6']),
  park:      make(['M6 4h8a4 4 0 0 1 0 8h-4v8H6z','M10 8h4']),
  star:      make('M12 4l2.4 5 5.6.6-4 3.8 1.2 5.6L12 16.3 6.8 19l1.2-5.6-4-3.8L9.6 9z'),
  filter:    make(['M4 5h16l-6 8v6l-4-2v-4z']),
  cog:       make(['M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z','M12 2v3','M12 19v3','m4.2 4.2 2.1 2.1','m17.7 17.7 2.1 2.1','M2 12h3','M19 12h3','m4.2 19.8 2.1-2.1','m17.7 6.3 2.1-2.1']),
  x:         make(['M6 6l12 12','M18 6L6 18']),
  copy:      make(['M9 4h10v12H9z','M5 8v12h10']),
  ext:       make(['M14 5h5v5','M19 5l-8 8','M19 14v5H5V5h5']),
  eye:       make(['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z','M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z']),
  side:      make(['M4 5h16v14H4z','M10 5v14']),
  cmd:       make('M9 6a3 3 0 1 1-3 3h12a3 3 0 1 1-3-3v12a3 3 0 1 1 3-3H6a3 3 0 1 1 3 3z'),
  bell:      make(['M6 16V11a6 6 0 1 1 12 0v5l2 2H4z','M10 20a2 2 0 0 0 4 0']),
  caret:     make('m9 6 6 6-6 6'),
};

export default Icon;
