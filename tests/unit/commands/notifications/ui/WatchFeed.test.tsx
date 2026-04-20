import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createRefetchScheduler,
  UNREAD_REFETCH_DEBOUNCE_MS,
} from '../../../../../src/commands/notifications/ui/WatchFeed.js';

/**
 * WatchFeed debounce coverage (A-001).
 *
 * Per IMPL § O-5 and the audit remediation note, the debounce scheduler is
 * extracted from the Ink component into a pure factory so this test file
 * does not need to mount Ink (which is flaky under vitest's PassThrough
 * stdin/stdout setup, per the A-006 investigation).
 *
 * Contract under test:
 *   - 3 notifications within 100 ms → the scheduler calls `fetchUnread`
 *     exactly ONCE after the total 250 ms debounce window elapses.
 *   - `cancel()` (the unmount path) before the timer fires prevents any
 *     `fetchUnread()` / `onResult` / `onError` from being invoked.
 *   - Late fetch resolution after `isMounted` flips to false does not call
 *     `onResult` (mirrors the `mountedRef.current` guard in the component).
 */

describe('createRefetchScheduler — A-001 debounce + unmount semantics', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('IMPL requirement — 3 schedule() calls within 100 ms → 1 fetchUnread call after 250 ms', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(7);
    const onResult = vi.fn();
    const onError = vi.fn();
    const scheduler = createRefetchScheduler({
      fetchUnread,
      onResult,
      onError,
      isMounted: () => true,
    });

    // 3 notifications within 100 ms — all before the debounce window elapses.
    scheduler.schedule();
    vi.advanceTimersByTime(30);
    scheduler.schedule();
    vi.advanceTimersByTime(30);
    scheduler.schedule();
    vi.advanceTimersByTime(30);

    // Still inside the 250 ms window → fetchUnread NOT yet called.
    expect(fetchUnread).not.toHaveBeenCalled();

    // Advance past the trailing-edge deadline (90 ms already elapsed; the
    // final schedule() reset the timer, so we need 250 ms more from that
    // reset — total 90 + 250 = 340 ms from the first schedule() call).
    vi.advanceTimersByTime(UNREAD_REFETCH_DEBOUNCE_MS);

    expect(fetchUnread).toHaveBeenCalledTimes(1);

    // Flush the promise microtask so onResult fires.
    await vi.runAllTimersAsync();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(7);
    expect(onError).not.toHaveBeenCalled();
  });

  it('cancel() before the timer fires → NO fetchUnread, NO onResult, NO onError', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(1);
    const onResult = vi.fn();
    const onError = vi.fn();
    const scheduler = createRefetchScheduler({
      fetchUnread,
      onResult,
      onError,
      isMounted: () => true,
    });

    scheduler.schedule();
    // Unmount before the 250 ms window elapses.
    vi.advanceTimersByTime(100);
    scheduler.cancel();

    // Advance well past the deadline — nothing should fire.
    vi.advanceTimersByTime(500);
    await vi.runAllTimersAsync();

    expect(fetchUnread).not.toHaveBeenCalled();
    expect(onResult).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('isMounted() returning false at fetch-resolution time → onResult is NOT dispatched (unmount safety rail)', async () => {
    // Simulate the race where the timer fires and fetchUnread resolves, but
    // the component unmounts between the timer callback and the then-handler.
    let mounted = true;
    const fetchUnread = vi.fn().mockResolvedValue(9);
    const onResult = vi.fn();
    const onError = vi.fn();
    const scheduler = createRefetchScheduler({
      fetchUnread,
      onResult,
      onError,
      isMounted: () => mounted,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(UNREAD_REFETCH_DEBOUNCE_MS);

    // Timer fired → fetchUnread was called. Now flip mounted to false
    // BEFORE the promise microtask drains.
    expect(fetchUnread).toHaveBeenCalledTimes(1);
    mounted = false;

    await vi.runAllTimersAsync();

    expect(onResult).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('fetchUnread() rejection → onError fires (gated by isMounted), onResult does NOT', async () => {
    const fetchUnread = vi.fn().mockRejectedValue(new Error('boom'));
    const onResult = vi.fn();
    const onError = vi.fn();
    const scheduler = createRefetchScheduler({
      fetchUnread,
      onResult,
      onError,
      isMounted: () => true,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(UNREAD_REFETCH_DEBOUNCE_MS);
    await vi.runAllTimersAsync();

    expect(fetchUnread).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onResult).not.toHaveBeenCalled();
  });

  it('single schedule() at mount → exactly one fetchUnread after debounceMs', async () => {
    const fetchUnread = vi.fn().mockResolvedValue(3);
    const onResult = vi.fn();
    const onError = vi.fn();
    const scheduler = createRefetchScheduler({
      fetchUnread,
      onResult,
      onError,
      isMounted: () => true,
    });

    scheduler.schedule();
    vi.advanceTimersByTime(UNREAD_REFETCH_DEBOUNCE_MS - 1);
    expect(fetchUnread).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(fetchUnread).toHaveBeenCalledTimes(1);
    await vi.runAllTimersAsync();
    expect(onResult).toHaveBeenCalledWith(3);
  });
});
