import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';

// Mock dependencies before importing the module under test
const mockTool = vi.fn();
const mockConnect = vi.fn();

vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => {
  return {
    McpServer: class MockMcpServer {
      tool = mockTool;
      connect = mockConnect;
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
  getDefaultSpace: vi.fn(),
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

// NOTE: The `os` module is NOT mocked here at module scope. The outer describe's
// pre-existing tests see the real `os.hostname()`. The nested `Phase 1 WS client
// metadata` describe block below applies a scoped os mock via vi.doMock +
// vi.resetModules and restores it in afterAll.

import { startMcpServer } from '../../../src/mcp/server.js';
import { ensureAuthHeader } from '../../../src/auth/store.js';
import { partitionTools } from '../../../src/capabilities/partitioner.js';
import { searchCapabilities } from '../../../src/capabilities/search.js';
import { getClientHeaders, setClientType } from '../../../src/api/graphql.js';

const mockEnsureAuthHeader = vi.mocked(ensureAuthHeader);
const mockPartitionTools = vi.mocked(partitionTools);
const mockSearchCapabilities = vi.mocked(searchCapabilities);

describe('startMcpServer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPartitionTools.mockReturnValue({ alwaysLoad: [], deferred: [] });
    // Reset the module-level clientType flag so tests don't bleed into each other.
    setClientType('cli');
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

  it('discover_tools handler returns matching tools from searchCapabilities', async () => {
    const deferredCap = {
      name: 'deferred_tool',
      displayName: 'Deferred Tool',
      description: 'A deferred tool',
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

    mockEnsureAuthHeader.mockResolvedValue('Bearer test-token');
    mockPartitionTools.mockReturnValue({
      alwaysLoad: [],
      deferred: [deferredCap as any],
    });
    mockSearchCapabilities.mockReturnValue([deferredCap as any]);

    await startMcpServer();

    // Find the discover_tools registration and extract its handler
    const discoverCall = mockTool.mock.calls.find(
      (call: any[]) => call[0] === 'discover_tools',
    );
    expect(discoverCall).toBeDefined();

    // The handler is the last argument in server.tool(name, desc, schema, handler)
    const handler = discoverCall![discoverCall!.length - 1];
    const result = await handler({ query: 'deferred' });

    expect(mockSearchCapabilities).toHaveBeenCalledWith('deferred', [deferredCap]);
    expect(result.content).toHaveLength(1);

    const parsed = JSON.parse(result.content[0].text);
    expect(parsed).toEqual([
      { name: 'deferred_tool', description: 'A deferred tool', alreadyLoaded: false },
    ]);
  });

});

// ---------------------------------------------------------------------------
// Phase 1: WS session-revocation — X-Client-Type / X-Client-Device-Name
//
// The os.hostname() stub is scoped to THIS describe only (A-004). We use
// vi.doMock('os', ...) + vi.resetModules() so the dynamically imported copies
// of src/api/graphql.js and src/mcp/server.js bind to the stubbed hostname.
// The outer describe above continues to see the real os.hostname().
// ---------------------------------------------------------------------------

describe('Phase 1 WS client metadata', () => {
  // Dynamic re-imports bound to the scoped os mock.
  let startMcpServerScoped: typeof import('../../../src/mcp/server.js').startMcpServer;
  let getClientHeadersScoped: typeof import('../../../src/api/graphql.js').getClientHeaders;
  let setClientTypeScoped: typeof import('../../../src/api/graphql.js').setClientType;
  let ensureAuthHeaderScoped: ReturnType<
    typeof vi.mocked<typeof import('../../../src/auth/store.js').ensureAuthHeader>
  >;
  let partitionToolsScoped: ReturnType<
    typeof vi.mocked<typeof import('../../../src/capabilities/partitioner.js').partitionTools>
  >;

  beforeAll(async () => {
    // Scoped os stub — ONLY applies to the module graph re-imported below.
    vi.doMock('os', async () => {
      const actual = await vi.importActual<typeof import('os')>('os');
      return {
        ...actual,
        hostname: () => 'test-host',
      };
    });

    // Re-register the hoisted mocks for the fresh module graph that
    // vi.resetModules() invalidates below.
    vi.doMock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
      McpServer: class MockMcpServer {
        tool = mockTool;
        connect = mockConnect;
        constructor() {}
      },
    }));
    vi.doMock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
      StdioServerTransport: class MockTransport {
        constructor() {}
      },
    }));
    vi.doMock('../../../src/auth/store.js', () => ({
      ensureAuthHeader: vi.fn(),
      getDefaultSpace: vi.fn(),
    }));
    vi.doMock('../../../src/capabilities/partitioner.js', () => ({
      partitionTools: vi.fn(),
    }));
    vi.doMock('../../../src/config/version.js', () => ({
      getPackageVersion: vi.fn().mockReturnValue('1.0.0-test'),
    }));
    vi.doMock('../../../src/capabilities/search.js', () => ({
      searchCapabilities: vi.fn().mockReturnValue([]),
    }));

    vi.resetModules();

    const serverMod = await import('../../../src/mcp/server.js');
    const graphqlMod = await import('../../../src/api/graphql.js');
    const storeMod = await import('../../../src/auth/store.js');
    const partitionerMod = await import('../../../src/capabilities/partitioner.js');

    startMcpServerScoped = serverMod.startMcpServer;
    getClientHeadersScoped = graphqlMod.getClientHeaders;
    setClientTypeScoped = graphqlMod.setClientType;
    ensureAuthHeaderScoped = vi.mocked(storeMod.ensureAuthHeader);
    partitionToolsScoped = vi.mocked(partitionerMod.partitionTools);
  });

  afterAll(() => {
    vi.doUnmock('os');
    vi.doUnmock('@modelcontextprotocol/sdk/server/mcp.js');
    vi.doUnmock('@modelcontextprotocol/sdk/server/stdio.js');
    vi.doUnmock('../../../src/auth/store.js');
    vi.doUnmock('../../../src/capabilities/partitioner.js');
    vi.doUnmock('../../../src/config/version.js');
    vi.doUnmock('../../../src/capabilities/search.js');
    vi.resetModules();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    partitionToolsScoped.mockReturnValue({ alwaysLoad: [], deferred: [] });
    setClientTypeScoped('cli');
  });

  it('after startMcpServer() runs, getClientHeaders() reports X-Client-Type = "mcp"', async () => {
    ensureAuthHeaderScoped.mockResolvedValue('Bearer test-token');

    await startMcpServerScoped();

    const headers = getClientHeadersScoped();
    expect(headers['X-Client-Type']).toBe('mcp');
  });

  it('after startMcpServer() runs, getClientHeaders() reports prefixed X-Client-Device-Name = "Lemonade MCP (<hostname>)"', async () => {
    ensureAuthHeaderScoped.mockResolvedValue('Bearer test-token');

    await startMcpServerScoped();

    const headers = getClientHeadersScoped();
    expect(headers['X-Client-Device-Name']).toBe('Lemonade MCP (test-host)');
  });

  it('CLI baseline (no startMcpServer run): getClientHeaders() reports raw hostname without MCP prefix', () => {
    // beforeEach reset clientType to 'cli'; no startMcpServer call.
    const headers = getClientHeadersScoped();
    expect(headers['X-Client-Type']).toBe('cli');
    expect(headers['X-Client-Device-Name']).toBe('test-host');
  });
});
