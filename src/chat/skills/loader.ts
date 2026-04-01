import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getConfig, setConfigValue } from '../../auth/store.js';

let cachedSkills: string | null = null;

function getSkillsDir(): string {
  const thisDir = dirname(fileURLToPath(import.meta.url));
  if (thisDir.includes('/dist/')) {
    const projectRoot = thisDir.replace(/\/dist\/chat\/skills$/, '');
    return join(projectRoot, 'src', 'chat', 'skills');
  }
  return thisDir;
}

const SKILL_FILES = [
  'personality.md',
  'events-core.md',
  'events-analytics.md',
  'events-advanced.md',
  'community.md',
  'billing.md',
  'connectors.md',
  'tempo.md',
] as const;

export function loadSkills(): string {
  if (cachedSkills !== null) return cachedSkills;

  const dir = getSkillsDir();
  const parts: string[] = [];

  for (const file of SKILL_FILES) {
    try {
      const content = readFileSync(join(dir, file), 'utf-8');
      parts.push(content.trim());
    } catch {
      // Skip missing files gracefully
    }
  }

  cachedSkills = parts.join('\n\n');
  return cachedSkills;
}

export function getAgentName(): string {
  try {
    const config = getConfig();
    return (config as Record<string, unknown>).agent_name as string || 'Zesty';
  } catch {
    return 'Zesty';
  }
}

export function setAgentName(name: string): void {
  setConfigValue('agent_name', name);
}

// Reset cache (for tests)
export function _resetCache(): void {
  cachedSkills = null;
}
