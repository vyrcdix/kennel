// Anthropic client wrapper for Smart Routing's classifier (Phase 0+).
// The classifier itself lives in routingClassifier.ts (slice 2); this
// module just owns the SDK construction, the model constant, the
// env-var check, and a thin typed call surface that the classifier
// (and future server-initiated AI calls) can target.
//
// Failure shape: when ANTHROPIC_API_KEY is unset, callers see
// `isAnthropicConfigured() === false` and routes can short-circuit
// with a clean 503 instead of throwing deep inside the SDK.

import Anthropic from '@anthropic-ai/sdk';

/** v0.5 spec: Sonnet 4.6 is the classification tier. When 4.7 lands in
 *  this tier and benchmarks beat 4.6, this constant is the one-line
 *  bump (along with a re-tune of the prompt). */
export const ANTHROPIC_MODEL = 'claude-sonnet-4-6';

/** Conservative ceiling for classifier responses. Structured output
 *  schemas usually fit in ~400 tokens; 1024 gives headroom without
 *  encouraging the model to ramble. */
export const DEFAULT_MAX_TOKENS = 1024;

let cachedClient: Anthropic | null = null;

/** True when the environment has a key configured. Doesn't validate
 *  that the key actually works — that's the caller's problem on the
 *  first real call. */
export const isAnthropicConfigured = (): boolean =>
  typeof process.env.ANTHROPIC_API_KEY === 'string' &&
  process.env.ANTHROPIC_API_KEY.length > 0;

/** Lazy singleton. Throws when called without ANTHROPIC_API_KEY so
 *  callers must gate on isAnthropicConfigured() first. */
export const getAnthropicClient = (): Anthropic => {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY not set — classifier is unavailable. ' +
        'See docs/email-ingestion-plan.md for the env-file setup.',
    );
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
};

/** Tests reset the singleton so a fresh env can construct a fresh client. */
export const _resetAnthropicClientForTests = (): void => {
  cachedClient = null;
};

/** Thin wrapper around messages.create. Slice 2's classifier replaces
 *  the body with a structured-output call carrying the cached
 *  per-thread context block; for slice 1 this exists so the shim has
 *  one real consumer and so tests have something to stub. */
export type ClassifyArgs = {
  /** The instruction text (rendered as the first system block, NOT
   *  cached — it's small and changes when the prompt evolves). */
  system: string;
  /** The per-thread context. Rendered as a second system block WITH
   *  prompt caching so successive routings against the same thread
   *  re-use the prefix. */
  cachedContext: string;
  /** The user-visible payload — the pasted body + hint + a JSON
   *  schema reminder. */
  userMessage: string;
  /** Optional override. Defaults to ANTHROPIC_MODEL. */
  model?: string;
  /** Optional override. Defaults to DEFAULT_MAX_TOKENS. */
  maxTokens?: number;
};

export const classifyRaw = async (args: ClassifyArgs) => {
  const client = getAnthropicClient();
  const response = await client.messages.create({
    model: args.model ?? ANTHROPIC_MODEL,
    max_tokens: args.maxTokens ?? DEFAULT_MAX_TOKENS,
    system: [
      { type: 'text', text: args.system },
      {
        type: 'text',
        text: args.cachedContext,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: args.userMessage }],
  });
  return response;
};
