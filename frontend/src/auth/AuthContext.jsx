import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const AuthContext = createContext(null)
const TOKEN_KEY = 'financial-platform-token'
const USER_KEY = 'financial-platform-user'
const EXPIRY_KEY = 'financial-platform-token-expires-at'

function clearStoredAuthentication() {
  ;[sessionStorage, localStorage].forEach((storage) => {
    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
    storage.removeItem(EXPIRY_KEY)
  })
}

function authenticationStorage() {
  if (sessionStorage.getItem(TOKEN_KEY)) return sessionStorage
  if (localStorage.getItem(TOKEN_KEY)) return localStorage
  return null
}

function readStoredUser() {
  try {
    const storage = authenticationStorage()
    if (!storage) return null
    const expiresAt = Number(storage.getItem(EXPIRY_KEY))
    if (!expiresAt || expiresAt <= Date.now()) {
      clearStoredAuthentication()
      return null
    }
    return JSON.parse(storage.getItem(USER_KEY))
  } catch {
    clearStoredAuthentication()
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    const expire = () => {
      clearStoredAuthentication()
      setUser(null)
    }
    window.addEventListener('financial-platform-auth-expired', expire)
    return () => window.removeEventListener('financial-platform-auth-expired', expire)
  }, [])

  useEffect(() => {
    if (!user) return undefined
    const storage = authenticationStorage()
    const expiresAt = Number(storage?.getItem(EXPIRY_KEY))
    const remaining = expiresAt - Date.now()
    if (remaining <= 0) {
      clearStoredAuthentication()
      setUser(null)
      return undefined
    }
    const timeout = window.setTimeout(
      () => {
        clearStoredAuthentication()
        setUser(null)
      },
      Math.min(remaining, 2_147_483_647),
    )
    return () => window.clearTimeout(timeout)
  }, [user])

  function storeAuthentication(response, rememberMe = false) {
    clearStoredAuthentication()
    const storage = rememberMe ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, response.accessToken)
    storage.setItem(USER_KEY, JSON.stringify(response.user))
    storage.setItem(EXPIRY_KEY, String(Date.now() + Number(response.expiresInSeconds) * 1000))
    setUser(response.user)
    return response.user
  }

  async function login(email, password, rememberMe = false) {
    const response = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    return storeAuthentication(response, rememberMe)
  }

  async function register(businessName, fullName, email, password) {
    return storeAuthentication(
      await apiRequest('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ businessName, fullName, email, password }),
      }),
    )
  }

  function logout() {
    clearStoredAuthentication()
    setUser(null)
  }

  function updateBusinessName(businessName) {
    setUser((currentUser) => {
      const updated = { ...currentUser, businessName }
      authenticationStorage()?.setItem(USER_KEY, JSON.stringify(updated))
      return updated
    })
  }

  const value = useMemo(() => ({ user, login, register, logout, updateBusinessName }), [user])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
