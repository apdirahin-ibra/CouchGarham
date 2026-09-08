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
const STORAGE_USER_KEY = 'best_official_session_actor'

function getSavedAuth(): {
  user: AuthenticatedActor | null
  token: string | null
} {
  if (typeof window === 'undefined') return { user: null, token: null }
  try {
    const savedToken = window.localStorage.getItem(STORAGE_TOKEN_KEY)
    const savedUser = window.localStorage.getItem(STORAGE_USER_KEY)
    if (savedToken && savedUser) {
      return { user: JSON.parse(savedUser), token: savedToken }
    }
  } catch {
    // Ignore storage parse failure
  }
  return { user: null, token: null }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = getSavedAuth()
  const [user, setUser] = useState<AuthenticatedActor | null>(initial.user)
  const [token, setToken] = useState<string | null>(initial.token)
  const [isLoading, setIsLoading] = useState(
    !initial.user &&
      typeof window !== 'undefined' &&
      !!window.localStorage.getItem(STORAGE_TOKEN_KEY),
  )

  // Validate session against server in the background
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
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(actor))
          }
        } else {
          window.localStorage.removeItem(STORAGE_TOKEN_KEY)
          window.localStorage.removeItem(STORAGE_USER_KEY)
          setUser(null)
          setToken(null)
        }
      })
      .catch((err) => {
        console.warn('Session verification fallback:', err)
        if (mounted && !initial.user) {
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
  }, [initial.user])

  const loginPlayer = useCallback(async (playerId: string, pin: string) => {
    const res = await loginPlayerFn({ data: { playerId, pin } })
    setUser(res.actor)
    setToken(res.token)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, res.token)
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.actor))
    }
  }, [])

  const loginAdmin = useCallback(async (username: string, pass: string) => {
    const res = await loginAdminFn({
      data: { username: username.trim(), password: pass },
    })
    setUser(res.actor)
    setToken(res.token)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_TOKEN_KEY, res.token)
      window.localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(res.actor))
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
      window.localStorage.removeItem(STORAGE_USER_KEY)
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
