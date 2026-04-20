import { describe, it, expect, vi } from 'vitest';
import {
  keystrokeToDecision,
  handleUnmountCleanup,
} from '../../../../../src/commands/notifications/ui/ReadAllConfirm.js';

/**
 * ReadAllConfirm keystroke + unmount-cleanup coverage.
 *
 * Per IMPL § O-5: the `ink-testing-library` dependency is off-limits, so the
 * component's two decision paths are covered via extracted pure helpers:
 *
 *   1. `keystrokeToDecision(input)` — covers every keystroke branch
 *      (y/Y → true, everything else including Escape → false).
 *   2. `handleUnmountCleanup(decidedRef, onDecision)` — covers the
 *      Ctrl+C-during-prompt safety rail (ReadAllConfirm.tsx useEffect
 *      cleanup): if the prompt has not yet resolved, resolve `false`.
 *
 * Single-fire (decidedRef) + Ink wiring (render + exit) is covered by the
 * read-all integration test which exercises the full Ink render path.
 */

describe('keystrokeToDecision — y/Y confirms, everything else cancels', () => {
  it("'y' → true", () => {
    expect(keystrokeToDecision('y')).toBe(true);
  });

  it("'Y' (uppercase) → true", () => {
    expect(keystrokeToDecision('Y')).toBe(true);
  });

  it("'n' → false", () => {
    expect(keystrokeToDecision('n')).toBe(false);
  });

  it("'N' (uppercase) → false", () => {
    expect(keystrokeToDecision('N')).toBe(false);
  });

  it("'q' → false", () => {
    expect(keystrokeToDecision('q')).toBe(false);
  });

  it('empty string (Escape / Ctrl+C passthrough) → false', () => {
    // Ink's useInput surfaces bare Escape as input === '' (key.escape=true).
    // Our keystroke handler takes the pure `input` string only, which maps
    // empty → false. This is the escape-key coverage for A-006.
    expect(keystrokeToDecision('')).toBe(false);
  });

  it('arbitrary character (e.g. "x") → false', () => {
    expect(keystrokeToDecision('x')).toBe(false);
  });

  it('digit → false', () => {
    expect(keystrokeToDecision('1')).toBe(false);
  });

  it('space → false', () => {
    expect(keystrokeToDecision(' ')).toBe(false);
  });

  it('multi-char sequence "yy" → false (only exact "y" confirms)', () => {
    expect(keystrokeToDecision('yy')).toBe(false);
  });

  it('multi-char sequence "yes" → false', () => {
    expect(keystrokeToDecision('yes')).toBe(false);
  });

  it('lowercase only: "Y " → false (space suffix breaks the match)', () => {
    expect(keystrokeToDecision('Y ')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────
// A-006 — unmount-cleanup pure-helper coverage
// ─────────────────────────────────────────────────────────────────────────

describe('handleUnmountCleanup — Ctrl+C-during-prompt safety rail', () => {
  it('unresolved ref (decidedRef=false) → onDecision(false) fires exactly once', () => {
    const onDecision = vi.fn();
    const decidedRef = { current: false };

    handleUnmountCleanup(decidedRef, onDecision);

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith(false);
    // Ref flipped — a second cleanup call (e.g. StrictMode re-run) is a no-op.
    expect(decidedRef.current).toBe(true);
  });

  it('already-resolved ref (decidedRef=true) → onDecision is NOT called', () => {
    const onDecision = vi.fn();
    // Keystroke path already fired → ref is `true` when cleanup runs.
    const decidedRef = { current: true };

    handleUnmountCleanup(decidedRef, onDecision);

    expect(onDecision).not.toHaveBeenCalled();
    expect(decidedRef.current).toBe(true);
  });

  it('called twice in a row → onDecision still fires exactly once (single-fire guarantee)', () => {
    const onDecision = vi.fn();
    const decidedRef = { current: false };

    handleUnmountCleanup(decidedRef, onDecision);
    handleUnmountCleanup(decidedRef, onDecision);

    expect(onDecision).toHaveBeenCalledTimes(1);
    expect(onDecision).toHaveBeenCalledWith(false);
  });
});
