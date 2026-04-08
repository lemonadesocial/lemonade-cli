import { describe, it, expect, vi } from 'vitest';
import { AIProvider, ProviderCapabilities } from '../../../src/chat/providers/interface';
import { AnthropicProvider } from '../../../src/chat/providers/anthropic';
import { OpenAIProvider } from '../../../src/chat/providers/openai';
import { LemonadeAIProvider } from '../../../src/chat/providers/lemonade-ai';

// Mock SDKs so constructors don't fail
vi.mock('@anthropic-ai/sdk', () => {
  class MockAnthropic {
    messages = { stream: vi.fn() };
  }
  return { default: MockAnthropic };
});

vi.mock('openai', () => {
  class MockOpenAI {
    chat = { completions: { create: vi.fn() } };
  }
  return { default: MockOpenAI };
});

vi.mock('../../../src/auth/store', () => ({
  ensureAuthHeader: async () => 'Bearer test',
  getConfig: () => ({}),
}));

function assertCapabilities(provider: AIProvider, expected: ProviderCapabilities) {
  expect(provider.capabilities).toBeDefined();
  expect(typeof provider.capabilities.supportsToolCalling).toBe('boolean');
  expect(provider.capabilities.supportsToolCalling).toBe(expected.supportsToolCalling);
}

describe('Provider contract: capabilities', () => {
  it('AnthropicProvider declares tool-calling support', () => {
    const p = new AnthropicProvider('key');
    assertCapabilities(p, { supportsToolCalling: true });
    expect(p.name).toBe('anthropic');
    expect(typeof p.model).toBe('string');
  });

  it('OpenAIProvider declares tool-calling support', () => {
    const p = new OpenAIProvider('key');
    assertCapabilities(p, { supportsToolCalling: true });
    expect(p.name).toBe('openai');
    expect(typeof p.model).toBe('string');
  });

  it('LemonadeAIProvider declares no tool-calling support', () => {
    const p = new LemonadeAIProvider('model', 'stand-id');
    assertCapabilities(p, { supportsToolCalling: false });
    expect(p.name).toBe('lemonade-ai');
    expect(typeof p.model).toBe('string');
  });
});

describe('LemonadeAI abort signal forwarding', () => {
  it('forwards caller abort to fetch even without AbortSignal.any', async () => {
    const originalAny = AbortSignal.any;
    // Simulate older Node runtime
    // @ts-expect-error -- intentionally removing for test
    AbortSignal.any = undefined;

    let capturedSignal: AbortSignal | undefined;
    const mockFetch = vi.fn().mockImplementation((_url: string, opts: RequestInit) => {
      capturedSignal = opts.signal ?? undefined;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: { run: { message: 'ok' } } }),
      });
    });
    vi.stubGlobal('fetch', mockFetch);

    try {
      const ac = new AbortController();
      ac.abort('test-abort');

      const p = new LemonadeAIProvider('model', 'stand');
      const events: unknown[] = [];
      for await (const ev of p.stream({
        systemPrompt: [{ type: 'text', text: 'sys' }],
        messages: [{ role: 'user', content: 'hi' }],
        tools: [],
        maxTokens: 100,
        signal: ac.signal,
      })) {
        events.push(ev);
      }

      expect(capturedSignal).toBeDefined();
      expect(capturedSignal!.aborted).toBe(true);
    } finally {
      AbortSignal.any = originalAny;
      vi.unstubAllGlobals();
    }
  });
});

describe('Provider contract: stream() signature', () => {
  it('all providers accept signal in stream params', () => {
    // Type-level check — if these compile, stream() accepts StreamParams with signal
    const providers: AIProvider[] = [
      new AnthropicProvider('key'),
      new OpenAIProvider('key'),
      new LemonadeAIProvider('model', 'stand'),
    ];

    for (const p of providers) {
      expect(typeof p.stream).toBe('function');
      expect(typeof p.formatTools).toBe('function');
    }
  });
});
