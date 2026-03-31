import React, { useState, useCallback, useEffect } from 'react';
import { render, Box, Text, useApp, useInput, useStdout } from 'ink';
import { AIProvider, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { Header } from './Header.js';
import { WelcomeBanner } from './WelcomeBanner.js';
import { MessageArea } from './MessageArea.js';
import { InputArea } from './InputArea.js';
import { StatusBar } from './StatusBar.js';
import { ToolCallGroup } from './ToolCallGroup.js';
import { ConfirmPrompt } from './ConfirmPrompt.js';
import { ErrorDisplay } from './ErrorDisplay.js';
import { useChatEngine } from './hooks/useChatEngine.js';
import { parseSlashCommand, getModelsForProvider } from './SlashCommands.js';
import { getAgentName, setAgentName } from '../skills/loader.js';

interface AppProps {
  provider: AIProvider;
  session: SessionState;
  registry: Record<string, ToolDef>;
  formattedTools: unknown[];
  user: { _id: string; name: string; email: string; first_name: string };
}

// Header = 2 lines, InputArea = 3 lines, StatusBar = 2 lines
const FIXED_CHROME_HEIGHT = 7;

function App({ provider, session, registry, formattedTools, user }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [rows, setRows] = useState(() => stdout.rows || 24);
  const [showBanner, setShowBanner] = useState(true);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [slashOutput, setSlashOutput] = useState<string | null>(null);
  const [agentName, setAgentNameState] = useState(() => getAgentName());
  const [scrollOffset, setScrollOffset] = useState(0);

  useEffect(() => {
    const onResize = () => setRows(stdout.rows || 24);
    stdout.on('resize', onResize);
    return () => { stdout.off('resize', onResize); };
  }, [stdout]);

  const {
    messages,
    streamingText,
    isStreaming,
    tokenCount,
    streamTokenCount,
    lastError,
    classifiedError,
    lastToolName,
    toolCalls,
    sendMessage,
    clearHistory,
    cancelStream,
    pendingConfirmation,
    confirmAction,
  } = useChatEngine({ provider, session, registry, formattedTools });

  const messageAreaHeight = Math.max(rows - FIXED_CHROME_HEIGHT, 3);

  useInput((_input, key) => {
    if (key.escape && isStreaming) {
      cancelStream();
    }
    if (key.upArrow && !isStreaming) {
      setScrollOffset((prev) => prev + 1);
    }
    if (key.downArrow && !isStreaming) {
      setScrollOffset((prev) => Math.max(prev - 1, 0));
    }
  });

  const handleSubmit = useCallback((text: string) => {
    setSlashOutput(null);

    const cmd = parseSlashCommand(text);
    if (cmd.handled) {
      switch (cmd.action) {
        case 'exit':
          exit();
          return;

        case 'clear':
          clearHistory();
          setShowBanner(true);
          return;

        case 'help':
          setSlashOutput(cmd.output || '');
          return;

        case 'model': {
          if (!cmd.args) {
            const models = getModelsForProvider(provider.name);
            const list = models
              .map((m) => (m === provider.model ? `  * ${m} (current)` : `    ${m}`))
              .join('\n');
            setSlashOutput(`Models for ${provider.name}:\n${list}`);
          } else {
            const models = getModelsForProvider(provider.name);
            if (models.includes(cmd.args)) {
              provider.model = cmd.args;
              setSlashOutput(`Switched to ${cmd.args}`);
            } else {
              setSlashOutput(`Unknown model: "${cmd.args}". Available: ${models.join(', ')}`);
            }
          }
          return;
        }

        case 'provider':
          if (!cmd.args) {
            setSlashOutput('Usage: /provider <name>');
          } else {
            setSlashOutput('Provider switching requires API keys. Configure keys and restart.');
          }
          return;

        case 'space':
          setSlashOutput(`Current space: ${session.currentSpace?.title || 'none'}`);
          return;

        case 'name':
          if (!cmd.args) {
            setSlashOutput(`Agent name: ${agentName}`);
          } else {
            const newName = cmd.args.trim();
            setAgentName(newName);
            setAgentNameState(newName);
            setSlashOutput(`Agent renamed to "${newName}"`);
          }
          return;

        default:
          if (cmd.output) setSlashOutput(cmd.output);
          return;
      }
    }

    if (showBanner) setShowBanner(false);
    setPendingPrompt(null);
    setScrollOffset(0);
    sendMessage(text);
  }, [showBanner, sendMessage, exit, clearHistory, provider, session]);

  const handleSelectPrompt = useCallback((text: string) => {
    setPendingPrompt(text);
  }, []);

  return (
    <Box flexDirection="column" height={rows}>
      <Header
        providerName={provider.name}
        modelName={provider.model}
        spaceName={session.currentSpace?.title}
        tokenCount={tokenCount}
      />

      <Box flexDirection="column" height={messageAreaHeight} overflow="hidden">
        {showBanner && messages.length === 0 ? (
          <WelcomeBanner
            providerName={provider.name}
            modelName={provider.model}
            firstName={user.first_name || user.name}
            agentName={agentName}
            onSelectPrompt={handleSelectPrompt}
          />
        ) : null}

        <MessageArea
          messages={messages}
          streamingText={streamingText}
          isStreaming={isStreaming}
          maxHeight={messageAreaHeight}
          scrollOffset={scrollOffset}
        />

        {toolCalls.length > 0 ? <ToolCallGroup calls={toolCalls} /> : null}

        {classifiedError ? (
          <ErrorDisplay
            type={classifiedError.type}
            message={classifiedError.message}
            retryAfter={classifiedError.retryAfter}
          />
        ) : null}

        {slashOutput ? (
          <Box paddingX={2} marginY={0}>
            <Box flexDirection="column">
              {slashOutput.split('\n').map((line, i) => (
                <Text key={i} dimColor>{line}</Text>
              ))}
            </Box>
          </Box>
        ) : null}

        {pendingConfirmation ? (
          <ConfirmPrompt
            description={pendingConfirmation.description}
            onConfirm={(confirmed) => confirmAction(pendingConfirmation.id, confirmed)}
          />
        ) : null}
      </Box>

      {!pendingConfirmation ? (
        <InputArea
          onSubmit={handleSubmit}
          disabled={isStreaming}
          defaultValue={pendingPrompt ?? undefined}
        />
      ) : null}

      <StatusBar
        agentName={agentName}
        spaceName={session.currentSpace?.title}
        providerName={provider.name}
        modelName={provider.model}
        isStreaming={isStreaming}
        streamTokenCount={streamTokenCount}
        lastError={lastError}
        lastToolName={lastToolName}
      />
    </Box>
  );
}

export async function renderApp(props: AppProps): Promise<void> {
  const instance = render(<App {...props} />, { exitOnCtrlC: true });
  await instance.waitUntilExit();
}
