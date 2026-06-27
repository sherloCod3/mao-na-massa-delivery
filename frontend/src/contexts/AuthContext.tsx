import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react'

const AUTH_KEY = 'mao_na_massa_admin_token'

interface AuthState {
  token: string | null
  /** Define o token e persiste no localStorage */
  login: (token: string) => void
  /** Remove o token do localStorage */
  logout: () => void
  /** true se há um token salvo */
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthState | null>(null)

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(AUTH_KEY)
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(getStoredToken)

  const login = useCallback((newToken: string) => {
    localStorage.setItem(AUTH_KEY, newToken)
    setToken(newToken)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setToken(null)

    // Limpa cache do Service Worker para não expor dados autenticados (TM-005)
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_AUTH_CACHE' })
    }
  }, [])

  // Auto-logout on 401 — escuta evento disparado pelo client.ts
  useEffect(() => {
    const handler = () => logout()
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  const value = useMemo<AuthState>(
    () => ({ token, login, logout, isAuthenticated: token !== null }),
    [token, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider')
  return ctx
}
