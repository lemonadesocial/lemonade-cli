import { describe, it, expect } from 'vitest';
import { getAllCapabilities } from '../../../src/chat/tools/registry.js';

describe('Tool Discoverability Metadata', () => {
  const capabilities = getAllCapabilities();

  it('every capability has whenToUse defined and non-empty', () => {
    const missing = capabilities.filter(c => !c.whenToUse || c.whenToUse.trim().length === 0);
    if (missing.length > 0) {
      const names = missing.map(c => c.name).join(', ');
      expect.fail(`Missing whenToUse on ${missing.length} tools: ${names}`);
    }
  });

  it('every capability has searchHint defined and non-empty', () => {
    const missing = capabilities.filter(c => !c.searchHint || c.searchHint.trim().length === 0);
    if (missing.length > 0) {
      const names = missing.map(c => c.name).join(', ');
      expect.fail(`Missing searchHint on ${missing.length} tools: ${names}`);
    }
  });

  it('tools with alwaysLoad: true do NOT have shouldDefer: true', () => {
    const conflicts = capabilities.filter(c => c.alwaysLoad === true && c.shouldDefer === true);
    if (conflicts.length > 0) {
      const names = conflicts.map(c => c.name).join(', ');
      expect.fail(`Tools with both alwaysLoad and shouldDefer: ${names}`);
    }
  });

  it('tools in large categories (event, space, payment) that are NOT alwaysLoad have shouldDefer: true', () => {
    const largeCategories = ['event', 'space', 'payment'];
    const violations = capabilities.filter(c =>
      largeCategories.includes(c.category) &&
      c.alwaysLoad !== true &&
      c.shouldDefer !== true
    );
    if (violations.length > 0) {
      const names = violations.map(c => `${c.name} (${c.category})`).join(', ');
      expect.fail(`Large-category tools missing shouldDefer: ${names}`);
    }
  });

  it('alwaysLoad count stays within expected range', () => {
    const alwaysLoadCount = capabilities.filter(c => c.alwaysLoad === true).length;
    expect(alwaysLoadCount).toBeGreaterThanOrEqual(25);
    expect(alwaysLoadCount).toBeLessThanOrEqual(35);
  });

  it('shouldDefer count stays within expected range', () => {
    const shouldDeferCount = capabilities.filter(c => c.shouldDefer === true).length;
    expect(shouldDeferCount).toBeGreaterThanOrEqual(80);
    expect(shouldDeferCount).toBeLessThanOrEqual(130);
  });

  it('shouldDefer defaults to false for small categories', () => {
    const smallCategoryTools = capabilities.filter(c =>
      !['event', 'space', 'payment'].includes(c.category) &&
      c.shouldDefer === true
    );
    // Small categories should not have shouldDefer: true
    expect(smallCategoryTools.length).toBe(0);
  });

  it('all tools have been counted', () => {
    expect(capabilities.length).toBeGreaterThanOrEqual(213);
  });
});
