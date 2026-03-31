import { describe, it, expect } from 'vitest';
import { buildSystemMessages } from '../../../src/chat/session/cache.js';
import { createSessionState } from '../../../src/chat/session/state.js';

describe('buildSystemMessages with skills', () => {
  const session = createSessionState({ _id: '1', name: 'Test', email: 'test@test.com' });

  it('includes agent name in system prompt', () => {
    const messages = buildSystemMessages(session, 'anthropic');
    // Default agent name is Zesty
    expect(messages[0].text).toContain('You are Zesty');
  });

  it('includes skill content in system prompt', () => {
    const messages = buildSystemMessages(session, 'anthropic');
    // Should contain content from personality.md
    expect(messages[0].text).toContain('Concierge');
  });

  it('sets cache_control for anthropic provider', () => {
    const messages = buildSystemMessages(session, 'anthropic');
    expect(messages[0].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('does not set cache_control for openai provider', () => {
    const messages = buildSystemMessages(session, 'openai');
    expect(messages[0].cache_control).toBeUndefined();
  });
});
