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
import type { ExecutionContext } from '../../capabilities/types.js';

interface ClassifiedError {
  fatal: boolean;
  message: string;
}

function classifyError(err: unknown): ClassifiedError {
  if (err instanceof GraphQLError) {
    if (err.code === 'UNAUTHENTICATED') {
      return { fatal: true, message: 'Authentication failed. Run "lemonade auth login".' };
    }
    return { fatal: false, message: err.message };
  }

  if (err instanceof AtlasError) {
    if (err.statusCode === 401 || err.statusCode === 403) {
      return { fatal: true, message: 'Authentication failed.' };
    }
    return { fatal: false, message: err.message };
  }

  if (err instanceof TypeError && err.message.includes('fetch')) {
    return { fatal: true, message: 'Network error. Check your connection.' };
  }

  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status: number }).status;
    if (status === 429) {
      return { fatal: false, message: 'Rate limited. Wait a moment and try again.' };
    }
    if (status === 401) {
      return { fatal: true, message: 'API key is invalid.' };
    }
    if (status >= 500) {
      return { fatal: true, message: 'AI service error. Try again shortly.' };
    }
  }

  if (err instanceof Error) {
    return { fatal: false, message: err.message };
  }
  return { fatal: false, message: 'Unknown error' };
}

function formatDestructiveDescription(tool: ToolDef, args: Record<string, unknown>): string {
  const parts = [tool.displayName];
  const id = args.event_id || args.space_id || args.coin_id || '';
  if (id) parts.push(`(${id})`);
  return parts.join(' ');
}

/**
 * Pre-classification type for tool calls. Fields like `validation` and `needsPlan`
 * are optional because they are only populated when a tool is found in the registry
 * (tool !== null). The narrower `ParallelCall` type refines this for the parallel
 * execution path where tool is guaranteed non-null.
 */
interface ClassifiedCall {
  call: { id: string; name: string; arguments: Record<string, unknown> };
  tool: ToolDef | null;
  parallel: boolean;
  validation?: { valid: boolean; errors: string[] };
  needsPlan?: boolean;
}

export function buildContext(session: SessionState): ExecutionContext {
  return {
    defaultSpace: session.defaultSpace,
    currentSpace: session.currentSpace,
    currentEvent: session.currentEvent,
    lastCreatedEvent: session.lastCreatedEvent,
    lastCreatedTicketType: session.lastCreatedTicketType,
    timezone: session.timezone,
  };
}

/** Narrowed type for calls entering parallel execution — tool is guaranteed non-null. */
type ParallelCall = ClassifiedCall & { tool: ToolDef };

// Parallel batch does not support interactive prompts (plan mode, confirmation).
// Only non-interactive query tools are eligible for parallelization.
async function executeParallelBatch(
  batch: ParallelCall[],
  session: SessionState,
  engine?: ChatEngine,
  turnId?: string,
): Promise<{ results: ToolResultMessage[]; fatal: boolean }> {
  const results: ToolResultMessage[] = [];

  // Emit tool_start for ALL tools in the batch before any execution
  for (const item of batch) {
    if (engine) {
      engine.emit('tool_start', { id: item.call.id, name: item.tool.displayName, turnId });
    }
  }

  // Execute all tools concurrently with individual error handling
  const execResults = await Promise.all(
    batch.map(async (item) => {
      try {
        const result = await item.tool.execute(item.call.arguments, buildContext(session));
        return { success: true as const, result };
      } catch (err) {
        return { success: false as const, error: err };
      }
    }),
  );

  // Process results in original order: emit events, update session, collect results.
  // Session updates apply in original call order. If two parallel queries update
  // the same session field, the last one in call order wins.
  let fatal = false;
  for (let idx = 0; idx < batch.length; idx++) {
    const item = batch[idx];
    const execResult = execResults[idx];

    if (execResult.success) {
      if (engine) {
        engine.emit('tool_done', {
          id: item.call.id,
          name: item.tool.displayName,
          result: execResult.result,
          turnId,
        });
      }

      updateSession(session, item.call.name, execResult.result);

      results.push({
        type: 'tool_result',
        tool_use_id: item.call.id,
        content: JSON.stringify(execResult.result),
      });
    } else {
      const classified = classifyError(execResult.error);

      if (engine) {
        engine.emit('tool_done', {
          id: item.call.id,
          name: item.tool.displayName,
          error: classified.message,
          turnId,
        });
      }

      results.push({
        type: 'tool_result',
        tool_use_id: item.call.id,
        content: JSON.stringify({ error: classified.message }),
        is_error: true,
      });

      if (classified.fatal) {
        // Fatal errors don't cancel in-flight siblings because Promise.all has already
        // started all executions. This is acceptable for short-lived query tools.
        if (engine) {
          engine.emit('error', { message: classified.message, fatal: true, turnId });
        } else {
          printToolError(classified.message);
        }
        fatal = true;
      }
    }
  }

  return { results, fatal };
}

