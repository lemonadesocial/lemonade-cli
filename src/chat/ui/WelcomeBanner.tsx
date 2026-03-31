import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';
import { VERSION } from '../index.js';

const LOGO = `
 _                                      _
| |    ___ _ __ ___   ___  _ __   __ _ | |  ___
| |   / _ | '_ \` _ \\ / _ \\| '_ \\ / _\` || | / _ \\
| |__|  __| | | | | | (_) | | | | (_| || ||  __/
|_____\\___|_| |_| |_|\\___/|_| |_|\\__,_||_| \\___|
`.trimStart();

interface WelcomeBannerProps {
  providerName: string;
  modelName: string;
  firstName: string;
}

const SUGGESTED_PROMPTS = [
  'create a techno event in Berlin next Saturday',
  'how are ticket sales for my warehouse party?',
  'find events near me this weekend',
];

export function WelcomeBanner({ providerName, modelName, firstName }: WelcomeBannerProps): React.ReactElement {
  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={colors.lemon}>{LOGO}</Text>
      <Text>
        <Text bold>make-lemonade</Text>
        <Text dimColor> v{VERSION} | {providerName} | {modelName}</Text>
      </Text>
      <Text>{''}</Text>
      <Text>Hey {firstName}! What would you like to do?</Text>
      <Text>{''}</Text>
      {SUGGESTED_PROMPTS.map((prompt, i) => (
        <Text key={i} dimColor>  {i + 1}. &quot;{prompt}&quot;</Text>
      ))}
      <Text>{''}</Text>
      <Text dimColor>  Type /help for commands, Ctrl+D to quit</Text>
      <Text>{''}</Text>
      <Text dimColor>  Note: Tool results are sent to your AI provider.</Text>
      <Box borderStyle="single" borderColor={colors.muted} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} marginTop={1} />
    </Box>
  );
}
