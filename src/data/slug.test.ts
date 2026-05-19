import { describe, expect, test } from 'vitest';
import { deriveSlug, isValidSlug, SLUG_MAX } from './slug';

describe('deriveSlug', () => {
  test('simple name → lowercased', () => {
    expect(deriveSlug('Kennel')).toBe('kennel');
  });

  test('spaces and punctuation → hyphens', () => {
    expect(deriveSlug('Picnic — Engagement')).toBe('picnic-engagement');
  });

  test('collapses runs of hyphens', () => {
    expect(deriveSlug('foo / bar  // baz')).toBe('foo-bar-baz');
  });

  test('trims leading/trailing hyphens', () => {
    expect(deriveSlug('   weird name?? ')).toBe('weird-name');
  });

  test('strips diacritics-as-not-alphanumeric (best effort)', () => {
    expect(deriveSlug('Über cool')).toBe('ber-cool');
  });

  test('caps at SLUG_MAX', () => {
    const s = deriveSlug('a'.repeat(80));
    expect(s.length).toBeLessThanOrEqual(SLUG_MAX);
  });

  test('empty / pure-punctuation input → empty string', () => {
    expect(deriveSlug('')).toBe('');
    expect(deriveSlug('!!!')).toBe('');
  });
});

describe('isValidSlug', () => {
  test('valid slugs', () => {
    expect(isValidSlug('kennel')).toBe(true);
    expect(isValidSlug('picnic-engage')).toBe(true);
    expect(isValidSlug('a1-b2-c3')).toBe(true);
    expect(isValidSlug('a')).toBe(true);
  });

  test('empty → invalid', () => {
    expect(isValidSlug('')).toBe(false);
  });

  test('uppercase → invalid', () => {
    expect(isValidSlug('Kennel')).toBe(false);
  });

  test('leading or trailing hyphen → invalid', () => {
    expect(isValidSlug('-foo')).toBe(false);
    expect(isValidSlug('foo-')).toBe(false);
  });

  test('double hyphen → invalid', () => {
    expect(isValidSlug('foo--bar')).toBe(false);
  });

  test('non-alphanumeric → invalid', () => {
    expect(isValidSlug('foo_bar')).toBe(false);
    expect(isValidSlug('foo bar')).toBe(false);
    expect(isValidSlug('foo.bar')).toBe(false);
  });

  test('over SLUG_MAX → invalid', () => {
    expect(isValidSlug('a'.repeat(SLUG_MAX + 1))).toBe(false);
  });
});
