import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { THINKING_WORDS } from './ThinkingIndicator.js';
import { truncateResult } from './ToolCall.js';
import { LEMON, SUGGESTED_PROMPTS } from './WelcomeBanner.js';
import { VERSION } from '../version.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import type { UIMessage, ToolStatus } from './hooks/useChatEngine.js';

export const SPINNER_FRAMES = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

export const TIPS = [
  'say "switch to my Berlin space"',
  '/help shows all commands',
  'chain actions: "create event, add ticket, publish"',
  'press Escape to cancel a response',
  'type "exit" or Ctrl+D to quit',
  '"how are ticket sales?" works naturally',
  '/clear starts a fresh session',
  '/mode credits to use community credits',
  'Shift+Enter adds a new line',
  'Ctrl+L clears the screen',
  'Ctrl+U clears your input',
  '/btw asks a side question while AI is working',
  '/plan event_create walks you through step by step',
  '/version checks for CLI updates',
  '"create event" triggers guided plan mode',
  '"check my Stripe status" just works',
  'type / to see all available commands',
];

export function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

export function randomThinkingWord(): string {
  return THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
}

export function ThinkingSpinner(): React.JSX.Element {
  const [frame, setFrame] = useState(0);
  const [word, setWord] = useState(randomThinkingWord);

  useEffect(() => {
    const frameTimer = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    const wordTimer = setInterval(() => {
      setWord(randomThinkingWord());
    }, 2500);
    return () => {
      clearInterval(frameTimer);
      clearInterval(wordTimer);
    };
  }, []);

  return (
    <Text color="#C4B5FD">
      {SPINNER_FRAMES[frame]} {word}...
    </Text>
  );
}

export function ToolSpinner({ name }: { name: string }): React.JSX.Element {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % SPINNER_FRAMES.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text color="#C4B5FD">
      {SPINNER_FRAMES[frame]} Running: {name}...
    </Text>
  );
}

export function ToolResultLine({ tool }: { tool: ToolStatus }): React.JSX.Element {
  if (tool.status === 'running') {
    return <ToolSpinner name={tool.name} />;
  }
  if (tool.status === 'error') {
    const preview = tool.error ? truncateResult(String(tool.error)) : '';
    return (
      <Box flexDirection="column">
        <Text>
          <Text color="#FF637E">{'\u2718'}</Text> Failed: {tool.name}
        </Text>
        {preview ? <Text dimColor>    {preview}</Text> : null}
      </Box>
    );
  }
  // done
  const text = tool.result !== undefined && tool.result !== null
    ? (typeof tool.result === 'string' ? tool.result : JSON.stringify(tool.result))
    : '';
  const preview = truncateResult(text);
  return (
    <Box flexDirection="column">
      <Text>
        <Text color="#10B981">{'\u2714'}</Text> Done: {tool.name}
      </Text>
      {preview.length > 0 && preview.length < 200 ? <Text dimColor>    {preview}</Text> : null}
    </Box>
  );
}

export function MessageView({ msg }: { msg: UIMessage }): React.JSX.Element {
  if (msg.role === 'user') {
    return <Text dimColor>{'> '}{msg.content}</Text>;
  }
  if (msg.role === 'system') {
    const isError = msg.content.startsWith('Error:');
    if (isError) {
      let hint = '';
      if (msg.content.includes('auth') || msg.content.includes('401') || msg.content.includes('Unauthorized')) {
        hint = '  Run lemonade auth login';
      } else if (msg.content.includes('context length') || msg.content.includes('too many tokens')) {
        hint = '  Use /clear to start fresh';
      }
      return (
        <Box flexDirection="column">
          <Text color="#FF637E">{msg.content}</Text>
          {hint ? <Text dimColor>{hint}</Text> : null}
        </Box>
      );
    }
    return <Text color="#FDE047">{msg.content}</Text>;
  }
  // assistant
  return (
    <Box flexDirection="column">
      {msg.turnId?.startsWith('btw-') ? <Text color="#67E8F9">{'btw \u2192 '}</Text> : null}
      {msg.content ? <MarkdownRenderer text={msg.content} /> : null}
      {msg.tools?.map((tool) => (
        <Box key={tool.id} marginLeft={1}>
          <ToolResultLine tool={tool} />
        </Box>
      ))}
    </Box>
  );
}

export function WelcomeBannerView({ firstName, agentName, providerName, modelName }: {
  firstName: string;
  agentName: string;
  providerName: string;
  modelName: string;
}): React.JSX.Element {
  return (
    <Box flexDirection="column" paddingLeft={1}>
      {LEMON.map((line, i) => (
        <Text key={i} color="#FDE047">{line}</Text>
      ))}
      <Text>
        <Text bold>make-lemonade</Text>
        <Text dimColor>{` v${VERSION} | ${providerName} | ${modelName}`}</Text>
      </Text>
      <Text>{''}</Text>
      <Text>{` Hey ${firstName}! I'm ${agentName}, your event concierge. What would you like to do?`}</Text>
      <Text>{''}</Text>
      {SUGGESTED_PROMPTS.map((prompt, i) => (
        <Text key={i} dimColor>{`   ${i + 1}. "${prompt}"`}</Text>
      ))}
      <Text>{''}</Text>
      <Text dimColor>   Type /help for commands, Ctrl+D to quit</Text>
      <Text>{''}</Text>
      <Text dimColor>   Note: Tool results (including event and guest data) are sent to your AI provider.</Text>
    </Box>
  );
}
