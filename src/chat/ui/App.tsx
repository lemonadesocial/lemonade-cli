import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Text, useApp, useInput } from 'ink';
import { MultilineInput } from './input/index.js';
import { ChatEngine } from '../engine/ChatEngine.js';
import { AIProvider, Message, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { TurnCoordinator } from '../runtime/TurnCoordinator.js';
import { parseSlashCommand } from './SlashCommands.js';
import { executeSlashCommand } from '../runtime/SlashCommandRouter.js';
import { useChatEngine } from './hooks/useChatEngine.js';
import { usePlanMode } from './hooks/usePlanMode.js';
import { useCommandHistory } from './hooks/useCommandHistory.js';
import { useAutocomplete, AC_MAX_VISIBLE } from './hooks/useAutocomplete.js';
import { PlanWizard } from './PlanWizard.js';
import {
  ThinkingSpinner,
  MessageView,
  WelcomeBannerView,
  randomTip,
} from './MessageComponents.js';

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
  const history = useCommandHistory();

  const [inputValue, setInputValue] = useState('');
  const [tip, setTip] = useState(randomTip);
  const [showThinking, setShowThinking] = useState(false);
  const [spaceName, setSpaceName] = useState(displayOpts.spaceName || 'none');

  const autocomplete = useAutocomplete(inputValue);

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

  // API key state
  const [apiKeyPrompt, setApiKeyPrompt] = useState<{ connectionId: string; connectorType: string } | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState('');

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

  const { recordSubmit, handleHistoryUp: historyUp, handleHistoryDown: historyDown, resetBrowsing } = history;
  const { showAutocomplete, filteredCommands, selectCurrent } = autocomplete;

  // Handle submit
  const handleSubmit = useCallback(async (value: string) => {
    const input = value.trim();
    if (!input) return;
    setInputValue('');
    recordSubmit(input);

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
    // ORDERING CONSTRAINT: submitMainTurn must be called before addUserMessage.
    // The coordinator must accept the turn before the UI commits the message,
    // otherwise a rejected turn would leave a dangling user message in the UI.
    const submit = turnCoordinator.submitMainTurn(input);
    if (!submit.accepted) {
      addSystemMessage(submit.error);
      return;
    }

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
      if (submitTurnIdRef.current === myTurnId) {
        setShowThinking(false);
      }
    }
  }, [engine, provider, formattedTools, session, registry, chatMessages, addUserMessage, addSystemMessage, clearMessages, exit, turnCoordinator, messages, displayOpts, spaceName, startManualPlan, recordSubmit]);

  // Input change with history reset
  const handleChange = useCallback((val: string) => {
    setInputValue(val);
    resetBrowsing();
  }, [resetBrowsing]);

  const handleHistoryUp = useCallback(() => {
    const val = historyUp(inputValue);
    if (val !== null) setInputValue(val);
  }, [historyUp, inputValue]);

  const handleHistoryDown = useCallback(() => {
    const val = historyDown();
    if (val !== null) setInputValue(val);
  }, [historyDown]);

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
    if (autocomplete.showAutocomplete && autocomplete.filteredCommands.length > 0) {
      if (key.upArrow) {
        autocomplete.navigateUp();
        return;
      }
      if (key.downArrow) {
        autocomplete.navigateDown();
        return;
      }
      if (key.tab) {
        const selected = autocomplete.selectCurrent();
        if (selected) setInputValue(selected);
        return;
      }
    }
  }, { isActive: true });

  // Wrap submit to intercept autocomplete selection on Enter
  const onSubmit = useCallback((value: string) => {
    if (showAutocomplete && filteredCommands.length > 0) {
      const selected = selectCurrent();
      if (selected) {
        handleSubmit(selected);
        return;
      }
    }
    handleSubmit(value);
  }, [showAutocomplete, filteredCommands, selectCurrent, handleSubmit]);

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
                  suppressNavigation={autocomplete.showAutocomplete && autocomplete.filteredCommands.length > 0}
                />
              </Box>
            </Box>
          )}

          {/* Toolbar - flows after input */}
          {autocomplete.showAutocomplete ? (
            <Box flexDirection="column" paddingLeft={1}>
              {autocomplete.filteredCommands.length > 0 ? (
                autocomplete.filteredCommands
                  .slice(autocomplete.acScrollOffset, autocomplete.acScrollOffset + AC_MAX_VISIBLE)
                  .map((cmd, i) => {
                    const realIndex = i + autocomplete.acScrollOffset;
                    const isHighlighted = realIndex === autocomplete.acIndex;
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
