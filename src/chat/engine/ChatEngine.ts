import { EventEmitter } from 'events';

export interface ChatEngineEvents {
  text_delta: { text: string };
  tool_start: { id: string; name: string };
  tool_done: { id: string; name: string; result?: unknown; error?: string };
  confirm_request: { id: string; description: string };
  turn_done: { usage: { input_tokens: number; output_tokens: number } };
  error: { message: string; fatal: boolean };
  warning: { message: string };
}

type EventMap = {
  [K in keyof ChatEngineEvents]: [ChatEngineEvents[K]];
};

export class ChatEngine extends EventEmitter {
  private pendingConfirmations = new Map<string, (confirmed: boolean) => void>();

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
    });
  }

  confirmAction(id: string, confirmed: boolean): void {
    const resolver = this.pendingConfirmations.get(id);
    if (resolver) {
      this.pendingConfirmations.delete(id);
      resolver(confirmed);
    }
  }
}
