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

function resolveBetterAuthUrl(): string {
  const direct = env.BETTER_AUTH_URL?.trim()
  if (direct && (direct.startsWith('http://') || direct.startsWith('https://'))) {
    return direct
  }
  const netlifyUrl = env.URL?.trim() || env.DEPLOY_URL?.trim()
  if (netlifyUrl && (netlifyUrl.startsWith('http://') || netlifyUrl.startsWith('https://'))) {
    return netlifyUrl
  }
  const vercelUrl = env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`
  }
  return 'http://localhost:3000'
}

const serverSecretEnvironmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  BETTER_AUTH_SECRET: z.string().min(32, 'must contain at least 32 characters'),
  BETTER_AUTH_URL: z.string().url('must be a valid absolute URL'),
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
  const resolvedAuthUrl = resolveBetterAuthUrl()

  const result = serverEnvironmentSchema.safeParse({
    secrets: {
      DATABASE_URL: env.DATABASE_URL,
      BETTER_AUTH_SECRET: env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: resolvedAuthUrl,
      SUPABASE_SERVICE_ROLE_KEY: env.SUPABASE_SERVICE_ROLE_KEY,
    },
    public: {
      SUPABASE_URL: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
      SUPABASE_ANON_KEY: env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
      VITE_APP_URL:
        env.VITE_APP_URL || resolvedAuthUrl || 'http://localhost:3000',
    },
  })

  if (!result.success) {
    throw formatEnvironmentError('server', result.error)
  }

  return result.data
}
