import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { existsSync, mkdtempSync, rmSync, statSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

/**
 * Unit tests for `src/auth/notification-dedup.ts` — persistent last-seen
 * dedup cache covering US-6.8 (FIFO cap 200), US-6.9 (write-failure
 * degrades to stderr breadcrumb), US-6.10 (file mode 0o600 inherited
 * from the atomic `writeConfig` primitive).
 *
 * Isolation strategy: each test rewrites `process.env.HOME` to a fresh
 * tmpdir before importing the module under test. `readConfig` /
 * `writeConfig` in `src/auth/store.ts` derive their path from `homedir()`
 * (Node `os`), which resolves `HOME` at call time — so no `vi.mock('os')`
 * is required here as long as the env override is in place before
 * module initialization and we re-import per test.
 */

let testHome: string;
let savedHome: string | undefined;

beforeEach(() => {
  savedHome = process.env.HOME;
  testHome = mkdtempSync(join(tmpdir(), 'lem-cli-dedup-'));
  process.env.HOME = testHome;
  vi.resetModules();
});

afterEach(() => {
  if (existsSync(testHome)) {
    rmSync(testHome, { recursive: true, force: true });
  }
  if (savedHome === undefined) {
    delete process.env.HOME;
  } else {
    process.env.HOME = savedHome;
  }
  vi.restoreAllMocks();
});

describe('notification-dedup — persisted last-seen cache', () => {
  it('appends 5 distinct IDs and returns them as a Set preserving insertion order', async () => {
    const { appendLastSeenNotificationId, getLastSeenNotificationIds } =
      await import('../../../src/auth/notification-dedup.js');

    const ids = ['n1', 'n2', 'n3', 'n4', 'n5'];
    for (const id of ids) appendLastSeenNotificationId(id);

    const result = getLastSeenNotificationIds();
    expect(result.size).toBe(5);
    // Set iteration order mirrors insertion — verify FIFO order of IDs.
    expect([...result]).toEqual(ids);
  });

  it('trims to last 200 IDs (FIFO) when 201 are appended — US-6.8', async () => {
    const { appendLastSeenNotificationId, getLastSeenNotificationIds } =
      await import('../../../src/auth/notification-dedup.js');

    for (let i = 0; i < 201; i++) {
      appendLastSeenNotificationId(`id-${i}`);
    }

    const result = getLastSeenNotificationIds();
    expect(result.size).toBe(200);
    // Oldest ID evicted.
    expect(result.has('id-0')).toBe(false);
    // Last 200 IDs (id-1 .. id-200) must all be present.
    for (let i = 1; i <= 200; i++) {
      expect(result.has(`id-${i}`)).toBe(true);
    }
  });

  it('does not throw and writes stderr breadcrumb when writeFileSync fails — US-6.9', async () => {
    const stderrSpy = vi
      .spyOn(process.stderr, 'write')
      .mockImplementation(() => true);

    // Mock the fs module seen by src/auth/store.ts so writeFileSync throws
    // on the tmpfile write path inside writeConfig. We import via the same
    // specifier store.ts uses ('fs') — vi.doMock is per-module via
    // resetModules above, so the import inside notification-dedup -> store
    // will pick up the mocked fs.
    vi.doMock('fs', async () => {
      const actual = await vi.importActual<typeof import('fs')>('fs');
      return {
        ...actual,
        writeFileSync: vi.fn(() => {
          throw new Error('simulated ENOSPC');
        }),
      };
    });

    const { appendLastSeenNotificationId } = await import(
      '../../../src/auth/notification-dedup.js'
    );

    expect(() => appendLastSeenNotificationId('id-fail')).not.toThrow();

    const calls = stderrSpy.mock.calls.map((c) => String(c[0]));
    const combined = calls.join('');
    expect(combined).toContain('[notifications] dedup persist failed:');

    vi.doUnmock('fs');
  });

  it('persisted config.json has mode 0o600 — US-6.10', async () => {
    const { appendLastSeenNotificationId } = await import(
      '../../../src/auth/notification-dedup.js'
    );

    appendLastSeenNotificationId('perm-check');

    const configPath = join(testHome, '.lemonade', 'config.json');
    expect(existsSync(configPath)).toBe(true);
    const stats = statSync(configPath);
    const mode = stats.mode & 0o777;
    expect(mode).toBe(0o600);
  });

  it('returns an empty Set on fresh install (no config.json yet)', async () => {
    const { getLastSeenNotificationIds } = await import(
      '../../../src/auth/notification-dedup.js'
    );

    const configPath = join(testHome, '.lemonade', 'config.json');
    // Precondition: no config file yet.
    expect(existsSync(configPath)).toBe(false);

    const result = getLastSeenNotificationIds();
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  it('is idempotent: appending an already-persisted ID does not duplicate or reorder', async () => {
    const { appendLastSeenNotificationId, getLastSeenNotificationIds } =
      await import('../../../src/auth/notification-dedup.js');

    appendLastSeenNotificationId('a');
    appendLastSeenNotificationId('b');
    appendLastSeenNotificationId('c');
    // Re-add 'a' — must not duplicate or move to end.
    appendLastSeenNotificationId('a');

    const result = getLastSeenNotificationIds();
    expect([...result]).toEqual(['a', 'b', 'c']);
  });

});
