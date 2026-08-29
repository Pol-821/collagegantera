import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User } from '@/types'
import api from '@/services/api'
import { subscribeToPush, unsubscribeFromPush } from '@/services/push'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, contrasenya: string) => Promise<void>
  register: (data: { email: string; contrasenya: string; nom: string; cognoms: string; codiColla: string; nomFamilia?: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, contrasenya: string) => {
    const res = await api.post<{ token: string; user: User }>('/auth/login', { email, password: contrasenya })
    setToken(res.data.token)
    setUser(res.data.user)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    subscribeToPush().catch(() => {})
  }

  const register = async (data: { email: string; contrasenya: string; nom: string; cognoms: string; codiColla: string; nomFamilia?: string }) => {
    const res = await api.post<{ token: string; user: User }>('/auth/register', {
      email: data.email,
      password: data.contrasenya,
      nom: data.nom,
      cognoms: data.cognoms,
      codiColla: data.codiColla,
      nomFamilia: data.nomFamilia,
    })
    setToken(res.data.token)
    setUser(res.data.user)
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    subscribeToPush().catch(() => {})
  }

  const logout = () => {
    unsubscribeFromPush().catch(() => {})
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const refreshUser = async () => {
    try {
      const res = await api.get('/auth/profile')
      const updated: User = {
        id: res.data.id,
        email: res.data.email,
        nom: res.data.nom,
        cognoms: res.data.cognoms,
        avatarUrl: res.data.avatarUrl,
        roles: res.data.roles || [],
        notificationsEnabled: res.data.notificationsEnabled,
        isFamilyHead: res.data.isFamilyHead,
      }
      setUser(updated)
      localStorage.setItem('user', JSON.stringify(updated))
    } catch {}
  }

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
