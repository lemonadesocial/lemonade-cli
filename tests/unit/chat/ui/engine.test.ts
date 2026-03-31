import { describe, it, expect, vi } from 'vitest';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';

// US-T.7: ChatEngine emits correct events
describe('ChatEngine', () => {
  it('emits text_delta events', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('text_delta', handler);
    engine.emit('text_delta', { text: 'hello' });
    expect(handler).toHaveBeenCalledWith({ text: 'hello' });
  });

  it('emits tool_start events', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('tool_start', handler);
    engine.emit('tool_start', { id: 'tc1', name: 'event_create' });
    expect(handler).toHaveBeenCalledWith({ id: 'tc1', name: 'event_create' });
  });

  it('emits tool_done events with result', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('tool_done', handler);
    engine.emit('tool_done', { id: 'tc1', name: 'event_create', result: { _id: '123' } });
    expect(handler).toHaveBeenCalledWith({ id: 'tc1', name: 'event_create', result: { _id: '123' } });
  });

  it('emits tool_done events with error', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('tool_done', handler);
    engine.emit('tool_done', { id: 'tc1', name: 'event_create', error: 'not found' });
    expect(handler).toHaveBeenCalledWith({ id: 'tc1', name: 'event_create', error: 'not found' });
  });

  it('emits error events', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('error', handler);
    engine.emit('error', { message: 'network error', fatal: true });
    expect(handler).toHaveBeenCalledWith({ message: 'network error', fatal: true });
  });

  it('emits warning events', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('warning', handler);
    engine.emit('warning', { message: 'session getting long' });
    expect(handler).toHaveBeenCalledWith({ message: 'session getting long' });
  });

  it('emits turn_done with usage', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('turn_done', handler);
    engine.emit('turn_done', { usage: { input_tokens: 100, output_tokens: 50 } });
    expect(handler).toHaveBeenCalledWith({ usage: { input_tokens: 100, output_tokens: 50 } });
  });

  it('requestConfirmation emits confirm_request and resolves on confirmAction', async () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('confirm_request', handler);

    const promise = engine.requestConfirmation('tc1', 'Cancel event?');
    expect(handler).toHaveBeenCalledWith({ id: 'tc1', description: 'Cancel event?' });

    engine.confirmAction('tc1', true);
    const result = await promise;
    expect(result).toBe(true);
  });

  it('confirmAction resolves false when declined', async () => {
    const engine = new ChatEngine();
    const promise = engine.requestConfirmation('tc2', 'Delete?');
    engine.confirmAction('tc2', false);
    const result = await promise;
    expect(result).toBe(false);
  });

  it('removes listeners with off', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('text_delta', handler);
    engine.off('text_delta', handler);
    engine.emit('text_delta', { text: 'hello' });
    expect(handler).not.toHaveBeenCalled();
  });
});
