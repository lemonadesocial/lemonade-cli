import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from 'ink-testing-library';
import { MarkdownText, renderMarkdown } from '../../../../src/chat/ui/MarkdownText';

// US-T.2: MarkdownText renders headings, bold, code blocks, lists correctly
describe('MarkdownText', () => {
  describe('renderMarkdown', () => {
    it('renders bold text', () => {
      const result = renderMarkdown('**bold text**');
      expect(result).toContain('bold text');
    });

    it('renders italic text', () => {
      const result = renderMarkdown('*italic text*');
      expect(result).toContain('italic text');
    });

    it('renders headings', () => {
      const result = renderMarkdown('# Heading One');
      expect(result).toContain('Heading One');
    });

    it('renders second-level headings', () => {
      const result = renderMarkdown('## Heading Two');
      expect(result).toContain('Heading Two');
    });

    it('renders unordered lists', () => {
      const result = renderMarkdown('- item one\n- item two\n- item three');
      expect(result).toContain('item one');
      expect(result).toContain('item two');
      expect(result).toContain('item three');
    });

    it('renders ordered lists', () => {
      const result = renderMarkdown('1. first\n2. second\n3. third');
      expect(result).toContain('first');
      expect(result).toContain('second');
      expect(result).toContain('third');
    });

    it('renders inline code', () => {
      const result = renderMarkdown('use `console.log()` for debugging');
      expect(result).toContain('console.log()');
    });

    it('renders code blocks', () => {
      const result = renderMarkdown('```js\nconst x = 1;\n```');
      expect(result).toContain('const x = 1');
    });

    it('renders links', () => {
      const result = renderMarkdown('[click here](https://example.com)');
      expect(result).toContain('click here');
    });

    it('handles plain text without markdown', () => {
      const result = renderMarkdown('just plain text');
      expect(result).toContain('just plain text');
    });

    it('handles empty string', () => {
      const result = renderMarkdown('');
      expect(result).toBe('');
    });

    it('handles mixed markdown content', () => {
      const md = '# Title\n\nSome **bold** and *italic* text.\n\n- list item\n\n```\ncode\n```';
      const result = renderMarkdown(md);
      expect(result).toContain('Title');
      expect(result).toContain('bold');
      expect(result).toContain('italic');
      expect(result).toContain('list item');
      expect(result).toContain('code');
    });
  });

  describe('component rendering', () => {
    it('renders markdown text in an Ink component', () => {
      const { lastFrame } = render(<MarkdownText text="**hello world**" />);
      expect(lastFrame()!).toContain('hello world');
    });

    it('renders a heading in an Ink component', () => {
      const { lastFrame } = render(<MarkdownText text="# Welcome" />);
      expect(lastFrame()!).toContain('Welcome');
    });

    it('renders a list in an Ink component', () => {
      const { lastFrame } = render(<MarkdownText text="- apples\n- bananas" />);
      const output = lastFrame()!;
      expect(output).toContain('apples');
      expect(output).toContain('bananas');
    });
  });
});
