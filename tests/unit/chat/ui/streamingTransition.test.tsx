import React, { useState } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { Box } from 'ink';
import { AssistantMessage } from '../../../../src/chat/ui/AssistantMessage';
import { MessageArea } from '../../../../src/chat/ui/MessageArea';
import { THINKING_WORDS } from '../../../../src/chat/ui/ThinkingIndicator';

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

  it('MessageArea shows ThinkingIndicator before first token, streaming text during', () => {
    // Phase 1: streaming started, no text yet -> thinking indicator
    const { lastFrame: thinkingFrame } = render(
      <MessageArea streamingText="" isStreaming={true} />,
    );
    const output = thinkingFrame()!;
    const hasThinkingWord = THINKING_WORDS.some((w) => output.includes(`${w}...`));
    expect(hasThinkingWord).toBe(true);

    // Phase 2: first token arrived -> streaming text shown
    const { lastFrame: streamingFrame } = render(
      <MessageArea streamingText="# Hello **world**" isStreaming={true} />,
    );
    const streamOut = streamingFrame()!;
    expect(streamOut).not.toContain('Thinking...');
    expect(streamOut).toContain('Hello');
  });

  it('MessageArea shows nothing when not streaming and no streaming text', () => {
    // Completed messages are flushed to stdout, not rendered in Ink
    const { lastFrame } = render(
      <MessageArea streamingText="" isStreaming={false} />,
    );
    const output = lastFrame()!;
    expect(output).not.toContain('Thinking...');
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
