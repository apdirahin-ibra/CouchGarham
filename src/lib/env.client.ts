import {
  formatEnvironmentError,
  publicEnvironmentSchema,
  type PublicEnvironment,
} from './env.shared'

/**
 * Read browser-safe configuration at the point of use.
 *
 * Vite only exposes variables with its VITE_ prefix to browser code. The
 * returned names deliberately match the domain-facing server configuration,
 * while their inputs are the explicit public aliases.
 */
export function getPublicEnv(): PublicEnvironment {
  const result = publicEnvironmentSchema.safeParse({
    SUPABASE_URL:
      import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL,
    SUPABASE_ANON_KEY:
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.SUPABASE_ANON_KEY,
    VITE_APP_URL:
      import.meta.env.VITE_APP_URL ||
      import.meta.env.BETTER_AUTH_URL ||
      'http://localhost:3000',
  })

  if (!result.success) {
    throw formatEnvironmentError('public', result.error)
  }

  return result.data
}