async function executeSequential(
  item: ClassifiedCall,
  session: SessionState,
  rl: readline.Interface | null,
  isTTY: boolean,
  engine?: ChatEngine,
  turnId?: string,
): Promise<{ results: ToolResultMessage[]; fatal: boolean }> {
  const results: ToolResultMessage[] = [];
  const { call, tool } = item;

  if (!tool) {
    results.push({
      type: 'tool_result',
      tool_use_id: call.id,
      content: `Unknown tool: ${call.name}`,
      is_error: true,
    });
    return { results, fatal: false };
  }

  const validation = item.validation ?? validateArgs(call.arguments, tool.params);
  if (!validation.valid) {
    const missingRequired = tool.params.filter(
      (p) => p.required && !(p.name in call.arguments),
    );
    if (engine && isTTY && missingRequired.length > 0 && !turnId?.startsWith('btw-')) {
      const planResult = await engine.requestPlan(
        call.id, tool, call.arguments, missingRequired,
      );
      if (planResult === null) {
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify({ cancelled: true, reason: 'User cancelled plan mode' }),
        });
        engine.emit('tool_done', { id: call.id, name: tool.displayName, error: 'Plan cancelled', turnId });
        return { results, fatal: false };
      }
      call.arguments = planResult;
      const revalidation = validateArgs(call.arguments, tool.params);
      if (!revalidation.valid) {
        results.push({
          type: 'tool_result',
          tool_use_id: call.id,
          content: JSON.stringify({ error: revalidation.errors.join(', ') }),
          is_error: true,
        });
        return { results, fatal: false };
      }
      // Fall through to execution
    } else {
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify({ error: validation.errors.join(', ') }),
        is_error: true,
      });
      return { results, fatal: false };
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
        return { results, fatal: false };
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
        return { results, fatal: false };
      }
    }
  } else if (tool.destructive && !isTTY) {
    results.push({
      type: 'tool_result',
      tool_use_id: call.id,
      content: JSON.stringify({ cancelled: true, reason: 'Destructive action declined in non-interactive mode' }),
    });
    return { results, fatal: false };
  }

  if (engine) {
    engine.emit('tool_start', { id: call.id, name: tool.displayName, turnId });
  }

  const spinner = (!engine && isTTY) ? ora(`Running: ${tool.displayName}...`).start() : null;

  try {
    const result = await tool.execute(call.arguments, buildContext(session));
    if (spinner) spinner.succeed(`Done: ${tool.displayName}`);
    if (engine) {
      engine.emit('tool_done', { id: call.id, name: tool.displayName, result, turnId });
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
      engine.emit('tool_done', { id: call.id, name: tool.displayName, error: classified.message, turnId });
    }

    results.push({
      type: 'tool_result',
      tool_use_id: call.id,
      content: JSON.stringify({ error: classified.message }),
      is_error: true,
    });

    if (classified.fatal) {
      if (engine) {
        engine.emit('error', { message: classified.message, fatal: true, turnId });
      } else {
        printToolError(classified.message);
      }
      return { results, fatal: true };
    }
  }

  return { results, fatal: false };
}

export async function executeToolCalls(
  toolCalls: Array<{ id: string; name: string; arguments: Record<string, unknown> }>,
  registry: Record<string, ToolDef>,
  session: SessionState,
  rl: readline.Interface | null,
  isTTY: boolean,
  engine?: ChatEngine,
  turnId?: string,
): Promise<{ results: ToolResultMessage[]; fatal: boolean }> {
  const results: ToolResultMessage[] = [];

  // Pre-classify all calls
  const classified: ClassifiedCall[] = toolCalls.map(call => {
    const tool = registry[call.name] ?? null;
    if (!tool) return { call, tool: null, parallel: false };

    const validation = validateArgs(call.arguments, tool.params);
    const needsPlan = !validation.valid && tool.params.some(p => p.required && !(p.name in call.arguments));
    // Only query-type tools are parallelized. 'none' and 'mutation' run sequentially for safety.
    const canParallelize = !tool.destructive && tool.backendType === 'query' && validation.valid && !needsPlan;

    return { call, tool, parallel: canParallelize, validation, needsPlan };
  });

  // Process in batches: consecutive parallelizable calls run together
  let i = 0;
  while (i < classified.length) {
    // Collect consecutive parallelizable calls (parallel === true guarantees tool is non-null)
    const batch: ParallelCall[] = [];
    while (i < classified.length && classified[i].parallel) {
      batch.push(classified[i] as ParallelCall);
      i++;
    }

    // Execute parallel batch
    if (batch.length > 0) {
      const batchResult = await executeParallelBatch(batch, session, engine, turnId);
      results.push(...batchResult.results);
      if (batchResult.fatal) return { results, fatal: true };
    }

    // Execute next sequential call (if any)
    if (i < classified.length && !classified[i].parallel) {
      const seqResult = await executeSequential(classified[i], session, rl, isTTY, engine, turnId);
      results.push(...seqResult.results);
      if (seqResult.fatal) return { results, fatal: true };
      i++;
    }
  }

  return { results, fatal: false };
}
