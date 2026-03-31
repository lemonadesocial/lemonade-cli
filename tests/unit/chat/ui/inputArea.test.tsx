import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { InputArea } from '../../../../src/chat/ui/InputArea';

// US-T.4: InputArea handles submit, empty input rejection, disabled state
describe('InputArea', () => {
  it('renders the prompt indicator', () => {
    const { lastFrame } = render(
      <InputArea onSubmit={() => {}} disabled={false} />,
    );
    expect(lastFrame()!).toContain('>');
  });

  it('shows placeholder when not disabled', () => {
    const { lastFrame } = render(
      <InputArea onSubmit={() => {}} disabled={false} />,
    );
    expect(lastFrame()!).toContain('Type a message');
  });

  it('shows ellipsis when disabled', () => {
    const { lastFrame } = render(
      <InputArea onSubmit={() => {}} disabled={true} />,
    );
    expect(lastFrame()!).toContain('...');
  });

  it('does not show TextInput when disabled', () => {
    const { lastFrame } = render(
      <InputArea onSubmit={() => {}} disabled={true} />,
    );
    // When disabled, placeholder text should not appear
    expect(lastFrame()!).not.toContain('Type a message');
  });

  it('renders with defaultValue pre-filled', () => {
    const { lastFrame } = render(
      <InputArea onSubmit={() => {}} disabled={false} defaultValue="prefilled text" />,
    );
    expect(lastFrame()!).toContain('prefilled text');
  });

  it('calls onSubmit when Enter is pressed', () => {
    const onSubmit = vi.fn();
    const { stdin } = render(
      <InputArea onSubmit={onSubmit} disabled={false} defaultValue="test input" />,
    );
    stdin.write('\r');
    expect(onSubmit).toHaveBeenCalledWith('test input');
  });
});
