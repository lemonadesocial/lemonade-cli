import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');
const EXTENDED_DIR = join(PROJECT_ROOT, 'src', 'commands', 'extended');
const FIXTURE = join(__dirname, 'fixtures', 'graphql-schema.json');

describe('generate-from-graphql', () => {
  beforeAll(() => {
    if (existsSync(EXTENDED_DIR)) {
      rmSync(EXTENDED_DIR, { recursive: true });
    }

    execSync(
      `npx tsx src/codegen/generate-from-graphql.ts "${FIXTURE}"`,
      { cwd: PROJECT_ROOT, stdio: 'pipe' },
    );
  });

  afterAll(() => {
    if (existsSync(EXTENDED_DIR)) {
      rmSync(EXTENDED_DIR, { recursive: true });
    }
  });

  it('creates extended directory', () => {
    expect(existsSync(EXTENDED_DIR)).toBe(true);
  });

  it('skips operations covered by manual resolvers', () => {
    // getMe is in mcpResolverNames (via TOOL_TO_RESOLVER), should not be generated
    const files = readFileSync(join(EXTENDED_DIR, '_schema-version.json'), 'utf-8');
    const marker = JSON.parse(files);
    // getMe should be skipped
    expect(existsSync(join(EXTENDED_DIR, 'get-me.ts'))).toBe(false);
  });

  it('generates commands for non-covered queries', () => {
    // getSpace is not in MANUAL_RESOLVERS or MCP tools
    expect(existsSync(join(EXTENDED_DIR, 'get-space.ts'))).toBe(true);
  });

  it('generates commands for non-covered mutations', () => {
    expect(existsSync(join(EXTENDED_DIR, 'delete-space.ts'))).toBe(true);
  });

  it('generates valid TypeScript with correct exports', () => {
    const content = readFileSync(join(EXTENDED_DIR, 'get-space.ts'), 'utf-8');

    expect(content).toContain('export const group =');
    expect(content).toContain('export const subcommand =');
    expect(content).toContain('export function register(');
    expect(content).toContain('Auto-generated from GraphQL introspection');
  });

  it('includes required args as requiredOption', () => {
    const content = readFileSync(join(EXTENDED_DIR, 'get-space.ts'), 'utf-8');
    expect(content).toContain('.requiredOption(');
  });

  it('uses mutation type for mutation operations', () => {
    const content = readFileSync(join(EXTENDED_DIR, 'delete-space.ts'), 'utf-8');
    expect(content).toContain('mutation');
  });

  it('writes version marker', () => {
    const marker = JSON.parse(readFileSync(join(EXTENDED_DIR, '_schema-version.json'), 'utf-8'));
    expect(marker.command_count).toBeGreaterThan(0);
    expect(marker.generated_at).toBeDefined();
  });
});
