import { useCallback, useEffect, useState, type ReactNode } from 'react'

import {
  loginAdminFn,
  loginPlayerFn,
  logoutFn,
  resolveCurrentSessionFn,
} from '../server/api'
import { AuthContext } from './auth-context'
import type { AuthenticatedActor } from './authorization'

export { useAuth } from './auth-context'

const STORAGE_TOKEN_KEY = 'best_official_session_token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthenticatedActor | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate session against server on startup
  useEffect(() => {
    let mounted = true
    const savedToken =
      typeof window !== 'undefined'
        ? window.localStorage.getItem(STORAGE_TOKEN_KEY)
        : null

    if (!savedToken) {
      setIsLoading(false)
      return
    }

    resolveCurrentSessionFn({ data: { sessionToken: savedToken } })
      .then((actor) => {
        if (!mounted) return
        if (actor) {
          setUser(actor)
          setToken(savedToken)
        } else {
          window.localStorage.removeItem(STORAGE_TOKEN_KEY)
          setUser(null)
          setToken(null)
        }
      })
      .catch((err) => {
        console.warn('Session verification fallback:', err)
        if (mounted) {
          setUser(null)
          setToken(null)
        }
      })
      .finally(() => {
        if (mounted) setIsLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [])

  const loginPlayer = useCallback(async (playerId: string) => {
    setIsLoading(true)
    try {
      const res = await loginPlayerFn({ data: { playerId } })
      setUser(res.actor)
      setToken(res.token)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_TOKEN_KEY, res.token)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loginAdmin = useCallback(async (username: string, pass: string) => {
    setIsLoading(true)
    try {
      const res = await loginAdminFn({
        data: { username: username.trim(), password: pass },
      })
      setUser(res.actor)
      setToken(res.token)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_TOKEN_KEY, res.token)
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (token) {
      try {
        await logoutFn({ data: { sessionToken: token } })
      } catch (err) {
        console.error('Logout error:', err)
      }
    }
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_TOKEN_KEY)
    }
  }, [token])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        loginPlayer,
        loginAdmin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
