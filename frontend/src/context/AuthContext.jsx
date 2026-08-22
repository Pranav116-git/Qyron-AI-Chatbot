import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('qyron-token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      authApi.getMe(token)
        .then(userData => {
          setUser(userData)
          setLoading(false)
        })
        .catch(() => {
          localStorage.removeItem('qyron-token')
          setToken(null)
          setUser(null)
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [token])

  const login = useCallback(async (email, password) => {
    const data = await authApi.login(email, password)
    localStorage.setItem('qyron-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const register = useCallback(async (email, username, password) => {
    const data = await authApi.register(email, username, password)
    localStorage.setItem('qyron-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const googleLogin = useCallback(async (credential) => {
    const data = await authApi.googleLogin(credential)
    localStorage.setItem('qyron-token', data.access_token)
    setToken(data.access_token)
    setUser(data.user)
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('qyron-token')
    setToken(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, googleLogin, logout }}>
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
