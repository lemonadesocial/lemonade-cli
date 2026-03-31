import { describe, it, expect } from 'vitest';
import {
  parseSlashCommand,
  getModelsForProvider,
} from '../../../../src/chat/ui/SlashCommands';

// US-T.6: Slash command parsing
describe('parseSlashCommand', () => {
  it('parses /help', () => {
    const result = parseSlashCommand('/help');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('help');
    expect(result.output).toContain('Commands');
    expect(result.output).toContain('Keyboard shortcuts');
  });

  it('parses /clear', () => {
    const result = parseSlashCommand('/clear');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('clear');
  });

  it('parses /model with no args (list models)', () => {
    const result = parseSlashCommand('/model');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('model');
    expect(result.args).toBeUndefined();
  });

  it('parses /model with model name', () => {
    const result = parseSlashCommand('/model gpt-4o');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('model');
    expect(result.args).toBe('gpt-4o');
  });

  it('parses /provider with name', () => {
    const result = parseSlashCommand('/provider openai');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('provider');
    expect(result.args).toBe('openai');
  });

  it('parses /provider with missing key (no args)', () => {
    const result = parseSlashCommand('/provider');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('provider');
    expect(result.args).toBeUndefined();
  });

  it('parses /space', () => {
    const result = parseSlashCommand('/space');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('space');
  });

  it('parses /exit', () => {
    const result = parseSlashCommand('/exit');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('exit');
  });

  it('parses /quit', () => {
    const result = parseSlashCommand('/quit');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('exit');
  });

  it('returns error for unknown command', () => {
    const result = parseSlashCommand('/foobar');
    expect(result.handled).toBe(true);
    expect(result.output).toContain('Unknown command');
    expect(result.output).toContain('/foobar');
  });

  it('does not handle non-slash input', () => {
    const result = parseSlashCommand('hello world');
    expect(result.handled).toBe(false);
  });

  it('is case-insensitive', () => {
    const result = parseSlashCommand('/HELP');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('help');
  });
});

describe('getModelsForProvider', () => {
  it('returns anthropic models', () => {
    const models = getModelsForProvider('anthropic');
    expect(models).toContain('claude-sonnet-4-6');
    expect(models.length).toBeGreaterThan(0);
  });

  it('returns openai models', () => {
    const models = getModelsForProvider('openai');
    expect(models).toContain('gpt-4o');
    expect(models.length).toBeGreaterThan(0);
  });

  it('returns empty for unknown provider', () => {
    expect(getModelsForProvider('unknown')).toEqual([]);
  });
});
