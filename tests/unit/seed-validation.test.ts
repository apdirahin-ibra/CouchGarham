import { describe, expect, it } from 'vitest'

describe('Database Seed Safety & Validation', () => {
  it('strictly rejects seeding when ADMIN_INITIAL_PASSWORD is absent and ALLOW_DEMO_SEED is not true', async () => {
    const originalEnv = { ...process.env }
    delete process.env.ADMIN_INITIAL_PASSWORD
    delete process.env.ALLOW_DEMO_SEED

    try {
      const { runDatabaseSeed } = await import('../../src/server/seed')
      await expect(runDatabaseSeed()).rejects.toThrow(
        /ADMIN_INITIAL_PASSWORD environment variable must be provided/i,
      )
    } finally {
      process.env = originalEnv
    }
  })
})
