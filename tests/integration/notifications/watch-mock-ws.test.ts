import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { createServer, type Server as HttpServer } from 'http';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/use/ws';
import { resolve as resolvePath } from 'path';

/**
 * Integration smoke test for `lemonade notifications watch --json` against a
 * mock graphql-ws server. Mirrors IMPL Phase 2 § Test expectations.
 *
 * Covers:
 *   - US-1.4 — latency: 3 synthetic notificationCreated payloads emitted
 *     within 500 ms, all appear on stdout within a 2 s window.
 *   - US-1.6 — SIGINT exits code 0 within 500 ms.
 *   - US-1.7 — status breadcrumbs appear on stderr only; stdout holds NDJSON
 *     payloads only.
 *
 * Note: this test spawns `node dist/index.js` — it requires that `yarn build`
 * has already produced a fresh dist/. The CI workflow at
 * .github/workflows/ci.yml (test job) runs `yarn build` before `yarn test`
 * so this is a safe assumption.
 */

// ──────────────────────────────────────────────────────────────────────────
// Pub/sub used by the mock subscription resolver.
// ──────────────────────────────────────────────────────────────────────────
type MockNotification = {
  _id: string;
  created_at: string;
  type: string;
  title?: string;
  message?: string;
};

const subscribers = new Set<(n: MockNotification) => void>();
const subscriberReady: { resolve: () => void; promise: Promise<void> } = (() => {
  let resolve!: () => void;
  const promise = new Promise<void>((r) => {
    resolve = r;
  });
  return { resolve, promise };
})();

function publish(n: MockNotification): void {
  for (const s of subscribers) s(n);
}

function createSubscriberStream(): AsyncIterable<{ notificationCreated: MockNotification }> {
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
  // Register synchronously so publish() called after this point sees it.
  subscribers.add(sub);
  subscriberReady.resolve();

  return {
    [Symbol.asyncIterator](): AsyncIterator<{ notificationCreated: MockNotification }> {
      return {
        async next(): Promise<IteratorResult<{ notificationCreated: MockNotification }>> {
          if (closed) return { value: undefined, done: true };
          if (queue.length > 0) {
            return { value: { notificationCreated: queue.shift()! }, done: false };
          }
          const next = await new Promise<MockNotification>((res) => {
            waiter = res;
          });
          return { value: { notificationCreated: next }, done: false };
        },
        async return(): Promise<IteratorResult<{ notificationCreated: MockNotification }>> {
          closed = true;
          subscribers.delete(sub);
          return { value: undefined, done: true };
        },
      };
    },
  };
}

