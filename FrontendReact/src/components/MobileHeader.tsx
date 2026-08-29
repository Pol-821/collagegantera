import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useCollaSettings } from '@/contexts/CollaSettingsContext'
import { Bell, Moon, Sun, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState, useEffect } from 'react'
import api from '@/services/api'
import type { Notification } from '@/types'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { useNavigate } from 'react-router-dom'

interface MobileHeaderProps {
  onMenuOpen: () => void
}

export default function MobileHeader({ onMenuOpen }: MobileHeaderProps) {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { collaName, logoUrl } = useCollaSettings()
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      api.get('/notifications').then((res) => {
        const data = Array.isArray(res.data) ? res.data : []
        setNotifications(data)
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length)
      }).catch((err) => console.error("API Error:", err))
    }
  }, [user])

  const markAsRead = async (id: string) => {
    await api.put(`/notifications/${id}/read`)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))
  }

  return (
    <header className="sticky top-0 z-30 h-14 border-b bg-card/80 backdrop-blur-md flex items-center justify-between px-4 gap-2">
      <div className="flex items-center gap-2">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-6 w-6 rounded object-cover" />
        ) : null}
        <h1 className="text-lg font-bold">{collaName}</h1>
      </div>
      <div className="flex items-center gap-1">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 relative">
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notificacions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No tens notificacions
                </div>
              ) : (
                notifications.slice(0, 5).map((n) => (
                  <DropdownMenuItem
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`flex flex-col items-start gap-1 p-3 ${n.isRead ? '' : 'bg-accent/50'}`}
                  >
                    <span className="font-medium text-sm">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.body}</span>
                  </DropdownMenuItem>
                ))
              )}
              {notifications.length > 5 && (
                <DropdownMenuItem onClick={() => navigate('/notificacions')} className="justify-center text-primary">
                  Veure totes
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="w-9 h-9">
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={onMenuOpen} className="w-9 h-9">
          <Menu className="w-4 h-4" />
        </Button>
      </div>
    </header>
  )
}
