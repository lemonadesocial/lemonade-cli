import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

const TIPS = [
  "say 'switch to my Berlin space' to change spaces",
  '/clear starts a fresh conversation',
  "try 'how are ticket sales?' for analytics",
  'Escape cancels the current response',
  '/model to switch AI models',
  "'create an event and add tickets' chains multiple actions",
  'destructive actions always ask for confirmation',
  '/help shows all commands',
];

interface StatusBarProps {
  agentName: string;
  spaceName?: string;
  providerName: string;
  modelName: string;
  isStreaming: boolean;
  streamTokenCount: number;
  lastError?: string;
  lastToolName?: string;
}

export function StatusBar({
  agentName,
  spaceName,
  providerName,
  modelName,
  isStreaming,
  streamTokenCount,
  lastError,
  lastToolName,
}: StatusBarProps): React.ReactElement {
  const [tipIndex, setTipIndex] = useState(0);
  const [showError, setShowError] = useState(false);
  const [showTool, setShowTool] = useState(false);

  useEffect(() => {
    if (!isStreaming && !showError && !showTool) {
      const interval = setInterval(() => {
        setTipIndex((prev) => (prev + 1) % TIPS.length);
      }, 15_000);
      return () => clearInterval(interval);
    }
  }, [isStreaming, showError, showTool]);

  useEffect(() => {
    if (lastError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastError]);

  useEffect(() => {
    if (lastToolName) {
      setShowTool(true);
      const timer = setTimeout(() => setShowTool(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastToolName]);

  let center: React.ReactElement;
  if (isStreaming) {
    center = <Text dimColor>streaming... {streamTokenCount} tokens</Text>;
  } else if (showError && lastError) {
    center = <Text color={colors.error}>{lastError}</Text>;
  } else if (showTool && lastToolName) {
    center = <Text dimColor>Last: {lastToolName}</Text>;
  } else {
    center = <Text dimColor>Tip: {TIPS[tipIndex]}</Text>;
  }

  return (
    <Box flexDirection="column">
      <Box borderStyle="single" borderColor={colors.muted} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} />
      <Box justifyContent="space-between" paddingX={1}>
        <Text color={colors.violetLight}>{agentName} | Space: {spaceName || 'none'}</Text>
        {center}
        <Text color={colors.violet}>{providerName} | {modelName}</Text>
      </Box>
    </Box>
  );
}
