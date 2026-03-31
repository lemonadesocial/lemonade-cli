import { describe, it, expect } from 'vitest';
import { parseSlashCommand, getModelsForProvider } from '../../../../src/chat/ui/SlashCommands';

// Integration tests for App.tsx slash command dispatch logic.
// We test the dispatch logic directly rather than rendering the full App
// (which requires a real AIProvider + session), validating that each
// command produces the expected action and output.

describe('App slash command dispatch', () => {
  it('/help returns help text with commands and shortcuts', () => {
    const result = parseSlashCommand('/help');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('help');
    expect(result.output).toContain('/help');
    expect(result.output).toContain('/clear');
    expect(result.output).toContain('/model');
    expect(result.output).toContain('Escape');
  });

  it('/clear triggers clear action', () => {
    const result = parseSlashCommand('/clear');
    expect(result.handled).toBe(true);
    expect(result.action).toBe('clear');
  });

  it('/model lists models when called without args', () => {
    const result = parseSlashCommand('/model');
    expect(result.action).toBe('model');
    expect(result.args).toBeUndefined();

    // Simulate App dispatch: no args -> list models
    const models = getModelsForProvider('anthropic');
    expect(models.length).toBeGreaterThan(0);
    expect(models).toContain('claude-sonnet-4-6');
  });

  it('/model <valid> switches model for anthropic', () => {
    const result = parseSlashCommand('/model claude-opus-4-6');
    expect(result.action).toBe('model');
    expect(result.args).toBe('claude-opus-4-6');

    const models = getModelsForProvider('anthropic');
    expect(models.includes(result.args!)).toBe(true);
  });

  it('/model <invalid> is detected as invalid', () => {
    const result = parseSlashCommand('/model gpt-banana');
    expect(result.action).toBe('model');
    expect(result.args).toBe('gpt-banana');

    const models = getModelsForProvider('anthropic');
    expect(models.includes(result.args!)).toBe(false);
  });

  it('unknown command returns error output', () => {
    const result = parseSlashCommand('/banana');
    expect(result.handled).toBe(true);
    expect(result.output).toContain('Unknown command');
    expect(result.output).toContain('/banana');
  });

  it('/exit and /quit both produce exit action', () => {
    expect(parseSlashCommand('/exit').action).toBe('exit');
    expect(parseSlashCommand('/quit').action).toBe('exit');
  });

  it('/space produces space action', () => {
    expect(parseSlashCommand('/space').action).toBe('space');
  });

  it('/provider without args has no args', () => {
    const result = parseSlashCommand('/provider');
    expect(result.action).toBe('provider');
    expect(result.args).toBeUndefined();
  });

  it('/provider with args passes provider name', () => {
    const result = parseSlashCommand('/provider openai');
    expect(result.action).toBe('provider');
    expect(result.args).toBe('openai');
  });
});
