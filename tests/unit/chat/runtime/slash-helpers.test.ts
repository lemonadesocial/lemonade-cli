import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeCapability, CapabilityNotAvailableError } from '../../../../src/chat/runtime/slash-helpers';

// Mock the registry, filter, and auth modules
vi.mock('../../../../src/chat/tools/registry', () => ({
  getAllCapabilities: vi.fn(() => []),
}));

vi.mock('../../../../src/capabilities/filter', () => ({
  findCapability: vi.fn(() => undefined),
}));

vi.mock('../../../../src/auth/store', () => ({
  getDefaultSpace: vi.fn(() => 'mock-space-id'),
}));

import { getAllCapabilities } from '../../../../src/chat/tools/registry';
import { findCapability } from '../../../../src/capabilities/filter';

const mockGetAllCapabilities = vi.mocked(getAllCapabilities);
const mockFindCapability = vi.mocked(findCapability);

describe('slash-helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('executeCapability', () => {
    it('returns formatted result when formatResult exists', async () => {
      const mockCap = {
        name: 'test_tool',
        execute: vi.fn().mockResolvedValue({ items: [1, 2] }),
        formatResult: vi.fn().mockReturnValue('Formatted: 2 items'),
      };
      mockGetAllCapabilities.mockReturnValue([mockCap] as never);
      mockFindCapability.mockReturnValue(mockCap as never);

      const { result, formatted } = await executeCapability('test_tool', { foo: 'bar' });

      expect(result).toEqual({ items: [1, 2] });
      expect(formatted).toBe('Formatted: 2 items');
      expect(mockCap.execute).toHaveBeenCalledWith({ foo: 'bar' }, { defaultSpace: 'mock-space-id' });
      expect(mockCap.formatResult).toHaveBeenCalledWith({ items: [1, 2] });
    });

    it('returns compact JSON when formatResult is absent', async () => {
      const mockCap = {
        name: 'test_tool',
        execute: vi.fn().mockResolvedValue({ count: 5 }),
      };
      mockGetAllCapabilities.mockReturnValue([mockCap] as never);
      mockFindCapability.mockReturnValue(mockCap as never);

      const { result, formatted } = await executeCapability('test_tool', {});

      expect(result).toEqual({ count: 5 });
      expect(formatted).toBe('{"count":5}');
    });

    it('throws CapabilityNotAvailableError for missing capabilities', async () => {
      mockGetAllCapabilities.mockReturnValue([]);
      mockFindCapability.mockReturnValue(undefined);

      await expect(executeCapability('nonexistent', {})).rejects.toThrow(CapabilityNotAvailableError);
      await expect(executeCapability('nonexistent', {})).rejects.toThrow(
        'Tool "nonexistent" is not available.',
      );
    });

    it('throws CapabilityNotAvailableError when tool not in runtime registry', async () => {
      const registry = { other_tool: {} } as Record<string, never>;

      await expect(executeCapability('missing_tool', {}, registry)).rejects.toThrow(
        CapabilityNotAvailableError,
      );
    });

    it('propagates execution errors', async () => {
      const mockCap = {
        name: 'failing_tool',
        execute: vi.fn().mockRejectedValue(new Error('Backend timeout')),
      };
      mockGetAllCapabilities.mockReturnValue([mockCap] as never);
      mockFindCapability.mockReturnValue(mockCap as never);

      await expect(executeCapability('failing_tool', {})).rejects.toThrow('Backend timeout');
    });
  });
});
