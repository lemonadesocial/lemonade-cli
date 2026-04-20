import React from 'react';
import { Box, Text } from 'ink';
import type { NotificationChannelPreference } from '../state.js';

export interface ListViewProps {
  preferences: NotificationChannelPreference[];
  cursor: number;
  status: 'idle' | 'loading' | 'error';
  error?: string;
  info?: string;
}

/**
 * Render the scope suffix for a preference line — same shape as the
 * capability formatter at `src/chat/tools/domains/notifications.ts:99-106`:
 * `category=… type=… ref=…:… space=…`. Global (no scope) renders as
 * `global`.
 */
function describeScope(p: NotificationChannelPreference): string {
  const parts: string[] = [];
  if (p.notification_category) parts.push(`category=${p.notification_category}`);
  if (p.notification_type) parts.push(`type=${p.notification_type}`);
  if (p.ref_type) parts.push(`ref=${p.ref_type}${p.ref_id ? `:${p.ref_id}` : ''}`);
  if (p.space_scoped) parts.push(`space=${p.space_scoped}`);
  return parts.length ? parts.join(' ') : 'global';
}

/**
 * Canonical preference line shape (US-5a.2) — mirrors the capability
 * formatter at `src/chat/tools/domains/notifications.ts:359`:
 *   `- [<_id>] channels=[<csv>] <scope>`
 * Matching that format keeps CLI TUI output consistent with AI-chat
 * tool output so scripts and snapshots remain cross-surface stable.
 */
export function describePreference(p: NotificationChannelPreference): string {
  const channels = (p.enabled_channels || []).join(',');
  return `[${p._id}] channels=[${channels}] ${describeScope(p)}`;
}

/**
 * Ink list view for the preference TUI (US-5a.1-4). Navigation keys are
 * owned by the parent `PreferenceTui` via `useInput` — this component is
 * purely presentational so it can be exercised with a static state
 * snapshot in tests.
 */
export function ListView({
  preferences,
  cursor,
  status,
  error,
  info,
}: ListViewProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold>Notification channel preferences</Text>
      {status === 'loading' ? (
        <Text dimColor>Loading…</Text>
      ) : status === 'error' ? (
        <Text color="red">Error: {error ?? 'failed to load preferences'}</Text>
      ) : preferences.length === 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>No notification channel preferences set.</Text>
          <Text dimColor>(a) Add new</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {preferences.map((p, idx) => {
            const selected = idx === cursor;
            return (
              <Text key={p._id} color={selected ? 'cyan' : undefined}>
                {selected ? '> ' : '  '}
                {describePreference(p)}
              </Text>
            );
          })}
        </Box>
      )}
      {error && status !== 'error' ? (
        <Box marginTop={1}>
          <Text color="red">{error}</Text>
        </Box>
      ) : null}
      {info ? (
        <Box marginTop={1}>
          <Text color="green">{info}</Text>
        </Box>
      ) : null}
      <Box marginTop={1}>
        <Text dimColor>
          ↑/↓ navigate · Enter edit · a add · d delete · q/Esc quit
        </Text>
      </Box>
    </Box>
  );
}
