// Slice 1 sanity for the Anthropic shim — env-var gating only. The
// SDK itself doesn't get exercised here; slice 2's classifier tests
// will mock messages.create directly.

import { afterEach, describe, expect, test } from 'vitest';
import {
  _resetAnthropicClientForTests,
  getAnthropicClient,
  isAnthropicConfigured,
} from './anthropic.js';

afterEach(() => {
  _resetAnthropicClientForTests();
});

describe('isAnthropicConfigured', () => {
  test('false when the env var is unset', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(isAnthropicConfigured()).toBe(false);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  test('false when the env var is empty', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = '';
    try {
      expect(isAnthropicConfigured()).toBe(false);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });

  test('true when the env var has a value', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    try {
      expect(isAnthropicConfigured()).toBe(true);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });
});

describe('getAnthropicClient', () => {
  test('throws when the key is unset', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      expect(() => getAnthropicClient()).toThrow(/ANTHROPIC_API_KEY/);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
    }
  });

  test('returns a client when the key is set', () => {
    const previous = process.env.ANTHROPIC_API_KEY;
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
    try {
      const client = getAnthropicClient();
      expect(client).toBeTruthy();
      // Singleton: a second call returns the same instance.
      expect(getAnthropicClient()).toBe(client);
    } finally {
      if (previous !== undefined) process.env.ANTHROPIC_API_KEY = previous;
      else delete process.env.ANTHROPIC_API_KEY;
    }
  });
});
