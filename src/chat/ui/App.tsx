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
  const [previousLines, setPreviousLines] = useState<string[]>([]);
  const [tip, setTip] = useState(randomTip);
  const [showThinking, setShowThinking] = useState(false);
  const [spaceName, setSpaceName] = useState(displayOpts.spaceName || 'none');
  const streamAbortRef = useRef<AbortController | null>(null);
  const turnInProgressRef = useRef(false);
  const btwAbortsRef = useRef<Map<string, AbortController>>(new Map());
  const pendingApiKeyRef = useRef<{ connectionId: string; connectorType: string } | null>(null);

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
    setPreviousLines([]);

    // Check if we're collecting an API key (from /connectors connect)
    if (pendingApiKeyRef.current) {
      const { connectionId, connectorType } = pendingApiKeyRef.current;
      pendingApiKeyRef.current = null;
      addSystemMessage('Submitting API key...');
      try {
        const submitTool = registry['connector_submit_api_key'];
        await submitTool.execute({ connection_id: connectionId, api_key: input });
        addSystemMessage(`${connectorType} connected! Use /connectors connected to verify.`);
      } catch (err) {
        addSystemMessage(`Failed to submit API key: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      return;
    }

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

    // Slash commands - parse first, some allowed during active turn
    const slashResult = parseSlashCommand(input);
    if (slashResult.handled) {
      // /btw - ALWAYS allowed, even during active turn
      if (slashResult.action === 'btw') {
        const btwInput = slashResult.args;
        if (!btwInput) {
          addSystemMessage('Usage: /btw <message>');
          return;
        }

        // Show btw user message in chat
        addUserMessage(`btw: ${btwInput}`);

        // Clone message history for isolation
        const snapshot: Message[] = JSON.parse(JSON.stringify(chatMessages));
        snapshot.push({ role: 'user', content: btwInput });

        // Clone session for isolation
        const btwSession = { ...session };

        const btwTurnId = `btw-${Date.now()}`;
        const btwSystemPrompt: SystemMessage[] = buildSystemMessages(btwSession, provider.name);
        btwSystemPrompt.push({
          type: 'text',
          text: 'BTW SIDE REQUEST: Keep response to 1-2 sentences MAX. Answer the specific question only. Do not reference or modify the main task in progress. No follow-up questions. Execute at most one tool call. No personality flair.',
        });

        const btwAbort = new AbortController();
        btwAbortsRef.current.set(btwTurnId, btwAbort);

        // Fire and forget - runs in parallel
        handleTurn(
          provider, snapshot, formattedTools, btwSystemPrompt,
          btwSession, registry, null, true, engine, btwAbort.signal, btwTurnId,
        ).catch((err) => {
          addSystemMessage(`btw error: ${err instanceof Error ? err.message : 'Unknown'}`);
        }).finally(() => {
          btwAbortsRef.current.delete(btwTurnId);
        });

        return;
      }

      // All other slash commands require no active turn (except already handled above)
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
      if (slashResult.action === 'version') {
        const currentVersion = VERSION;
        addSystemMessage(`Current version: v${currentVersion}`);
        addSystemMessage('Checking for updates...');
        try {
          const response = await fetch('https://registry.npmjs.org/@lemonade-social/cli/latest');
          const data = await response.json() as { version: string };
          const latestVersion = data.version;
          if (currentVersion === latestVersion) {
            addSystemMessage(`You're on the latest version (v${currentVersion}).`);
          } else {
            addSystemMessage(`Update available: v${currentVersion} \u2192 v${latestVersion}`);
            const confirmed = await engine.requestConfirmation('update-cli', `Update to v${latestVersion}`);
            if (confirmed) {
              addSystemMessage('Updating...');
              const { execSync } = await import('child_process');
              try {
                execSync('npm install -g @lemonade-social/cli', { stdio: 'pipe' });
                addSystemMessage(`Updated to v${latestVersion}.`);
                const restart = await engine.requestConfirmation('restart-cli', 'Restart session to use new version');
                if (restart) {
                  addSystemMessage(`Updated to v${latestVersion}. Exiting to apply update...`);
                  setTimeout(() => exit(), 200);
                }
              } catch (installErr) {
                const errMsg = installErr instanceof Error ? installErr.message : 'Unknown error';
                addSystemMessage(`Update failed: ${errMsg}. Try manually: npm install -g @lemonade-social/cli`);
              }
            } else {
              addSystemMessage('Update skipped. Run /version anytime to update.');
            }
          }
        } catch {
          addSystemMessage('Could not check for updates. Run: npm install -g @lemonade-social/cli');
        }
        return;
      }
      if (slashResult.action === 'status') {
        const lines: string[] = [
          `Model: ${displayOpts.modelName}`,
          `Provider: ${displayOpts.providerName}`,
          `Mode: ${getAiModeDisplay()}`,
          `Space: ${spaceName}`,
        ];
        if (session.currentEvent) {
          lines.push(`Event: ${session.currentEvent.title} (${session.currentEvent._id})`);
        }
        if (session.timezone) {
          lines.push(`Timezone: ${session.timezone}`);
        }
        lines.push(`Agent: ${getAgentName()}`);
        lines.push(`CLI: v${VERSION}`);
        addSystemMessage(lines.join('\n'));
        return;
      }
      if (slashResult.action === 'events') {
        addSystemMessage('Fetching events...');
        try {
          const tool = registry['event_list'];
          const args: Record<string, unknown> = {};
          if (slashResult.args) {
            if (slashResult.args === '--draft' || slashResult.args === 'draft') {
              args.draft = true;
            } else {
              args.search = slashResult.args;
            }
          }
          const result = await tool.execute(args) as { items?: Array<Record<string, unknown>> };
          if (!result?.items?.length) {
            addSystemMessage('No events found.');
          } else {
            const lines = result.items.map((e: Record<string, unknown>, i: number) => {
              const status = e.published ? 'Published' : 'Draft';
              const date = e.start ? new Date(e.start as string).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : '';
              return `${i + 1}. ${e.title} — ${date} — ${status}`;
            });
            addSystemMessage(lines.join('\n'));
          }
        } catch (err) {
          addSystemMessage(`Failed to fetch events: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        return;
      }
      if (slashResult.action === 'spaces') {
        try {
          // Use cached spaces for /spaces <n> to avoid re-fetch ordering mismatch
          let spaces: Array<{ _id: string; title: string; slug?: string }>;
          if (slashResult.args && cachedSpacesRef.current) {
            spaces = cachedSpacesRef.current;
          } else {
            addSystemMessage('Fetching spaces...');
            const tool = registry['space_list'];
            const result = await tool.execute({}) as { items?: Array<{ _id: string; title: string; slug?: string }> };
            if (!result?.items?.length) {
              addSystemMessage('No spaces found.');
              return;
            }
            spaces = result.items;
            cachedSpacesRef.current = spaces;
          }

          // /spaces <number> — switch directly using cached list
          if (slashResult.args && /^\d+$/.test(slashResult.args)) {
            const idx = parseInt(slashResult.args, 10) - 1;
            if (idx >= 0 && idx < spaces.length) {
              const switchTool = registry['space_switch'];
              const switched = await switchTool.execute({ space_id: spaces[idx]._id }) as { _id: string; title: string };
              addSystemMessage(`Switched to ${switched.title}.`);
              setSpaceName(switched.title);
            } else {
              addSystemMessage(`Invalid number. Use 1-${spaces.length}.`);
            }
            return;
          }

          // /spaces <name> — fuzzy match and switch
          if (slashResult.args) {
            const query = slashResult.args.toLowerCase();
            const match = spaces.find(s => s.title.toLowerCase().includes(query));
            if (match) {
              const switchTool = registry['space_switch'];
              const switched = await switchTool.execute({ space_id: match._id }) as { _id: string; title: string };
              addSystemMessage(`Switched to ${switched.title}.`);
              setSpaceName(switched.title);
            } else {
              addSystemMessage(`No space matching "${slashResult.args}". Use /spaces to see all.`);
            }
            return;
          }

          // /spaces (no args) — list with hint
          const lines = spaces.map((s, i) => {
            const current = session.currentSpace?._id === s._id ? ' (current)' : '';
            return `${i + 1}. ${s.title}${current}`;
          });
          lines.push('');
          lines.push('Type /spaces <number> to switch, e.g. /spaces 3');
          addSystemMessage(lines.join('\n'));
        } catch (err) {
          addSystemMessage(`Failed to fetch spaces: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        return;
      }
      if (slashResult.action === 'credits') {
        try {
          const tool = registry['credits_balance'];
          if (!tool) {
            addSystemMessage('Credits tool not available. Check your AI mode with /mode.');
            return;
          }
          const result = await tool.execute({}) as Record<string, unknown>;
          const lines: string[] = [];
          if (result.credits !== undefined) lines.push(`Credits: ${result.credits}`);
          if (result.subscription_tier) lines.push(`Tier: ${result.subscription_tier}`);
          if (result.subscription_renewal_date) lines.push(`Renews: ${result.subscription_renewal_date}`);
          if (lines.length === 0) lines.push('No credits information available.');
          addSystemMessage(lines.join('\n'));
        } catch (err) {
          addSystemMessage(`Failed to fetch credits: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
        return;
      }
      if (slashResult.action === 'history') {
        const count = slashResult.args ? parseInt(slashResult.args, 10) : 10;
        const recentMessages = messages.slice(-count);
        if (recentMessages.length === 0) {
          addSystemMessage('No conversation history yet.');
        } else {
          const lines = recentMessages.map((msg) => {
            const role = msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Zesty' : 'System';
            let content = msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content;
            // Redact potential credentials
            content = content.replace(/(?:api[_-]?key|token|secret|password)\s*[:=]\s*\S+/gi, '[REDACTED]');
            return `[${role}] ${content}`;
          });
          addSystemMessage(`Last ${recentMessages.length} messages:\n${lines.join('\n')}`);
        }
        return;
      }
      if (slashResult.action === 'export') {
        const parts = (slashResult.args || '').split(/\s+/);
        const exportType = parts[0];
        const exportId = parts[1];

        if (!exportType || !exportId) {
          addSystemMessage('Usage:\n  /export guests <event_id> — Export guest list as CSV\n  /export apps <event_id> — Export applications as CSV');
          return;
        }

        if (exportType === 'guests') {
          addSystemMessage('Exporting guests...');
          try {
            const tool = registry['event_export_guests'];
            const result = await tool.execute({ event_id: exportId }) as { count: number; tickets: Array<Record<string, unknown>> };
            if (!result?.tickets?.length) {
              addSystemMessage('No guest data found.');
              return;
            }
            // Build CSV
            const headers = ['Name', 'Email', 'Ticket Type', 'Amount', 'Currency', 'Purchase Date', 'Check-in Date', 'Active'];
            const rows = result.tickets.map((t: Record<string, unknown>) => [
              t.buyer_name || '',
              t.buyer_email || '',
              t.ticket_type || '',
              t.payment_amount || '',
              t.currency || '',
              t.purchase_date || '',
              t.checkin_date || '',
              t.active !== false ? 'Yes' : 'No',
            ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
            const csv = [headers.join(','), ...rows].join('\n');
            const filename = `guests-${exportId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
            const { writeFileSync, chmodSync } = await import('fs');
            writeFileSync(filename, csv);
            chmodSync(filename, 0o600); // Owner read/write only
            addSystemMessage(`Exported ${result.count} guests to ${filename}`);
          } catch (err) {
            addSystemMessage(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if (exportType === 'apps' || exportType === 'applications') {
          addSystemMessage('Exporting applications...');
          try {
            const tool = registry['event_application_export'];
            const result = await tool.execute({ event_id: exportId }) as { applications: Array<Record<string, unknown>>; count: number };
            if (!result?.applications?.length) {
              addSystemMessage('No application data found.');
              return;
            }
            // Build CSV
            const firstApp = result.applications[0] as Record<string, unknown>;
            const questions = (firstApp.questions as string[]) || [];
            const headers = ['Name', 'Email', ...questions];
            const rows = result.applications.map((app: Record<string, unknown>) => {
              const user = (app.user || app.non_login_user) as Record<string, unknown> | undefined;
              const answers = (app.answers as Array<Record<string, unknown>>) || [];
              const answerValues = answers.map(a => String(a.answer || ''));
              return [
                user?.name || '',
                user?.email || '',
                ...answerValues,
              ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
            });
            const csv = [headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','), ...rows].join('\n');
            const filename = `applications-${exportId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.csv`;
            const { writeFileSync, chmodSync } = await import('fs');
            writeFileSync(filename, csv);
            chmodSync(filename, 0o600); // Owner read/write only
            addSystemMessage(`Exported ${result.count} applications to ${filename}`);
          } catch (err) {
            addSystemMessage(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        addSystemMessage(`Unknown export type: ${exportType}. Use "guests" or "apps".`);
        return;
      }
      if (slashResult.action === 'connectors') {
        const parts = (slashResult.args || '').split(/\s+/);
        const subcommand = parts[0];
        const subArg = parts.slice(1).join(' ');

        if (!subcommand || subcommand === 'list') {
          // List available connectors
          addSystemMessage('Fetching available connectors...');
          try {
            const tool = registry['connectors_list'];
            const result = await tool.execute({}) as Array<Record<string, unknown>>;
            const connectors = Array.isArray(result) ? result : [];
            if (connectors.length === 0) {
              addSystemMessage('No connectors available.');
            } else {
              const lines = connectors.map((c: Record<string, unknown>, i: number) =>
                `${i + 1}. ${c.name} (${c.id}) — ${c.authType} — ${(c.capabilities as string[])?.join(', ') || ''}`,
              );
              addSystemMessage(lines.join('\n'));
            }
          } catch (err) {
            addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if (subcommand === 'connected') {
          if (!session.currentSpace) {
            addSystemMessage('No space selected. Use /spaces to switch first.');
            return;
          }
          addSystemMessage('Fetching connections...');
          try {
            const tool = registry['space_connectors'];
            const result = await tool.execute({ space_id: session.currentSpace._id }) as Array<Record<string, unknown>>;
            const connections = Array.isArray(result) ? result : [];
            if (connections.length === 0) {
              addSystemMessage('No connected integrations for this space.');
            } else {
              const lines = connections.map((c: Record<string, unknown>, i: number) => {
                const status = c.status || 'unknown';
                const lastSync = c.lastSyncAt ? new Date(c.lastSyncAt as string).toLocaleDateString() : 'never';
                const enabled = c.enabled ? '' : ' (disabled)';
                return `${i + 1}. ${c.connectorType} — ${status}${enabled} — last sync: ${lastSync}\n   ID: ${c.id}`;
              });
              addSystemMessage(lines.join('\n'));
            }
          } catch (err) {
            addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if (subcommand === 'logs' && subArg) {
          addSystemMessage('Fetching logs...');
          try {
            const tool = registry['connector_logs'];
            const result = await tool.execute({ connection_id: subArg }) as { logs: Array<Record<string, unknown>>; count: number };
            if (!result.logs?.length) {
              addSystemMessage('No sync logs found.');
            } else {
              const lines = result.logs.map((l: Record<string, unknown>, i: number) => {
                const icon = l.status === 'success' ? '\u2714' : '\u2718';
                const records = l.recordsProcessed !== undefined ? ` (${l.recordsProcessed} records)` : '';
                const date = l.createdAt ? new Date(l.createdAt as string).toLocaleString() : '';
                return `${i + 1}. ${icon} ${l.actionId} — ${l.status}${records} — ${l.triggerType} — ${date}`;
              });
              addSystemMessage(lines.join('\n'));
            }
          } catch (err) {
            addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if (subcommand === 'connect' && subArg) {
          if (!session.currentSpace) {
            addSystemMessage('No space selected. Use /spaces to switch first.');
            return;
          }
          addSystemMessage(`Connecting ${subArg}...`);
          try {
            // Step 1: Initiate connection
            const connectTool = registry['connector_connect'];
            const connectResult = await connectTool.execute({
              space_id: session.currentSpace._id,
              connector_type: subArg,
            }) as { connectionId: string; authUrl?: string; requiresApiKey: boolean };

            if (connectResult.requiresApiKey) {
              // Step 2a: API key flow — prompt user to type key in chat input
              addSystemMessage('This connector requires an API key.');
              addSystemMessage(`Type your ${subArg} API key below and press Enter:`);
              addSystemMessage('(Your key will be sent securely to the backend — it will NOT be stored in chat history.)');

              // Store pending connection so the next regular message is treated as an API key
              pendingApiKeyRef.current = {
                connectionId: connectResult.connectionId,
                connectorType: subArg,
              };
            } else if (connectResult.authUrl) {
              // Step 2b: OAuth flow — open browser and poll for completion
              addSystemMessage('Opening browser for authorization...');
              try {
                const open = (await import('open')).default;
                await open(connectResult.authUrl);
              } catch {
                addSystemMessage(`Open this URL in your browser:\n${connectResult.authUrl}`);
              }

              addSystemMessage('Waiting for authorization... (this may take up to 2 minutes)');

              // Poll for connection status change
              const connectionId = connectResult.connectionId;
              const startTime = Date.now();
              const TIMEOUT_MS = 120_000; // 2 minutes
              const POLL_INTERVAL_MS = 3_000; // 3 seconds

              const pollForConnection = async (): Promise<boolean> => {
                while (Date.now() - startTime < TIMEOUT_MS) {
                  await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
                  try {
                    const connTool = registry['space_connectors'];
                    const connResult = await connTool.execute({ space_id: session.currentSpace!._id }) as Array<Record<string, unknown>>;
                    const connections = Array.isArray(connResult) ? connResult : [];
                    const match = connections.find(c => c.id === connectionId);
                    if (match && match.status !== 'pending') {
                      if (match.status === 'connected' || match.status === 'active') {
                        addSystemMessage(`Connected! ${subArg} is ready. Use /connectors connected to verify.`);
                        return true;
                      } else {
                        addSystemMessage(`Connection failed: ${match.errorMessage || match.status}`);
                        return false;
                      }
                    }
                  } catch {
                    // Polling error — continue
                  }
                }
                addSystemMessage('Authorization timed out (2 minutes). Try again with /connectors connect ' + subArg);
                return false;
              };

              await pollForConnection();
            } else {
              addSystemMessage(`Connected! (ID: ${connectResult.connectionId})`);
            }
          } catch (err) {
            addSystemMessage(`Failed to connect: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if ((subcommand === 'run' || subcommand === 'sync') && subArg) {
          const runParts = subArg.split(/\s+/);
          const connId = runParts[0];
          const actionId = runParts[1] || 'sync-events';
          addSystemMessage(`Running ${actionId} on ${connId}...`);
          try {
            const tool = registry['connectors_sync'];
            const result = await tool.execute({ connection_id: connId, action: actionId }) as Record<string, unknown>;
            if (result.success) {
              const records = result.recordsProcessed !== undefined ? ` (${result.recordsProcessed} records)` : '';
              addSystemMessage(`Success${records}${result.message ? ': ' + result.message : ''}`);
            } else {
              addSystemMessage(`Failed: ${result.error || result.message || 'Unknown error'}`);
            }
          } catch (err) {
            addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        if (subcommand === 'disconnect' && subArg) {
          addSystemMessage(`Disconnecting ${subArg}...`);
          try {
            const tool = registry['connector_disconnect'];
            const result = await tool.execute({ connection_id: subArg }) as { disconnected: boolean };
            addSystemMessage(result.disconnected ? 'Disconnected.' : 'Failed to disconnect.');
          } catch (err) {
            addSystemMessage(`Failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
          return;
        }

        addSystemMessage('Usage:\n  /connectors — list available\n  /connectors connected — show space connections\n  /connectors connect <type> — connect an integration\n  /connectors run <id> [action] — run sync or action\n  /connectors logs <id> — sync history\n  /connectors disconnect <id> — remove connection');
        return;
      }
      if (slashResult.output) {
        addSystemMessage(slashResult.output);
        return;
      }
      return;
    }

    // Regular messages: block during active turn
    if (turnInProgressRef.current) {
      addSystemMessage('Please wait for the current response to finish, or press Escape to cancel. Use /btw for side questions.');
      return;
    }

    // Regular message: send to AI
    addUserMessage(input);
    setShowThinking(true);
    chatMessages.push({ role: 'user', content: input });

    const systemPrompt: SystemMessage[] = buildSystemMessages(session, provider.name);
    const abort = new AbortController();
    streamAbortRef.current = abort;
    turnInProgressRef.current = true;

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
    turnInProgressRef.current = false;
    streamAbortRef.current = null;
    setShowThinking(false);
  }, [engine, provider, formattedTools, session, registry, chatMessages, addUserMessage, addSystemMessage, clearMessages, exit]);

  // Keyboard handling
  useInput((input, key) => {
    // Enter key handling (submit or multiline)
    if (key.return) {
      if (key.shift) {
        // Shift+Enter: move current line to previous lines, reset input
        setPreviousLines((prev) => [...prev, inputValue]);
        setInputValue('');
        return;
      }
      // Plain Enter: join all lines and submit
      const fullText = [...previousLines, inputValue].join('\n');
      setPreviousLines([]);
      onSubmit(fullText);
      return;
    }

    // Ctrl+L: clear screen (same as /clear)
    if (key.ctrl && input === 'l') {
      chatMessages.length = 0;
      clearMessages();
      addSystemMessage('Session cleared.');
      return;
    }

    // Ctrl+U: clear input line (and all previous lines)
    if (key.ctrl && input === 'u') {
      setInputValue('');
      setPreviousLines([]);
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
        resetStreaming();
        turnInProgressRef.current = false;
        addSystemMessage('(cancelled)');
      } else if (btwAbortsRef.current.size > 0) {
        for (const [, controller] of btwAbortsRef.current) {
          controller.abort();
        }
        btwAbortsRef.current.clear();
        resetStreaming();
        addSystemMessage('(btw cancelled)');
      } else {
        setInputValue('');
        setPreviousLines([]);
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
            flexDirection="column"
          >
            {previousLines.map((line, i) => (
              <Text key={i} dimColor>{'  '}{line}</Text>
            ))}
            <Box>
              <Text color="#FDE047">{'> '}</Text>
              <TextInput
                value={inputValue}
                onChange={setInputValue}
                focus={!pendingConfirm && !planState.active}
                showCursor={true}
                placeholder={isStreaming ? '' : 'How can I help... #makelemonade (Shift+Enter for new line)'}
              />
            </Box>
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
