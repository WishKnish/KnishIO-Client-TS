import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'path';

// The suites that read the monorepo's shared vector masters
// (../shared-test-results/, absent in a standalone checkout) guard the fixture
// themselves and register one visible skipped test when it is missing, so the
// absence shows up in the run's skip count instead of the file vanishing.
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    exclude: [...configDefaults.exclude],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/types': resolve(__dirname, 'src/types'),
      '@/core': resolve(__dirname, 'src/core'),
      '@/libraries': resolve(__dirname, 'src/libraries'),
      '@/query': resolve(__dirname, 'src/query'),
      '@/mutation': resolve(__dirname, 'src/mutation'),
      '@/response': resolve(__dirname, 'src/response'),
    },
  },
});
