import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ChatEngine } from '../engine/ChatEngine.js';
import { AIProvider, Message, ToolDef, SystemMessage } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { buildSystemMessages } from '../session/cache.js';
import { handleTurn } from '../stream/handler.js';
import { parseSlashCommand, SLASH_COMMANDS } from './SlashCommands.js';
import { getAgentName } from '../skills/loader.js';
import { getAiModeDisplay } from '../aiMode.js';
import { getCreditsSpaceId } from '../spaceSelection.js';
import { THINKING_WORDS } from './ThinkingIndicator.js';
import { truncateResult } from './ToolCall.js';
import { LEMON, SUGGESTED_PROMPTS } from './WelcomeBanner.js';
import { VERSION } from '../version.js';
import { MarkdownRenderer } from './MarkdownRenderer.js';
import { useChatEngine, UIMessage, ToolStatus } from './hooks/useChatEngine.js';
import { usePlanMode } from './hooks/usePlanMode.js';
import { PlanWizard } from './PlanWizard.js';

const SPINNER_FRAMES = ['\u280B', '\u2819', '\u2839', '\u2838', '\u283C', '\u2834', '\u2826', '\u2827', '\u2807', '\u280F'];

const TIPS = [
  'say "switch to my Berlin space"',
  '/help shows all commands',
  'chain actions: "create event, add ticket, publish"',
  'press Escape to cancel a response',
  'type "exit" or Ctrl+D to quit',
  '"how are ticket sales?" works naturally',
  '/clear starts a fresh session',
  '/mode credits to use community credits',
];

function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}

function randomThinkingWord(): string {
  return THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
}

// --- Sub-components ---

