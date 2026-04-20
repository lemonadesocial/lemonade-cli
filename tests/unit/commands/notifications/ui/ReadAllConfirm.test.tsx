import { describe, it, expect } from 'vitest';
import {
  keystrokeToDecision,
} from '../../../../../src/commands/notifications/ui/ReadAllConfirm.js';

/**
 * ReadAllConfirm keystroke coverage.
 *
 * The keystroke-to-decision logic is extracted into a pure function so it can
 * be unit-tested without mounting Ink (per IMPL § O-5: no `ink-testing-library`
 * dependency; tests must use extracted pure logic OR Ink's built-in helpers).
 *
 * Single-fire, unmount-resolve-false, and exit() wiring are covered
 * indirectly by the read-all integration test which exercises the full
 * Ink render path via the command action.
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
