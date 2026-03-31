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

const LEFT_WIDTH = 25;
const RIGHT_WIDTH = 25;

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + '...';
}

type StatusMode = 'tips' | 'streaming' | 'tool' | 'error';

interface StatusBarProps {
  spaceName?: string;
  creditsSpaceName?: string;
  providerName: string;
  modelName: string;
  isStreaming: boolean;
  streamTokenCount: number;
  lastError?: string;
  lastToolName?: string;
}

export function StatusBar({
  spaceName,
  creditsSpaceName,
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

  let centerText: string;
  let centerColor: string | undefined;
  let mode: StatusMode = 'tips';

  if (isStreaming) {
    mode = 'streaming';
    centerText = `streaming... ${streamTokenCount} tokens`;
  } else if (showError && lastError) {
    mode = 'error';
    centerText = lastError;
    centerColor = '#FF637E';
  } else if (showTool && lastToolName) {
    mode = 'tool';
    centerText = lastToolName;
  } else {
    centerText = `Tip: ${TIPS[tipIndex]}`;
  }

  const showModel = mode !== 'tips';

  const leftLabel = creditsSpaceName
    ? `Space: ${spaceName || 'none'} | ${creditsSpaceName}`
    : `Space: ${spaceName || 'none'}`;
  const leftText = truncate(leftLabel, LEFT_WIDTH);

  const rightText = showModel
    ? truncate(`${providerName} | ${modelName}`, RIGHT_WIDTH)
    : '';

  return (
    <Box flexDirection="column">
      <Text dimColor>{'─'.repeat(process.stdout.columns || 80)}</Text>
      <Box paddingX={1}>
        <Box width={LEFT_WIDTH}>
          <Text dimColor>{leftText}</Text>
        </Box>
        <Box flexGrow={1} justifyContent="center">
          {centerColor
            ? <Text color={centerColor} wrap="truncate">{centerText}</Text>
            : <Text dimColor wrap="truncate">{centerText}</Text>
          }
        </Box>
        <Box width={RIGHT_WIDTH} justifyContent="flex-end">
          <Text dimColor>{rightText}</Text>
        </Box>
      </Box>
    </Box>
  );
}
