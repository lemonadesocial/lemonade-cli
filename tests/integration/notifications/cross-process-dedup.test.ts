import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { createServer, type Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'fs';
import { join, resolve as resolvePath } from 'path';
import { tmpdir } from 'os';

/**
 * Integration test for US-6.7 — cross-process dedup via the persisted
 * last-seen cache in `~/.lemonade/config.json`.
 *
 * Approach (mirrors Phase 2's `watch-mock-ws.test.ts`):
 *   - Start a mock graphql-ws server on an ephemeral port backed by an
 *     in-memory pub/sub that replays the same 5 synthetic
 *     `notificationCreated` payloads to every subscriber.
 *   - Create a fresh tmpdir and override `HOME` in the child env so the
 *     CLI's `~/.lemonade/config.json` is isolated from the user's real
 *     config.
 *   - Spawn child 1: `node dist/index.js notifications watch --json`
 *     against the mock WS. Expect 5 NDJSON lines on stdout; SIGINT and
 *     wait for exit. Verify the persisted config contains all 5 IDs.
 *   - Spawn child 2: same command, same mock WS emitting the same 5
 *     payloads. Expect 0 NDJSON lines on stdout (dedup from the
 *     persisted cache seeded by `getLastSeenNotificationIds()`). SIGINT
 *     and verify clean exit.
 *
 * Note: `yarn build` must have run before this test (CI's test job
 * already does so — mirrors Phase 2's assumption).
 */

type MockNotification = {
  _id: string;
  created_at: string;
  type: string;
  title?: string;
  message?: string;
};

// Shared subscribers set and a per-connection "ready" signal so the test
// can publish only after the server-side generator is listening.
const subscribers = new Set<(n: MockNotification) => void>();

let currentSubscriberReady: {
  resolve: () => void;
  promise: Promise<void>;
} | null = null;

function newSubscriberReady(): void {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  currentSubscriberReady = { resolve, promise };
}

function publish(n: MockNotification): void {
  for (const s of subscribers) s(n);
}

function createSubscriberStream(): AsyncIterable<{
  notificationCreated: MockNotification;
}> {
  const queue: MockNotification[] = [];
  let waiter: ((n: MockNotification) => void) | null = null;
  let closed = false;

  const sub = (n: MockNotification) => {
    if (waiter) {
      const w = waiter;
      waiter = null;
      w(n);
    } else {
      queue.push(n);
    }
  };
  subscribers.add(sub);
  currentSubscriberReady?.resolve();

  return {
    [Symbol.asyncIterator](): AsyncIterator<{
      notificationCreated: MockNotification;
    }> {
      return {
        async next(): Promise<
          IteratorResult<{ notificationCreated: MockNotification }>
        > {
          if (closed) return { value: undefined, done: true };
          if (queue.length > 0) {
            return {
              value: { notificationCreated: queue.shift()! },
              done: false,
            };
          }
          const next = await new Promise<MockNotification>((res) => {
            waiter = res;
          });
          return { value: { notificationCreated: next }, done: false };
        },
        async return(): Promise<
          IteratorResult<{ notificationCreated: MockNotification }>
        > {
          closed = true;
          subscribers.delete(sub);
          return { value: undefined, done: true };
        },
      };
    },
  };
}

async function mockSubscribe(): Promise<
  AsyncIterable<{ data: { notificationCreated: MockNotification } }>
> {
  const stream = createSubscriberStream();
  return {
    [Symbol.asyncIterator](): AsyncIterator<{
      data: { notificationCreated: MockNotification };
    }> {
      const inner = stream[Symbol.asyncIterator]();
      return {
        async next() {
          const { value, done } = await inner.next();
          if (done) return { value: undefined, done: true };
          return { value: { data: value }, done: false };
        },
        async return() {
          if (typeof inner.return === 'function') await inner.return();
          return { value: undefined, done: true };
        },
      };
    },
  };
}

// ──────────────────────────────────────────────────────────────────────────
// Test suite — spin up one mock WS for the whole suite (same pattern as
// watch-mock-ws.test.ts).
// ──────────────────────────────────────────────────────────────────────────
let httpServer: HttpServer;
let wsServer: WebSocketServer;
let port: number;
let disposeGraphqlWs: { dispose: () => Promise<void> | void };

beforeAll(async () => {
  httpServer = createServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ data: { ok: true } }));
  });

  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });

  const address = httpServer.address();
  if (!address || typeof address === 'string') {
    throw new Error('Failed to bind mock HTTP server');
  }
  port = address.port;

  wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  disposeGraphqlWs = useServer(
    {
      schema: {} as unknown as Parameters<typeof useServer>[0]['schema'],
      validate: () => [],
      execute: (async () => ({ data: null })) as unknown as Parameters<
        typeof useServer
      >[0]['execute'],
      subscribe: mockSubscribe as unknown as Parameters<
        typeof useServer
      >[0]['subscribe'],
    },
    wsServer,
  );
});

afterAll(async () => {
  await disposeGraphqlWs.dispose();
  await new Promise<void>((resolve) => {
    wsServer.close(() => resolve());
  });
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
});

let spawnedChildren: ChildProcessWithoutNullStreams[] = [];

afterEach(() => {
  const leaked = spawnedChildren;
  spawnedChildren = [];
  for (const child of leaked) {
    if (child.exitCode === null && child.killed === false) {
      try {
        child.kill('SIGKILL');
      } catch {
        // best-effort
      }
    }
  }
});

