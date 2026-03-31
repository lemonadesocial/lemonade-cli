import { describe, it, expect } from 'vitest';
import { classifyError } from '../../../../src/chat/ui/hooks/useChatEngine';

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
});
