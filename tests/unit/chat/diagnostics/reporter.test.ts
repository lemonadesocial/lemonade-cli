import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DiagReporter } from '../../../../src/chat/diagnostics/reporter';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof fs>('fs');
  return {
    ...actual,
    appendFileSync: vi.fn(),
    mkdirSync: vi.fn(),
    existsSync: vi.fn().mockReturnValue(true),
  };
});

vi.mock('os', async () => {
  const actual = await vi.importActual<typeof os>('os');
  return {
    ...actual,
    homedir: vi.fn().mockReturnValue('/tmp/test-home'),
  };
});

describe('DiagReporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes JSON lines to log file when enabled', () => {
    const reporter = new DiagReporter(true);
    reporter.log('input', 'INFO', 'test message', { key: 'value' });

    expect(fs.appendFileSync).toHaveBeenCalledOnce();
    const call = vi.mocked(fs.appendFileSync).mock.calls[0];
    expect(call[0]).toBe(path.join('/tmp/test-home', '.lemonade', 'diagnostics.log'));
    const written = call[1] as string;
    expect(written.endsWith('\n')).toBe(true);
    const parsed = JSON.parse(written.trim());
    expect(parsed.mon).toBe('input');
    expect(parsed.lvl).toBe('INFO');
    expect(parsed.msg).toBe('test message');
    expect(parsed.data).toEqual({ key: 'value' });
    expect(parsed.ts).toBeTypeOf('number');
    expect(parsed.sid).toBeTypeOf('string');
  });

  it('does nothing when disabled', () => {
    const reporter = new DiagReporter(false);
    reporter.log('input', 'INFO', 'test message');

    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });

  it('creates .lemonade directory if missing', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    new DiagReporter(true);

    expect(fs.mkdirSync).toHaveBeenCalledWith(
      path.join('/tmp/test-home', '.lemonade'),
      { recursive: true },
    );
  });

  it('does not create directory when disabled', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    new DiagReporter(false);

    expect(fs.mkdirSync).not.toHaveBeenCalled();
  });

  it('handles write failures gracefully', () => {
    vi.mocked(fs.appendFileSync).mockImplementation(() => {
      throw new Error('disk full');
    });

    const reporter = new DiagReporter(true);
    // Should not throw
    expect(() => reporter.log('input', 'INFO', 'test')).not.toThrow();
  });

  it('logs anomaly at ANOMALY level', () => {
    const reporter = new DiagReporter(true);
    reporter.anomaly('input', 'something wrong', { detail: 1 });

    const written = (vi.mocked(fs.appendFileSync).mock.calls[0][1] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.lvl).toBe('ANOMALY');
    expect(parsed.msg).toBe('something wrong');
  });

  it('logs assertion failures as ERROR', () => {
    const reporter = new DiagReporter(true);
    reporter.assertion(false, 'input', 'cursor out of bounds', { cursor: -1 });

    const written = (vi.mocked(fs.appendFileSync).mock.calls[0][1] as string).trim();
    const parsed = JSON.parse(written);
    expect(parsed.lvl).toBe('ERROR');
    expect(parsed.msg).toContain('ASSERTION FAILED');
  });

  it('does not log when assertion passes', () => {
    const reporter = new DiagReporter(true);
    reporter.assertion(true, 'input', 'cursor in bounds');

    expect(fs.appendFileSync).not.toHaveBeenCalled();
  });

  it('reports isEnabled correctly', () => {
    expect(new DiagReporter(true).isEnabled).toBe(true);
    expect(new DiagReporter(false).isEnabled).toBe(false);
  });
});
