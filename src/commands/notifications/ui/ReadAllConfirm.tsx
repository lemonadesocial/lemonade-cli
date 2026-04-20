import React, { useCallback, useEffect, useRef } from 'react';
import { Box, Text, useApp, useInput } from 'ink';

export interface ReadAllConfirmProps {
  /** Pre-fetched unread count to show in the prompt line. */
  count: number;
  /**
   * Invoked exactly once with `true` on y/Y, `false` otherwise (n/N/q/Esc/any
   * other key). Never resolves more than once, even under rapid keystrokes.
   */
  onDecision: (confirmed: boolean) => void;
}

/**
 * Pure keystroke-to-decision function. Extracted so it can be unit-tested
 * without mounting the Ink component (per IMPL § O-5: no `ink-testing-library`
 * dependency; tests must use extracted pure logic or Ink's built-in helpers).
 *
 * Returns:
 *   - `true` when the keystroke confirms (y or Y)
 *   - `false` for ALL other keys (n, N, q, Escape, Ctrl+C, any other input)
 */
export function keystrokeToDecision(input: string): boolean {
  return input === 'y' || input === 'Y';
}

/**
 * Ink (y/N) confirmation for `lemonade notifications read --all`.
 *
 * Unlike `filters/ui/DeleteConfirm.tsx`, this component owns its own
 * `useInput` handler and calls `useApp().exit()` on decision — the
 * `read --all` parent is a one-shot command (not a persistent TUI), so
 * the component is authoritative over both the decision and the exit.
 *
 * Anti-patterns honoured:
 * - NEVER call process.exit() inside the component — use useApp().exit().
 * - The decision callback is fired AT MOST ONCE (guarded via `decidedRef`).
 * - The callback also fires on unmount with `false` if the user killed the
 *   process before any keystroke — so the action handler's `finally` block
 *   still runs (Ctrl+C-during-prompt edge case).
 */
export function ReadAllConfirm({ count, onDecision }: ReadAllConfirmProps): React.JSX.Element {
  const { exit } = useApp();
  const decidedRef = useRef<boolean>(false);

  const decide = useCallback(
    (confirmed: boolean) => {
      if (decidedRef.current) return;
      decidedRef.current = true;
      onDecision(confirmed);
      exit();
    },
    [onDecision, exit],
  );

  useInput((input) => {
    if (decidedRef.current) return;
    decide(keystrokeToDecision(input));
  });

  // Unmount-before-keystroke edge case: user Ctrl+C's out of the whole
  // process. Ink tears down the component; our cleanup resolves the decision
  // with `false` so the action handler's `finally` block runs.
  useEffect(() => {
    return () => {
      if (!decidedRef.current) {
        decidedRef.current = true;
        onDecision(false);
      }
    };
  }, [onDecision]);

  return (
    <Box flexDirection="column">
      <Text bold>Mark all as read</Text>
      <Box marginTop={1}>
        <Text>
          Mark all {count} notifications as read? (y/N)
        </Text>
      </Box>
    </Box>
  );
}
