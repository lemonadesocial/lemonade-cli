import { Message, ToolDef } from '../providers/interface.js';
import { SessionState } from '../session/state.js';
import { ChatEngine } from '../engine/ChatEngine.js';
import { TurnCoordinator } from './TurnCoordinator.js';
import { SlashCommandResult, getModelsForProvider } from '../ui/SlashCommands.js';
import { VERSION } from '../version.js';
import { getAgentName } from '../skills/loader.js';
import { getAiModeDisplay } from '../aiMode.js';
import { getCreditsSpaceId } from '../spaceSelection.js';
import { graphqlRequest } from '../../api/graphql.js';
import type { UIMessage } from '../ui/hooks/useChatEngine.js';

/** Runtime-only dependencies — no React/Ink types leak in. */
export interface SlashCommandRuntimeDeps {
  engine: ChatEngine;
  registry: Record<string, ToolDef>;
  session: SessionState;
  chatMessages: Message[];
  turnCoordinator: TurnCoordinator;
  displayOpts: { providerName: string; modelName: string };
  spaceName: string;
  cachedSpacesRef: { current: Array<{ _id: string; title: string; slug?: string }> | null };
}

/** UI callbacks injected by the host (React/Ink layer). */
export interface SlashCommandUIDeps {
  addSystemMessage: (text: string) => void;
  addUserMessage: (text: string) => void;
  clearMessages: () => void;
  exit: () => void;
  startManualPlan: (tool: ToolDef) => void;
  setSpaceName: (name: string) => void;
  setApiKeyPrompt: (prompt: { connectionId: string; connectorType: string } | null) => void;
  uiMessages: UIMessage[];
}

export type SlashCommandDeps = SlashCommandRuntimeDeps & SlashCommandUIDeps;

function getRegistryTool(
  registry: Record<string, ToolDef>,
  name: string,
  addSystemMessage: (text: string) => void,
): ToolDef | null {
  const tool = registry[name];
  if (!tool) {
    addSystemMessage(`Tool "${name}" is not available. It may require a different AI mode or space configuration.`);
    return null;
  }
  return tool;
}

