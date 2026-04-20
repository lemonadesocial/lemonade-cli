import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createNdjsonUnreadRefetcher,
  NDJSON_UNREAD_DEBOUNCE_MS,
} from '../../../../src/commands/notifications/watch.js';

/**
 * NDJSON unread-refetch coverage (A-004).
 *
 * The `scheduleUnreadRefetch` logic is extracted into
 * `createNdjsonUnreadRefetcher` so this test file does not need to mount the
 * full `runNdjsonWatch` — which would require stubbing process signal
 * handlers, WebSocket subscriptions, and stdin. Instead we unit-test the
 * helper directly with fake timers and an injected `stderrWrite` spy.
 *
 * Contract under test:
 *   - On schedule() → after `debounceMs`, fetchUnread is called and the
 *     returned N is written as `[unread] <N>\n` to stderr.
 *   - stdout is NEVER touched (negative assertion) — the caller owns
 *     per-notification stdout writes; this helper is stderr-only.
 *   - On fetch failure → silent (US-1.4 NDJSON deviation). No stderr write,
 *     no throw.
 */

describe('createNdjsonUnreadRefetcher — NDJSON unread-refetch breadcrumb (A-004)', () => {
  let stdoutWriteSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers();
    // Spy on real stdout — the helper MUST NOT write to stdout.
    stdoutWriteSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    vi.useRealTimers();
    stdoutWriteSpy.mockRestore();
  });

  it('one notification → stderrWrite receives `[unread] <N>\\n` after debounceMs; stdout is untouched', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(42);
    const stderrWrite = vi.fn();
    const refetcher = createNdjsonUnreadRefetcher({ fetchUnread, stderrWrite });

    // Fire one notification.
    refetcher.schedule();
    // Still inside the debounce window.
    vi.advanceTimersByTime(NDJSON_UNREAD_DEBOUNCE_MS - 1);
    expect(fetchUnread).not.toHaveBeenCalled();

    // Cross the deadline → fetchUnread fires, stderr receives the breadcrumb.
    vi.advanceTimersByTime(1);
    await vi.runAllTimersAsync();

    expect(fetchUnread).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledWith('[unread] 42\n');

    // NEGATIVE ASSERTION — stdout was NOT written. (US-1.5: stdout stays
    // strictly one-JSON-line-per-notification; the refetcher is stderr-only.)
    const stdoutText = stdoutWriteSpy.mock.calls
      .map((c) => (typeof c[0] === 'string' ? c[0] : (c[0] as Buffer).toString()))
      .join('');
    expect(stdoutText).not.toContain('[unread]');
  });

  it('three notifications within 100 ms → single fetchUnread + single stderr breadcrumb (debounce)', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(5);
    const stderrWrite = vi.fn();
    const refetcher = createNdjsonUnreadRefetcher({ fetchUnread, stderrWrite });

    refetcher.schedule();
    vi.advanceTimersByTime(30);
    refetcher.schedule();
    vi.advanceTimersByTime(30);
    refetcher.schedule();
    vi.advanceTimersByTime(30);

    expect(fetchUnread).not.toHaveBeenCalled();

    vi.advanceTimersByTime(NDJSON_UNREAD_DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(fetchUnread).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledTimes(1);
    expect(stderrWrite).toHaveBeenCalledWith('[unread] 5\n');
  });

  it('US-1.4 — fetchUnread rejection is SWALLOWED silently (no stderr write, no throw)', async () => {
    const fetchUnread = vi.fn().mockRejectedValue(new Error('boom'));
    const stderrWrite = vi.fn();
    const refetcher = createNdjsonUnreadRefetcher({ fetchUnread, stderrWrite });

    refetcher.schedule();
    vi.advanceTimersByTime(NDJSON_UNREAD_DEBOUNCE_MS);
    // runAllTimersAsync must not reject — the catch handler swallows.
    await vi.runAllTimersAsync();

    expect(fetchUnread).toHaveBeenCalledTimes(1);
    // NEGATIVE ASSERTION — no breadcrumb emitted on failure.
    expect(stderrWrite).not.toHaveBeenCalled();
  });

  it('cancel() before the timer fires → no fetchUnread, no stderr write', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(1);
    const stderrWrite = vi.fn();
    const refetcher = createNdjsonUnreadRefetcher({ fetchUnread, stderrWrite });

    refetcher.schedule();
    vi.advanceTimersByTime(100);
    refetcher.cancel();

    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    expect(fetchUnread).not.toHaveBeenCalled();
    expect(stderrWrite).not.toHaveBeenCalled();
  });
});
