import { describe, expect, it } from 'vitest'

import { runDatabaseSeed } from '../../src/server/seed'

describe('Database Seed Safety & Validation', () => {
  it('strictly rejects seeding when ADMIN_INITIAL_PASSWORD is absent and ALLOW_DEMO_SEED is not true', async () => {
    const originalAdminPass = process.env.ADMIN_INITIAL_PASSWORD
    const originalDemoSeed = process.env.ALLOW_DEMO_SEED
    delete process.env.ADMIN_INITIAL_PASSWORD
    delete process.env.ALLOW_DEMO_SEED

    try {
      await expect(runDatabaseSeed()).rejects.toThrow(
        /ADMIN_INITIAL_PASSWORD environment variable must be provided/i,
      )
    } finally {
      if (originalAdminPass)
        process.env.ADMIN_INITIAL_PASSWORD = originalAdminPass
      if (originalDemoSeed) process.env.ALLOW_DEMO_SEED = originalDemoSeed
    }
  })
})
