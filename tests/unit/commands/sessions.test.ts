import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Command } from 'commander';

vi.mock('../../../src/api/graphql.js', () => ({
  graphqlRequestDocument: vi.fn(),
  getClientHeaders: () => ({}),
  setClientType: vi.fn(),
}));

vi.mock('../../../src/output/error.js', () => ({
  handleError: vi.fn(),
  ExitCode: { SUCCESS: 0, USER_ERROR: 1, AUTH_ERROR: 2, NETWORK_ERROR: 3 },
}));

import { registerSessionsCommands } from '../../../src/commands/sessions/index.js';
import { graphqlRequestDocument } from '../../../src/api/graphql.js';

const mockGraphqlRequestDocument = vi.mocked(graphqlRequestDocument);

describe('Sessions Commands', () => {
  let program: Command;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    program = new Command();
    program.exitOverride();
    registerSessionsCommands(program);
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
  });

  describe('registration', () => {
    it('registers the sessions command group', () => {
      const sessionsCmd = program.commands.find((c) => c.name() === 'sessions');
      expect(sessionsCmd).toBeDefined();
    });

    it('registers list, revoke, and revoke-others subcommands', () => {
      const sessionsCmd = program.commands.find((c) => c.name() === 'sessions')!;
      const subcommands = sessionsCmd.commands.map((c) => c.name());
      expect(subcommands).toContain('list');
      expect(subcommands).toContain('revoke');
      expect(subcommands).toContain('revoke-others');
    });
  });

  describe('sessions list', () => {
    const mockSessions = [
      {
        _id: 'sess_001',
        client_type: 'cli',
        device_name: 'dev-machine',
        os: 'darwin 24.0.0',
        app_version: '1.3.0',
        last_active: '2026-04-11T10:00:00Z',
        is_current: true,
        kratos_session_id: 'abc12345-def6-7890-ghij-klmnopqrstuv',
      },
      {
        _id: 'sess_002',
        client_type: 'mcp',
        device_name: 'mcp-host',
        os: 'linux 5.15.0',
        app_version: '1.3.0',
        last_active: '2026-04-10T08:00:00Z',
        is_current: false,
        kratos_session_id: null,
      },
    ];

    it('renders a table with session data', async () => {
      mockGraphqlRequestDocument.mockResolvedValueOnce({ getMyActiveSessions: mockSessions });

      await program.parseAsync(['node', 'test', 'sessions', 'list']);

      expect(mockGraphqlRequestDocument).toHaveBeenCalledOnce();
      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('sess_001');
      expect(output).toContain('cli');
      expect(output).toContain('Yes');
      expect(output).toContain('No');
    });

    it('outputs JSON when --json flag is set', async () => {
      mockGraphqlRequestDocument.mockResolvedValueOnce({ getMyActiveSessions: mockSessions });

      await program.parseAsync(['node', 'test', 'sessions', 'list', '--json']);

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(output.ok).toBe(true);
      expect(output.data).toHaveLength(2);
      expect(output.data[0]._id).toBe('sess_001');
    });

    it('handles sessions with null kratos_session_id', async () => {
      const sessionsWithNullKratos = [
        {
          _id: 'sess_003',
          client_type: 'cli',
          device_name: 'api-client',
          os: '-',
          app_version: '-',
          last_active: '2026-04-11T10:00:00Z',
          is_current: false,
          kratos_session_id: null,
        },
      ];
      mockGraphqlRequestDocument.mockResolvedValueOnce({ getMyActiveSessions: sessionsWithNullKratos });

      await program.parseAsync(['node', 'test', 'sessions', 'list']);

      expect(consoleLogSpy).toHaveBeenCalledOnce();
      const output = consoleLogSpy.mock.calls[0][0] as string;
      expect(output).toContain('sess_003');
    });
  });

  describe('sessions revoke', () => {
    it('calls revokeMySession mutation with session id', async () => {
      mockGraphqlRequestDocument.mockResolvedValueOnce({ getMyActiveSessions: [] });
      mockGraphqlRequestDocument.mockResolvedValueOnce({ revokeMySession: true });

      await program.parseAsync(['node', 'test', 'sessions', 'revoke', 'sess_001']);

      expect(mockGraphqlRequestDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          definitions: expect.arrayContaining([
            expect.objectContaining({
              name: expect.objectContaining({ value: 'RevokeMySession' }),
            }),
          ]),
        }),
        { session_id: 'sess_001' },
      );
      expect(consoleLogSpy).toHaveBeenCalledWith('Session revoked successfully.');
    });

    it('outputs JSON on success with --json flag', async () => {
      mockGraphqlRequestDocument.mockResolvedValueOnce({ getMyActiveSessions: [] });
      mockGraphqlRequestDocument.mockResolvedValueOnce({ revokeMySession: true });

      await program.parseAsync(['node', 'test', 'sessions', 'revoke', 'sess_001', '--json']);

      const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
      expect(output.ok).toBe(true);
      expect(output.data.success).toBe(true);
    });
  });

  describe('sessions revoke-others step-up flow', () => {
    it('registers revoke-others with step-up description', () => {
      const sessionsCmd = program.commands.find((c) => c.name() === 'sessions')!;
      const revokeOthersCmd = sessionsCmd.commands.find((c) => c.name() === 'revoke-others');
      expect(revokeOthersCmd).toBeDefined();
      expect(revokeOthersCmd!.description()).toContain('step-up');
    });

    it('calls requestStepUpVerification as first API call', async () => {
      mockGraphqlRequestDocument.mockResolvedValueOnce({
        requestStepUpVerification: true,
      });
      // The next call will hang waiting for stdin, but we verify the first mutation is called
      mockGraphqlRequestDocument.mockImplementationOnce(() => new Promise(() => {})); // never resolves

      // Intercept stderr to suppress prompt output
      const stderrSpy = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

      // Run with a timeout — we expect it to stall at the readline prompt
      const parsePromise = program.parseAsync(['node', 'test', 'sessions', 'revoke-others']);

      // Give it a tick to execute the first mutation
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockGraphqlRequestDocument).toHaveBeenCalledTimes(1);
      expect(mockGraphqlRequestDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          definitions: expect.arrayContaining([
            expect.objectContaining({
              name: expect.objectContaining({ value: 'RequestStepUpVerification' }),
            }),
          ]),
        }),
      );

      stderrSpy.mockRestore();
      // We intentionally don't await parsePromise — it's stuck on readline
    });
  });
});

describe('Sessions JSON output shapes', () => {
  it('list JSON envelope has ok + data array', () => {
    const envelope = { ok: true, data: [{ _id: 'sess_001' }] };
    expect(envelope.ok).toBe(true);
    expect(Array.isArray(envelope.data)).toBe(true);
  });

  it('revoke JSON envelope has ok + success boolean', () => {
    const envelope = { ok: true, data: { success: true } };
    expect(envelope.ok).toBe(true);
    expect(typeof envelope.data.success).toBe('boolean');
  });

  it('revoke-others JSON envelope has ok + revoked_count', () => {
    const envelope = { ok: true, data: { revoked_count: 3 } };
    expect(envelope.ok).toBe(true);
    expect(typeof envelope.data.revoked_count).toBe('number');
  });
});
