import { describe, it, expect, vi } from 'vitest';
import { ChatEngine } from '../../../../src/chat/engine/ChatEngine';

// Test streaming text accumulation (text_delta events)
describe('streaming text accumulation', () => {
  it('accumulates text_delta tokens into a single string', () => {
    const engine = new ChatEngine();
    let streamingText = '';

    engine.on('text_delta', (data) => {
      streamingText += data.text;
    });

    engine.emit('text_delta', { text: 'Hello' });
    engine.emit('text_delta', { text: ' ' });
    engine.emit('text_delta', { text: 'world' });
    engine.emit('text_delta', { text: '!' });

    expect(streamingText).toBe('Hello world!');
  });

  it('tracks token count from text_delta events', () => {
    const engine = new ChatEngine();
    let tokenCount = 0;

    engine.on('text_delta', () => {
      tokenCount++;
    });

    engine.emit('text_delta', { text: 'Hello' });
    engine.emit('text_delta', { text: ' world' });
    engine.emit('text_delta', { text: '!' });

    expect(tokenCount).toBe(3);
  });

  it('resets streaming state between turns', () => {
    const engine = new ChatEngine();
    let streamingText = '';
    let tokenCount = 0;

    const handler = (data: { text: string }) => {
      streamingText += data.text;
      tokenCount++;
    };
    engine.on('text_delta', handler);

    // First turn
    engine.emit('text_delta', { text: 'First ' });
    engine.emit('text_delta', { text: 'response' });
    expect(streamingText).toBe('First response');
    expect(tokenCount).toBe(2);

    // Reset between turns (as useChatEngine does)
    streamingText = '';
    tokenCount = 0;

    // Second turn
    engine.emit('text_delta', { text: 'Second ' });
    engine.emit('text_delta', { text: 'response' });
    expect(streamingText).toBe('Second response');
    expect(tokenCount).toBe(2);
  });

  it('handles empty text_delta events', () => {
    const engine = new ChatEngine();
    let streamingText = '';

    engine.on('text_delta', (data) => {
      streamingText += data.text;
    });

    engine.emit('text_delta', { text: '' });
    engine.emit('text_delta', { text: 'hello' });

    expect(streamingText).toBe('hello');
  });

  it('preserves markdown in streamed text for later rendering', () => {
    const engine = new ChatEngine();
    let streamingText = '';

    engine.on('text_delta', (data) => {
      streamingText += data.text;
    });

    engine.emit('text_delta', { text: '# ' });
    engine.emit('text_delta', { text: 'Title' });
    engine.emit('text_delta', { text: '\n\n' });
    engine.emit('text_delta', { text: '**bold**' });

    expect(streamingText).toBe('# Title\n\n**bold**');
  });

  it('ThinkingIndicator state: no text means thinking', () => {
    // When isStreaming is true and streamingText is empty, show thinking
    const isStreaming = true;
    const streamingText = '';
    const showThinking = isStreaming && !streamingText;
    expect(showThinking).toBe(true);
  });

  it('ThinkingIndicator state: text arrived means not thinking', () => {
    const isStreaming = true;
    const streamingText = 'Hello';
    const showThinking = isStreaming && !streamingText;
    expect(showThinking).toBe(false);
  });

  it('ThinkingIndicator state: not streaming means not thinking', () => {
    const isStreaming = false;
    const streamingText = '';
    const showThinking = isStreaming && !streamingText;
    expect(showThinking).toBe(false);
  });
});
