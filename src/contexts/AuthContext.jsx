import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    try {
      const stored = sessionStorage.getItem('campusbite_worker_session')
      return stored ? JSON.parse(stored) : null
    } catch (e) {
      return null
    }
  })

  useEffect(() => {
    if (session) {
      sessionStorage.setItem('campusbite_worker_session', JSON.stringify(session))
    } else {
      sessionStorage.removeItem('campusbite_worker_session')
    }
  }, [session])

  const login = (userData) => {
    setSession(userData)
  }

  const logout = () => {
    setSession(null)
    sessionStorage.removeItem('access_token')
  }

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
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
