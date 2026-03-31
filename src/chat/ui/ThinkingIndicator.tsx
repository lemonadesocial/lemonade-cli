import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { Spinner } from '@inkjs/ui';
import { colors } from './theme.js';

export const THINKING_WORDS = [
  'squeezing', 'zesting', 'juicing', 'pulping', 'peeling', 'garnishing',
  'philosophizing', 'lemonizing', 'marinating', 'fermenting', 'percolating',
  'simmering', 'brewing', 'concocting', 'stirring',
  'hustling', 'scheming', 'plotting', 'manifesting',
];

function randomWord(): string {
  return THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
}

export function ThinkingIndicator(): React.ReactElement {
  const [word, setWord] = useState(randomWord);

  useEffect(() => {
    const interval = setInterval(() => {
      setWord(randomWord());
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box paddingX={1} marginTop={1} gap={1}>
      <Spinner label="" />
      <Text color={colors.violetLight}>{word}...</Text>
    </Box>
  );
}
