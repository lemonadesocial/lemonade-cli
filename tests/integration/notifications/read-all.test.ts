import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { spawn, type ChildProcessWithoutNullStreams } from 'child_process';
import { createServer, type Server as HttpServer, type IncomingMessage, type ServerResponse } from 'http';
import { resolve as resolvePath } from 'path';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Integration test for `lemonade notifications read --all --yes --json`.
 *
 * Spawns `node dist/index.js` against a mock HTTP graphql endpoint. Asserts:
 *   - POST body contains the `ReadAllNotifications` operation name + vars
 *   - pre-fetch + mutation + refetch all route through the endpoint
 *   - exit code 0 + stdout parses to `{ ok:true, data:{ marked, unread } }`
 *
 * Note: `yarn build` must have run first (same assumption as the sibling
 * watch-mock-ws integration test).
 */

interface RecordedRequest {
  body: string;
  parsed: { query?: string; variables?: Record<string, unknown>; operationName?: string };
  headers: Record<string, string | string[] | undefined>;
}

let httpServer: HttpServer;
let port: number;
let requests: RecordedRequest[] = [];

/**
 * Response script — one response per incoming graphql request, in order.
 * Each response is an object passed through `JSON.stringify` with `data` or
 * `errors` as applicable.
 */
let responseScript: Array<{ data?: unknown; errors?: unknown }> = [];

function handleGraphql(req: IncomingMessage, res: ServerResponse): void {
  const chunks: Buffer[] = [];
  req.on('data', (c: Buffer) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf-8');
    let parsed: RecordedRequest['parsed'] = {};
    try {
      parsed = JSON.parse(body);
    } catch {
      // unparseable — still record.
    }
    requests.push({ body, parsed, headers: req.headers });

    const resp = responseScript.shift() ?? { errors: [{ message: 'No response scripted' }] };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(resp));
  });
}

beforeAll(async () => {
  httpServer = createServer((req, res) => {
    if (req.method === 'POST' && req.url === '/graphql') {
      handleGraphql(req, res);
      return;
    }
    res.writeHead(404);
    res.end();
  });
  await new Promise<void>((resolve) => {
    httpServer.listen(0, '127.0.0.1', () => resolve());
  });
  const addr = httpServer.address();
  if (!addr || typeof addr === 'string') throw new Error('bind failed');
  port = addr.port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });
});

let spawnedChildren: ChildProcessWithoutNullStreams[] = [];
let tmpHome: string;

afterEach(() => {
  const leaked = spawnedChildren;
  spawnedChildren = [];
  for (const child of leaked) {
    if (child.exitCode === null && !child.killed) {
      try {
        child.kill('SIGKILL');
      } catch {
        // ignore
      }
    }
  }
  requests = [];
  responseScript = [];
  if (tmpHome) {
    try {
      rmSync(tmpHome, { recursive: true, force: true });
    } catch {
      // ignore
    }
  }
});

function runCli(args: string[]): Promise<{
  exitCode: number | null;
  stdout: string;
  stderr: string;
}> {
  tmpHome = mkdtempSync(join(tmpdir(), 'lemonade-cli-test-'));
  const binPath = resolvePath(process.cwd(), 'dist/index.js');

  const child = spawn('node', [binPath, ...args], {
    env: {
      ...process.env,
      HOME: tmpHome,
      LEMONADE_API_URL: `http://localhost:${port}`,
      LEMONADE_API_KEY: 'test-api-key',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  spawnedChildren.push(child);

  return new Promise((resolve) => {
    const stdoutChunks: string[] = [];
    const stderrChunks: string[] = [];
    child.stdout.on('data', (c: Buffer) => stdoutChunks.push(c.toString('utf-8')));
    child.stderr.on('data', (c: Buffer) => stderrChunks.push(c.toString('utf-8')));
    child.on('close', (code) => {
      resolve({
        exitCode: code,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join(''),
      });
    });
  });
}

describe('notifications read --all — integration (spawned binary vs mock graphql)', () => {
  it('--all --yes --json → POSTs ReadAllNotifications, exits 0, stdout envelope is { marked, unread }', async () => {
    // Script the three responses in order: pre-fetch count, mutation, refetch.
    responseScript = [
      { data: { getNotificationUnreadCount: 12 } },
      { data: { readAllNotifications: 12 } },
      { data: { getNotificationUnreadCount: 0 } },
    ];

    const { exitCode, stdout, stderr } = await runCli([
      'notifications', 'read', '--all', '--yes', '--json',
    ]);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    // Three POSTs: pre-fetch, mutation, refetch.
    expect(requests).toHaveLength(3);

    const [preFetch, mutation, refetch] = requests;
    expect(preFetch.parsed.query).toContain('GetNotificationUnreadCount');
    expect(mutation.parsed.query).toContain('ReadAllNotifications');
    expect(mutation.parsed.query).toContain('readAllNotifications(category: $category)');
    expect(refetch.parsed.query).toContain('GetNotificationUnreadCount');

    // Variables omit category (flag absent).
    expect(mutation.parsed.variables).toEqual({});

    // Stdout envelope.
    const parsed = JSON.parse(stdout.trim()) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ marked: 12, unread: 0 });
  });

  it('--all --dry-run --json → POSTs GetNotificationUnreadCount ONLY (no mutation), exits 0', async () => {
    responseScript = [
      { data: { getNotificationUnreadCount: 7 } },
    ];

    const { exitCode, stdout, stderr } = await runCli([
      'notifications', 'read', '--all', '--dry-run', '--json',
    ]);

    expect(exitCode, `stderr: ${stderr}`).toBe(0);

    // Only one POST — pre-fetch. The mutation MUST NOT be issued.
    expect(requests).toHaveLength(1);
    expect(requests[0].parsed.query).toContain('GetNotificationUnreadCount');
    // NEGATIVE — confirm no readAllNotifications body was ever sent.
    for (const r of requests) {
      expect(r.body).not.toContain('readAllNotifications');
    }

    const parsed = JSON.parse(stdout.trim()) as Record<string, unknown>;
    expect(parsed.ok).toBe(true);
    expect(parsed.data).toEqual({ dry_run: true, would_mark: 7 });
  });
});
