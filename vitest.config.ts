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
    //
    // NOTE (A-012): these inline rules are GLOBAL across the whole test run
    // — every suite, not just the integration WS smoke test, pays the
    // transform cost. We accept the global scope because:
    //   1. Splitting into vitest workspace projects (one project per
    //      test dir) is the only way to narrow the scope and it is OUT OF
    //      SCOPE for the Phase 2 notifications work.
    //   2. `graphql` is small and already loaded by the chat-layer tests
    //      via the mocked GraphQL client, so the real-world overhead is
    //      negligible.
    // Revisit if a future suite shows measurable startup regression.
    server: {
      deps: {
        inline: [/^graphql$/, /^graphql-ws/],
      },
    },
  },
});