function spawnCli(
  envOverride: NodeJS.ProcessEnv,
): ChildProcessWithoutNullStreams {
  const cliEntry = resolvePath(process.cwd(), 'dist/index.js');
  const child = spawn(
    process.execPath,
    [cliEntry, 'notifications', 'watch', '--json'],
    {
      env: {
        ...process.env,
        LEMONADE_API_URL: `http://127.0.0.1:${port}`,
        LEMONADE_API_KEY: 'test-key',
        ...envOverride,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  spawnedChildren.push(child);
  return child;
}

function countNdjsonLines(stdout: string): string[] {
  return stdout
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        const parsed = JSON.parse(line) as { _id?: string };
        return parsed._id ?? '';
      } catch {
        return '';
      }
    })
    .filter((id) => id.length > 0);
}

async function waitForExit(
  child: ChildProcessWithoutNullStreams,
): Promise<number> {
  return new Promise((resolve) => {
    child.on('exit', (code) => resolve(code ?? -1));
  });
}

describe('notifications watch — cross-process dedup (US-6.7)', () => {
  it(
    'second run dedups 5 IDs already persisted by the first run',
    async () => {
      const tmpHome = mkdtempSync(
        join(tmpdir(), 'lem-cli-xproc-'),
      );

      try {
        const payloads: MockNotification[] = Array.from({ length: 5 }).map(
          (_, i) => ({
            _id: `xproc-${i + 1}`,
            created_at: new Date().toISOString(),
            type: 'event_update',
            title: `payload-${i + 1}`,
          }),
        );

        // ── RUN 1 ────────────────────────────────────────────────────────
        newSubscriberReady();
        const child1 = spawnCli({ HOME: tmpHome });

        const run1Stdout: string[] = [];
        const run1Stderr: string[] = [];
        child1.stdout.on('data', (chunk: Buffer) => {
          run1Stdout.push(chunk.toString('utf-8'));
        });
        child1.stderr.on('data', (chunk: Buffer) => {
          run1Stderr.push(chunk.toString('utf-8'));
        });

        // Wait for the server-side subscriber generator to register.
        await Promise.race([
          currentSubscriberReady!.promise,
          new Promise((r) => setTimeout(r, 3000)),
        ]);
        await new Promise((r) => setTimeout(r, 50));

        for (const p of payloads) publish(p);

        // Wait for all 5 NDJSON lines on stdout.
        const deadline1 = Date.now() + 3000;
        let received1: string[] = [];
        while (Date.now() < deadline1) {
          received1 = countNdjsonLines(run1Stdout.join(''));
          if (received1.length >= 5) break;
          await new Promise((r) => setTimeout(r, 50));
        }

        if (received1.length < 5) {
          process.stderr.write(
            `\n[xproc-test debug] run1 stdout:\n${run1Stdout.join('')}\n`,
          );
          process.stderr.write(
            `[xproc-test debug] run1 stderr:\n${run1Stderr.join('')}\n`,
          );
        }

        expect(received1.length).toBe(5);
        for (let i = 1; i <= 5; i++) {
          expect(received1).toContain(`xproc-${i}`);
        }

        const sigintStart1 = Date.now();
        child1.kill('SIGINT');
        const exit1 = await waitForExit(child1);
        const sigintDuration1 = Date.now() - sigintStart1;
        expect(exit1).toBe(0);
        expect(sigintDuration1).toBeLessThan(1500);

        // Verify persisted config contains all 5 IDs.
        const configPath = join(tmpHome, '.lemonade', 'config.json');
        expect(existsSync(configPath)).toBe(true);
        const persisted = JSON.parse(
          readFileSync(configPath, 'utf-8'),
        ) as { lastSeenNotificationIds?: string[] };
        expect(persisted.lastSeenNotificationIds).toBeDefined();
        for (let i = 1; i <= 5; i++) {
          expect(persisted.lastSeenNotificationIds).toContain(`xproc-${i}`);
        }

        // ── RUN 2 ────────────────────────────────────────────────────────
        newSubscriberReady();
        const child2 = spawnCli({ HOME: tmpHome });

        const run2Stdout: string[] = [];
        const run2Stderr: string[] = [];
        child2.stdout.on('data', (chunk: Buffer) => {
          run2Stdout.push(chunk.toString('utf-8'));
        });
        child2.stderr.on('data', (chunk: Buffer) => {
          run2Stderr.push(chunk.toString('utf-8'));
        });

        await Promise.race([
          currentSubscriberReady!.promise,
          new Promise((r) => setTimeout(r, 3000)),
        ]);
        await new Promise((r) => setTimeout(r, 50));

        // Republish the same 5 payloads with identical _ids.
        for (const p of payloads) publish(p);

        // Wait 3s and assert ZERO NDJSON lines appeared.
        await new Promise((r) => setTimeout(r, 3000));
        const received2 = countNdjsonLines(run2Stdout.join(''));

        if (received2.length !== 0) {
          process.stderr.write(
            `\n[xproc-test debug] run2 stdout:\n${run2Stdout.join('')}\n`,
          );
          process.stderr.write(
            `[xproc-test debug] run2 stderr:\n${run2Stderr.join('')}\n`,
          );
        }

        expect(received2.length).toBe(0);

        const sigintStart2 = Date.now();
        child2.kill('SIGINT');
        const exit2 = await waitForExit(child2);
        const sigintDuration2 = Date.now() - sigintStart2;
        expect(exit2).toBe(0);
        expect(sigintDuration2).toBeLessThan(1500);
      } finally {
        // Cleanup: SIGKILL any leaked child, remove tmpdir.
        for (const child of spawnedChildren) {
          if (child.exitCode === null && child.killed === false) {
            try {
              child.kill('SIGKILL');
            } catch {
              // best-effort
            }
          }
        }
        if (existsSync(tmpHome)) {
          rmSync(tmpHome, { recursive: true, force: true });
        }
      }
    },
    40000,
  );
});
