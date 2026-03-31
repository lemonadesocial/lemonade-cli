import React from 'react';
import { Box, Text } from 'ink';
import { highlight, supportsLanguage } from 'cli-highlight';
import { colors } from './theme.js';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export function highlightCode(code: string, language?: string): string {
  try {
    if (language && supportsLanguage(language)) {
      return highlight(code, { language });
    }
    return highlight(code, { language: undefined });
  } catch {
    return code;
  }
}

export function CodeBlock({ code, language }: CodeBlockProps): React.ReactElement {
  const highlighted = highlightCode(code, language);

  return (
    <Box flexDirection="column" marginY={1}>
      {language ? (
        <Text color={colors.violetLight} dimColor> {language}</Text>
      ) : null}
      <Box paddingX={1}>
        <Text>{highlighted}</Text>
      </Box>
    </Box>
  );
}
