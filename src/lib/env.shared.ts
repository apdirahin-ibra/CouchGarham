import { z } from 'zod'

const requiredValue = z.string().trim().min(1, 'is required')
const requiredUrl = z.url('must be a valid absolute URL')

export const publicEnvironmentSchema = z.object({
  SUPABASE_URL: requiredUrl,
  SUPABASE_ANON_KEY: requiredValue,
  VITE_APP_URL: requiredUrl,
})

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>

export function formatEnvironmentError(
  scope: 'public' | 'server',
  error: z.ZodError,
): Error {
  const problems = error.issues.map((issue) => {
    const variable = issue.path.join('.') || 'environment'
    return `${variable}: ${issue.message}`
  })

  return new Error(
    `Invalid ${scope} environment configuration:\n- ${problems.join('\n- ')}`,
    { cause: error },
  )
}
