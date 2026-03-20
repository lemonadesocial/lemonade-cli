import { describe, it, expect } from 'vitest';
import { renderTable, renderKeyValue } from '../../../src/output/table';

describe('Table Output', () => {
  describe('renderTable', () => {
    it('renders headers and rows', () => {
      const output = renderTable(
        ['Name', 'Age'],
        [['Alice', '30'], ['Bob', '25']],
      );
      expect(output).toContain('Name');
      expect(output).toContain('Age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
    });

    it('includes title when provided', () => {
      const output = renderTable(['A'], [['1']], { title: 'My Table' });
      expect(output).toContain('My Table');
    });

    it('truncates long cells', () => {
      const longText = 'a'.repeat(100);
      const output = renderTable(['Col'], [[longText]], { truncate: 20 });
      expect(output).toContain('...');
    });
  });

  describe('renderKeyValue', () => {
    it('aligns keys with padding', () => {
      const output = renderKeyValue([
        ['Short', 'value1'],
        ['Much Longer Key', 'value2'],
      ]);
      expect(output).toContain('Short');
      expect(output).toContain('Much Longer Key');
      expect(output).toContain('value1');
      expect(output).toContain('value2');
    });
  });
});
