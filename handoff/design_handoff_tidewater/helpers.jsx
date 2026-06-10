// Shared atoms for the Life-skin direction boards.
// Icon set is hand-traced Lucide-style (parity with the base skin's `Icon`).
// Everything here is skin-agnostic: it reads `currentColor` / CSS vars so the
// same atom renders correctly inside .sk-kitchen and .sk-tide.

const Icon = ({ d, size = 16, sw = 1.6, fill = 'none', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={{ flex: '0 0 auto', display: 'block', ...style }}>
    {Array.isArray(d) ? d.map((s, i) => <path key={i} d={s} />) : <path d={d} />}
  </svg>
);

const Ic = {
  search:  (p={}) => <Icon {...p} d={["M11 4a7 7 0 1 1 0 14 7 7 0 0 1 0-14z","m20 20-3.5-3.5"]} />,
  plus:    (p={}) => <Icon {...p} d={["M12 5v14","M5 12h14"]} />,
  grid:    (p={}) => <Icon {...p} d={["M4 4h7v7H4z","M13 4h7v7h-7z","M4 13h7v7H4z","M13 13h7v7h-7z"]} />,
  layers:  (p={}) => <Icon {...p} d={["m12 3 9 5-9 5-9-5 9-5z","m3 13 9 5 9-5"]} />,
  shelf:   (p={}) => <Icon {...p} d={["M4 5h16","M4 12h16","M4 19h16","M8 5v7","M14 12v7"]} />,
  tide:    (p={}) => <Icon {...p} d={["M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0","M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0"]} />,
  clock:   (p={}) => <Icon {...p} d={["M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z","M12 8v4l3 2"]} />,
  review:  (p={}) => <Icon {...p} d={["M5 4h11l3 3v13H5z","M9 12h6","M9 16h4","M9 8h3"]} />,
  gem:     (p={}) => <Icon {...p} d={["M6 3h12l3 6-9 12L3 9z","M3 9h18","M9 3 6 9l6 12","M15 3l3 6-6 12"]} />,
  cog:     (p={}) => <Icon {...p} d={["M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z","M12 2v3","M12 19v3","m4.2 4.2 2.1 2.1","m17.7 17.7 2.1 2.1","M2 12h3","M19 12h3","m4.2 19.8 2.1-2.1","m17.7 6.3 2.1-2.1"]} />,
  bulb:    (p={}) => <Icon {...p} d={["M9 18h6","M10 22h4","M8 14a4 4 0 1 1 8 0c0 2-2 3-2 4h-4c0-1-2-2-2-4z"]} />,
  note:    (p={}) => <Icon {...p} d={["M4 5h16v14H4z","M8 9h8","M8 13h8","M8 17h5"]} />,
  check:   (p={}) => <Icon {...p} d={["M4 5h16v14H4z","m8 12 3 3 5-6"]} />,
  doc:     (p={}) => <Icon {...p} d={["M6 3h8l4 4v14H6z","M14 3v4h4","M9 13h6","M9 17h6"]} />,
  link:    (p={}) => <Icon {...p} d={["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1","M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"]} />,
  ask:     (p={}) => <Icon {...p} d={["M4 6h16v10H8l-4 4z","M9 10h.01","M12 10h.01","M15 10h.01"]} />,
  q:       (p={}) => <Icon {...p} d={["M9 9a3 3 0 1 1 4 2.8c-.8.4-1 .9-1 1.7","M12 17h.01"]} />,
  arrowR:  (p={}) => <Icon {...p} d={["M5 12h14","m13 6 6 6-6 6"]} />,
  arrowUp: (p={}) => <Icon {...p} d="m6 14 6-6 6 6" />,
  pickup:  (p={}) => <Icon {...p} d={["M12 20V8","m6 12 6-6 6 6","M5 4h14"]} />,
  file:    (p={}) => <Icon {...p} d={["M3 6h18v4H3z","M5 10v10h14V10","M10 14h4"]} />,
  release: (p={}) => <Icon {...p} d={["M12 3v9","m8 8 4-4 4 4","M5 14c0 4 3 7 7 7s7-3 7-7"]} />,
  retire:  (p={}) => <Icon {...p} d={["M4 7h16","M9 7V4h6v3","M6 7v13h12V7"]} />,
  refresh: (p={}) => <Icon {...p} d={["M4 12a8 8 0 0 1 14-5l2 2","M20 5v4h-4","M20 12a8 8 0 0 1-14 5l-2-2","M4 19v-4h4"]} />,
  pencil:  (p={}) => <Icon {...p} d={["M5 19h14","M14 5l4 4-9 9-4 1 1-4z"]} />,
  spark:   (p={}) => <Icon {...p} d={["M12 3v4","M12 17v4","M3 12h4","M17 12h4","m6 6 2.5 2.5","m15.5 15.5 2.5 2.5","m18 6-2.5 2.5","m8.5 15.5-2.5 2.5"]} />,
  run:     (p={}) => <Icon {...p} d={["M13 4a1.6 1.6 0 1 0 0-.01","M9 20l2-5 3-2 1 3 3 2","M6 12l3-3 4 1 2-3"]} />,
  book:    (p={}) => <Icon {...p} d={["M5 4h11a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z","M5 18h13","M9 8h5"]} />,
  plane:   (p={}) => <Icon {...p} d={["M21 6 3 12l5 2 2 5 3-4 5 3z"]} />,
  pin:     (p={}) => <Icon {...p} d={["M12 17v5","M5 9h14l-2 8H7L5 9z","M9 9V4h6v5"]} />,
  paste:   (p={}) => <Icon {...p} d={["M9 4h6v3H9z","M7 5H5v15h14V5h-2","M9 12h6","M9 16h4"]} />,
  sun:     (p={}) => <Icon {...p} d={["M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z","M12 2v2","M12 20v2","M2 12h2","M20 12h2","m5 5 1.5 1.5","m17.5 17.5 1.5 1.5","m19 5-1.5 1.5","m6.5 17.5-1.5 1.5"]} />,
  moon:    (p={}) => <Icon {...p} d="M20 14.5A8 8 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5z" />,
  grip:    (p={}) => <Icon {...p} d={["M9 6h.01","M15 6h.01","M9 12h.01","M15 12h.01","M9 18h.01","M15 18h.01"]} sw={2.4} />,
  x:       (p={}) => <Icon {...p} d={["M6 6l12 12","M18 6 6 18"]} />,
  undo:    (p={}) => <Icon {...p} d={["M9 14 4 9l5-5","M4 9h11a5 5 0 0 1 0 10h-3"]} />,
  eye:     (p={}) => <Icon {...p} d={["M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z","M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"]} />,
  send:    (p={}) => <Icon {...p} d={["M22 2 11 13","M22 2 15 22l-4-9-9-4z"]} />,
  tagi:    (p={}) => <Icon {...p} d={["M3 7v5l9 9 7-7-9-9H7a4 4 0 0 0-4 4z","M7.5 8.5h.01"]} />,
  hash:    (p={}) => <Icon {...p} d={["M5 9h14","M5 15h14","M10 4 8 20","M16 4l-2 16"]} />,
  more:    (p={}) => <Icon {...p} d={["M6 12h.01","M12 12h.01","M18 12h.01"]} sw={2.4} />,
};

// Item-kind glyph
const KindIcon = ({ kind, size = 15 }) => {
  const map = { idea: Ic.bulb, note: Ic.note, action: Ic.check, doc: Ic.doc, ref: Ic.link, question: Ic.q };
  const C = map[kind] || Ic.note;
  return <C size={size} />;
};

// Mono utility text — uses the skin's --ff-mono via the .mono class.
const Mono = ({ children, dim, style }) => (
  <span className="mono" style={{ opacity: dim ? 0.62 : 1, ...style }}>{children}</span>
);

// One keyboard hint chip (kbd key + label)
const Kbd = ({ k, children }) => (
  <span className="kbdhint"><kbd className="kbd">{k}</kbd>{children && <span>{children}</span>}</span>
);

Object.assign(window, { Icon, Ic, KindIcon, Mono, Kbd });
