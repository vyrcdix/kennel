// Line-level diff via LCS. Sufficient for the proposal screen's needs;
// swap for a real diff lib (e.g. diff or jsdiff) when the data layer lands.

export type DiffOp = { kind: 'eq' | 'add' | 'del'; text: string };

export const diffLines = (a: string, b: string): DiffOp[] => {
  const aa = a.split('\n');
  const bb = b.split('\n');
  const m = aa.length;
  const n = bb.length;
  const lcs: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      lcs[i][j] = aa[i] === bb[j]
        ? lcs[i + 1][j + 1] + 1
        : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
    }
  }
  const out: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (aa[i] === bb[j]) {
      out.push({ kind: 'eq', text: aa[i] });
      i++; j++;
    } else if (lcs[i + 1][j] >= lcs[i][j + 1]) {
      out.push({ kind: 'del', text: aa[i] });
      i++;
    } else {
      out.push({ kind: 'add', text: bb[j] });
      j++;
    }
  }
  while (i < m) out.push({ kind: 'del', text: aa[i++] });
  while (j < n) out.push({ kind: 'add', text: bb[j++] });
  return out;
};

export type SideLine =
  | { kind: 'eq'; n: number; text: string }
  | { kind: 'del'; n: number; text: string }
  | { kind: 'add'; n: number; text: string }
  | { kind: 'pad' };

/** Side-by-side projection: changes align vertically with blank padding
 *  inserted on the opposing side. */
export const toSideBySide = (
  ops: DiffOp[],
  baseLeft = 1,
  baseRight = 1,
): { left: SideLine[]; right: SideLine[] } => {
  const left: SideLine[] = [];
  const right: SideLine[] = [];
  let l = baseLeft;
  let r = baseRight;
  let buf: DiffOp[] = [];
  const flush = () => {
    const dels = buf.filter((o) => o.kind === 'del');
    const adds = buf.filter((o) => o.kind === 'add');
    const max = Math.max(dels.length, adds.length);
    for (let k = 0; k < max; k++) {
      if (k < dels.length) left.push({ kind: 'del', n: l++, text: dels[k].text });
      else left.push({ kind: 'pad' });
      if (k < adds.length) right.push({ kind: 'add', n: r++, text: adds[k].text });
      else right.push({ kind: 'pad' });
    }
    buf = [];
  };
  for (const op of ops) {
    if (op.kind === 'eq') {
      flush();
      left.push({ kind: 'eq', n: l++, text: op.text });
      right.push({ kind: 'eq', n: r++, text: op.text });
    } else {
      buf.push(op);
    }
  }
  flush();
  return { left, right };
};

export const summary = (ops: DiffOp[]) => {
  let adds = 0;
  let dels = 0;
  for (const o of ops) {
    if (o.kind === 'add') adds++;
    else if (o.kind === 'del') dels++;
  }
  return { adds, dels };
};

/** Group contiguous run of changes into a hunk count. */
export const countHunks = (ops: DiffOp[]) => {
  let hunks = 0;
  let inHunk = false;
  for (const o of ops) {
    if (o.kind === 'eq') {
      inHunk = false;
    } else if (!inHunk) {
      hunks++;
      inHunk = true;
    }
  }
  return hunks;
};
