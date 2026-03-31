import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { CodeBlock, highlightCode } from '../../../../src/chat/ui/CodeBlock';

describe('CodeBlock', () => {
  describe('highlightCode', () => {
    it('highlights JavaScript code', () => {
      const result = highlightCode('const x = 1;', 'javascript');
      expect(result).toContain('const');
      expect(result).toContain('x');
    });

    it('highlights TypeScript code', () => {
      const result = highlightCode('const x: number = 1;', 'typescript');
      expect(result).toContain('const');
    });

    it('handles unknown language gracefully', () => {
      const result = highlightCode('some code here', 'fakeLang');
      expect(result).toContain('some code here');
    });

    it('handles empty code', () => {
      const result = highlightCode('');
      expect(result).toBe('');
    });

    it('auto-detects when no language specified', () => {
      const result = highlightCode('function foo() { return 42; }');
      expect(result).toContain('function');
    });
  });

  describe('component rendering', () => {
    it('renders code content', () => {
      const { lastFrame } = render(<CodeBlock code="const x = 1;" language="javascript" />);
      expect(lastFrame()!).toContain('const');
    });

    it('renders language label when provided', () => {
      const { lastFrame } = render(<CodeBlock code="print('hi')" language="python" />);
      expect(lastFrame()!).toContain('python');
    });

    it('renders without language label when not provided', () => {
      const { lastFrame } = render(<CodeBlock code="some code" />);
      expect(lastFrame()!).toContain('some code');
    });
  });
});
