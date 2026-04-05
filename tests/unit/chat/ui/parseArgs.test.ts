import { describe, it, expect } from 'vitest';
import { parseArgs } from '../../../../src/chat/parseArgs.js';

describe('parseArgs', () => {

  it('accepts --simple flag and sets simpleDeprecated', () => {
    const args = parseArgs(['node', 'make-lemonade', '--simple']);
    expect(args.json).toBe(false);
    expect(args.simpleDeprecated).toBe(true);
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses --provider flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--provider', 'openai']);
    expect(args.provider).toBe('openai');
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses --model flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--model', 'gpt-4o']);
    expect(args.model).toBe('gpt-4o');
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses --json flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--json']);
    expect(args.json).toBe(true);
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses --help flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--help']);
    expect(args.help).toBe(true);
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses -h shorthand for help', () => {
    const args = parseArgs(['node', 'make-lemonade', '-h']);
    expect(args.help).toBe(true);
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses --mode flag', () => {
    const args = parseArgs(['node', 'make-lemonade', '--mode', 'credits']);
    expect(args.mode).toBe('credits');
    expect(args.unknownFlags).toEqual([]);
  });

  it('parses multiple flags together', () => {
    const args = parseArgs(['node', 'make-lemonade', '--simple', '--provider', 'anthropic', '--model', 'claude-sonnet-4-6']);
    expect(args.provider).toBe('anthropic');
    expect(args.model).toBe('claude-sonnet-4-6');
    expect(args.simpleDeprecated).toBe(true);
    expect(args.unknownFlags).toEqual([]);
  });

  it('collects unknown flags starting with -', () => {
    const args = parseArgs(['node', 'make-lemonade', '--modle', 'gpt-4o', '--verbose']);
    expect(args.unknownFlags).toEqual(['--modle', '--verbose']);
    expect(args.model).toBeUndefined();
  });

  it('collects unknown short flags', () => {
    const args = parseArgs(['node', 'make-lemonade', '-v']);
    expect(args.unknownFlags).toEqual(['-v']);
  });

  it('silently skips positional arguments that do not start with -', () => {
    const args = parseArgs(['node', 'make-lemonade', 'somefile.txt']);
    expect(args.unknownFlags).toEqual([]);
  });

  it('valid flags are never reported as unknown', () => {
    const args = parseArgs([
      'node', 'make-lemonade',
      '--provider', 'openai',
      '--model', 'gpt-4o',
      '--mode', 'credits',
      '--json',
      '--simple',
      '--help',
    ]);
    expect(args.unknownFlags).toEqual([]);
    expect(args.provider).toBe('openai');
    expect(args.model).toBe('gpt-4o');
    expect(args.mode).toBe('credits');
    expect(args.json).toBe(true);
    expect(args.help).toBe(true);
  });
});
