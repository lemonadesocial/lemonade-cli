import { describe, it, expect } from 'vitest';
import { classifyError, scrubSensitive } from '../../../../src/chat/ui/hooks/useChatEngine';

describe('scrubSensitive', () => {
  it('redacts sk-ant- API key patterns', () => {
    const msg = 'Error with key sk-ant-api03-abcdefghijklmnop';
    const result = scrubSensitive(msg);
    expect(result).not.toContain('sk-ant-api03');
    expect(result).toContain('sk-...redacted');
  });

  it('redacts sk- API key patterns (20+ chars)', () => {
    const msg = 'Auth failed for sk-abcdefghijklmnopqrstuvwxyz';
    const result = scrubSensitive(msg);
    expect(result).not.toContain('sk-abcdefghijklmnop');
    expect(result).toContain('sk-...redacted');
  });

  it('leaves messages without keys unchanged', () => {
    const msg = 'Connection refused';
    expect(scrubSensitive(msg)).toBe(msg);
  });

  it('redacts multiple keys in one message', () => {
    const msg = 'keys: sk-ant-abc123def456 and sk-xxxxxxxxxxxxxxxxxxxx';
    const result = scrubSensitive(msg);
    expect(result.match(/sk-\.\.\.redacted/g)?.length).toBe(2);
  });
});

describe('classifyError', () => {
  it('classifies rate limit errors', () => {
    const result = classifyError('Rate limit exceeded, retry after 30s');
    expect(result.type).toBe('rate_limit');
    expect(result.retryAfter).toBe(30);
  });

  it('classifies 429 as rate limit', () => {
    const result = classifyError('HTTP 429 too many requests');
    expect(result.type).toBe('rate_limit');
  });

  it('classifies auth errors', () => {
    expect(classifyError('Unauthorized').type).toBe('auth');
    expect(classifyError('401 auth failed').type).toBe('auth');
    expect(classifyError('Token expired').type).toBe('auth');
  });

  it('classifies context length errors', () => {
    expect(classifyError('context_length_exceeded').type).toBe('context_length');
    expect(classifyError('Token limit reached').type).toBe('context_length');
  });

  it('classifies network errors', () => {
    expect(classifyError('ECONNREFUSED').type).toBe('network');
    expect(classifyError('Network timeout').type).toBe('network');
    expect(classifyError('fetch failed').type).toBe('network');
  });

  it('defaults to generic for unknown errors', () => {
    expect(classifyError('Something unexpected').type).toBe('generic');
  });

  it('scrubs API keys from classified error messages', () => {
    const result = classifyError('Auth failed for sk-ant-api03-abcdefghijklmnop');
    expect(result.type).toBe('auth');
    expect(result.message).toContain('sk-...redacted');
    expect(result.message).not.toContain('sk-ant-api03');
  });
});
