import { defineConfig, configDefaults } from 'vitest/config';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Cycle 127: generate-secret-parity.test.ts statically imports the shared
// canonical-patent-vectors.json from the monorepo's sdks/shared-test-results/
// (one level above this repo) — ABSENT in a standalone GitHub Actions checkout.
// Gate it on the fixture existing: run in the monorepo, skip in standalone CI.
const canonicalVectorsPresent = existsSync(
  resolve(__dirname, '../shared-test-results/canonical-patent-vectors.json'),
);

// Cycle 135: cross-platform-canonical.test.ts statically imports the shared
// cross-platform-test-vectors.json from the monorepo parent — same standalone-CI
// gate as above (run in the monorepo, skip in a standalone checkout).
const crossPlatformVectorsPresent = existsSync(
  resolve(__dirname, '../shared-test-results/cross-platform-test-vectors.json'),
);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 60000,
    exclude: [
      ...configDefaults.exclude,
      ...(canonicalVectorsPresent ? [] : ['**/generate-secret-parity.test.ts', '**/buffer-conservation.test.ts']),
      ...(crossPlatformVectorsPresent ? [] : ['**/cross-platform-canonical.test.ts']),
    ],
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