function ThinkingSpinner(): React.JSX.Element {
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

function ToolSpinner({ name }: { name: string }): React.JSX.Element {
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

function ToolResultLine({ tool }: { tool: ToolStatus }): React.JSX.Element {
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

function MessageView({ msg }: { msg: UIMessage }): React.JSX.Element {
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
      {msg.content ? <MarkdownRenderer text={msg.content} /> : null}
      {msg.tools?.map((tool) => (
        <Box key={tool.id} marginLeft={1}>
          <ToolResultLine tool={tool} />
        </Box>
      ))}
    </Box>
  );
}

// --- Welcome Banner ---

function WelcomeBannerView({ firstName, agentName, providerName, modelName }: {
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

// --- Main App ---

export interface AppProps {
  engine: ChatEngine;
  provider: AIProvider;
  formattedTools: unknown[];
  session: SessionState;
  registry: Record<string, ToolDef>;
  messages: Message[];
  firstName: string;
  agentName: string;
  displayOpts: {
    spaceName?: string;
    providerName: string;
    modelName: string;
  };
}

export function App({
  engine,
  provider,
  formattedTools,
  session,
  registry,
  messages: chatMessages,
  firstName,
  agentName,
  displayOpts,
}: AppProps): React.JSX.Element {
  const { exit } = useApp();
  const {
    messages,
    isStreaming,
    pendingConfirm,
    tokenCount,
    addUserMessage,
    addSystemMessage,
    clearMessages,
    confirmAction,
  } = useChatEngine(engine);

  const { planState, completePlan, cancelPlan, startManualPlan } = usePlanMode(engine);

  const [inputValue, setInputValue] = useState('');
  const [tip, setTip] = useState(randomTip);
  const [showThinking, setShowThinking] = useState(false);
  const [spaceName, setSpaceName] = useState(displayOpts.spaceName || 'none');
  const streamAbortRef = useRef<AbortController | null>(null);

  // Autocomplete state
  const [acIndex, setAcIndex] = useState(0);
  const [acScrollOffset, setAcScrollOffset] = useState(0);
  const AC_MAX_VISIBLE = 6;

  const showAutocomplete = inputValue.startsWith('/');
  const filteredCommands = showAutocomplete
    ? SLASH_COMMANDS.filter((cmd) => cmd.name.startsWith(inputValue))
    : [];

  useEffect(() => {
    const onToolDone = (data: { id: string; name: string; result?: unknown }) => {
      if (data.name === 'space switch' || data.name === 'space create') {
        const r = data.result as Record<string, unknown> | undefined;
        if (r?.title) setSpaceName(String(r.title));
      }
    };
    engine.on('tool_done', onToolDone);
    return () => { engine.off('tool_done', onToolDone); };
  }, [engine]);

  // Reset autocomplete index when input changes
  useEffect(() => {
    setAcIndex(0);
    setAcScrollOffset(0);
  }, [inputValue]);

  // Hide thinking spinner once assistant starts streaming text
  useEffect(() => {
    if (isStreaming && messages.length > 0) {
      const last = messages[messages.length - 1];
      if (last?.role === 'assistant' && last.content !== '') {
        setShowThinking(false);
      }
    }
  }, [isStreaming, messages]);

  // Update tip on each turn completion
  useEffect(() => {
    if (!isStreaming && tokenCount > 0) {
      setTip(randomTip());
      setShowThinking(false);
    }
  }, [isStreaming, tokenCount]);

  // Handle submit
  const handleSubmit = useCallback(async (value: string) => {
    const input = value.trim();
    if (!input) return;
    setInputValue('');

    // Exit commands
    if (['exit', 'quit', 'bye'].includes(input.toLowerCase())) {
      exit();
      return;
    }

    // Help shortcut
    if (input.toLowerCase() === 'help') {
      addSystemMessage(
        'Tips:\n' +
        '  Ask in natural language: "create an event called Demo Night tomorrow at 7pm"\n' +
        '  Chain actions: "create an event, add a free ticket, and publish it"\n' +
        '  Reference context: "add tickets to it" (refers to the last event)\n' +
        '  Destructive actions (cancel, delete) will ask for confirmation\n' +
        '  Type "exit" or press Ctrl+D to quit',
      );
      return;
    }

    // Slash commands
    const slashResult = parseSlashCommand(input);
    if (slashResult.handled) {
      if (slashResult.action === 'clear') {
        chatMessages.length = 0;
        clearMessages();
        addSystemMessage('Session cleared.');
        return;
      }
      if (slashResult.action === 'exit') {
        exit();
        return;
      }
      if (slashResult.action === 'mode') {
        const currentMode = getAiModeDisplay();
        if (slashResult.args === 'credits' || slashResult.args === 'own_key') {
          const { setAiModeConfig } = await import('../aiMode.js');
          setAiModeConfig(slashResult.args);
          addSystemMessage(`Restart the session to use ${slashResult.args} mode.`);
        } else {
          let modeInfo = `Current AI mode: ${currentMode}`;
          const creditsSpace = getCreditsSpaceId();
          if (creditsSpace) modeInfo += `\nCredits space: ${creditsSpace}`;
          modeInfo += '\nUsage: /mode credits  or  /mode own_key';
          addSystemMessage(modeInfo);
        }
        return;
      }
      if (slashResult.action === 'name') {
        if (slashResult.args) {
          const { setAgentName } = await import('../skills/loader.js');
          setAgentName(slashResult.args.trim());
          addSystemMessage(`Agent renamed to "${slashResult.args.trim()}".`);
        } else {
          addSystemMessage(`Agent name: ${getAgentName()}`);
        }
        return;
      }
      if (slashResult.action === 'plan') {
        if (slashResult.args) {
          const tool = registry[slashResult.args];
          if (tool) {
            addSystemMessage(`Starting guided mode for ${tool.displayName}...`);
            startManualPlan(tool);
          } else {
            // Try to find by displayName
            const match = Object.values(registry).find(
              (t) => t.displayName.toLowerCase() === slashResult.args!.toLowerCase() ||
                     t.name.toLowerCase() === slashResult.args!.toLowerCase(),
            );
            if (match) {
              addSystemMessage(`Starting guided mode for ${match.displayName}...`);
              startManualPlan(match);
            } else {
              addSystemMessage(`Unknown tool: ${slashResult.args}. Use a tool name like "event_create".`);
            }
          }
        } else {
          addSystemMessage('Usage: /plan <tool_name>\nExample: /plan event_create');
        }
        return;
      }
      if (slashResult.output) {
        addSystemMessage(slashResult.output);
        return;
      }
      return;
    }

    // Regular message: send to AI
    addUserMessage(input);
    setShowThinking(true);
    chatMessages.push({ role: 'user', content: input });

    const systemPrompt: SystemMessage[] = buildSystemMessages(session, provider.name);
    const abort = new AbortController();
    streamAbortRef.current = abort;

    try {
      await handleTurn(
        provider,
        chatMessages,
        formattedTools,
        systemPrompt,
        session,
        registry,
        null, // no readline
        true,
        engine,
        abort.signal,
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('context length') || msg.includes('too many tokens')) {
        addSystemMessage('Error: Session is too long. Start a new session: exit and run make-lemonade again.');
      } else {
        addSystemMessage(`Error: ${msg}`);
      }
    }
    streamAbortRef.current = null;
    setShowThinking(false);
  }, [engine, provider, formattedTools, session, registry, chatMessages, addUserMessage, addSystemMessage, clearMessages, exit]);

  // Keyboard handling
  useInput((input, key) => {
    // Enter key handling (submit or newline)
    if (key.return) {
      if (key.shift) {
        // Shift+Enter: insert newline
        setInputValue((prev) => prev + '\n');
        return;
      }
      // Plain Enter: submit
      onSubmit(inputValue);
      return;
    }

    if (key.escape) {
      if (planState.active) {
        cancelPlan();
        addSystemMessage('(plan cancelled)');
      } else if (streamAbortRef.current) {
        streamAbortRef.current.abort();
        streamAbortRef.current = null;
        setShowThinking(false);
        addSystemMessage('(cancelled)');
      } else {
        setInputValue('');
      }
      return;
    }

    // Autocomplete navigation
    if (showAutocomplete && filteredCommands.length > 0) {
      if (key.upArrow) {
        setAcIndex((prev) => {
          const next = prev <= 0 ? filteredCommands.length - 1 : prev - 1;
          // Adjust scroll offset
          if (next < acScrollOffset) {
            setAcScrollOffset(next);
          } else if (next >= acScrollOffset + AC_MAX_VISIBLE) {
            setAcScrollOffset(next - AC_MAX_VISIBLE + 1);
          }
          return next;
        });
        return;
      }
      if (key.downArrow) {
        setAcIndex((prev) => {
          const next = prev >= filteredCommands.length - 1 ? 0 : prev + 1;
          // Adjust scroll offset
          if (next >= acScrollOffset + AC_MAX_VISIBLE) {
            setAcScrollOffset(next - AC_MAX_VISIBLE + 1);
          } else if (next < acScrollOffset) {
            setAcScrollOffset(next);
          }
          return next;
        });
        return;
      }
      if (key.tab) {
        setInputValue(filteredCommands[acIndex].name);
        return;
      }
    }
  }, { isActive: true });

  // Wrap submit to intercept autocomplete selection on Enter
  const onSubmit = useCallback((value: string) => {
    if (showAutocomplete && filteredCommands.length > 0) {
      const selected = filteredCommands[acIndex].name;
      setInputValue(selected);
      handleSubmit(selected);
      return;
    }
    handleSubmit(value);
  }, [showAutocomplete, filteredCommands, acIndex, handleSubmit]);

  // Confirm dialog input
  useInput((input) => {
    if (pendingConfirm) {
      const lower = input.toLowerCase();
      if (lower === 'y') {
        confirmAction(pendingConfirm.id, true);
      } else if (lower === 'n') {
        confirmAction(pendingConfirm.id, false);
      }
    }
  }, { isActive: !!pendingConfirm });

  // Build visible messages
  const visibleMessages = messages;
  const hasThinking = showThinking && (
    messages.length === 0 ||
    messages[messages.length - 1]?.role !== 'assistant' ||
    messages[messages.length - 1]?.content === ''
  );

  return (
    <Box flexDirection="column">
      {/* Message area - natural document flow */}
      {visibleMessages.length === 0 && !hasThinking ? (
        <WelcomeBannerView
          firstName={firstName}
          agentName={agentName}
          providerName={displayOpts.providerName}
          modelName={displayOpts.modelName}
        />
      ) : null}
      {visibleMessages.map((msg, i) => (
        <Box key={i} paddingLeft={1} marginTop={1}>
          <MessageView msg={msg} />
        </Box>
      ))}
      {hasThinking ? (
        <Box paddingLeft={1}>
          <ThinkingSpinner />
        </Box>
      ) : null}
      {pendingConfirm ? (
        <Box paddingLeft={1}>
          <Text color="#FDE047">
            Confirm: {pendingConfirm.description}? (y/n){' '}
          </Text>
        </Box>
      ) : null}

      {/* Input area OR Plan Wizard */}
      {planState.active ? (
        <Box marginTop={2}>
          <PlanWizard
            toolDisplayName={planState.toolDisplayName}
            steps={planState.steps}
            onComplete={completePlan}
            onCancel={() => {
              cancelPlan();
              addSystemMessage('(plan cancelled)');
            }}
            spaceOptions={planState.spaces}
          />
        </Box>
      ) : (
        <>
          {/* Input field - flows after messages */}
          <Box
            marginTop={2}
            borderStyle="round"
            borderColor="#FDE047"
            paddingLeft={1}
            paddingRight={1}
          >
            <Text color="#FDE047">{'> '}</Text>
            <TextInput
              value={inputValue}
              onChange={setInputValue}
              focus={!pendingConfirm && !planState.active}
              showCursor={true}
              placeholder={isStreaming ? '' : 'Ask anything...'}
            />
          </Box>

          {/* Toolbar - flows after input */}
          {showAutocomplete ? (
            <Box flexDirection="column" paddingLeft={1}>
              {filteredCommands.length > 0 ? (
                filteredCommands
                  .slice(acScrollOffset, acScrollOffset + AC_MAX_VISIBLE)
                  .map((cmd, i) => {
                    const realIndex = i + acScrollOffset;
                    const isHighlighted = realIndex === acIndex;
                    return (
                      <Box key={cmd.name} justifyContent="space-between">
                        <Text inverse={isHighlighted}>
                          {isHighlighted ? '> ' : '  '}{cmd.name}
                        </Text>
                        <Text dimColor inverse={isHighlighted}>{cmd.description}</Text>
                      </Box>
                    );
                  })
              ) : (
                <Text dimColor>No matching commands</Text>
              )}
            </Box>
          ) : (
            <Box flexDirection="column" paddingLeft={1}>
              <Box justifyContent="space-between">
                <Text dimColor>Space: {spaceName}</Text>
                <Text dimColor>{displayOpts.modelName}</Text>
              </Box>
              <Box justifyContent="space-between">
                <Text>{''}</Text>
                <Text dimColor>Tip: {tip}</Text>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
