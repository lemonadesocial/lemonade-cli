import chalk from 'chalk';
import ora from 'ora';
import readline from 'readline';
import { ToolDef, ToolResultMessage } from '../providers/interface.js';
import { SessionState, updateSession } from '../session/state.js';
import { validateArgs } from './schema.js';
import { printToolError } from '../stream/display.js';
import { GraphQLError } from '../../api/graphql.js';
import { AtlasError } from '../../api/atlas.js';
import { ChatEngine } from '../engine/ChatEngine.js';

interface ClassifiedError {
  fatal: boolean;
  message: string;
  retryable: boolean;
}

function classifyError(err: unknown): ClassifiedError {
  if (err instanceof GraphQLError) {
    if (err.code === 'UNAUTHENTICATED') {
      return { fatal: true, message: 'Authentication failed. Run "lemonade auth login".', retryable: false };
    }
    return { fatal: false, message: err.message, retryable: false };
  }

  if (err instanceof AtlasError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return { fatal: true, message: 'Authentication failed.', retryable: false };
    }
    return { fatal: false, message: err.message, retryable: false };
  }

  if (err instanceof TypeError && err.message.includes('fetch')) {
    return { fatal: true, message: 'Network error. Check your connection.', retryable: true };
  }

  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 429) {
      return { fatal: false, message: 'Rate limited. Wait a moment and try again.', retryable: true };
    }
    if (status === 401) {
      return { fatal: true, message: 'API key is invalid.', retryable: false };
    }
    if (status >= 500) {
      return { fatal: true, message: 'AI service error. Try again shortly.', retryable: true };
    }
  }

  if (err instanceof Error) {
    return { fatal: false, message: err.message, retryable: false };
  }
  return { fatal: false, message: 'Unknown error', retryable: false };
}

function formatDestructiveDescription(tool: ToolDef, args: Record<string, unknown>): string {
  const parts = [tool.displayName];
  const id = args.event_id || args.space_id || args.coin_id || '';
  if (id) parts.push(`(${id})`);
  return parts.join(' ');
}

export async function executeToolCalls(
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
  registry: Record<string, ToolDef>,
  session: SessionState,
  rl: readline.Interface | null,
  isTTY: boolean,
  engine?: ChatEngine,
): Promise<{ results: ToolResultMessage[]; fatal: boolean }> {
  const results: ToolResultMessage[] = [];

  for (const call of toolCalls) {
    const tool = registry[call.name];

    if (!tool) {
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: `Unknown tool: ${call.name}`,
        is_error: true,
      });
      continue;
    }

    const validation = validateArgs(call.arguments, tool.params);
    if (!validation.valid) {
      // If in Ink UI mode, try plan mode for missing required params
      const missingRequired = tool.params.filter(
        (p) => p.required && !(p.name in call.arguments),
      );
      if (engine && isTTY && missingRequired.length > 0) {
        const planResult = await engine.requestPlan(
          call.id, tool, call.arguments, missingRequired,
        );
        if (planResult === null) {
          // User cancelled plan mode
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify({ cancelled: true, reason: 'User cancelled plan mode' }),
          });
          engine.emit('tool_done', { id: call.id, name: tool.displayName, error: 'Plan cancelled' });
          continue;
        }
        // Re-assign arguments with merged params and re-validate
        call.arguments = planResult;
        const revalidation = validateArgs(call.arguments, tool.params);
        if (!revalidation.valid) {
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify({ error: revalidation.errors.join(', ') }),
            is_error: true,
          });
          continue;
        }
        // Fall through to execution below
      } else {
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify({ error: validation.errors.join(', ') }),
          is_error: true,
        });
        continue;
      }
    }

    if (tool.destructive && isTTY) {
      const desc = formatDestructiveDescription(tool, call.arguments);

      if (engine) {
        const confirmed = await engine.requestConfirmation(call.id, desc);
        if (!confirmed) {
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify({ cancelled: true, reason: 'User declined' }),
          });
          continue;
        }
      } else if (rl) {
        const answer = await new Promise<string>((resolve) => {
          rl.question(chalk.yellow(`\n  Confirm: ${desc}? (yes/no) `), resolve);
        });
        if (!['yes', 'y'].includes(answer.trim().toLowerCase())) {
          results.push({
            type: 'tool_result',
            tool_use_id: call.id,
            content: JSON.stringify({ cancelled: true, reason: 'User declined' }),
          });
          continue;
        }
      }
    } else if (tool.destructive && !isTTY) {
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify({ cancelled: true, reason: 'Destructive action declined in non-interactive mode' }),
      });
      continue;
    }

    if (engine) {
      engine.emit('tool_start', { id: call.id, name: tool.displayName });
    }

    const spinner = (!engine && isTTY) ? ora(`Running: ${tool.displayName}...`).start() : null;

    try {
      const result = await tool.execute(call.arguments);
      if (spinner) spinner.succeed(`Done: ${tool.displayName}`);
      if (engine) {
        engine.emit('tool_done', { id: call.id, name: tool.displayName, result });
      }

      updateSession(session, call.name, result);

      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify(result),
      });
    } catch (err) {
      if (spinner) spinner.fail(`Failed: ${tool.displayName}`);

      const classified = classifyError(err);

      if (engine) {
        engine.emit('tool_done', { id: call.id, name: tool.displayName, error: classified.message });
      }

      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify({ error: classified.message }),
        is_error: true,
      });

      if (classified.fatal) {
        if (engine) {
          engine.emit('error', { message: classified.message, fatal: true });
        } else {
          printToolError(classified.message);
        }
        return { results, fatal: true };
      }
    }
  }

  return { results, fatal: false };
}
