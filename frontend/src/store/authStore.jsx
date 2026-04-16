import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const [permissions, setPermissions] = useState(() => {
    try { return JSON.parse(localStorage.getItem('permissions')) || {} } catch { return {} }
  })

  const login = (token, userData, perms = {}) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    localStorage.setItem('permissions', JSON.stringify(perms))
    setUser(userData)
    setPermissions(perms)
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('permissions')
    setUser(null)
    setPermissions({})
  }

  const updatePermissions = (perms) => {
    localStorage.setItem('permissions', JSON.stringify(perms))
    setPermissions(perms)
  }

  // Belirli bir modül/aksiyon için izin kontrolü
  const can = (module, action = 'view') => {
    if (user?.role === 'admin') return true
    return permissions?.[module]?.[action] ?? false
  }

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, updatePermissions, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
