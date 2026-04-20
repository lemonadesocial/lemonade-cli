import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { setFlagApiKey } from '../../../auth/store.js';
import { handleError } from '../../../output/error.js';
import { jsonSuccess } from '../../../output/json.js';
import { fetchFilters } from './graphql.js';
import { FilterTui } from './ui/FilterTui.js';

/**
 * Exact PRD wording for the non-TTY mutation-attempt error (US-4e.2).
 * Kept in one place so tests can assert the literal string.
 */
export const NON_TTY_MUTATION_MESSAGE =
  'Interactive TUI requires a TTY. Use an AI chat or web client for non-interactive filter mutations.';

const MUTATION_SUBCOMMANDS = new Set(['add', 'edit', 'delete', 'rm', 'new', 'create', 'update']);

/**
 * Register `lemonade notifications filters` and its non-interactive
 * short-circuit:
 *
 *   - TTY + no `--json` → mount Ink `<FilterTui />`.
 *   - Non-TTY (piped / CI) OR `--json` → fetch filters, print
 *     `jsonSuccess(items)` envelope, exit 0 (US-4e.1).
 *   - Non-TTY + a mutation subcommand (e.g. `add`/`delete` passed as a
 *     positional) → emit the PRD-mandated error with exit 1 (US-4e.2).
 *
 * Anti-patterns honoured (IMPL Phase 3 §):
 *   - No `process.exit` inside the Ink component — we `await` the
 *     render instance and exit from this wrapper with the resolved code.
 *   - `setFlagApiKey` is mirrored in a `finally` per the Phase 2
 *     pattern (`watch.ts:23-33`, `list.ts:53-98`).
 */
export function registerNotificationsFilters(notifications: Command): void {
  notifications
    .command('filters [action]')
    .description('Interactive TUI to list, add, edit, and delete notification filters (mute/hide/only rules)')
    .option('--json', 'Non-interactive JSON list output (also implied when stdout is not a TTY)')
    .option('--api-key <key>', 'API key override')
    .action(async (action: string | undefined, opts: { json?: boolean; apiKey?: string }) => {
      const wantsJson = !!opts.json;
      const isTty = !!process.stdout.isTTY;

      // Non-TTY mutation attempts are hard-refused per US-4e.2. A
      // positional like `lemonade notifications filters add` when piped
      // triggers this — the user has opted out of the interactive flow
      // but explicitly asked for a mutation. Exit 1 with the exact
      // PRD wording.
      if (action && MUTATION_SUBCOMMANDS.has(action.toLowerCase()) && (!isTty || wantsJson)) {
        process.stderr.write(`${NON_TTY_MUTATION_MESSAGE}\n`);
        process.exit(1);
      }

      // Non-interactive list path (US-4e.1). Fetches filters and emits
      // `jsonSuccess(items)` — no Ink, no mutation prompts.
      if (!isTty || wantsJson) {
        try {
          setFlagApiKey(opts.apiKey);
          const filters = await fetchFilters();
          console.log(jsonSuccess(filters));
        } catch (error) {
          handleError(error, true);
        } finally {
          setFlagApiKey(undefined);
        }
        return;
      }

      // Interactive path. `setFlagApiKey` is restored in `finally` so
      // an unexpected render throw does not leak the per-invocation
      // override.
      try {
        setFlagApiKey(opts.apiKey);

        let resolvedExitCode = 0;
        const exitPromise = new Promise<void>((resolve) => {
          const instance = render(
            React.createElement(FilterTui, {
              onDone: (code: number) => {
                resolvedExitCode = code;
              },
            }),
            {
              exitOnCtrlC: false,
              patchConsole: true,
            },
          );
          instance
            .waitUntilExit()
            .then(() => resolve())
            .catch(() => resolve());
        });
        await exitPromise;

        if (resolvedExitCode !== 0) {
          process.exit(resolvedExitCode);
        }
      } catch (error) {
        handleError(error, false);
      } finally {
        setFlagApiKey(undefined);
      }
    });
}
