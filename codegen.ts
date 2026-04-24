import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'https://backend.staging.lemonade.social/graphql',
  documents: ['./src/graphql/gql/**/*.gql'],
  ignoreNoDocuments: false,
  emitLegacyCommonJSImports: false,
  generates: {
    './src/graphql/generated/backend/': {
      preset: 'client',
      plugins: [],
      presetConfig: {
        fragmentMasking: false,
      },
      config: {
        useTypeImports: true,
      },
    },
  },
};

export default config;