export async function executeSlashCommand(
  slashResult: SlashCommandResult,
  deps: SlashCommandDeps,
): Promise<void> {
  const {
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
    uiMessages,
    displayOpts,
    spaceName,
    cachedSpacesRef,
  } = deps;

  // /btw - ALWAYS allowed, even during active turn
  if (slashResult.action === 'btw') {
    const btwInput = slashResult.args;
    if (!btwInput) {
      addSystemMessage('Usage: /btw <message>');
      return;
    }
    addUserMessage(`btw: ${btwInput}`);
    turnCoordinator.submitBtwTurn(btwInput);
    return;
  }

  if (slashResult.action === 'clear') {
    turnCoordinator.clearSession();
    clearMessages();
    addSystemMessage('Session cleared.');
    return;
  }

  if (slashResult.action === 'exit') {
    exit();
    return;
  }

  if (slashResult.action === 'model') {
    const available = getModelsForProvider(displayOpts.providerName);
    if (slashResult.args) {
      const requested = slashResult.args.trim().toLowerCase();
      const match = available.find(m => m.toLowerCase() === requested || m.toLowerCase().includes(requested));
      if (match) {
        addSystemMessage(`Model switching requires a session restart. Current model: ${displayOpts.modelName}`);
      } else {
        addSystemMessage(`Unknown model: "${slashResult.args}". Available for ${displayOpts.providerName}:\n${available.map(m => `  ${m}`).join('\n')}`);
      }
    } else {
      const lines = [`Current model: ${displayOpts.modelName}`, `Available for ${displayOpts.providerName}:`];
      lines.push(...available.map(m => `  ${m}${m === displayOpts.modelName ? ' (active)' : ''}`));
      addSystemMessage(lines.join('\n'));
    }
    return;
  }

  if (slashResult.action === 'provider') {
    if (slashResult.args) {
      addSystemMessage(`Provider switching requires a session restart. Current provider: ${displayOpts.providerName}`);
    } else {
      addSystemMessage(`Current provider: ${displayOpts.providerName}\nAvailable: anthropic, openai\nUsage: /provider <name> (requires restart)`);
    }
    return;
  }

  if (slashResult.action === 'space') {
    addSystemMessage(`Current space: ${spaceName}\nUse /spaces to list or switch spaces.`);
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
      const tool = getRegistryTool(registry, 'event_list', addSystemMessage);
      if (!tool) return;
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
      let spaces: Array<{ _id: string; title: string; slug?: string }>;
      // Use cache for subcommands (number/name switch); always refresh on bare /spaces
      const useCache = slashResult.args && cachedSpacesRef.current;
      if (useCache) {
        spaces = cachedSpacesRef.current!;
      } else {
        addSystemMessage('Fetching spaces...');
        const tool = getRegistryTool(registry, 'space_list', addSystemMessage);
        if (!tool) return;
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
          const switchTool = getRegistryTool(registry, 'space_switch', addSystemMessage);
          if (!switchTool) return;
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
          const switchTool = getRegistryTool(registry, 'space_switch', addSystemMessage);
          if (!switchTool) return;
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
    const recentMessages = uiMessages.slice(-count);
    if (recentMessages.length === 0) {
      addSystemMessage('No conversation history yet.');
    } else {
      const lines = recentMessages.map((msg) => {
        const role = msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Zesty' : 'System';
        let content = msg.content.length > 100 ? msg.content.slice(0, 100) + '...' : msg.content;
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
        const tool = getRegistryTool(registry, 'event_export_guests', addSystemMessage);
        if (!tool) return;
        const result = await tool.execute({ event_id: exportId }) as { count: number; tickets: Array<Record<string, unknown>> };
        if (!result?.tickets?.length) {
          addSystemMessage('No guest data found.');
          return;
        }
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
        chmodSync(filename, 0o600);
        addSystemMessage(`Exported ${result.count} guests to ${filename}`);
      } catch (err) {
        addSystemMessage(`Export failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
      return;
    }

    if (exportType === 'apps' || exportType === 'applications') {
      addSystemMessage('Exporting applications...');
      try {
        const tool = getRegistryTool(registry, 'event_application_export', addSystemMessage);
        if (!tool) return;
        const result = await tool.execute({ event_id: exportId }) as { applications: Array<Record<string, unknown>>; count: number };
        if (!result?.applications?.length) {
          addSystemMessage('No application data found.');
          return;
        }
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
        chmodSync(filename, 0o600);
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
      addSystemMessage('Fetching available connectors...');
      try {
        const tool = getRegistryTool(registry, 'connectors_list', addSystemMessage);
        if (!tool) return;
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
        const tool = getRegistryTool(registry, 'space_connectors', addSystemMessage);
        if (!tool) return;
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
        const tool = getRegistryTool(registry, 'connector_logs', addSystemMessage);
        if (!tool) return;
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
        const connectTool = getRegistryTool(registry, 'connector_connect', addSystemMessage);
        if (!connectTool) return;
        const connectResult = await connectTool.execute({
          space_id: session.currentSpace._id,
          connector_type: subArg,
        }) as { connectionId: string; authUrl?: string; requiresApiKey: boolean };

        if (connectResult.requiresApiKey) {
          addSystemMessage('This connector requires an API key.');
          addSystemMessage(`Type your ${subArg} API key below and press Enter:`);
          addSystemMessage('(Your key will be sent securely to the backend — it will NOT be stored in chat history.)');
          setApiKeyPrompt({
            connectionId: connectResult.connectionId,
            connectorType: subArg,
          });
        } else if (connectResult.authUrl) {
          addSystemMessage('Opening browser for authorization...');
          try {
            const open = (await import('open')).default;
            await open(connectResult.authUrl);
          } catch {
            addSystemMessage(`Open this URL in your browser:\n${connectResult.authUrl}`);
          }

          addSystemMessage('Waiting for authorization... (this may take up to 2 minutes)');

          const connectionId = connectResult.connectionId;
          const startTime = Date.now();
          const TIMEOUT_MS = 120_000;
          const POLL_INTERVAL_MS = 3_000;

          const pollForConnection = async (): Promise<boolean> => {
            while (Date.now() - startTime < TIMEOUT_MS) {
              await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
              if (!session.currentSpace) {
                addSystemMessage('Space changed during authorization. Aborting poll.');
                return false;
              }
              try {
                const connTool = registry['space_connectors'];
                if (!connTool) {
                  addSystemMessage('space_connectors tool not available.');
                  return false;
                }
                const connResult = await connTool.execute({ space_id: session.currentSpace._id }) as Array<Record<string, unknown>>;
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
        const tool = getRegistryTool(registry, 'connectors_sync', addSystemMessage);
        if (!tool) return;
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
        const tool = getRegistryTool(registry, 'connector_disconnect', addSystemMessage);
        if (!tool) return;
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

  if (slashResult.action === 'tempo') {
    const subcommand = (slashResult.args || '').split(/\s+/)[0];

    if (!subcommand || subcommand === 'status') {
      try {
        const { isTempoInstalled } = await import('../tempo/index.js');
        if (!isTempoInstalled()) {
          addSystemMessage('Tempo CLI is not installed.\n\n  /tempo install — install Tempo CLI\n\nAfter installing:\n  /tempo login — connect or create a wallet\n  /tempo balance — check USDC balance\n  /tempo fund — add funds\n  /tempo request <url> — make a paid MPP request');
          return;
        }
        addSystemMessage('Checking Tempo wallet...');
        const tool = getRegistryTool(registry, 'tempo_status', addSystemMessage);
        if (!tool) return;
        const result = await tool.execute({});
        const formatted = tool.formatResult?.(result) || JSON.stringify(result);
        addSystemMessage(formatted);
      } catch (err) {
        addSystemMessage(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    if (subcommand === 'install') {
      const confirmed = await engine.requestConfirmation('tempo-install', 'Install Tempo CLI? (runs: curl -fsSL https://tempo.xyz/install | bash)');
      if (confirmed) {
        addSystemMessage('Installing Tempo CLI...');
        try {
          const { installTempo } = await import('../tempo/index.js');
          const success = await installTempo();
          addSystemMessage(success ? 'Tempo CLI installed! Use /tempo login to connect your wallet.' : 'Installation failed. Try manually: curl -fsSL https://tempo.xyz/install | bash');
        } catch (err) {
          addSystemMessage(`Installation failed: ${err instanceof Error ? err.message : 'Unknown'}`);
        }
      } else {
        addSystemMessage('Installation cancelled.');
      }
      return;
    }

    if (subcommand === 'login') {
      addSystemMessage('Connecting Tempo wallet...');
      try {
        const { tempoLogin, getWalletInfo } = await import('../tempo/index.js');

        let authUrl = '';
        const result = await tempoLogin((line) => {
          addSystemMessage(line);
          const urlMatch = line.match(/(https:\/\/wallet\.tempo\.xyz\/cli-auth\S+)/);
          if (urlMatch && !authUrl) {
            authUrl = urlMatch[1];
            import('open').then(mod => mod.default(authUrl)).catch(() => {
              addSystemMessage(`Open this URL in your browser: ${authUrl}`);
            });
            addSystemMessage('');
            addSystemMessage('If the browser redirects away from the confirmation page:');
            addSystemMessage('  Try opening the URL above in a private/incognito window.');
          }
        });

        if (result.success) {
          const info = getWalletInfo();
          if (info.loggedIn && info.address) {
            addSystemMessage(`Tempo wallet connected: ${info.address}`);
            try {
              await graphqlRequest(
                'mutation($input: UserInput!) { updateUser(input: $input) { _id } }',
                { input: {} },
              );
              addSystemMessage('Wallet linked to your Lemonade account.');
            } catch {
              addSystemMessage('Note: Could not auto-link wallet to Lemonade. Update manually in settings.');
            }
          } else {
            addSystemMessage('Login process completed. Check /tempo status.');
          }
        } else {
          const info = getWalletInfo();
          if (info.loggedIn && info.address) {
            addSystemMessage(`Tempo wallet connected: ${info.address}`);
          } else {
            addSystemMessage('Login did not complete. Try again with /tempo login.');
            if (result.output) addSystemMessage(result.output);
          }
        }
      } catch (err) {
        addSystemMessage(`Login failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    if (subcommand === 'logout') {
      try {
        const { tempoExec } = await import('../tempo/index.js');
        tempoExec(['wallet', 'logout']);
        addSystemMessage('Tempo wallet disconnected.');
      } catch (err) {
        addSystemMessage(`Logout failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    if (subcommand === 'balance') {
      try {
        const tool = getRegistryTool(registry, 'tempo_status', addSystemMessage);
        if (!tool) return;
        const result = await tool.execute({});
        const r = result as { installed: boolean; loggedIn: boolean; address?: string; balances?: Record<string, string> };
        if (!r.installed) { addSystemMessage('Tempo CLI not installed. Use /tempo install.'); return; }
        if (!r.loggedIn) { addSystemMessage('Not logged in. Use /tempo login.'); return; }
        const bal = r.balances ? Object.entries(r.balances).map(([k, v]) => `  ${v} ${k}`).join('\n') : '  No balances';
        let rewardInfo = '';
        if (session.currentSpace) {
          try {
            const rewardTool = registry['rewards_balance'];
            if (rewardTool) {
              const rewards = await rewardTool.execute({ space_id: session.currentSpace._id }) as Record<string, unknown>;
              if (rewards) {
                const accrued = rewards.organizer_accrued_usdc || rewards.attendee_accrued_usdc || '0';
                const pending = rewards.organizer_pending_usdc || rewards.attendee_pending_usdc || '0';
                rewardInfo = `\n\nRewards (${session.currentSpace.title}):\n  Accrued: ${accrued} USDC\n  Pending payout: ${pending} USDC`;
              }
            }
          } catch {
            // Rewards fetch failed — skip
          }
        }
        addSystemMessage(`Tempo Wallet: ${r.address}\n${bal}${rewardInfo}`);
      } catch (err) {
        addSystemMessage(`Error: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    if (subcommand === 'fund') {
      try {
        const { tempoExec } = await import('../tempo/index.js');
        const output = tempoExec(['wallet', 'fund']);
        addSystemMessage(`${output}\n\nCheck /tempo balance.`);
      } catch (err) {
        addSystemMessage(`Fund failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    if (subcommand === 'request') {
      const url = (slashResult.args || '').replace(/^request\s*/, '').trim();
      if (!url) {
        addSystemMessage('Usage: /tempo request <url>');
        return;
      }
      addSystemMessage(`Making paid request to ${url}...`);
      try {
        const { tempoExec } = await import('../tempo/index.js');
        const output = tempoExec(['request', '-t', url]);
        addSystemMessage(output);
      } catch (err) {
        addSystemMessage(`Request failed: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
      return;
    }

    addSystemMessage('Usage:\n  /tempo — check status\n  /tempo install — install Tempo CLI\n  /tempo login — connect wallet\n  /tempo logout — disconnect\n  /tempo balance — check USDC balance\n  /tempo fund — add funds\n  /tempo request <url> — make a paid MPP request');
    return;
  }

  // Commands with static output (e.g. /help, unknown commands)
  if (slashResult.output) {
    addSystemMessage(slashResult.output);
    return;
  }
}
