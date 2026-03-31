import React from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from './theme.js';
import { VERSION } from '../version.js';

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
  agentName: string;
  onSelectPrompt?: (text: string) => void;
}

export const SUGGESTED_PROMPTS = [
  'help me plan a techno event in Berlin next Saturday',
  'how are ticket sales for my warehouse party?',
  "let's build a community space for my meetup group",
];

export function WelcomeBanner({ providerName, modelName, firstName, agentName, onSelectPrompt }: WelcomeBannerProps): React.ReactElement {
  useInput((input) => {
    const index = parseInt(input, 10) - 1;
    if (index >= 0 && index < SUGGESTED_PROMPTS.length && onSelectPrompt) {
      onSelectPrompt(SUGGESTED_PROMPTS[index]);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Text color={colors.lemon}>{LOGO}</Text>
      <Text>
        <Text bold>make-lemonade</Text>
        <Text dimColor> v{VERSION} | {providerName} | {modelName}</Text>
      </Text>
      <Text>{''}</Text>
      <Text>Hey {firstName}! I'm {agentName}, your event concierge. What would you like to do?</Text>
      <Text>{''}</Text>
      {SUGGESTED_PROMPTS.map((prompt, i) => (
        <Text key={i} dimColor>  {i + 1}. &quot;{prompt}&quot;</Text>
      ))}
      <Text>{''}</Text>
      <Text dimColor>  Type /help for commands, Ctrl+D to quit</Text>
      <Text>{''}</Text>
      <Text dimColor>  Note: Tool results (including event and guest data) are sent to your AI provider.</Text>
      <Box borderStyle="single" borderColor={colors.muted} borderTop={true} borderBottom={false} borderLeft={false} borderRight={false} marginTop={1} />
    </Box>
  );
}
