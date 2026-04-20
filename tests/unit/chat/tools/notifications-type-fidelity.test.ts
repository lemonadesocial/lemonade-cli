import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';

import {
  NOTIFICATION_TYPES,
  NOTIFICATION_CATEGORIES,
} from '../../../../src/chat/tools/domains/notifications.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..', '..', '..', '..');
const schemaDir = join(REPO_ROOT, 'schema');
const srcDir = join(REPO_ROOT, 'src');

function readJson<T>(relPath: string): T {
  const raw = readFileSync(join(schemaDir, relPath), 'utf-8');
  return JSON.parse(raw) as T;
}

function walkTsFiles(root: string, excludeDirs: Set<string>): string[] {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        if (excludeDirs.has(entry)) continue;
        stack.push(full);
      } else if (st.isFile() && entry.endsWith('.ts')) {
        out.push(full);
      }
    }
  }
  return out;
}

describe('notifications type fidelity (drift guardrails)', () => {
  const notificationTypes = readJson<string[]>('notification-types.json');
  const backendResolvers = readJson<{
    queries: string[];
    mutations: string[];
    subscriptions: string[];
  }>('backend-resolvers.json');

  // US-7.2: runtime NOTIFICATION_TYPES is a superset of the backend snapshot.
  it('NOTIFICATION_TYPES is a superset of schema/notification-types.json (US-7.2)', () => {
    const runtime = new Set<string>(NOTIFICATION_TYPES);
    const missing = notificationTypes.filter((t) => !runtime.has(t));
    expect(missing).toEqual([]);
  });

  // US-7.1: runtime NOTIFICATION_TYPES is a subset of the backend snapshot.
  it('NOTIFICATION_TYPES is a subset of schema/notification-types.json (US-7.1)', () => {
    const snapshot = new Set<string>(notificationTypes);
    const extra = NOTIFICATION_TYPES.filter((t) => !snapshot.has(t));
    expect(extra).toEqual([]);
  });

  // US-8.1: NOTIFICATION_CATEGORIES is exactly the documented 7-item tuple.
  it('NOTIFICATION_CATEGORIES deep-equals the canonical 7-item array (US-8.1)', () => {
    expect([...NOTIFICATION_CATEGORIES]).toEqual([
      'event',
      'social',
      'messaging',
      'payment',
      'space',
      'store',
      'system',
    ]);
  });

  // US-7.4: the legacy `aiGetNotifications` resolver must not appear in the
  // CLI's backend snapshot — the CLI treats it as deprecated.
  it('backend-resolvers.json.queries does NOT contain aiGetNotifications (US-7.4)', () => {
    expect(backendResolvers.queries).not.toContain('aiGetNotifications');
  });

  // US-7.5: `getNotifications` is the canonical feed resolver and must be present.
  it('backend-resolvers.json.queries contains getNotifications (US-7.5)', () => {
    expect(backendResolvers.queries).toContain('getNotifications');
  });

  // US-5.2: `getNotificationUnreadCount` is the scalar unread-count query
  // consumed by `notifications unread` + `notifications read --all` pre-fetch
  // + watch-header segment. Drift-guardrail regression.
  it('backend-resolvers.json.queries contains getNotificationUnreadCount', () => {
    expect(backendResolvers.queries).toContain('getNotificationUnreadCount');
  });

  // US-5.2: `readAllNotifications` is the bulk mark-read mutation consumed by
  // `notifications read --all`. Drift-guardrail regression.
  it('backend-resolvers.json.mutations contains readAllNotifications', () => {
    expect(backendResolvers.mutations).toContain('readAllNotifications');
  });

  // US-7.5b: all 6 filter/preference resolvers must remain present.
  it('backend-resolvers.json contains all 6 filter/preference resolvers (US-7.5b)', () => {
    expect(backendResolvers.queries).toContain('getNotificationFilters');
    expect(backendResolvers.queries).toContain('getNotificationChannelPreferences');
    expect(backendResolvers.mutations).toContain('setNotificationFilter');
    expect(backendResolvers.mutations).toContain('deleteNotificationFilter');
    expect(backendResolvers.mutations).toContain('setNotificationChannelPreference');
    expect(backendResolvers.mutations).toContain('deleteNotificationChannelPreference');
  });

  // US-7.7: the `notificationCreated` subscription must be present under the
  // new top-level `subscriptions` key.
  it('backend-resolvers.json.subscriptions contains notificationCreated (US-7.7)', () => {
    expect(backendResolvers.subscriptions).toContain('notificationCreated');
  });

  // US-7.6: no non-test source file may reference the legacy resolver name.
  it('no src/**/*.ts file references aiGetNotifications (US-7.6)', () => {
    const files = walkTsFiles(srcDir, new Set(['node_modules', 'dist', '__tests__', 'tests']));
    const offenders = files.filter((f) => {
      const content = readFileSync(f, 'utf-8');
      return /aiGetNotifications/.test(content);
    });
    expect(offenders).toEqual([]);
  });
});
