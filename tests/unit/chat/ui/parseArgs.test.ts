import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../../../src/chat/parseArgs.js';

// US-T.11, US-T.12: --simple flag in parseArgs
describe('parseArgs', () => {
  it('parses --simple flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--simple']);
    expect(args.simple).toBe(true);
  });

  it('defaults simple to false', () => {
    const args = parseArgs(['node', 'make-lemonade']);
    expect(args.simple).toBe(false);
  });

  it('parses --provider flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--provider', 'openai']);
    expect(args.provider).toBe('openai');
  });

  it('parses --model flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--model', 'gpt-4o']);
    expect(args.model).toBe('gpt-4o');
  });

  it('parses --json flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--json']);
    expect(args.json).toBe(true);
  });

  it('parses --help flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--help']);
    expect(args.help).toBe(true);
  });

  it('parses -h shorthand for help', () => {
    const args = parseArgs(['node', 'make-lemonade', '-h']);
    expect(args.help).toBe(true);
  });

  it('parses multiple flags together', () => {
    const args = parseArgs(['node', 'make-lemonade', '--simple', '--provider', 'anthropic', '--model', 'claude-sonnet-4-6']);
    expect(args.simple).toBe(true);
    expect(args.provider).toBe('anthropic');
    expect(args.model).toBe('claude-sonnet-4-6');
  });
});
