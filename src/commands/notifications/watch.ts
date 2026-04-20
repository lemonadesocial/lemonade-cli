import { Command } from 'commander';
import React from 'react';
import { render } from 'ink';
import { setFlagApiKey } from '../../auth/store.js';
import { handleError } from '../../output/error.js';
import { startNotificationListener } from '../../chat/notifications/listener.js';
import { WatchFeed } from './ui/WatchFeed.js';

export function registerNotificationsWatch(notifications: Command): void {
  notifications
    .command('watch')
    .description('Stream live notifications to the terminal (Ink feed or NDJSON)')
    .option('--json', 'Emit NDJSON (one JSON line per notification) instead of Ink feed')
    .option('--api-key <key>', 'API key override')
    .action(async (opts) => {
      setFlagApiKey(opts.apiKey);

      // NDJSON short-circuit: when --json OR stdout is not a TTY, bypass Ink
      // and write one line per notification to stdout, breadcrumbs to stderr.
      // Defense-in-depth: even without --json, a non-TTY destination cannot
      // render Ink — fall back to NDJSON (IMPL Phase 2 scope clarification #2).
      const useNdjson = !!opts.json || !process.stdout.isTTY;

      if (useNdjson) {
        try {
          await runNdjsonWatch();
          setFlagApiKey(undefined);
        } catch (error) {
          setFlagApiKey(undefined);
          handleError(error, !!opts.json);
        }
        return;
      }

      try {
        await runInkWatch();
        setFlagApiKey(undefined);
      } catch (error) {
        setFlagApiKey(undefined);
        handleError(error, !!opts.json);
      }
    });
}

/**
 * NDJSON mode — stdout receives one JSON line per notification; stderr
 * receives status breadcrumbs. SIGINT disposes the listener and exits 0
 * within the 500ms budget (US-1.6).
 */
async function runNdjsonWatch(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    let stopped = false;

    const listener = startNotificationListener({
      onNotification: (_formatted, raw) => {
        try {
          process.stdout.write(JSON.stringify(raw) + '\n');
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      },
      onStatusChange: (status) => {
        process.stderr.write(`[${status}]\n`);
      },
    });

    const onSigint = () => {
      if (stopped) return;
      stopped = true;
      try {
        listener.stop();
      } finally {
        process.off('SIGINT', onSigint);
        process.off('SIGTERM', onSigint);
        resolve();
      }
    };

    process.on('SIGINT', onSigint);
    process.on('SIGTERM', onSigint);
  });
}

/**
 * Ink mode — mounts WatchFeed with patchConsole + exitOnCtrlC:false so the
 * component owns clean teardown via its useEffect cleanup.
 */
async function runInkWatch(): Promise<void> {
  const instance = render(React.createElement(WatchFeed), {
    exitOnCtrlC: false,
    patchConsole: true,
  });
  await instance.waitUntilExit();
}
