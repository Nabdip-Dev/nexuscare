import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [doctorProfile, setDoctorProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('nc_token')
    if (!token) { setLoading(false); return }
    try {
      const { data } = await authAPI.getMe()
      setUser(data.data.user)
      setDoctorProfile(data.data.doctorProfile || null)
      setIsAuthenticated(true)
    } catch {
      localStorage.removeItem('nc_token')
      localStorage.removeItem('nc_user')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadUser() }, [loadUser])

  const login = async (credentials) => {
    const { data } = await authAPI.login(credentials)
    const { token, user, doctorProfile } = data.data
    localStorage.setItem('nc_token', token)
    localStorage.setItem('nc_user', JSON.stringify(user))
    setUser(user)
    setDoctorProfile(doctorProfile || null)
    setIsAuthenticated(true)
    return { user, doctorProfile }
  }

  const logout = () => {
    localStorage.removeItem('nc_token')
    localStorage.removeItem('nc_user')
    setUser(null)
    setDoctorProfile(null)
    setIsAuthenticated(false)
    toast.success('Logged out successfully')
  }

  const updateUser = (updates) => {
    setUser(prev => ({ ...prev, ...updates }))
  }

  return (
    <AuthContext.Provider value={{ user, doctorProfile, loading, isAuthenticated, login, logout, updateUser, loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
