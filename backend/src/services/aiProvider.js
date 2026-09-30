// Provider-agnostic AI layer. summarize() is the only thing routes call —
// swap MOCK_PROVIDER for a real one later without touching anything else.
import { config } from '../config/index.js';

const PROMPT_VERSION = 'summarize-v1';

function mockSummarize(text, { tone = 'neutral', length = 'short' } = {}) {
  // Deterministic, offline "summary": first sentence(s), trimmed to a target length.
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  const sentenceCount = length === 'long' ? 3 : length === 'medium' ? 2 : 1;
  let summary = sentences.slice(0, sentenceCount).join(' ') || text.slice(0, 140);
  if (tone === 'casual') summary = summary.replace(/\.$/, '') + ' 🙂';
  return summary;
}

const providers = {
  mock: {
    async summarize(text, options) {
      // Small artificial delay so latencyMs isn't always ~0ms, and so the
      // timeout path is actually exercisable in tests.
      await new Promise((r) => setTimeout(r, 50));
      return mockSummarize(text, options);
    },
  },
  // A real provider would live here, same summarize(text, options) shape,
  // selected via AI_PROVIDER in .env.
};

function withTimeout(promise, ms) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(Object.assign(new Error('AI provider timed out'), { code: 'TIMEOUT' })), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export async function runSummarize(text, options) {
  const provider = providers[config.ai.provider] || providers.mock;
  const start = Date.now();
  try {
    const output = await withTimeout(provider.summarize(text, options), config.ai.timeoutMs);
    return { status: 'SUCCESS', output, fallbackUsed: false, latencyMs: Date.now() - start, promptVersion: PROMPT_VERSION };
  } catch (err) {
    const timedOut = err.code === 'TIMEOUT';
    // Fallback: a trivial truncation, so the caller always gets *something* back.
    const fallback = text.slice(0, 140).trim() + (text.length > 140 ? '…' : '');
    return {
      status: timedOut ? 'TIMEOUT' : 'FAILED',
      output: fallback,
      fallbackUsed: true,
      error: err.message,
      latencyMs: Date.now() - start,
      promptVersion: PROMPT_VERSION,
    };
  }
}
