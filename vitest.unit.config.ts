import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    clearMocks: true,
    fileParallelism: false,
    include: ['tests/unit/**/*.test.ts', 'tests/integration/**/*.test.ts'],
    isolate: true,
    maxWorkers: 1,
    passWithNoTests: false,
    restoreMocks: true,
    sequence: {
      concurrent: false,
    },
  },
})
