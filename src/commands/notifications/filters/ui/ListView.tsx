import React from 'react';
import { Box, Text } from 'ink';
import type { NotificationFilter } from '../state.js';

export interface ListViewProps {
  filters: NotificationFilter[];
  cursor: number;
  status: 'idle' | 'loading' | 'error';
  error?: string;
  info?: string;
}

/**
 * Render one filter line using the same `describeScope()` shape as the
 * capability formatter at `src/chat/tools/domains/notifications.ts:99-106`:
 * `[<_id>] MODE <category|type|ref|space>`. Global (no scope) renders as
 * `global` (US-4a.2).
 */
export function describeFilter(f: NotificationFilter): string {
  const parts: string[] = [];
  if (f.notification_category) parts.push(`category=${f.notification_category}`);
  if (f.notification_type) parts.push(`type=${f.notification_type}`);
  if (f.ref_type) parts.push(`ref=${f.ref_type}${f.ref_id ? `:${f.ref_id}` : ''}`);
  if (f.space_scoped) parts.push(`space=${f.space_scoped}`);
  const scope = parts.length ? parts.join(' ') : 'global';
  return `[${f._id}] ${f.mode.toUpperCase()} ${scope}`;
}

/**
 * Ink list view for the filter TUI (US-4a.1-4). Navigation keys are
 * owned by the parent `FilterTui` via `useInput` — this component is
 * purely presentational so it can be exercised with a static state
 * snapshot in tests.
 */
export function ListView({ filters, cursor, status, error, info }: ListViewProps): React.JSX.Element {
  return (
    <Box flexDirection="column">
      <Text bold>Notification filters</Text>
      {status === 'loading' ? (
        <Text dimColor>Loading…</Text>
      ) : status === 'error' ? (
        <Text color="red">Error: {error ?? 'failed to load filters'}</Text>
      ) : filters.length === 0 ? (
        <Box flexDirection="column" marginTop={1}>
          <Text dimColor>No notification filters set.</Text>
          <Text dimColor>(a) Add new</Text>
        </Box>
      ) : (
        <Box flexDirection="column" marginTop={1}>
          {filters.map((f, idx) => {
            const selected = idx === cursor;
            return (
              <Text key={f._id} color={selected ? 'cyan' : undefined}>
                {selected ? '> ' : '  '}
                {describeFilter(f)}
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
