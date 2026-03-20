const tseslint = require('@typescript-eslint/eslint-plugin');
const tsparser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'always-multiline'],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '*.js', 'tests/'],
  },
];
