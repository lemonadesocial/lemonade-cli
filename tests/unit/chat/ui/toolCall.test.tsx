import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ToolCall, truncateResult } from '../../../../src/chat/ui/ToolCall';

// US-T.5: ToolCall renders spinner/success/failure states with truncated results
describe('ToolCall', () => {
  it('renders spinner indicator while running', () => {
    const { lastFrame } = render(
      <ToolCall name="event_create" status="running" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('event_create');
  });

  it('renders green checkmark on success', () => {
    const { lastFrame } = render(
      <ToolCall name="event_create" status="success" result='{"_id":"123"}' />,
    );
    const output = lastFrame()!;
    expect(output).toContain('event_create');
    // The checkmark character
    expect(output).toContain('\u2714');
  });

  it('renders red X on failure', () => {
    const { lastFrame } = render(
      <ToolCall name="event_create" status="failure" error="Not found" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('event_create');
    // The X character
    expect(output).toContain('\u2718');
    expect(output).toContain('Not found');
  });

  it('does not show result while running', () => {
    const { lastFrame } = render(
      <ToolCall name="event_create" status="running" result="should not show" />,
    );
    const output = lastFrame()!;
    expect(output).not.toContain('should not show');
  });

  it('shows result detail dimmed on success', () => {
    const { lastFrame } = render(
      <ToolCall name="event_create" status="success" result="Event created" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Event created');
  });

  it('truncates result to 3 lines max', () => {
    const longResult = 'line 1\nline 2\nline 3\nline 4\nline 5';
    const { lastFrame } = render(
      <ToolCall name="event_create" status="success" result={longResult} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('line 1');
    expect(output).toContain('line 2');
    expect(output).toContain('line 3');
    expect(output).toContain('...');
    expect(output).not.toContain('line 4');
  });

  it('renders 3-line results without truncation', () => {
    const shortResult = 'line 1\nline 2\nline 3';
    const { lastFrame } = render(
      <ToolCall name="event_create" status="success" result={shortResult} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('line 1');
    expect(output).toContain('line 3');
    expect(output).not.toContain('...');
  });

  it('truncates single long line exceeding 500 chars', () => {
    const longLine = 'x'.repeat(600);
    const { lastFrame } = render(
      <ToolCall name="event_create" status="success" result={longLine} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('...');
    expect(output).not.toContain('x'.repeat(600));
  });
});

describe('truncateResult', () => {
  it('returns short text unchanged', () => {
    expect(truncateResult('hello')).toBe('hello');
  });

  it('truncates text beyond 500 chars', () => {
    const long = 'a'.repeat(600);
    const result = truncateResult(long);
    expect(result.length).toBeLessThan(600);
    expect(result).toContain('...');
  });

  it('truncates lines beyond 3', () => {
    const result = truncateResult('1\n2\n3\n4\n5');
    expect(result).toContain('1');
    expect(result).toContain('...');
    expect(result).not.toContain('4');
  });

  it('applies char cap before line cap', () => {
    const longSingleLine = 'z'.repeat(600);
    const result = truncateResult(longSingleLine);
    expect(result).toBe('z'.repeat(500) + '...');
  });
});