// Custom `subscribe` function (bypasses graphql's schema validator to avoid
// vitest's dual-realm issue between `graphql` and `graphql-ws`'s ESM
// resolution). The CLI under test sends exactly one subscription op
// (`notificationCreated`); we simply push the pub/sub stream back as the
// operation result without routing through graphql.execute.
async function mockSubscribe(): Promise<AsyncIterable<{ data: { notificationCreated: MockNotification } }>> {
  const stream = createSubscriberStream();
  return {
    [Symbol.asyncIterator](): AsyncIterator<{ data: { notificationCreated: MockNotification } }> {
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
// Test suite.
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
  // Sidestep graphql's cross-realm isSchema check (vitest loads `graphql`
  // in a different realm than graphql-ws' ESM resolution). We provide:
  //   - a non-null stub `schema` (graphql-ws' own truthiness check)
  //   - `validate: () => []` to skip schema validation
  //   - a custom `subscribe` that ignores execArgs.schema and yields from
  //     our pub/sub generator directly
  disposeGraphqlWs = useServer(
    {
      schema: {} as unknown as Parameters<typeof useServer>[0]['schema'],
      validate: () => [],
      execute: (async () => ({ data: null })) as unknown as Parameters<typeof useServer>[0]['execute'],
      subscribe: mockSubscribe as unknown as Parameters<typeof useServer>[0]['subscribe'],
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

// Suite-scope handle on the spawned CLI so afterEach can SIGKILL any leaked
// child if a test body threw before reaching its own teardown (A-011).
let spawnedChild: ChildProcessWithoutNullStreams | null = null;

afterEach(() => {
  const leaked = spawnedChild;
  spawnedChild = null;
  if (leaked && leaked.exitCode === null && leaked.killed === false) {
    try {
      leaked.kill('SIGKILL');
    } catch {
      // best-effort — prevent CI from hanging if the kill races with exit
    }
  }
});

describe('notifications watch — mock WS integration', () => {
  it(
    'emits NDJSON lines for 3 synthetic notifications and exits 0 on SIGINT',
    async () => {
      const cliEntry = resolvePath(process.cwd(), 'dist/index.js');
      const child: ChildProcessWithoutNullStreams = spawn(
        process.execPath,
        [cliEntry, 'notifications', 'watch', '--json'],
        {
          env: {
            ...process.env,
            LEMONADE_API_URL: `http://127.0.0.1:${port}`,
            LEMONADE_API_KEY: 'test-key',
          },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      spawnedChild = child;

      try {
        const stdoutChunks: string[] = [];
        const stderrChunks: string[] = [];
        child.stdout.on('data', (chunk: Buffer) => {
          stdoutChunks.push(chunk.toString('utf-8'));
        });
        child.stderr.on('data', (chunk: Buffer) => {
          stderrChunks.push(chunk.toString('utf-8'));
        });

        // Wait for the child to connect AND for our server-side subscriber to
        // register (the CLI subscribe -> server onSubscribe -> generator start
        // flow). subscriberReady fires when the generator adds itself to the
        // subscribers Set — after that, publish() will route through.
        await Promise.race([
          subscriberReady.promise,
          new Promise((r) => setTimeout(r, 3000)),
        ]);
        // Give the handshake an extra tick to settle.
        await new Promise((r) => setTimeout(r, 50));

        // Emit 3 synthetic payloads within a tight window (well under the 500 ms
        // budget — US-1.4 mandates ≤ 250 ms p95 per event at loopback).
        publish({
          _id: 'evt-1',
          created_at: new Date().toISOString(),
          type: 'event_update',
          title: 't1',
        });
        publish({
          _id: 'evt-2',
          created_at: new Date().toISOString(),
          type: 'event_update',
          title: 't2',
        });
        publish({
          _id: 'evt-3',
          created_at: new Date().toISOString(),
          type: 'event_update',
          title: 't3',
        });

        // Wait for stdout to receive all 3 NDJSON lines (2s window per spec).
        const deadline = Date.now() + 2000;
        let receivedIds: string[] = [];
        while (Date.now() < deadline) {
          const combined = stdoutChunks.join('');
          receivedIds = combined
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
          if (receivedIds.length >= 3) break;
          await new Promise((r) => setTimeout(r, 50));
        }

        if (receivedIds.length < 3) {
          // Surface raw streams so CI logs show why it failed. Kept on failure
          // only so a flaky run in CI is diagnosable without local repro.
          process.stderr.write(`\n[integration-test debug] stdout:\n${stdoutChunks.join('')}\n`);
          process.stderr.write(`[integration-test debug] stderr:\n${stderrChunks.join('')}\n`);
        }

        expect(receivedIds).toContain('evt-1');
        expect(receivedIds).toContain('evt-2');
        expect(receivedIds).toContain('evt-3');

        // US-1.7 — status breadcrumbs only on stderr, NOT on stdout.
        const stdoutAll = stdoutChunks.join('');
        expect(stdoutAll).not.toContain('[connected]');
        expect(stdoutAll).not.toContain('[polling]');

        // Stderr MUST NOT contain notification payloads.
        const stderrAll = stderrChunks.join('');
        expect(stderrAll).not.toContain('evt-1');
        expect(stderrAll).not.toContain('evt-2');
        expect(stderrAll).not.toContain('evt-3');

        // US-1.6 — SIGINT exits within 500 ms, code 0 (PRD budget;
        // previously asserted < 1500 ms — A-010 tightens to the real spec).
        const sigintStart = Date.now();
        child.kill('SIGINT');
        const exitCode: number = await new Promise((resolve) => {
          child.on('exit', (code) => resolve(code ?? -1));
        });
        const sigintDuration = Date.now() - sigintStart;

        expect(exitCode).toBe(0);
        expect(sigintDuration).toBeLessThan(500);
      } finally {
        // A-011 — if the test body threw before reaching child.kill('SIGINT')
        // above, SIGKILL here to prevent a leaked node subprocess from
        // hanging the vitest run.
        if (child.exitCode === null && child.killed === false) {
          try {
            child.kill('SIGKILL');
          } catch {
            // best-effort
          }
        }
      }
    },
    20000,
  );
});
