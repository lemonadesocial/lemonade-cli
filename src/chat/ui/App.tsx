import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { render, Box, Text, useApp, useInput } from 'ink';
import { AIProvider, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { InputArea } from './InputArea.js';
import { StatusBar } from './StatusBar.js';
import { ToolCallGroup } from './ToolCallGroup.js';
import { ConfirmPrompt } from './ConfirmPrompt.js';
import { ErrorDisplay } from './ErrorDisplay.js';
import { ThinkingIndicator } from './ThinkingIndicator.js';
import { useChatEngine } from './hooks/useChatEngine.js';
import { parseSlashCommand, getModelsForProvider, SLASH_COMMANDS } from './SlashCommands.js';
import { getAgentName, setAgentName } from '../skills/loader.js';
import { formatUserMessage, formatAssistantMessage } from './writeMessage.js';
import { formatWelcomeBanner } from './WelcomeBanner.js';
import { getAiModeDisplay } from '../aiMode.js';

interface AppProps {
  provider: AIProvider;
  session: SessionState;
  registry: Record<string, ToolDef>;
  formattedTools: unknown[];
  user: { _id: string; name: string; email: string; first_name: string };
  creditsSpaceName?: string;
}

const ALL_SLASH_NAMES = SLASH_COMMANDS.map((c) => c.name);

/*
 * RENDERING ARCHITECTURE: split stdout + Ink
 *
 * Completed messages and the welcome banner are written directly to
 * process.stdout.write(). This produces natural terminal scrollback that
 * the user can scroll with their terminal emulator.
 *
 * Ink renders ONLY the live/interactive elements at the bottom:
 *   - ThinkingIndicator (while waiting for first token)
 *   - Streaming text (tokens arriving in real-time)
 *   - ToolCallGroup (active tool calls)
 *   - ConfirmPrompt (destructive-action confirmation)
 *   - InputArea (user text input)
 *   - StatusBar (tips, streaming status, errors)
 *
 * NO height prop on the root Box — Ink renders at the cursor position
 * (always at the bottom after stdout writes).
 *
 * Scenario verification:
 *
 * 1. Short message + short response:
 *    User msg written to stdout, response written to stdout after streaming
 *    completes. Both visible in terminal scrollback above Ink input.
 *    Works because stdout.write() appends to scrollback and Ink sits below.
 *
 * 2. 50-line streaming response:
 *    Tokens render in Ink's streaming <Text>. Terminal grows naturally as
 *    Ink re-renders. When done, full text flushed to stdout, Ink clears
 *    streaming state. Scrollback contains the full response.
 *    Works because Ink has no height constraint — it just renders at cursor.
 *
 * 3. 20+ messages:
 *    All completed messages live in terminal scrollback. User scrolls with
 *    terminal (mouse wheel, Shift+PgUp). Ink stays at bottom.
 *    Works because messages are stdout output, not Ink-managed.
 *
 * 4. User scrolls up then sends new message:
 *    stdout.write() appends at bottom, terminal auto-scrolls to new output.
 *    Works because stdout writes always go to the end of scrollback.
 *
 * 5. Streaming tokens:
 *    Ink re-renders the streaming <Text> on each delta. Always visible
 *    because Ink is at the cursor position (bottom of terminal).
 *    Works because Ink's default non-fullscreen mode tracks the cursor.
 */

function App({ provider, session, registry, formattedTools, user, creditsSpaceName }: AppProps): React.ReactElement {
  const { exit } = useApp();
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [slashOutput, setSlashOutput] = useState<string | null>(null);
  const [agentName, setAgentNameState] = useState(() => getAgentName());
  const [modelName, setModelName] = useState(() => provider.model);
  const [inputValue, setInputValue] = useState('');
  const [showBanner, setShowBanner] = useState(true);

  // Track how many messages have been flushed to stdout
  const flushedCountRef = useRef(0);
  const bannerWrittenRef = useRef(false);

  const {
    messages,
    streamingText,
    isStreaming,
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

  // Write the welcome banner to stdout once on first render
  useEffect(() => {
    if (!bannerWrittenRef.current) {
      bannerWrittenRef.current = true;
      const banner = formatWelcomeBanner({
        providerName: provider.name,
        modelName: provider.model,
        firstName: user.first_name || user.name,
        agentName,
      });
      process.stdout.write(banner);
    }
  }, []);

  // Flush completed messages to stdout as they appear.
  // This gives us natural terminal scrollback instead of Ink fullscreen.
  useEffect(() => {
    const newMessages = messages.slice(flushedCountRef.current);
    for (const msg of newMessages) {
      if (msg.role === 'user') {
        process.stdout.write(formatUserMessage(msg.text));
      } else {
        process.stdout.write(formatAssistantMessage(msg.text));
      }
    }
    flushedCountRef.current = messages.length;
  }, [messages]);

  // Reset flushed count when history is cleared
  useEffect(() => {
    if (messages.length === 0) {
      flushedCountRef.current = 0;
    }
  }, [messages.length]);

  useInput((input, key) => {
    if (key.escape && isStreaming) {
      cancelStream();
    }
  });

  // Slash command suggestions filtered by current input
  const slashSuggestions = useMemo(() => {
    if (!inputValue.startsWith('/')) return undefined;
    return ALL_SLASH_NAMES.filter((name) => name.startsWith(inputValue));
  }, [inputValue]);

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value);
  }, []);

  const handleSubmit = useCallback((text: string) => {
    setSlashOutput(null);
    setInputValue('');

    const cmd = parseSlashCommand(text);
    if (cmd.handled) {
      switch (cmd.action) {
        case 'exit':
          exit();
          return;

        case 'clear':
          clearHistory();
          setShowBanner(true);
          bannerWrittenRef.current = false;
          // Re-write the banner
          {
            const banner = formatWelcomeBanner({
              providerName: provider.name,
              modelName: modelName,
              firstName: user.first_name || user.name,
              agentName,
            });
            process.stdout.write(banner);
            bannerWrittenRef.current = true;
          }
          return;

        case 'help':
          setSlashOutput(cmd.output || '');
          return;

        case 'model': {
          if (!cmd.args) {
            const models = getModelsForProvider(provider.name);
            const list = models
              .map((m) => (m === modelName ? `  * ${m} (current)` : `    ${m}`))
              .join('\n');
            setSlashOutput(`Models for ${provider.name}:\n${list}`);
          } else {
            const models = getModelsForProvider(provider.name);
            if (models.includes(cmd.args)) {
              provider.model = cmd.args;
              setModelName(cmd.args);
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

        case 'mode': {
          const current = getAiModeDisplay();
          if (cmd.args === 'credits') {
            setSlashOutput(`Current mode: ${current}\nTo switch to credits mode, exit and run: make-lemonade --mode credits`);
          } else if (cmd.args === 'own_key') {
            setSlashOutput(`Current mode: ${current}\nTo switch to own-key mode, exit and run: make-lemonade --mode own_key`);
          } else {
            setSlashOutput(`Current mode: ${current}\nUsage: /mode credits  or  /mode own_key\nMode changes require restarting the session.`);
          }
          return;
        }

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
    sendMessage(text);
  }, [showBanner, sendMessage, exit, clearHistory, provider, session, modelName, agentName, user]);

  return (
    <Box flexDirection="column">
      {isStreaming && !streamingText ? <ThinkingIndicator /> : null}
      {isStreaming && streamingText ? (
        <Box paddingX={1} marginTop={1}>
          <Text>{streamingText}</Text>
        </Box>
      ) : null}

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

      {!pendingConfirmation ? (
        <InputArea
          onSubmit={handleSubmit}
          disabled={isStreaming}
          defaultValue={pendingPrompt ?? undefined}
          onChange={handleInputChange}
          suggestions={slashSuggestions}
        />
      ) : null}

      <StatusBar
        spaceName={session.currentSpace?.title}
        creditsSpaceName={creditsSpaceName}
        providerName={provider.name}
        modelName={modelName}
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
