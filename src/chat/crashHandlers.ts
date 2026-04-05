/**
 * Crash handlers for unhandled rejections and uncaught exceptions.
 *
 * These use process.stderr.write() with plain strings instead of chalk/console
 * to avoid depending on library code that could itself throw during a crash.
 */

export function formatCrashMessage(err: unknown): string {
  if (err instanceof Error) return err.stack || err.message;
  return String(err);
}

export function handleUnhandledRejection(reason: unknown): void {
  process.stderr.write(`\nFatal (unhandled rejection): ${formatCrashMessage(reason)}\n`);
  process.exit(1);
}

export function handleUncaughtException(err: unknown): void {
  process.stderr.write(`\nFatal (uncaught exception): ${formatCrashMessage(err)}\n`);
  process.exit(1);
}

/**
 * Register global crash handlers on the process object.
 *
 * main().catch() handles rejections originating from the main() promise chain.
 * These handlers catch:
 * - Rejections from fire-and-forget promises that are not awaited by main()
 * - Synchronous throws that occur outside the main() call stack
 */
export function registerCrashHandlers(): void {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
}
