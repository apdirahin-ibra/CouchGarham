import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '#': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    clearMocks: true,
    fileParallelism: false,
    include: ['tests/component/**/*.test.tsx'],
    isolate: false,
    pool: 'threads',
    passWithNoTests: false,
    restoreMocks: true,
    setupFiles: ['./tests/setup/component.ts'],
  },
})
