import { describe, expect, test } from 'vitest';
import { countHunks, diffLines, summary, toSideBySide } from './diff';

describe('diffLines', () => {
  test('identical text → all eq', () => {
    const ops = diffLines('a\nb\nc', 'a\nb\nc');
    expect(ops.every((o) => o.kind === 'eq')).toBe(true);
    expect(ops).toHaveLength(3);
  });

  test('pure addition appends adds after eqs', () => {
    const ops = diffLines('a\nb', 'a\nb\nc');
    expect(ops.map((o) => o.kind)).toEqual(['eq', 'eq', 'add']);
    expect(ops[2].text).toBe('c');
  });

  test('pure deletion produces dels in place', () => {
    const ops = diffLines('a\nb\nc', 'a\nc');
    expect(ops.map((o) => o.kind)).toEqual(['eq', 'del', 'eq']);
    expect(ops[1].text).toBe('b');
  });

  test('mixed replacement', () => {
    const ops = diffLines('x\nold\ny', 'x\nnew1\nnew2\ny');
    const kinds = ops.map((o) => o.kind);
    expect(kinds[0]).toBe('eq');
    expect(kinds[kinds.length - 1]).toBe('eq');
    expect(kinds.filter((k) => k === 'add').length).toBe(2);
    expect(kinds.filter((k) => k === 'del').length).toBe(1);
  });

  test('empty strings produce one eq line each', () => {
    const ops = diffLines('', '');
    expect(ops).toEqual([{ kind: 'eq', text: '' }]);
  });
});

describe('summary', () => {
  test('counts adds and dels, ignores eqs', () => {
    const ops = diffLines('a\nb\nc', 'a\nx\nc\nd');
    expect(summary(ops)).toEqual({ adds: 2, dels: 1 });
  });
});

describe('countHunks', () => {
  test('contiguous changes count as one hunk', () => {
    const ops = diffLines('a\nb\nc', 'a\nx\ny\nc');
    expect(countHunks(ops)).toBe(1);
  });

  test('separated changes count as two', () => {
    const ops = diffLines('a\nb\nc\nd\ne', 'a\nB\nc\nD\ne');
    expect(countHunks(ops)).toBe(2);
  });

  test('no changes → zero hunks', () => {
    expect(countHunks(diffLines('a\nb', 'a\nb'))).toBe(0);
  });
});

describe('toSideBySide', () => {
  test('aligns equal lines on both sides', () => {
    const ops = diffLines('a\nb', 'a\nb');
    const { left, right } = toSideBySide(ops);
    expect(left).toHaveLength(2);
    expect(right).toHaveLength(2);
    expect(left.every((l) => l.kind === 'eq')).toBe(true);
    expect(right.every((r) => r.kind === 'eq')).toBe(true);
  });

  test('pads opposite side for asymmetric chunks', () => {
    const ops = diffLines('a\nb', 'a\nB1\nB2\nB3');
    const { left, right } = toSideBySide(ops);
    expect(left).toHaveLength(right.length);
    const leftPads = left.filter((l) => l.kind === 'pad').length;
    const rightAdds = right.filter((r) => r.kind === 'add').length;
    expect(rightAdds).toBeGreaterThan(0);
    expect(leftPads).toBeGreaterThan(0);
  });

  test('line numbers increment monotonically per side', () => {
    const ops = diffLines('a\nb\nc', 'a\nX\nc');
    const { left, right } = toSideBySide(ops);
    const leftNs = left.filter((l) => l.kind !== 'pad').map((l) => (l as any).n);
    const rightNs = right.filter((r) => r.kind !== 'pad').map((r) => (r as any).n);
    for (let i = 1; i < leftNs.length; i++) expect(leftNs[i]).toBeGreaterThan(leftNs[i - 1]);
    for (let i = 1; i < rightNs.length; i++) expect(rightNs[i]).toBeGreaterThan(rightNs[i - 1]);
  });
});
