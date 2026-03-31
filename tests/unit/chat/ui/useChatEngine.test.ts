import { describe, it, expect, vi } from 'vitest';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';

// US-T.8: useChatEngine hook integration tests via engine events
// These test the engine-level behavior that useChatEngine depends on.
describe('ChatEngine integration', () => {
  it('accumulates text_delta events', () => {
    const engine = new ChatEngine();
    let accumulated = '';
    engine.on('text_delta', (data) => {
      accumulated += data.text;
    });

    engine.emit('text_delta', { text: 'Hello' });
    engine.emit('text_delta', { text: ' world' });
    expect(accumulated).toBe('Hello world');
  });

  it('tracks tool lifecycle: start then done', () => {
    const engine = new ChatEngine();
    const events: string[] = [];

    engine.on('tool_start', (data) => events.push(`start:${data.name}`));
    engine.on('tool_done', (data) => events.push(`done:${data.name}`));

    engine.emit('tool_start', { id: 'tc1', name: 'event_create' });
    engine.emit('tool_done', { id: 'tc1', name: 'event_create', result: { _id: '123' } });

    expect(events).toEqual(['start:event_create', 'done:event_create']);
  });

  it('tracks token usage from turn_done', () => {
    const engine = new ChatEngine();
    let totalTokens = 0;

    engine.on('turn_done', (data) => {
      totalTokens += data.usage.input_tokens + data.usage.output_tokens;
    });

    engine.emit('turn_done', { usage: { input_tokens: 100, output_tokens: 50 } });
    engine.emit('turn_done', { usage: { input_tokens: 200, output_tokens: 75 } });

    expect(totalTokens).toBe(425);
  });

  it('confirmAction resolves the pending promise', async () => {
    const engine = new ChatEngine();
    const confirmHandler = vi.fn();
    engine.on('confirm_request', confirmHandler);

    const resultPromise = engine.requestConfirmation('tc1', 'Cancel event?');
    expect(confirmHandler).toHaveBeenCalledWith({ id: 'tc1', description: 'Cancel event?' });

    engine.confirmAction('tc1', true);
    expect(await resultPromise).toBe(true);
  });

  it('confirmation times out after 60 seconds and auto-rejects', async () => {
    vi.useFakeTimers();
    const engine = new ChatEngine();

    const resultPromise = engine.requestConfirmation('tc1', 'Delete?');

    vi.advanceTimersByTime(60_000);

    expect(await resultPromise).toBe(false);
    vi.useRealTimers();
  });

  it('error events propagate with fatal flag', () => {
    const engine = new ChatEngine();
    const errors: Array<{ message: string; fatal: boolean }> = [];

    engine.on('error', (data) => errors.push(data));

    engine.emit('error', { message: 'Auth failed', fatal: true });
    engine.emit('error', { message: 'Rate limited', fatal: false });

    expect(errors).toEqual([
      { message: 'Auth failed', fatal: true },
      { message: 'Rate limited', fatal: false },
    ]);
  });

  it('clearning listeners stops event delivery', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('text_delta', handler);
    engine.off('text_delta', handler);
    engine.emit('text_delta', { text: 'should not arrive' });
    expect(handler).not.toHaveBeenCalled();
  });
});
