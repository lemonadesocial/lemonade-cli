import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { validateMode, VALID_MODES } from '../../../src/chat/index.js';

describe('--mode flag validation', () => {
  const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

  beforeEach(() => {
    mockExit.mockClear();
    mockError.mockClear();
  });

  afterEach(() => {
    mockExit.mockClear();
    mockError.mockClear();
  });

  it('accepts "credits" without error', () => {
    validateMode('credits');
    expect(mockError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('accepts "own_key" without error', () => {
    validateMode('own_key');
    expect(mockError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('returns error for invalid mode', () => {
    validateMode('turbo');
    expect(mockError).toHaveBeenCalledOnce();
    const msg = mockError.mock.calls[0][0] as string;
    expect(msg).toContain('turbo');
    expect(msg).toContain('credits');
    expect(msg).toContain('own_key');
    expect(mockExit).toHaveBeenCalledWith(2);
  });

  it('does not trigger error when no mode is provided', () => {
    validateMode(undefined);
    expect(mockError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('treats empty string as not provided', () => {
    validateMode('');
    expect(mockError).not.toHaveBeenCalled();
    expect(mockExit).not.toHaveBeenCalled();
  });

  for (const valid of VALID_MODES) {
    it(`does not reject valid mode "${valid}"`, () => {
      validateMode(valid);
      expect(mockError).not.toHaveBeenCalled();
      expect(mockExit).not.toHaveBeenCalled();
    });
  }

  it('VALID_MODES contains exactly credits and own_key', () => {
    expect([...VALID_MODES]).toEqual(['credits', 'own_key']);
  });
});
