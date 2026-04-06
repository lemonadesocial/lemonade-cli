import { getAllCapabilities } from '../chat/tools/registry.js';
import { CanonicalCapability } from './types.js';

export interface ToolPartition {
  alwaysLoad: CanonicalCapability[];   // sent as full schemas
  deferred: CanonicalCapability[];     // listed as names only
}

export function partitionTools(): ToolPartition {
  const caps = getAllCapabilities();
  const alwaysLoad: CanonicalCapability[] = [];
  const deferred: CanonicalCapability[] = [];

  for (const cap of caps) {
    if (cap.alwaysLoad || !cap.shouldDefer) {
      alwaysLoad.push(cap);
    } else {
      deferred.push(cap);
    }
  }

  return { alwaysLoad, deferred };
}

export function formatDeferredToolList(deferred: CanonicalCapability[]): string {
  const byCategory = new Map<string, CanonicalCapability[]>();
  for (const cap of deferred) {
    const list = byCategory.get(cap.category) || [];
    list.push(cap);
    byCategory.set(cap.category, list);
  }

  const lines: string[] = ['<deferred-tools>'];
  lines.push('The following tools are available but not loaded. Use the tool_search tool to load any of them by name or keyword.');
  lines.push('');
  for (const [category, caps] of byCategory) {
    lines.push(`## ${category} (${caps.length} tools)`);
    for (const cap of caps) {
      lines.push(`- ${cap.name}: ${cap.searchHint || cap.description}`);
    }
    lines.push('');
  }
  lines.push('</deferred-tools>');
  return lines.join('\n');
}
