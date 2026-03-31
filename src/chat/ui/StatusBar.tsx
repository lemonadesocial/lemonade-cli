import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';

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

type StatusMode = 'tips' | 'streaming' | 'tool' | 'error';

interface StatusBarProps {
  spaceName?: string;
  providerName: string;
  modelName: string;
  isStreaming: boolean;
  streamTokenCount: number;
  lastError?: string;
  lastToolName?: string;
}

export function StatusBar({
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
  let mode: StatusMode = 'tips';

  if (isStreaming) {
    mode = 'streaming';
    center = <Text dimColor>streaming... {streamTokenCount} tokens</Text>;
  } else if (showError && lastError) {
    mode = 'error';
    center = <Text color="#FF637E">{lastError}</Text>;
  } else if (showTool && lastToolName) {
    mode = 'tool';
    center = <Text dimColor>{lastToolName}</Text>;
  } else {
    center = <Text dimColor>Tip: {TIPS[tipIndex]}</Text>;
  }

  const showModel = mode !== 'tips';

  return (
    <Box flexDirection="column">
      <Text dimColor>{'─'.repeat(process.stdout.columns || 80)}</Text>
      <Box justifyContent="space-between" paddingX={1}>
        <Text dimColor>Space: {spaceName || 'none'}</Text>
        {center}
        {showModel ? (
          <Text dimColor>{providerName} | {modelName}</Text>
        ) : (
          <Text> </Text>
        )}
      </Box>
    </Box>
  );
}
