import '@tanstack/react-start/server-only'

import { env } from 'node:process'
import { z } from 'zod'

import {
  formatEnvironmentError,
  publicEnvironmentSchema,
  type PublicEnvironment,
} from './env.shared'

const postgresUrl = z
  .url('must be a valid PostgreSQL URL')
  .refine(
    (value) =>
      value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'must use the postgres:// or postgresql:// protocol',
  )

const serverSecretEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  BETTER_AUTH_SECRET: z.string().min(32, 'must contain at least 32 characters'),
  BETTER_AUTH_URL: z.url('must be a valid absolute URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1, 'is required'),
})

const serverEnvironmentSchema = z.object({
  secrets: serverSecretEnvironmentSchema,
  public: publicEnvironmentSchema,
})

export type ServerSecretEnvironment = z.infer<
  typeof serverSecretEnvironmentSchema
>

export type ServerEnvironment = {
  secrets: ServerSecretEnvironment
  public: PublicEnvironment
}

/**
 * Validate server configuration when a server operation needs it.
 *
 * This is intentionally not evaluated at module load. Besides allowing the
 * secret-free scaffold to build, reading per call supports runtimes that inject
 * environment variables per request.
 */
export function getServerEnv(): ServerEnvironment {
  const result = serverEnvironmentSchema.safeParse({
    secrets: {
      DATABASE_URL: env.DATABASE_URL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: env.BETTER_AUTH_URL,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    public: {
      SUPABASE_URL: env.SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY,
      VITE_APP_URL: env.VITE_APP_URL,
    },
  })

  if (!result.success) {
    throw formatEnvironmentError('server', result.error)
  }

  return result.data
}
