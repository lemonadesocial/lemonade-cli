import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from 'ink-testing-library';
import { ConfirmPrompt } from '../../../../src/chat/ui/ConfirmPrompt';

describe('ConfirmPrompt', () => {
  it('renders the confirmation description', () => {
    const { lastFrame } = render(
      <ConfirmPrompt description="Cancel this event?" onConfirm={() => {}} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Cancel this event?');
    expect(output).toContain('Confirm?');
  });

  it('accepts "yes" and calls onConfirm(true)', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmPrompt description="Delete?" onConfirm={onConfirm} />,
    );
    stdin.write('y');
    stdin.write('e');
    stdin.write('s');
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('accepts "y" and calls onConfirm(true)', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmPrompt description="Delete?" onConfirm={onConfirm} />,
    );
    stdin.write('y');
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it('rejects "no" and calls onConfirm(false)', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmPrompt description="Delete?" onConfirm={onConfirm} />,
    );
    stdin.write('n');
    stdin.write('o');
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledWith(false);
  });

  it('shows "Cancelled" after decline', async () => {
    const onConfirm = vi.fn();
    const { stdin, lastFrame } = render(
      <ConfirmPrompt description="Delete?" onConfirm={onConfirm} />,
    );
    stdin.write('n');
    stdin.write('o');
    stdin.write('\r');
    // Wait for React to re-render after state update
    await new Promise((r) => setTimeout(r, 50));
    expect(lastFrame()!).toContain('Cancelled');
  });

  it('rejects arbitrary input as decline', () => {
    const onConfirm = vi.fn();
    const { stdin } = render(
      <ConfirmPrompt description="Delete?" onConfirm={onConfirm} />,
    );
    stdin.write('m');
    stdin.write('a');
    stdin.write('y');
    stdin.write('b');
    stdin.write('e');
    stdin.write('\r');
    expect(onConfirm).toHaveBeenCalledWith(false);
  });
});
