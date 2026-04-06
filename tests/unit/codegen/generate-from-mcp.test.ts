import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';
import { readFileSync, existsSync, rmSync } from 'fs';
import { join } from 'path';

const PROJECT_ROOT = join(__dirname, '..', '..', '..');
const GENERATED_DIR = join(PROJECT_ROOT, 'src', 'commands', 'generated');
const FIXTURE = join(__dirname, 'fixtures', 'mcp-schema.json');

describe('generate-from-mcp', () => {
  beforeAll(() => {
    // Clean generated dir
    if (existsSync(GENERATED_DIR)) {
      rmSync(GENERATED_DIR, { recursive: true });
    }

    // Run the codegen
    execSync(
      `npx tsx src/codegen/generate-from-mcp.ts "${FIXTURE}"`,
      { cwd: PROJECT_ROOT, stdio: 'pipe' },
    );
  });

  afterAll(() => {
    // Clean up
    if (existsSync(GENERATED_DIR)) {
      rmSync(GENERATED_DIR, { recursive: true });
    }
  });

  it('creates generated directory', () => {
    expect(existsSync(GENERATED_DIR)).toBe(true);
  });

  it('generates command files for each tool', () => {
    expect(existsSync(join(GENERATED_DIR, 'event-search.ts'))).toBe(true);
    expect(existsSync(join(GENERATED_DIR, 'event-create.ts'))).toBe(true);
    expect(existsSync(join(GENERATED_DIR, 'get-me.ts'))).toBe(true);
  });

  it('writes schema version marker', () => {
    const markerPath = join(GENERATED_DIR, '_schema-version.json');
    expect(existsSync(markerPath)).toBe(true);

    const marker = JSON.parse(readFileSync(markerPath, 'utf-8'));
    expect(marker.version).toBe('1.5.0');
    expect(marker.tool_count).toBe(3);
  });

  it('generates valid TypeScript with correct exports', () => {
    const content = readFileSync(join(GENERATED_DIR, 'event-search.ts'), 'utf-8');

    // Has required exports
    expect(content).toContain("export const group = 'event'");
    expect(content).toContain("export const subcommand = 'search'");
    expect(content).toContain('export function register(');

    // Uses the correct GraphQL resolver name
    expect(content).toContain('aiSearchEvents');

    // Has flags from input schema
    expect(content).toContain("'--q <value>'");
    expect(content).toContain("'--lat <number>'");
    expect(content).toContain("'--lng <number>'");
    expect(content).toContain("'--limit <number>'");

    // Has JSON output option
    expect(content).toContain("'--json'");
  });

  it('marks required fields as requiredOption', () => {
    const content = readFileSync(join(GENERATED_DIR, 'event-create.ts'), 'utf-8');
    expect(content).toContain(".requiredOption('--title <value>'");
    expect(content).toContain(".requiredOption('--space-id <value>'");
    expect(content).toContain(".requiredOption('--start <value>'");
  });

  it('uses correct mutation type for non-read-only tools', () => {
    const content = readFileSync(join(GENERATED_DIR, 'event-create.ts'), 'utf-8');
    expect(content).toContain('mutation');
  });

  it('uses query type for read-only tools', () => {
    const content = readFileSync(join(GENERATED_DIR, 'event-search.ts'), 'utf-8');
    expect(content).toMatch(/^const QUERY = `query/m);
  });

  it('includes auto-generated header comment', () => {
    const content = readFileSync(join(GENERATED_DIR, 'event-search.ts'), 'utf-8');
    expect(content).toContain('Auto-generated from mcp-schema.json');
    expect(content).toContain('Tool: event_search');
  });
});
