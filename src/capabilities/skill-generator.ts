import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getAllCapabilities } from '../chat/tools/registry.js';
import type { CanonicalCapability } from './types.js';

const HEADER = '<!-- Auto-generated from capability registry. Do not edit manually. -->';

function getGeneratedDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  if (thisDir.includes('/dist/')) {
    const projectRoot = thisDir.replace(/\/dist\/capabilities$/, '');
    return join(projectRoot, 'src', 'chat', 'skills', 'generated');
  }
  return join(thisDir, '..', 'chat', 'skills', 'generated');
}

function formatParam(p: { name: string; type: string; required: boolean; description: string }): string {
  const req = p.required ? 'required' : 'optional';
  return `  - \`${p.name}\` (${p.type}, ${req}) — ${p.description}`;
}

function formatCapability(cap: CanonicalCapability): string {
  const lines: string[] = [];
  lines.push(`### ${cap.displayName} (\`${cap.name}\`)`);
  lines.push('');
  lines.push(cap.description);
  lines.push('');

  if (cap.whenToUse) {
    lines.push(`**When to use:** ${cap.whenToUse}`);
    lines.push('');
  }

  lines.push(`- **Backend:** ${cap.backendService}${cap.backendResolver ? ` → \`${cap.backendResolver}\`` : ''} (${cap.backendType})`);
  lines.push(`- **Surfaces:** ${cap.surfaces.join(', ')}`);
  lines.push(`- **Destructive:** ${cap.destructive ? 'yes' : 'no'}`);

  if (cap.requiresSpace || cap.requiresEvent) {
    const reqs: string[] = [];
    if (cap.requiresSpace) reqs.push('space');
    if (cap.requiresEvent) reqs.push('event');
    lines.push(`- **Requires:** ${reqs.join(', ')}`);
  }

  if (cap.params.length > 0) {
    lines.push('');
    lines.push('**Parameters:**');
    for (const p of cap.params) {
      lines.push(formatParam({
        name: p.name,
        type: typeof p.type === 'object' ? 'object' : p.type,
        required: p.required,
        description: p.description,
      }));
    }
  }

  return lines.join('\n');
}

function generateCategoryFile(category: string, capabilities: CanonicalCapability[]): string {
  const sorted = [...capabilities].sort((a, b) => a.name.localeCompare(b.name));
  const lines: string[] = [];
  lines.push(HEADER);
  lines.push('');
  lines.push(`# ${category.charAt(0).toUpperCase() + category.slice(1)} Tools`);
  lines.push('');
  lines.push(`${sorted.length} tool${sorted.length === 1 ? '' : 's'} in this category.`);
  lines.push('');

  for (const cap of sorted) {
    lines.push(formatCapability(cap));
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  // Related tools section
  const names = sorted.map(c => `\`${c.name}\``);
  lines.push('## Related Tools');
  lines.push('');
  lines.push(names.join(', '));
  lines.push('');

  return lines.join('\n');
}

export interface GenerateResult {
  dir: string;
  files: string[];
}

export function generateSkillFiles(targetDir?: string): GenerateResult {
  const dir = targetDir ?? getGeneratedDir();
  mkdirSync(dir, { recursive: true });

  const capabilities = getAllCapabilities();
  const byCategory = new Map<string, CanonicalCapability[]>();

  for (const cap of capabilities) {
    const list = byCategory.get(cap.category) ?? [];
    list.push(cap);
    byCategory.set(cap.category, list);
  }

  const files: string[] = [];
  for (const [category, caps] of [...byCategory.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const content = generateCategoryFile(category, caps);
    const filename = `${category}.md`;
    writeFileSync(join(dir, filename), content, 'utf-8');
    files.push(filename);
  }

  return { dir, files };
}
