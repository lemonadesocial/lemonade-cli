import { describe, it, expect, afterEach } from 'vitest';
import { generateSkillFiles } from '../../../src/capabilities/skill-generator';
import { readFileSync, rmSync, existsSync } from 'fs';
import { join } from 'path';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

describe('generateSkillFiles', () => {
  let tempDir: string;

  afterEach(() => {
    if (tempDir && existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates files in the target directory', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-gen-'));
    const result = generateSkillFiles(tempDir);

    expect(result.dir).toBe(tempDir);
    expect(result.files.length).toBeGreaterThan(0);

    for (const file of result.files) {
      expect(existsSync(join(tempDir, file))).toBe(true);
    }
  });

  it('generated files contain correct category names and tool counts', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-gen-'));
    const result = generateSkillFiles(tempDir);

    for (const file of result.files) {
      const content = readFileSync(join(tempDir, file), 'utf-8');
      const category = file.replace('.md', '');
      const titleCase = category.charAt(0).toUpperCase() + category.slice(1);

      // Category name appears in title
      expect(content).toContain(`# ${titleCase} Tools`);

      // Tool count line exists
      expect(content).toMatch(/\d+ tools? in this category\./);
    }
  });

  it('generated files have the auto-generated header comment', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-gen-'));
    const result = generateSkillFiles(tempDir);

    for (const file of result.files) {
      const content = readFileSync(join(tempDir, file), 'utf-8');
      expect(content.startsWith('<!-- Auto-generated from capability registry. Do not edit manually. -->')).toBe(true);
    }
  });

  it('does not include a Related Tools section', () => {
    tempDir = mkdtempSync(join(tmpdir(), 'skill-gen-'));
    const result = generateSkillFiles(tempDir);

    for (const file of result.files) {
      const content = readFileSync(join(tempDir, file), 'utf-8');
      expect(content).not.toContain('## Related Tools');
    }
  });
});
