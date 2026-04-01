import { EventEmitter } from 'events';
import { ToolDef, ToolParam } from '../providers/interface.js';

export interface ChatEngineEvents {
  text_delta: { text: string; turnId?: string };
  tool_start: { id: string; name: string; turnId?: string };
  tool_done: { id: string; name: string; result?: unknown; error?: string; turnId?: string };
  confirm_request: { id: string; description: string; turnId?: string };
  plan_request: {
    toolCallId: string;
    toolName: string;
    toolDef: ToolDef;
    providedParams: Record<string, unknown>;
    missingParams: ToolParam[];
    turnId?: string;
  };
  thinking_start: { turnId?: string };
  turn_done: { usage: { input_tokens: number; output_tokens: number }; turnId?: string };
  error: { message: string; fatal: boolean; turnId?: string };
  warning: { message: string; turnId?: string };
}

const CONFIRMATION_TIMEOUT_MS = 60_000;

export class ChatEngine extends EventEmitter {
  private pendingConfirmations = new Map<string, (confirmed: boolean) => void>();
  private confirmationTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private pendingPlans = new Map<string, (params: Record<string, unknown> | null) => void>();
  private planTimers = new Map<string, ReturnType<typeof setTimeout>>();

  emit<K extends keyof ChatEngineEvents>(event: K, data: ChatEngineEvents[K]): boolean;
  emit(event: string, ...args: unknown[]): boolean;
  emit(event: string, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  on<K extends keyof ChatEngineEvents>(event: K, listener: (data: ChatEngineEvents[K]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this;
  on(event: string, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  off<K extends keyof ChatEngineEvents>(event: K, listener: (data: ChatEngineEvents[K]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this;
  off(event: string, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener);
  }

  requestConfirmation(id: string, description: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.pendingConfirmations.set(id, resolve);
      this.emit('confirm_request', { id, description });

      const timer = setTimeout(() => {
        this.confirmAction(id, false);
      }, CONFIRMATION_TIMEOUT_MS);
      this.confirmationTimers.set(id, timer);
    });
  }

  confirmAction(id: string, confirmed: boolean): void {
    const timer = this.confirmationTimers.get(id);
    if (timer) {
      clearTimeout(timer);
      this.confirmationTimers.delete(id);
    }

    const resolver = this.pendingConfirmations.get(id);
    if (resolver) {
      this.pendingConfirmations.delete(id);
      resolver(confirmed);
    }
  }

  requestPlan(
    toolCallId: string,
    toolDef: ToolDef,
    providedParams: Record<string, unknown>,
    missingParams: ToolParam[],
  ): Promise<Record<string, unknown> | null> {
    return new Promise((resolve) => {
      this.pendingPlans.set(toolCallId, resolve);
      this.emit('plan_request', {
        toolCallId,
        toolName: toolDef.name,
        toolDef,
        providedParams,
        missingParams,
      });
      // 5 minute timeout for plan mode
      const timer = setTimeout(() => {
        this.cancelPlan(toolCallId);
      }, 300_000);
      this.planTimers.set(toolCallId, timer);
    });
  }

  completePlan(toolCallId: string, mergedParams: Record<string, unknown>): void {
    const timer = this.planTimers.get(toolCallId);
    if (timer) {
      clearTimeout(timer);
      this.planTimers.delete(toolCallId);
    }
    const resolver = this.pendingPlans.get(toolCallId);
    if (resolver) {
      this.pendingPlans.delete(toolCallId);
      resolver(mergedParams);
    }
  }

  cancelPlan(toolCallId: string): void {
    const timer = this.planTimers.get(toolCallId);
    if (timer) {
      clearTimeout(timer);
      this.planTimers.delete(toolCallId);
    }
    const resolver = this.pendingPlans.get(toolCallId);
    if (resolver) {
      this.pendingPlans.delete(toolCallId);
      resolver(null);
    }
  }
}
