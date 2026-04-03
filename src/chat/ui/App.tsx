import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { MultilineInput } from './input/index.js';
import { ChatEngine } from '../engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { TurnCoordinator } from '../runtime/TurnCoordinator.js';
import { parseSlashCommand, SLASH_COMMANDS } from './SlashCommands.js';
import { executeSlashCommand } from '../runtime/SlashCommandRouter.js';
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
    isThinking,
    pendingConfirm,
    tokenCount,
    addUserMessage,
    addSystemMessage,
    clearMessages,
    confirmAction,
    resetStreaming,
  } = useChatEngine(engine);

  const { planState, completePlan, cancelPlan, startManualPlan } = usePlanMode(engine);
  const cachedSpacesRef = useRef<Array<{ _id: string; title: string; slug?: string }> | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [tip, setTip] = useState(randomTip);
  const [showThinking, setShowThinking] = useState(false);
  const [spaceName, setSpaceName] = useState(displayOpts.spaceName || 'none');

  const submitTurnIdRef = useRef(0);
  const turnCoordinatorRef = useRef<TurnCoordinator | null>(null);
  if (!turnCoordinatorRef.current) {
    turnCoordinatorRef.current = new TurnCoordinator({
      engine, provider, formattedTools, session, registry, chatMessages,
    });
  }
  // Keep deps current after re-render / provider change
  turnCoordinatorRef.current.updateDeps({
    engine, provider, formattedTools, session, registry, chatMessages,
  });
  const turnCoordinator = turnCoordinatorRef.current;

  // Reactive terminal width
  const [termColumns, setTermColumns] = useState(process.stdout.columns || 80);
  useEffect(() => {
    const onResize = () => setTermColumns(process.stdout.columns || 80);
    process.stdout.on('resize', onResize);
    return () => { process.stdout.off('resize', onResize); };
  }, []);
  const contentWidth = termColumns - 4;

  // Command history
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');

  // API key state (replaces pendingApiKeyRef)
  const [apiKeyPrompt, setApiKeyPrompt] = useState<{ connectionId: string; connectorType: string } | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');

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
    setCommandHistory(prev => {
      if (prev[prev.length - 1] === input) return prev;
      return [...prev, input];
    });
    setHistoryIndex(-1);
    setSavedInput('');

    // Exit commands (always allowed)
    if (['exit', 'quit', 'bye'].includes(input.toLowerCase())) {
      exit();
      return;
    }

    // Help shortcut (always allowed)
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

    // Slash commands — delegate to SlashCommandRouter
    const slashResult = parseSlashCommand(input);
    if (slashResult.handled) {
      await executeSlashCommand(slashResult, {
        addSystemMessage,
        addUserMessage,
        clearMessages,
        exit,
        engine,
        registry,
        session,
        chatMessages,
        turnCoordinator,
        startManualPlan,
        setSpaceName,
        setApiKeyPrompt,
        uiMessages: messages,
        displayOpts,
        spaceName,
        cachedSpacesRef,
      });
      return;
    }

    // Regular messages: coordinator is the single authority for turn acceptance.
    // submitMainTurn commits the user message to provider history before handleTurn reads it.
    const submit = turnCoordinator.submitMainTurn(input);
    if (!submit.accepted) {
      addSystemMessage(submit.error);
      return;
    }

    // UI-visible message committed after coordinator has accepted.
    addUserMessage(input);
    const myTurnId = ++submitTurnIdRef.current;
    setShowThinking(true);

    try {
      const result = await submit.completion;
      if (result.error) {
        addSystemMessage(result.error);
      }
    } catch {
      addSystemMessage('Error: unexpected failure during turn execution.');
    } finally {
      // Only clear thinking if no newer turn has started since this one.
      if (submitTurnIdRef.current === myTurnId) {
        setShowThinking(false);
      }
    }
  }, [engine, provider, formattedTools, session, registry, chatMessages, addUserMessage, addSystemMessage, clearMessages, exit, turnCoordinator, messages, displayOpts, spaceName, startManualPlan]);

  // History navigation callbacks
  const handleHistoryUp = useCallback(() => {
    if (commandHistory.length === 0) return;
    if (historyIndex === -1) setSavedInput(inputValue);
    const idx = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
    setHistoryIndex(idx);
    setInputValue(commandHistory[idx]);
  }, [commandHistory, historyIndex, inputValue]);

  const handleHistoryDown = useCallback(() => {
    if (historyIndex === -1) return;
    const idx = historyIndex + 1;
    if (idx >= commandHistory.length) {
      setHistoryIndex(-1);
      setInputValue(savedInput);
    } else {
      setHistoryIndex(idx);
      setInputValue(commandHistory[idx]);
    }
  }, [commandHistory, historyIndex, savedInput]);

  // Reset history browsing on manual edit
  const handleChange = useCallback((val: string) => {
    setInputValue(val);
    if (historyIndex !== -1) {
      setHistoryIndex(-1);
      setSavedInput('');
    }
  }, [historyIndex]);

  const handleExit = useCallback(() => { exit(); }, [exit]);

  const handleApiKeySubmit = useCallback(async (value: string) => {
    if (!apiKeyPrompt || !value.trim()) return;
    const { connectionId, connectorType } = apiKeyPrompt;
    addSystemMessage('Submitting API key...');
    try {
      const submitTool = registry['connector_submit_api_key'];
      await submitTool.execute({ connection_id: connectionId, api_key: value.trim() });
      setApiKeyPrompt(null);
      setApiKeyValue('');
      addSystemMessage(`${connectorType} connected! Use /connectors connected to verify.`);
    } catch (err) {
      // Keep apiKeyPrompt set so the masked input stays visible for retry
      setApiKeyValue('');
      addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}. Try again or press Escape to cancel.`);
    }
  }, [apiKeyPrompt, registry, addSystemMessage]);

  // Keyboard handling — only keys NOT handled by MultilineInput
  useInput((input, key) => {
    // Ctrl+L: clear screen (same as /clear)
    if (key.ctrl && input === 'l') {
      chatMessages.length = 0;
      clearMessages();
      addSystemMessage('Session cleared.');
      return;
    }

    if (key.escape) {
      if (apiKeyPrompt) {
        setApiKeyPrompt(null);
        setApiKeyValue('');
        addSystemMessage('API key entry cancelled.');
      } else if (planState.active) {
        cancelPlan();
        addSystemMessage('(plan cancelled)');
      } else if (turnCoordinator.cancelMainTurn()) {
        setShowThinking(false);
        resetStreaming();
        addSystemMessage('(cancelled)');
      } else if (turnCoordinator.cancelAllBtw()) {
        resetStreaming();
        addSystemMessage('(btw cancelled)');
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
  const hasThinking = (showThinking || isThinking) && (
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
            columns={contentWidth}
          />
        </Box>
      ) : (
        <>
          {/* Input field - flows after messages */}
          {apiKeyPrompt ? (
            <Box marginTop={2} borderStyle="round" borderColor="yellow" paddingLeft={1} paddingRight={1}>
              <Text color="yellow">{'\uD83D\uDD11 '}</Text>
              <Box flexGrow={1}>
                <MultilineInput
                  value={apiKeyValue}
                  onChange={setApiKeyValue}
                  onSubmit={handleApiKeySubmit}
                  focus={!!apiKeyPrompt && !pendingConfirm}
                  columns={contentWidth - 6}
                  mask="*"
                  singleLine={true}
                  placeholder="Paste API key... (Escape to cancel)"
                />
              </Box>
            </Box>
          ) : (
            <Box marginTop={2} borderStyle="round" borderColor="#FDE047" paddingLeft={1} paddingRight={1}>
              <Text color="#FDE047">{'> '}</Text>
              <Box flexGrow={1}>
                <MultilineInput
                  value={inputValue}
                  onChange={handleChange}
                  onSubmit={onSubmit}
                  onHistoryUp={handleHistoryUp}
                  onHistoryDown={handleHistoryDown}
                  onExit={handleExit}
                  focus={!pendingConfirm && !planState.active && !apiKeyPrompt}
                  columns={contentWidth - 2}
                  maxVisibleLines={8}
                  placeholder={isStreaming ? '' : 'How can I help... #makelemonade (Shift+Enter for new line)'}
                  continuationPrefix=""
                  suppressNavigation={showAutocomplete && filteredCommands.length > 0}
                />
              </Box>
            </Box>
          )}

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
