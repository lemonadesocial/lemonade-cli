import React from 'react';
import { Box, Text } from 'ink';
import { MarkdownText } from './MarkdownText.js';

interface AssistantMessageProps {
  text: string;
  streaming?: boolean;
}

export function AssistantMessage({ text, streaming }: AssistantMessageProps): React.ReactElement {
  return (
    <Box paddingX={1} marginTop={1}>
      {streaming ? <Text>{text}</Text> : <MarkdownText text={text} />}
    </Box>
  );
}
