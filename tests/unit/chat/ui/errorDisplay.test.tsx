import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { ErrorDisplay } from '../../../../src/chat/ui/ErrorDisplay';

// US-T.9: ErrorDisplay renders all error types with correct colors
describe('ErrorDisplay', () => {
  it('renders network error with retry hint', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="network" message="Connection refused" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Connection refused');
    expect(output).toContain('Check your connection');
  });

  it('renders auth error with login instruction', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="auth" message="Token expired" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Token expired');
    expect(output).toContain('lemonade auth login');
  });

  it('renders rate limit with countdown', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="rate_limit" message="Too many requests" retryAfter={30} />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Too many requests');
    expect(output).toContain('30s');
  });

  it('renders rate limit without countdown when retryAfter missing', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="rate_limit" message="Too many requests" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Wait a moment');
  });

  it('renders context length error with /clear suggestion', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="context_length" message="Context too long" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Context too long');
    expect(output).toContain('/clear');
  });

  it('renders generic error without hint', () => {
    const { lastFrame } = render(
      <ErrorDisplay type="generic" message="Something went wrong" />,
    );
    const output = lastFrame()!;
    expect(output).toContain('Something went wrong');
  });
});
