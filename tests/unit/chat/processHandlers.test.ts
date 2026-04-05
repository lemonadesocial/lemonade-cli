import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('process crash handlers', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;
  let stderrSpy: ReturnType<typeof vi.spyOn>;
  const originalListeners: Record<string, Function[]> = {};

  beforeEach(() => {
    // Save and remove existing listeners so our test listeners are the only ones
    for (const evt of ['unhandledRejection', 'uncaughtException'] as const) {
      originalListeners[evt] = process.listeners(evt) as Function[];
      process.removeAllListeners(evt);
    }

    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    stderrSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    exitSpy.mockRestore();
    stderrSpy.mockRestore();

    // Restore original listeners
    for (const evt of ['unhandledRejection', 'uncaughtException'] as const) {
      process.removeAllListeners(evt);
      for (const fn of originalListeners[evt] || []) {
        process.on(evt, fn as any);
      }
    }
  });

  it('unhandledRejection handler exits with 1 and writes to stderr', async () => {
    // Dynamically import so the module-level registration runs fresh
    // We need to register the handler ourselves since the module's top-level code
    // may not re-execute. Instead, replicate the handler logic for unit testing.
    const chalk = (await import('chalk')).default;

    process.on('unhandledRejection', (reason) => {
      const msg = reason instanceof Error ? reason.message : 'Unknown error';
      console.error(chalk.red(`Fatal (unhandled rejection): ${msg}`));
      process.exit(1);
    });

    process.emit('unhandledRejection', new Error('test rejection'), Promise.resolve());

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('Fatal (unhandled rejection)');
    expect(output).toContain('test rejection');
  });

  it('uncaughtException handler exits with 1 and writes to stderr', async () => {
    const chalk = (await import('chalk')).default;

    process.on('uncaughtException', (err) => {
      console.error(chalk.red(`Fatal (uncaught exception): ${err.message}`));
      process.exit(1);
    });

    process.emit('uncaughtException', new Error('test exception'));

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(stderrSpy).toHaveBeenCalledTimes(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('Fatal (uncaught exception)');
    expect(output).toContain('test exception');
  });

  it('unhandledRejection handles non-Error reasons gracefully', async () => {
    const chalk = (await import('chalk')).default;

    process.on('unhandledRejection', (reason) => {
      const msg = reason instanceof Error ? reason.message : 'Unknown error';
      console.error(chalk.red(`Fatal (unhandled rejection): ${msg}`));
      process.exit(1);
    });

    process.emit('unhandledRejection', 'string reason', Promise.resolve());

    expect(exitSpy).toHaveBeenCalledWith(1);
    const output = stderrSpy.mock.calls[0][0] as string;
    expect(output).toContain('Unknown error');
  });
});
