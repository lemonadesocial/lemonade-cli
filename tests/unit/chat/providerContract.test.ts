import { describe, it, expect } from 'vitest';
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
  getAuthHeader: () => 'Bearer test',
}));

function assertCapabilities(provider: AIProvider, expected: ProviderCapabilities) {
  expect(provider.capabilities).toBeDefined();
  expect(typeof provider.capabilities.supportsToolCalling).toBe('boolean');
  expect(typeof provider.capabilities.supportsAbortSignal).toBe('boolean');
  expect(provider.capabilities.supportsToolCalling).toBe(expected.supportsToolCalling);
  expect(provider.capabilities.supportsAbortSignal).toBe(expected.supportsAbortSignal);
}

describe('Provider contract: capabilities', () => {
  it('AnthropicProvider declares tool-calling and abort-signal support', () => {
    const p = new AnthropicProvider('key');
    assertCapabilities(p, { supportsToolCalling: true, supportsAbortSignal: true });
    expect(p.name).toBe('anthropic');
    expect(typeof p.model).toBe('string');
  });

  it('OpenAIProvider declares tool-calling and abort-signal support', () => {
    const p = new OpenAIProvider('key');
    assertCapabilities(p, { supportsToolCalling: true, supportsAbortSignal: true });
    expect(p.name).toBe('openai');
    expect(typeof p.model).toBe('string');
  });

  it('LemonadeAIProvider declares no tool-calling but abort-signal support', () => {
    const p = new LemonadeAIProvider('model', 'stand-id');
    assertCapabilities(p, { supportsToolCalling: false, supportsAbortSignal: true });
    expect(p.name).toBe('lemonade-ai');
    expect(typeof p.model).toBe('string');
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
