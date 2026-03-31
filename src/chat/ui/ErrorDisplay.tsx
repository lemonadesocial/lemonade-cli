import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

export type ErrorType = 'network' | 'auth' | 'rate_limit' | 'context_length' | 'generic';

interface ErrorDisplayProps {
  type: ErrorType;
  message: string;
  retryAfter?: number;
}

function getErrorContent(type: ErrorType, message: string, retryAfter?: number): {
  color: string;
  icon: string;
  text: string;
  hint?: string;
} {
  switch (type) {
    case 'network':
      return {
        color: colors.error,
        icon: '✘',
        text: message,
        hint: 'Check your connection and try again.',
      };
    case 'auth':
      return {
        color: colors.error,
        icon: '✘',
        text: message,
        hint: 'Run "lemonade auth login" to refresh your session.',
      };
    case 'rate_limit':
      return {
        color: colors.warning,
        icon: '⏳',
        text: message,
        hint: retryAfter
          ? `Rate limited. Retry in ${retryAfter}s.`
          : 'Rate limited. Wait a moment and try again.',
      };
    case 'context_length':
      return {
        color: colors.warning,
        icon: '⚠',
        text: message,
        hint: 'Context too long. Use /clear to reset the conversation.',
      };
    case 'generic':
    default:
      return {
        color: colors.error,
        icon: '✘',
        text: message,
      };
  }
}

export function ErrorDisplay({ type, message, retryAfter }: ErrorDisplayProps): React.ReactElement {
  const content = getErrorContent(type, message, retryAfter);

  return (
    <Box flexDirection="column" paddingLeft={1}>
      <Box>
        <Text color={content.color}>{content.icon} </Text>
        <Text color={content.color}>{content.text}</Text>
      </Box>
      {content.hint ? (
        <Box paddingLeft={4}>
          <Text dimColor>{content.hint}</Text>
        </Box>
      ) : null}
    </Box>
  );
}
