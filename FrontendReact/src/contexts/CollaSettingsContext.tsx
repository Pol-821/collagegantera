import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import api from '@/services/api'

interface CollaSettingsData {
  collaName: string
  primaryColor: string
  logoUrl: string
}

interface CollaSettingsContextType extends CollaSettingsData {
  updateSettings: (s: CollaSettingsData) => void
}

const CollaSettingsContext = createContext<CollaSettingsContextType | null>(null)

export function CollaSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CollaSettingsData>({
    collaName: 'Colla Gegantera',
    primaryColor: '#e63946',
    logoUrl: '',
  })

  const applyColor = (color: string) => {
    const root = document.documentElement
    root.style.setProperty('--color-primary', color)
    root.style.setProperty('--color-ring', color)
    root.style.setProperty('--color-primary-foreground', '#ffffff')
  }

  useEffect(() => {
    api.get('/settings')
      .then((res) => {
        const d = res.data
        const s = {
          collaName: d.collaName || 'Colla Gegantera',
          primaryColor: d.primaryColor || '#e63946',
          logoUrl: d.logoUrl || '',
        }
        setSettings(s)
        applyColor(s.primaryColor)
      })
      .catch(() => {
        applyColor(settings.primaryColor)
      })
  }, [])

  const updateSettings = useCallback((s: CollaSettingsData) => {
    setSettings(s)
    applyColor(s.primaryColor)
  }, [])

  return (
    <CollaSettingsContext.Provider value={{ ...settings, updateSettings }}>
      {children}
    </CollaSettingsContext.Provider>
  )
}

export function useCollaSettings() {
  const ctx = useContext(CollaSettingsContext)
  if (!ctx) throw new Error('useCollaSettings must be used within CollaSettingsProvider')
  return ctx
}
