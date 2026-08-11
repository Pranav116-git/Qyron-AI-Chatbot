import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi, fetchCsrfToken } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = useCallback(async () => {
    try {
      await fetchCsrfToken().catch(() => null)
      const data = await authApi.me()
      setUser(data)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    setUser(data)
    return data
  }, [])

  const register = useCallback(async (name, email, password, confirmPassword) => {
    const data = await authApi.register(name, email, password, confirmPassword)
    setUser(data)
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      setUser(null)
    }
  }, [])

  const refreshUser = useCallback(async () => {
    await checkAuth()
  }, [checkAuth])

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
    isAuthenticated: !!user,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
