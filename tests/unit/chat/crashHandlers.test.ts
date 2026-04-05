import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatCrashMessage,
  handleUnhandledRejection,
  handleUncaughtException,
  registerCrashHandlers,
} from '../../../src/chat/crashHandlers.js';

describe('crashHandlers', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation((() => true) as any);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();
  });

  describe('formatCrashMessage', () => {
    it('returns stack trace for Error objects when available', () => {
      const err = new Error('something broke');
      const result = formatCrashMessage(err);
      expect(result).toContain('something broke');
      // Stack traces include the error message plus file references
      expect(result).toContain('Error: something broke');
    });

    it('returns message when Error has no stack', () => {
      const err = new Error('no stack');
      err.stack = undefined;
      expect(formatCrashMessage(err)).toBe('no stack');
    });

    it('returns string representation for non-Error values', () => {
      expect(formatCrashMessage('string reason')).toBe('string reason');
      expect(formatCrashMessage(42)).toBe('42');
      expect(formatCrashMessage({ key: 'val' })).toBe('[object Object]');
    });

    it('handles null and undefined', () => {
      expect(formatCrashMessage(null)).toBe('null');
      expect(formatCrashMessage(undefined)).toBe('undefined');
    });
  });

  describe('handleUnhandledRejection', () => {
    it('writes to stderr and exits with 1 for Error reasons', () => {
      handleUnhandledRejection(new Error('test rejection'));

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('Fatal (unhandled rejection)');
      expect(output).toContain('test rejection');
    });

    it('handles non-Error reasons', () => {
      handleUnhandledRejection('string reason');

      expect(exitSpy).toHaveBeenCalledWith(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('Fatal (unhandled rejection)');
      expect(output).toContain('string reason');
    });

    it('handles null reason', () => {
      handleUnhandledRejection(null);

      expect(exitSpy).toHaveBeenCalledWith(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('null');
    });

    it('handles undefined reason', () => {
      handleUnhandledRejection(undefined);

      expect(exitSpy).toHaveBeenCalledWith(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('undefined');
    });

    it('includes stack trace in output for Error reasons', () => {
      const err = new Error('with stack');
      handleUnhandledRejection(err);

      const output = stderrSpy.mock.calls[0][0] as string;
      // Stack traces include file path references
      expect(output).toContain('crashHandlers.test');
    });
  });

  describe('handleUncaughtException', () => {
    it('writes to stderr and exits with 1 for Error', () => {
      handleUncaughtException(new Error('test exception'));

      expect(exitSpy).toHaveBeenCalledWith(1);
      expect(stderrSpy).toHaveBeenCalledTimes(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('Fatal (uncaught exception)');
      expect(output).toContain('test exception');
    });

    it('handles non-Error values safely', () => {
      handleUncaughtException('raw string throw');

      expect(exitSpy).toHaveBeenCalledWith(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('raw string throw');
    });
  });

  describe('registerCrashHandlers', () => {
    const savedRejectionListeners: Function[] = [];
    const savedExceptionListeners: Function[] = [];

    beforeEach(() => {
      savedRejectionListeners.push(...(process.listeners('unhandledRejection') as Function[]));
      savedExceptionListeners.push(...(process.listeners('uncaughtException') as Function[]));
      process.removeAllListeners('unhandledRejection');
      process.removeAllListeners('uncaughtException');
    });

    afterEach(() => {
      process.removeAllListeners('unhandledRejection');
      process.removeAllListeners('uncaughtException');
      for (const fn of savedRejectionListeners) process.on('unhandledRejection', fn as any);
      for (const fn of savedExceptionListeners) process.on('uncaughtException', fn as any);
      savedRejectionListeners.length = 0;
      savedExceptionListeners.length = 0;
    });

    it('registers handlers on process', () => {
      registerCrashHandlers();

      const rejectionListeners = process.listeners('unhandledRejection');
      const exceptionListeners = process.listeners('uncaughtException');

      expect(rejectionListeners).toContain(handleUnhandledRejection);
      expect(exceptionListeners).toContain(handleUncaughtException);
    });

    it('registered handlers work when triggered via process.emit', () => {
      registerCrashHandlers();

      process.emit('unhandledRejection', new Error('emit test'), Promise.resolve());

      expect(exitSpy).toHaveBeenCalledWith(1);
      const output = stderrSpy.mock.calls[0][0] as string;
      expect(output).toContain('emit test');
    });
  });
});
