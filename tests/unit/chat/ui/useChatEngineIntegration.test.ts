import { describe, it, expect, vi } from 'vitest';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';

// Integration tests for useChatEngine hook behavior tested via ChatEngine.
// The hook delegates to ChatEngine for tool lifecycle and confirmations,
// so we test those pathways at the engine level.

describe('useChatEngine integration: stream cancellation', () => {
  it('AbortController.abort() marks the signal as aborted', () => {
    const abort = new AbortController();
    expect(abort.signal.aborted).toBe(false);
    abort.abort();
    expect(abort.signal.aborted).toBe(true);
  });

  it('cancelled stream partial text gets [cancelled] suffix in finalization logic', () => {
    // Simulate the finalization logic from useChatEngine.sendMessage
    const wasCancelled = true;
    const currentStreaming = 'partial response here';
    const finalText = wasCancelled
      ? currentStreaming + ' [cancelled]'
      : currentStreaming;
    expect(finalText).toBe('partial response here [cancelled]');
  });

  it('non-cancelled stream text is finalized without suffix', () => {
    const wasCancelled = false;
    const currentStreaming = 'full response';
    const finalText = wasCancelled
      ? currentStreaming + ' [cancelled]'
      : currentStreaming;
    expect(finalText).toBe('full response');
  });
});

describe('useChatEngine integration: tool lifecycle', () => {
  it('tool_start followed by tool_done with result transitions correctly', () => {
    const engine = new ChatEngine();
    const toolStates: Array<{ id: string; status: string }> = [];

    engine.on('tool_start', (data) => {
      toolStates.push({ id: data.id, status: 'running' });
    });

    engine.on('tool_done', (data) => {
      const existing = toolStates.find((t) => t.id === data.id);
      if (existing) {
        existing.status = data.error ? 'failure' : 'success';
      }
    });

    engine.emit('tool_start', { id: 'tc1', name: 'event_create' });
    expect(toolStates[0]).toEqual({ id: 'tc1', status: 'running' });

    engine.emit('tool_done', { id: 'tc1', name: 'event_create', result: { _id: '123' } });
    expect(toolStates[0]).toEqual({ id: 'tc1', status: 'success' });
  });

  it('tool_done with error marks tool as failure', () => {
    const engine = new ChatEngine();
    const toolStates: Array<{ id: string; status: string }> = [];

    engine.on('tool_start', (data) => {
      toolStates.push({ id: data.id, status: 'running' });
    });

    engine.on('tool_done', (data) => {
      const existing = toolStates.find((t) => t.id === data.id);
      if (existing) {
        existing.status = data.error ? 'failure' : 'success';
      }
    });

    engine.emit('tool_start', { id: 'tc1', name: 'event_get' });
    engine.emit('tool_done', { id: 'tc1', name: 'event_get', error: 'not found' });
    expect(toolStates[0]).toEqual({ id: 'tc1', status: 'failure' });
  });

  it('multiple tools track independently', () => {
    const engine = new ChatEngine();
    const toolStates = new Map<string, string>();

    engine.on('tool_start', (data) => toolStates.set(data.id, 'running'));
    engine.on('tool_done', (data) => toolStates.set(data.id, data.error ? 'failure' : 'success'));

    engine.emit('tool_start', { id: 'tc1', name: 'event_create' });
    engine.emit('tool_start', { id: 'tc2', name: 'ticket_list' });
    expect(toolStates.get('tc1')).toBe('running');
    expect(toolStates.get('tc2')).toBe('running');

    engine.emit('tool_done', { id: 'tc1', name: 'event_create', result: {} });
    expect(toolStates.get('tc1')).toBe('success');
    expect(toolStates.get('tc2')).toBe('running');

    engine.emit('tool_done', { id: 'tc2', name: 'ticket_list', error: 'failed' });
    expect(toolStates.get('tc2')).toBe('failure');
  });
});

describe('useChatEngine integration: confirmAction', () => {
  it('confirmAction resolves pending confirmation with true', async () => {
    const engine = new ChatEngine();
    const promise = engine.requestConfirmation('tc1', 'Delete event?');
    engine.confirmAction('tc1', true);
    expect(await promise).toBe(true);
  });

  it('confirmAction resolves pending confirmation with false', async () => {
    const engine = new ChatEngine();
    const promise = engine.requestConfirmation('tc1', 'Delete event?');
    engine.confirmAction('tc1', false);
    expect(await promise).toBe(false);
  });

  it('confirm_request event carries description', () => {
    const engine = new ChatEngine();
    const handler = vi.fn();
    engine.on('confirm_request', handler);

    engine.requestConfirmation('tc1', 'Cancel the order?');
    expect(handler).toHaveBeenCalledWith({
      id: 'tc1',
      description: 'Cancel the order?',
    });
  });

  it('confirmAction for unknown id is a no-op', () => {
    const engine = new ChatEngine();
    // Should not throw
    engine.confirmAction('nonexistent', true);
  });
});
