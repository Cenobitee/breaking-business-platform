import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../api/client'

const AuthContext = createContext(null)
const TOKEN_KEY = 'financial-platform-token'
const USER_KEY = 'financial-platform-user'

function readStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem(USER_KEY))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser)

  useEffect(() => {
    const expire = () => setUser(null)
    window.addEventListener('financial-platform-auth-expired', expire)
    return () => window.removeEventListener('financial-platform-auth-expired', expire)
  }, [])

  function storeAuthentication(response) {
    sessionStorage.setItem(TOKEN_KEY, response.accessToken)
    sessionStorage.setItem(USER_KEY, JSON.stringify(response.user))
    setUser(response.user)
    return response.user
  }

  async function login(email, password) {
    return storeAuthentication(await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }))
  }

  async function register(businessName, fullName, email, password) {
    return storeAuthentication(await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ businessName, fullName, email, password }),
    }))
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
    setUser(null)
  }

  function updateBusinessName(businessName) {
    setUser((currentUser) => {
      const updated = { ...currentUser, businessName }
      sessionStorage.setItem(USER_KEY, JSON.stringify(updated))
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
