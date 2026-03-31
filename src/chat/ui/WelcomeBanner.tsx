import React from 'react';
import { Box, Text, useInput } from 'ink';
import chalk from 'chalk';
import { colors } from './theme.js';
import { VERSION } from '../version.js';

const LEMON = [
  '⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⣀⣀⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀',
  '⠀⠀⠀⠀⠀⢀⣀⣠⣤⣴⣶⡶⢿⣿⣿⣿⠿⠿⠿⠿⠟⠛⢋⣁⣤⡴⠂⣠⡆⠀',
  '⠀⠀⠀⠀⠈⠙⠻⢿⣿⣿⣿⣶⣤⣤⣤⣤⣤⣴⣶⣶⣿⣿⣿⡿⠋⣠⣾⣿⠁⠀',
  '⠀⠀⠀⠀⠀⢀⣴⣤⣄⡉⠛⠻⠿⠿⣿⣿⣿⣿⡿⠿⠟⠋⣁⣤⣾⣿⣿⣿⠀⠀',
  '⠀⠀⠀⠀⣠⣾⣿⣿⣿⣿⣿⣶⣶⣤⣤⣤⣤⣤⣤⣶⣾⣿⣿⣿⣿⣿⣿⣿⡇⠀',
  '⠀⠀⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀',
  '⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠁⠀',
  '⠀⢀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠇⢸⡟⢸⡟⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⢿⣷⡿⢿⡿⠁⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡟⢁⣴⠟⢀⣾⠃⠀⠀⠀',
  '⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠛⣉⣿⠿⣿⣶⡟⠁⠀⠀⠀⠀',
  '⠀⠀⢿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠿⠛⣿⣏⣸⡿⢿⣯⣠⣴⠿⠋⠀⠀⠀⠀⠀⠀',
  '⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⠿⠶⣾⣿⣉⣡⣤⣿⠿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⢸⣿⣿⣿⣿⡿⠿⠿⠿⠶⠾⠛⠛⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
  '⠀⠀⠈⠉⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀',
];

export const SUGGESTED_PROMPTS = [
  'help me plan a techno event in Berlin next Saturday',
  'how are ticket sales for my warehouse party?',
  "let's build a community space for my meetup group",
];

interface WelcomeBannerProps {
  providerName: string;
  modelName: string;
  firstName: string;
  agentName: string;
  onSelectPrompt?: (text: string) => void;
}

// Format the welcome banner as a plain ANSI string for stdout
export function formatWelcomeBanner({ providerName, modelName, firstName, agentName }: {
  providerName: string;
  modelName: string;
  firstName: string;
  agentName: string;
}): string {
  const lemonColor = chalk.hex(colors.lemon);
  const lines: string[] = [];

  lines.push('');
  for (const line of LEMON) {
    lines.push(' ' + lemonColor(line));
  }
  lines.push(` ${chalk.bold('make-lemonade')}${chalk.dim(` v${VERSION} | ${providerName} | ${modelName}`)}`);
  lines.push('');
  lines.push(` Hey ${firstName}! I'm ${agentName}, your event concierge. What would you like to do?`);
  lines.push('');
  for (let i = 0; i < SUGGESTED_PROMPTS.length; i++) {
    lines.push(chalk.dim(`   ${i + 1}. "${SUGGESTED_PROMPTS[i]}"`));
  }
  lines.push('');
  lines.push(chalk.dim('   Type /help for commands, Ctrl+D to quit'));
  lines.push('');
  lines.push(chalk.dim('   Note: Tool results (including event and guest data) are sent to your AI provider.'));
  lines.push('');

  return lines.join('\n') + '\n';
}

// Ink component version — kept for tests and potential future use
export function WelcomeBanner({ providerName, modelName, firstName, agentName, onSelectPrompt }: WelcomeBannerProps): React.ReactElement {
  useInput((input) => {
    const index = parseInt(input, 10) - 1;
    if (index >= 0 && index < SUGGESTED_PROMPTS.length && onSelectPrompt) {
      onSelectPrompt(SUGGESTED_PROMPTS[index]);
    }
  });

  return (
    <Box flexDirection="column" paddingX={1}>
      <Box flexDirection="column">
        {LEMON.map((line, i) => (
          <Text key={i} color={colors.lemon}>{line}</Text>
        ))}
      </Box>
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
