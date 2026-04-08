import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock dependencies before importing the module under test
const mockTool = vi.fn();
const mockConnect = vi.fn();
const mockServerInner = { sendToolListChanged: vi.fn() };

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: class MockMcpServer {
      tool = mockTool;
      connect = mockConnect;
      server = mockServerInner;
      constructor() {}
    },
  };
});

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => {
  return {
    StdioServerTransport: class MockTransport {
      constructor() {}
    },
  };
});

vi.mock('../../../src/auth/store.js', () => ({
  ensureAuthHeader: vi.fn(),
}));

vi.mock('../../../src/capabilities/partitioner.js', () => ({
  partitionTools: vi.fn(),
}));

vi.mock('../../../src/config/version.js', () => ({
  getPackageVersion: vi.fn().mockReturnValue('1.0.0-test'),
}));

vi.mock('../../../src/capabilities/search.js', () => ({
  searchCapabilities: vi.fn().mockReturnValue([]),
}));

import { startMcpServer } from '../../../src/mcp/server.js';
import { ensureAuthHeader } from '../../../src/auth/store.js';
import { partitionTools } from '../../../src/capabilities/partitioner.js';

const mockEnsureAuthHeader = vi.mocked(ensureAuthHeader);
const mockPartitionTools = vi.mocked(partitionTools);

describe('startMcpServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPartitionTools.mockReturnValue({ alwaysLoad: [], deferred: [] });
  });

  it('can be imported', () => {
    expect(startMcpServer).toBeTypeOf('function');
  });

  it('exits with error when not authenticated', async () => {
    mockEnsureAuthHeader.mockResolvedValue(undefined);

    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });
    const mockStderr = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);

    await expect(startMcpServer()).rejects.toThrow('process.exit called');

    expect(mockStderr).toHaveBeenCalledWith(
      expect.stringContaining('Not authenticated'),
    );

    mockExit.mockRestore();
    mockStderr.mockRestore();
  });

  it('registers always-load tools via server.tool()', async () => {
    mockEnsureAuthHeader.mockResolvedValue('Bearer test-token');

    const fakeCap = {
      name: 'test_tool',
      displayName: 'Test Tool',
      description: 'A test tool',
      category: 'test',
      params: [],
      destructive: false,
      execute: vi.fn(),
      backendType: 'query',
      backendService: 'graphql',
      requiresSpace: false,
      requiresEvent: false,
      surfaces: ['aiTool'],
    };

    mockPartitionTools.mockReturnValue({
      alwaysLoad: [fakeCap as any],
      deferred: [],
    });

    await startMcpServer();

    // One call for the always-load tool + one call for discover_tools meta-tool
    expect(mockTool).toHaveBeenCalledTimes(2);

    // First call registers our tool
    expect(mockTool.mock.calls[0][0]).toBe('test_tool');

    // Second call registers discover_tools
    expect(mockTool.mock.calls[1][0]).toBe('discover_tools');
  });

  it('registers discover_tools meta-tool', async () => {
    mockEnsureAuthHeader.mockResolvedValue('Bearer test-token');
    mockPartitionTools.mockReturnValue({ alwaysLoad: [], deferred: [] });

    await startMcpServer();

    // discover_tools should always be registered
    const discoverCall = mockTool.mock.calls.find(
      (call: any[]) => call[0] === 'discover_tools',
    );
    expect(discoverCall).toBeDefined();
    expect(discoverCall![1]).toContain('Search for additional tools');
  });

  it('uses correct tool count from partitionTools', async () => {
    mockEnsureAuthHeader.mockResolvedValue('Bearer test-token');

    const caps = Array.from({ length: 3 }, (_, i) => ({
      name: `tool_${i}`,
      displayName: `Tool ${i}`,
      description: `Tool ${i} desc`,
      category: 'test',
      params: [],
      destructive: false,
      execute: vi.fn(),
      backendType: 'query',
      backendService: 'graphql',
      requiresSpace: false,
      requiresEvent: false,
      surfaces: ['aiTool'],
    }));

    mockPartitionTools.mockReturnValue({
      alwaysLoad: caps as any[],
      deferred: [],
    });

    await startMcpServer();

    // 3 always-load tools + 1 discover_tools = 4 calls
    expect(mockTool).toHaveBeenCalledTimes(4);
  });

  it('connects to stdio transport', async () => {
    mockEnsureAuthHeader.mockResolvedValue('Bearer test-token');
    mockPartitionTools.mockReturnValue({ alwaysLoad: [], deferred: [] });

    await startMcpServer();

    expect(mockConnect).toHaveBeenCalledTimes(1);
  });
});
