import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Box } from 'ink';
import { AssistantMessage } from '../../../../src/chat/ui/AssistantMessage';
import { MessageArea, ChatMessage } from '../../../../src/chat/ui/MessageArea';

// L4: Integration test for streaming-to-markdown transition
describe('streaming to markdown transition', () => {
  it('shows raw text while streaming, then markdown when finalized', () => {
    const markdown = '**bold** and *italic*';

    // During streaming: raw markdown syntax visible, no rendering
    const { lastFrame: streamFrame } = render(
      <AssistantMessage text={markdown} streaming />,
    );
    const streamOutput = streamFrame()!;
    expect(streamOutput).toContain('**bold**');
    expect(streamOutput).toContain('*italic*');

    // After completion: markdown rendered (asterisks consumed by formatting)
    const { lastFrame: doneFrame } = render(
      <AssistantMessage text={markdown} />,
    );
    const doneOutput = doneFrame()!;
    expect(doneOutput).toContain('bold');
    expect(doneOutput).toContain('italic');
    expect(doneOutput).not.toContain('**bold**');
  });

  it('MessageArea shows ThinkingIndicator before first token, streaming text during, finalized after', () => {
    const messages: ChatMessage[] = [];

    // Phase 1: streaming started, no text yet -> thinking indicator
    const { lastFrame: thinkingFrame } = render(
      <MessageArea messages={messages} streamingText="" isStreaming={true} maxHeight={20} scrollOffset={0} />,
    );
    expect(thinkingFrame()!).toContain('Thinking...');

    // Phase 2: first token arrived -> streaming text shown
    const { lastFrame: streamingFrame } = render(
      <MessageArea messages={messages} streamingText="# Hello **world**" isStreaming={true} maxHeight={20} scrollOffset={0} />,
    );
    const streamOut = streamingFrame()!;
    expect(streamOut).not.toContain('Thinking...');
    expect(streamOut).toContain('Hello');

    // Phase 3: turn complete, message finalized -> viewport renders messages
    const finalized: ChatMessage[] = [
      { id: '1', role: 'assistant', text: '# Hello **world**' },
    ];
    const { lastFrame: finalFrame } = render(
      <MessageArea messages={finalized} streamingText="" isStreaming={false} maxHeight={20} scrollOffset={0} />,
    );
    const finalOut = finalFrame()!;
    expect(finalOut).not.toContain('Thinking...');
    expect(finalOut).toContain('Hello');
    expect(finalOut).toContain('world');
  });

  it('code blocks render as plain text during streaming and highlighted after', () => {
    const codeMarkdown = '```js\nconst x = 42;\n```';

    // Streaming: raw fenced code block syntax
    const { lastFrame: streamFrame } = render(
      <AssistantMessage text={codeMarkdown} streaming />,
    );
    expect(streamFrame()!).toContain('```js');

    // Completed: code rendered without fence markers
    const { lastFrame: doneFrame } = render(
      <AssistantMessage text={codeMarkdown} />,
    );
    const done = doneFrame()!;
    expect(done).toContain('const x = 42');
    expect(done).not.toContain('```');
  });
});
