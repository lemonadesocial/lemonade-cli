import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, rmSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');
const FIXTURE = join(__dirname, 'fixtures', 'graphql-schema.json');

// The codegen script writes into a temp dir (via CODEGEN_OUT_DIR) instead of
// <repo>/src/commands/extended/. This isolates the test from loader.test.ts
// and generate-from-mcp.test.ts which also touch src/commands/extended/
// under vitest's parallel worker pool (A-101).
describe('generate-from-graphql', () => {
  let tempExtendedDir: string;

  beforeAll(() => {
    tempExtendedDir = mkdtempSync(join(tmpdir(), 'codegen-graphql-'));

    // CODEGEN_SKIP_SCHEMA_SNAPSHOTS prevents the script from overwriting the
    // committed schema/*.json drift-guardrail files when run against a tiny
    // synthetic fixture — otherwise the notifications type-fidelity tests
    // (which read those files) would race and fail under parallel workers.
    //
    // CODEGEN_OUT_DIR redirects generated extended command files into the
    // per-test tmp dir so they never collide with loader.test.ts which
    // owns src/commands/extended/ under parallel workers (A-101).
    execSync(
      `npx tsx src/codegen/generate-from-graphql.ts "${FIXTURE}"`,
      {
        cwd: PROJECT_ROOT,
        stdio: 'pipe',
        env: {
          ...process.env,
          CODEGEN_SKIP_SCHEMA_SNAPSHOTS: '1',
          CODEGEN_OUT_DIR: tempExtendedDir,
        },
      },
    );
  });

  afterAll(() => {
    if (tempExtendedDir && existsSync(tempExtendedDir)) {
      rmSync(tempExtendedDir, { recursive: true, force: true });
    }
  });

  it('creates extended directory', () => {
    expect(existsSync(tempExtendedDir)).toBe(true);
  });

  it('skips operations covered by manual resolvers', () => {
    // getMe is in mcpResolverNames (via TOOL_TO_RESOLVER), should not be generated
    const files = readFileSync(join(tempExtendedDir, '_schema-version.json'), 'utf-8');
    const marker = JSON.parse(files);
    // getMe should be skipped
    expect(existsSync(join(tempExtendedDir, 'get-me.ts'))).toBe(false);
  });

  it('generates commands for non-covered queries', () => {
    // getSpace is not in MANUAL_RESOLVERS or MCP tools
    expect(existsSync(join(tempExtendedDir, 'get-space.ts'))).toBe(true);
  });

  it('generates commands for non-covered mutations', () => {
    expect(existsSync(join(tempExtendedDir, 'delete-space.ts'))).toBe(true);
  });

  it('generates valid TypeScript with correct exports', () => {
    const content = readFileSync(join(tempExtendedDir, 'get-space.ts'), 'utf-8');

    expect(content).toContain('export const group =');
    expect(content).toContain('export const subcommand =');
    expect(content).toContain('export function register(');
    expect(content).toContain('Auto-generated from GraphQL introspection');
  });

  it('includes required args as requiredOption', () => {
    const content = readFileSync(join(tempExtendedDir, 'get-space.ts'), 'utf-8');
    expect(content).toContain('.requiredOption(');
  });

  it('uses mutation type for mutation operations', () => {
    const content = readFileSync(join(tempExtendedDir, 'delete-space.ts'), 'utf-8');
    expect(content).toContain('mutation');
  });

  it('writes version marker', () => {
    const marker = JSON.parse(readFileSync(join(tempExtendedDir, '_schema-version.json'), 'utf-8'));
    expect(marker.command_count).toBeGreaterThan(0);
    expect(marker.generated_at).toBeDefined();
  });
});
