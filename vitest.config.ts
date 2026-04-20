import { defineConfig } from 'vitest/config';

export default defineConfig({
  define: {
    'process.env.NODE_ENV': '"test"',
  },
  test: {
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
    globals: true,
    setupFiles: ['tests/setup.ts'],
    // Force `graphql` + `graphql-ws` into the same realm so the mock WS
    // server in tests/integration/notifications/** can pass a GraphQLSchema
    // that graphql-ws' schema validator accepts (fixes "Cannot use
    // GraphQLSchema from another module or realm").
    server: {
      deps: {
        inline: [/^graphql$/, /^graphql-ws/],
      },
    },
  },
});
