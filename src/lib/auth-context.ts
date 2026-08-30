import { createContext, useContext } from 'react'

import type { AuthenticatedActor } from './authorization'

export type AuthContextValue = {
  user: AuthenticatedActor | null
  token: string | null
  isLoading: boolean
  loginPlayer: (playerId: string) => Promise<void>
  loginAdmin: (username: string, pass: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}
