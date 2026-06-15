import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCopyOverrides } from './copyOverrides.js';

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'copy-'));
});
afterEach(() => {
  delete process.env.KENNEL_COPY_FILE;
  rmSync(dir, { recursive: true, force: true });
});

describe('readCopyOverrides', () => {
  test('returns {} when the file is absent', () => {
    process.env.KENNEL_COPY_FILE = join(dir, 'nope.json');
    expect(readCopyOverrides()).toEqual({});
  });

  test('parses valid per-field overrides and drops junk', () => {
    const f = join(dir, 'copy.json');
    writeFileSync(
      f,
      JSON.stringify({
        'nav.dashboard': { life: 'Home Port' }, // partial (one skin) — kept
        'aging.title': { workshop: 'Old', life: 'Cold' }, // full — kept
        'bad.array': ['x'], // dropped
        'bad.empty': {}, // dropped (no skin fields)
        'bad.types': { workshop: 5, life: true }, // dropped
      }),
    );
    process.env.KENNEL_COPY_FILE = f;
    expect(readCopyOverrides()).toEqual({
      'nav.dashboard': { life: 'Home Port' },
      'aging.title': { workshop: 'Old', life: 'Cold' },
    });
  });

  test('malformed JSON → {} (never throws)', () => {
    const f = join(dir, 'copy.json');
    writeFileSync(f, '{ not valid json');
    process.env.KENNEL_COPY_FILE = f;
    expect(readCopyOverrides()).toEqual({});
  });
});
